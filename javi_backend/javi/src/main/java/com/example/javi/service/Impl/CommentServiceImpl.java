package com.example.javi.service.Impl;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.javi.dto.request.CreateCommentRequest;
import com.example.javi.dto.request.UpdateCommentRequest;
import com.example.javi.dto.response.CommentResponse;
import com.example.javi.entity.*;
import com.example.javi.exeption.AppException;
import com.example.javi.exeption.ErrorCode;
import com.example.javi.mapper.CommentMapper;
import com.example.javi.repository.*;
import com.example.javi.service.CommentService;
import com.example.javi.service.cache.CommentCacheService;
import com.example.javi.utils.SecurityUtil;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CommentServiceImpl implements CommentService {
    CommentRepository commentRepository;
    CommentReactionRepository reactionRepository;
    UsersRepository usersRepository;
    VocabulariesRepository vocabRepository;
    KanjiRepository kanjiRepository;
    GrammarRepository grammarRepository;
    SecurityUtil securityUtil;
    CommentMapper commentMapper;
    CommentCacheService commentCacheService;

    @Override
    @Transactional
    public CommentResponse createComment(CreateCommentRequest request) {
        Users currentUser = securityUtil.getCurrentUser();
        // Kiểm tra entity tồn tại
        switch (request.getEntityType()) {
            case WORD -> vocabRepository
                    .findById(request.getEntityId())
                    .orElseThrow(() -> new AppException(ErrorCode.WORD_NOT_FOUND));
            case KANJI -> kanjiRepository
                    .findById(request.getEntityId())
                    .orElseThrow(() -> new AppException(ErrorCode.KANJI_NOT_FOUND));
            case GRAMMAR -> grammarRepository
                    .findById(request.getEntityId())
                    .orElseThrow(() -> new AppException(ErrorCode.GRAMMAR_NOT_FOUND));
        }
        Comment comment = Comment.builder()
                .user(currentUser)
                .entityType(request.getEntityType())
                .entityId(request.getEntityId())
                .content(request.getContent())
                .build();
        boolean exists = commentRepository.existsByEntityTypeAndEntityIdAndUser(
                request.getEntityType(), request.getEntityId(), currentUser);
        if (exists) {
            throw new AppException(ErrorCode.DUPLICATE_COMMENT);
        }

        commentRepository.save(comment);
        CommentResponse commentResponse = commentMapper.toCommentResponse(comment);

        // Clear cache cho entity
        commentCacheService.clearEntityPages(request.getEntityType().name(), request.getEntityId());
        log.info("[CACHE CLEAR] Xóa cache cho entity {} có id: {}", request.getEntityType(), request.getEntityId());
        return commentResponse;
    }

    @Override
    @Transactional
    public CommentResponse updateComment(Long id, UpdateCommentRequest request) {
        Users currentUser = securityUtil.getCurrentUser();
        Comment comment =
                commentRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.COMMENT_NOT_FOUND));

        boolean isOwner = comment.getUser().getId().equals(currentUser.getId());
        boolean hasManagePermission = securityUtil.hasPermission("MANAGE_USER_COMMENT");

        // Chỉ chủ sở hữu hoặc người có quyền quản lý mới được sửa
        if (!isOwner && !hasManagePermission) {
            throw new AppException(ErrorCode.NO_PERMISSION_TO_UPDATE_COMMENT);
        }

        comment.setContent(request.getContent().trim());
        commentRepository.save(comment);
        CommentResponse commentResponse = commentMapper.toCommentResponse(comment);

        // Clear cache comment pages cho entity
        commentCacheService.clearEntityPages(comment.getEntityType().name(), comment.getEntityId());
        log.info("[CACHE CLEAR] Xóa comment id={} cho {}:{}", id, comment.getEntityType(), comment.getEntityId());
        return commentResponse;
    }

    // Nếu user từng bình luận trong 1 entity cụ thể thì khi tra sẽ ưu tiên hiển thị bình luận lên đầu mặc cho không có
    // ai like, nếu chưa từng bình luận hay chưa đăng nhập thì trả ra bình thường
    // Chấp nhận người dùng có thể nhìn thấy lại bình luận của mình ở trang đúng thực tế của nó
    @Override
    @Transactional(readOnly = true)
    public Page<CommentResponse> getCommentsByEntity(EntityType entityType, Long entityId, Pageable pageable) {
        Long currentUserId = securityUtil.getCurrentUserId();
        boolean isAnonymous = (currentUserId == null);

        log.info(
                "[CACHE DECISION] userId={} => {}",
                currentUserId != null ? currentUserId : "anonymous",
                isAnonymous ? "USE CACHE" : "SKIP CACHE");

        // Chỉ dùng cache nếu là user ẩn danh
        if (isAnonymous) {
            Page<CommentResponse> cached = commentCacheService.getCommentsPage(
                    entityType.name(), entityId, pageable.getPageNumber(), pageable.getPageSize());
            if (cached != null) {
                log.info(
                        "[CACHE HIT] Lấy cache comment page {} cho {}:{} (anonymous user)",
                        pageable.getPageNumber(),
                        entityType,
                        entityId);
                return cached;
            }
        }

        log.info(
                "[CACHE MISS or LOGIN USER] Truy vấn DB comment page {} cho {}:{}",
                pageable.getPageNumber(),
                entityType,
                entityId);

        Page<Comment> commentsPage = commentRepository.findByEntityTypeAndEntityId(entityType, entityId, pageable);
        List<Comment> comments = new ArrayList<>(commentsPage.getContent());

        // Lấy user hiện tại nếu có
        Users currentUser = null;
        if (!isAnonymous) {
            currentUser = usersRepository.findById(currentUserId).orElse(null);
        }

        // Nếu là trang đầu và có user đăng nhập thì đẩy comment của họ lên đầu
        if (pageable.getPageNumber() == 0 && currentUser != null) {
            Optional<Comment> myCommentOpt =
                    commentRepository.findByEntityTypeAndEntityIdAndUser(entityType, entityId, currentUser);
            if (myCommentOpt.isPresent()) {
                Comment myComment = myCommentOpt.get();

                boolean alreadyInPage =
                        comments.stream().anyMatch(c -> c.getId().equals(myComment.getId()));

                if (!alreadyInPage) {
                    comments.add(0, myComment);
                    if (comments.size() > pageable.getPageSize()) {
                        comments = comments.subList(0, pageable.getPageSize());
                    }
                } else {
                    comments.removeIf(c -> c.getId().equals(myComment.getId()));
                    comments.add(0, myComment);
                }
            }
        }

        // Convert sang CommentResponse + gán isMyComment
        Users finalCurrentUser = currentUser;
        List<CommentResponse> responses = comments.stream()
                .map(c -> {
                    CommentResponse resp = commentMapper.toCommentResponse(c);
                    if (finalCurrentUser != null && c.getUser() != null) {
                        resp.setIsMyComment(c.getUser().getId().equals(finalCurrentUser.getId()));
                    } else {
                        resp.setIsMyComment(false);
                    }
                    return resp;
                })
                .collect(Collectors.toList());

        Page<CommentResponse> resultPage = new PageImpl<>(responses, pageable, commentsPage.getTotalElements());

        // Chỉ lưu cache nếu user ẩn danh
        if (isAnonymous) {
            commentCacheService.saveCommentsPage(
                    entityType.name(), entityId, pageable.getPageNumber(), pageable.getPageSize(), resultPage);
            log.info(
                    "[CACHE SAVE] Lưu cache comment page {} cho {}:{} (anonymous user)",
                    pageable.getPageNumber(),
                    entityType,
                    entityId);
        } else {
            log.info("[CACHE SKIP] Bỏ qua cache vì user đăng nhập id={}", currentUserId);
        }

        return resultPage;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CommentResponse> getCommentsByUsername(String username, Pageable pageable) {
        Users user =
                usersRepository.findByUsername(username).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        Page<Comment> comments = commentRepository.findByUserOrderByCreatedAtDesc(user, pageable);

        return comments.map(commentMapper::toCommentResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CommentResponse> getMyComments(Pageable pageable) {
        Users currentUser = securityUtil.getCurrentUser();
        Page<Comment> comments = commentRepository.findByUserOrderByCreatedAtDesc(currentUser, pageable);
        return comments.map(commentMapper::toCommentResponse);
    }

    @Override
    @Transactional
    public void deleteComment(Long id) {
        Long currentUserId = securityUtil.getCurrentUserId();
        Comment comment =
                commentRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.COMMENT_NOT_FOUND));
        Users currentUser = securityUtil.getCurrentUser();

        // Nếu không phải admin, người có quyền hạn và không phải chính mình → cấm không cho cập nhật
        boolean isAdmin = currentUser.getRole() != null
                && currentUser.getRole().getPermissions().stream()
                        .anyMatch(p -> p.getName().equals("MANAGE_USER_COMMENT"));
        boolean isSelf = comment.getUser() != null && comment.getUser().getId().equals(currentUserId);

        if (!isSelf && !isAdmin) {
            throw new AppException(ErrorCode.NO_PERMISSION_TO_DELETE_COMMENT);
        }
        commentRepository.delete(comment);
        commentCacheService.clearEntityPages(comment.getEntityType().name(), comment.getEntityId());
        log.info(
                "[CACHE CLEAR] Sau khi xóa comment id={} cho {}:{}",
                id,
                comment.getEntityType(),
                comment.getEntityId());
    }

    // Nhấn liên tục like, dislike sẽ sinh ra nhiều câu sql hơn, hiệu năng thấp hơn method ở dưới
    //    @Override
    //    @Transactional
    //    public void reactToComment(Long commentId, String type) {
    //        Users currentUser = securityUtil.getCurrentUser();
    //        Comment comment = commentRepository.findById(commentId)
    //                .orElseThrow(() -> new AppException(ErrorCode.COMMENT_NOT_FOUND));
    //
    //        ReactionType reactionType;
    //        try {
    //            reactionType = ReactionType.valueOf(type.toUpperCase());
    //        } catch (IllegalArgumentException e) {
    //            throw new AppException(ErrorCode.INVALID_REACTION);
    //        }
    //        var existing = reactionRepository.findByUserAndComment(currentUser, comment);
    //
    //        if (existing.isPresent()) {
    //            var r = existing.get();
    //            if (r.getReactionType() == reactionType) {
    //                reactionRepository.delete(r); // bỏ like/dislike
    //            } else {
    //                r.setReactionType(reactionType); // đổi like <-> dislike
    //                reactionRepository.save(r);
    //            }
    //        } else {
    //            reactionRepository.save(CommentReaction.builder()
    //                    .user(currentUser)
    //                    .comment(comment)
    //                    .reactionType(reactionType)
    //                    .build());
    //        }
    //        // Cập nhật tổng like/dislike
    //        comment.setLikeCount((int) reactionRepository.countByCommentAndReactionType(comment, ReactionType.LIKE));
    //        comment.setDislikeCount((int) reactionRepository.countByCommentAndReactionType(comment,
    // ReactionType.DISLIKE));
    //        commentRepository.save(comment);
    //    }

    @Override
    @Transactional
    public void reactToComment(Long commentId, String type) {
        // Lấy user hiện tại
        Users currentUser = securityUtil.getCurrentUser();

        // Tìm comment
        Comment comment =
                commentRepository.findById(commentId).orElseThrow(() -> new AppException(ErrorCode.COMMENT_NOT_FOUND));

        // Parse reaction type (LIKE hoặc DISLIKE)
        ReactionType reactionType;
        try {
            reactionType = ReactionType.valueOf(type.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new AppException(ErrorCode.INVALID_REACTION);
        }

        // Kiểm tra xem user đã từng react comment này chưa
        Optional<CommentReaction> existingOpt = reactionRepository.findByUserAndComment(currentUser, comment);

        if (existingOpt.isPresent()) {
            CommentReaction existing = existingOpt.get();

            // Nếu bấm lại cùng loại (toggle off)
            if (existing.getReactionType() == reactionType) {
                reactionRepository.delete(existing);
                if (reactionType == ReactionType.LIKE) {
                    comment.setLikeCount(Math.max(0, comment.getLikeCount() - 1));
                } else {
                    comment.setDislikeCount(Math.max(0, comment.getDislikeCount() - 1));
                }
            }
            // Nếu đổi loại (like <-> dislike)
            else {
                existing.setReactionType(reactionType);
                reactionRepository.save(existing);

                if (reactionType == ReactionType.LIKE) {
                    comment.setLikeCount(comment.getLikeCount() + 1);
                    comment.setDislikeCount(Math.max(0, comment.getDislikeCount() - 1));
                } else {
                    comment.setDislikeCount(comment.getDislikeCount() + 1);
                    comment.setLikeCount(Math.max(0, comment.getLikeCount() - 1));
                }
            }
        }
        // Nếu chưa có reaction nào → tạo mới
        else {
            reactionRepository.save(CommentReaction.builder()
                    .user(currentUser)
                    .comment(comment)
                    .reactionType(reactionType)
                    .build());

            if (reactionType == ReactionType.LIKE) {
                comment.setLikeCount(comment.getLikeCount() + 1);
            } else {
                comment.setDislikeCount(comment.getDislikeCount() + 1);
            }
        }

        // Lưu lại comment (đã cập nhật count)
        commentRepository.save(comment);
        // Xóa cache
        commentCacheService.clearEntityPages(comment.getEntityType().name(), comment.getEntityId());
    }
}
