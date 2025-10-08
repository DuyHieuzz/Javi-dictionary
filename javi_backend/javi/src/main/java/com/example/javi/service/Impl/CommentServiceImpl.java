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
import com.example.javi.dto.response.CommentResponse;
import com.example.javi.entity.*;
import com.example.javi.exeption.AppException;
import com.example.javi.exeption.ErrorCode;
import com.example.javi.mapper.CommentMapper;
import com.example.javi.repository.*;
import com.example.javi.service.CommentService;
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
        commentRepository.save(comment);
        return commentMapper.toCommentResponse(comment);
    }

    // Nếu user từng bình luận trong 1 entity cụ thể thì khi tra sẽ ưu tiên hiển thị bình luận lên đầu mặc cho không có
    // ai like, nếu chưa từng bình luận hay chưa đăng nhập thì trả ra bình thường
    // Chấp nhận người dùng có thể nhìn thấy lại bình luận của mình ở trang đúng thực tế của nó
    @Override
    @Transactional(readOnly = true)
    public Page<CommentResponse> getCommentsByEntity(EntityType entityType, Long entityId, Pageable pageable) {
        // Lấy danh sách comment theo likeCount, createdAt
        Page<Comment> commentsPage = commentRepository.findByEntityTypeAndEntityId(entityType, entityId, pageable);
        List<Comment> comments = new ArrayList<>(commentsPage.getContent());

        // Lấy user hiện tại (nếu đã đăng nhập)
        Users currentUser = null;
        try {
            currentUser = securityUtil.getCurrentUser();
        } catch (Exception ignored) {
        }

        // Nếu là trang đầu và có user đăng nhập
        if (pageable.getPageNumber() == 0 && currentUser != null) {
            Optional<Comment> myCommentOpt =
                    commentRepository.findByEntityTypeAndEntityIdAndUser(entityType, entityId, currentUser);
            if (myCommentOpt.isPresent()) {
                Comment myComment = myCommentOpt.get();

                // Nếu comment của mình chưa nằm trong danh sách → thêm vào đầu
                boolean alreadyInPage =
                        comments.stream().anyMatch(c -> c.getId().equals(myComment.getId()));

                if (!alreadyInPage) {
                    comments.add(0, myComment);
                    if (comments.size() > pageable.getPageSize()) {
                        comments = comments.subList(0, pageable.getPageSize());
                    }
                } else {
                    // Nếu đã có trong trang, di chuyển nó lên đầu
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

        return new PageImpl<>(responses, pageable, commentsPage.getTotalElements());
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
    }
}
