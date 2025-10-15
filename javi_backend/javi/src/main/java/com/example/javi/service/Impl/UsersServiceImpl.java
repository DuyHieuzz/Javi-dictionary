package com.example.javi.service.Impl;

import java.io.UnsupportedEncodingException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Optional;

import jakarta.mail.MessagingException;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.javi.dto.request.ChangePassRequest;
import com.example.javi.dto.request.CreateUserRequest;
import com.example.javi.dto.request.LoginRequest;
import com.example.javi.dto.request.UpdateUserRequest;
import com.example.javi.dto.response.UserResponse;
import com.example.javi.entity.*;
import com.example.javi.exeption.AppException;
import com.example.javi.exeption.ErrorCode;
import com.example.javi.mapper.UsersMapper;
import com.example.javi.repository.RoleRepository;
import com.example.javi.repository.UsersRepository;
import com.example.javi.repository.VerificationTokenRepository;
import com.example.javi.service.UsersService;
import com.example.javi.service.VerificationTokenService;
import com.example.javi.utils.SecurityUtil;
import com.example.javi.utils.ValidationUtils;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jose.util.Base64;
import com.nimbusds.jwt.SignedJWT;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UsersServiceImpl implements UsersService {
    UsersRepository usersRepository;
    UsersMapper usersMapper;
    PasswordEncoder passwordEncoder;
    SecurityUtil securityUtil;
    RoleRepository roleRepository;
    VerificationTokenService verificationTokenService;
    VerificationTokenRepository verificationTokenRepository;

    @NonFinal
    @Value("${app.time-zone}")
    private String timezone;

    @NonFinal
    @Value("${jwt.signerKey}")
    String signerKey;

    private ZoneId getZoneId() {
        return ZoneId.of(timezone);
    }

    @Override
    public Page<Users> getAllUsersByFilter(Specification<Users> spec, Pageable pageable) {
        return usersRepository.findAll(spec, pageable);
    }

    @Override
    public UserResponse getUserById(Long id) {
        Users user = usersRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        return usersMapper.toUserResponse(user);
    }

    @Override
    @Transactional
    public UserResponse createUser(CreateUserRequest user) throws MessagingException, UnsupportedEncodingException {
        // Validate email & password
        if (!ValidationUtils.isValidEmail(user.getEmail())) {
            throw new AppException(ErrorCode.INVALID_EMAIL);
        }
        if (!user.getPassword().equals(user.getConfirmPassword())) {
            throw new AppException(ErrorCode.MISMATCH_PASSWORD);
        }

        // Kiểm tra username đã tồn tại chưa
        if (usersRepository.existsByUsername(user.getUsername())) {
            throw new AppException(ErrorCode.EXIST_USERNAME);
        }

        // Kiểm tra email tồn tại
        Optional<Users> existingUserOpt = usersRepository.findByEmail(user.getEmail());
        if (existingUserOpt.isPresent()) {
            Users existingUser = existingUserOpt.get();
            if (existingUser.isVerified()) {
                // Đã xác thực rồi → chặn
                throw new AppException(ErrorCode.EXIST_EMAIL);
            } else {
                // Chưa xác thực → gửi lại email xác thực
                verificationTokenService.resendVerification(existingUser.getEmail(), TokenType.EMAIL_VERIFICATION);
                throw new AppException(ErrorCode.EMAIL_NOT_VERIFIED);
            }
        }

        // Tạo user mới
        Users newUser = usersMapper.toUsers(user);

        Role defaultRole = (user.getRole() == null)
                ? roleRepository.findByName("USER").orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND))
                : user.getRole();

        newUser.setRole(defaultRole);
        newUser.setPassword(passwordEncoder.encode(user.getPassword()));
        newUser.setVerified(false); // chưa kích hoạt
        usersRepository.save(newUser);

        // Tạo token xác minh và gửi mail
        VerificationToken token =
                verificationTokenService.createVerificationTokenForUser(newUser, TokenType.EMAIL_VERIFICATION);
        verificationTokenService.sendVerificationEmail(newUser, token);

        // Trả kết quả
        return usersMapper.toCreateUserResponse(newUser);
    }

    @Override
    public UserResponse getMyInfo() {
        var context = SecurityContextHolder.getContext();
        String name = context.getAuthentication().getName();

        Users user = usersRepository.findByEmail(name).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        return usersMapper.toUserResponse(user);
    }

    @Override
    @Transactional
    public String updateAvatar(Long userId, String fileName) {
        Users user = usersRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        user.setAvatarUrl(fileName);
        usersRepository.save(user);
        return fileName;
    }

    @Override
    @Transactional
    public String changePassword(Long userId, ChangePassRequest changePassRequest) {
        Users user = usersRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (!passwordEncoder.matches(changePassRequest.getOldPassword(), user.getPassword())) {
            throw new AppException(ErrorCode.INCORRECT_PASSWORD);
        }

        if (!changePassRequest.getNewPassword().equals(changePassRequest.getConfirmPassword())) {
            throw new AppException(ErrorCode.MISMATCH_PASSWORD);
        }

        user.setPassword(passwordEncoder.encode(changePassRequest.getNewPassword()));
        usersRepository.save(user);

        return "Đổi mật khẩu thành công";
    }

    @Override
    @Transactional
    public void blockUser(Long userId) {
        Users user = usersRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        user.setStatus(Status.BLOCKED);
        usersRepository.save(user);
    }

    @Override
    @Transactional
    public void unblockUser(Long userId) {
        Users user = usersRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        user.setStatus(Status.ACTIVE);
        usersRepository.save(user);
    }

    @Override
    public String login(LoginRequest loginRequest) {
        String email = loginRequest.getEmail().trim();

        Users users = usersRepository.findByEmail(email).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (!passwordEncoder.matches(loginRequest.getPassword(), users.getPassword())) {
            throw new AppException(ErrorCode.INCORRECT_LOGIN_INFORMATION);
        }

        if (users.getStatus().equals(Status.BLOCKED)) {
            throw new AppException(ErrorCode.USER_HAS_BEEN_BLOCK);
        }

        return (securityUtil.generateToken(users));
    }

    @Override
    @Transactional
    public UserResponse updateUser(Long userId, UpdateUserRequest updateUserRequest) {
        Users user = usersRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        Users currentUser = securityUtil.getCurrentUser();

        // Nếu không phải admin, người có quyền hạn và không phải chính mình → cấm không cho cập nhật
        boolean isAdmin = currentUser.getRole() != null
                && currentUser.getRole().getPermissions().stream()
                        .anyMatch(p -> p.getName().equals("MANAGE_USER"));
        boolean isSelf = currentUser.getId().equals(userId);

        if (!isSelf && !isAdmin) {
            throw new AppException(ErrorCode.NO_PERMISSION_TO_UPDATE_USER);
        }
        if (updateUserRequest.getUsername() != null) {
            String newUsername = updateUserRequest.getUsername().trim();
            Optional<Users> existingUser = usersRepository.findByUsername(newUsername);

            if (existingUser.isPresent() && !existingUser.get().getId().equals(userId)) {
                throw new AppException(ErrorCode.EXIST_USERNAME);
            }
            if (newUsername.isEmpty()) {
                throw new AppException(ErrorCode.USERNAME_CANNOT_BLANK);
            }
            updateUserRequest.setUsername(newUsername);
        }

        // Thực hiện update
        usersMapper.updateUserFromDto(updateUserRequest, user);
        usersRepository.save(user);
        return usersMapper.toUserResponse(user);
    }

    // Hàm thủ công, getMyInfo hiệu năng cao hơn
    @Override
    public Users getUserDetailsFromToken(String token) {
        if (securityUtil.isTokenExpired(token)) {
            throw new AppException(ErrorCode.TOKEN_HAS_EXPIRED);
        }

        try {
            SignedJWT signedJWT = SignedJWT.parse(token);

            byte[] keyBytes = Base64.from(signerKey).decode();
            MACVerifier verifier = new MACVerifier(keyBytes);

            if (!signedJWT.verify(verifier)) {
                throw new AppException(ErrorCode.UNAUTHENTICATED);
            }

            String email = signedJWT.getJWTClaimsSet().getSubject();

            return usersRepository.findByEmail(email).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        } catch (Exception e) {
            log.error("Token verification failed: {}", e.getMessage());
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
    }

    @Override
    public String setPremiumManually(Long userId, PremiumType premiumType) {
        if (premiumType == null) {
            throw new AppException(ErrorCode.INVALID_PREMIUM_TYPE);
        }

        // Check quyền
        securityUtil.requirePermission("MANAGE_USER");

        Users user = usersRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiredAt =
                switch (premiumType) {
                    case MONTHLY_1 -> now.plusMonths(1);
                    case MONTHLY_3 -> now.plusMonths(3);
                    case MONTHLY_6 -> now.plusMonths(6);
                    case LIFETIME -> null;
                };

        user.setAccountType(AccountType.PREMIUM);
        user.setPremiumType(premiumType);
        user.setPremiumExpiredAt(expiredAt);

        usersRepository.save(user);
        return "Đã cấp premium cho người dùng có email là: " + user.getEmail() + ", hiệu lực đến "
                + (user.getPremiumExpiredAt() == null
                        ? "trọn đời"
                        : user.getPremiumExpiredAt().toString());
    }

    @Override
    @Transactional
    public synchronized void checkAndUpdateImageQuota(Users user) {
        ZoneId zoneId = getZoneId();
        LocalDate today = LocalDate.now(zoneId);

        // Hạ cấp nếu premium đã hết hạn
        if (user.getAccountType() == AccountType.PREMIUM
                && user.getPremiumExpiredAt() != null
                && user.getPremiumExpiredAt().isBefore(LocalDateTime.now(zoneId))) {
            log.info(
                    "[PREMIUM] User {} hết hạn lúc {}, tự động hạ cấp về FREE",
                    user.getEmail(),
                    user.getPremiumExpiredAt());
            user.setAccountType(AccountType.FREE);
            user.setPremiumExpiredAt(null);
            usersRepository.save(user);
        }

        // PREMIUM user còn hạn thì bỏ qua quota
        if (user.getAccountType() == AccountType.PREMIUM
                && (user.getPremiumExpiredAt() == null
                        || user.getPremiumExpiredAt().isAfter(LocalDateTime.now(zoneId)))) {
            log.debug("[QUOTA] PREMIUM user {} dịch ảnh, không trừ lượt", user.getEmail());
            return;
        }

        // Reset quota nếu sang ngày mới
        LocalDate lastDate = Optional.ofNullable(user.getLastImageTranslationDate())
                .map(LocalDateTime::toLocalDate)
                .orElse(null);

        if (lastDate == null || !lastDate.isEqual(today)) {
            log.info("[QUOTA] Reset lượt dịch ảnh cho user {} - Ngày mới {}", user.getEmail(), today);
            user.setDailyImageTranslations(2);
            user.setLastImageTranslationDate(LocalDateTime.now(zoneId));
            usersRepository.save(user);
        }

        // FREE user vượt quota
        if (user.getDailyImageTranslations() <= 0) {
            log.warn("[QUOTA] User {} đã vượt giới hạn 2 lượt dịch ảnh/ngày (FREE)", user.getEmail());
            throw new AppException(ErrorCode.FREE_USER_QUOTA_EXCEEDED);
        }

        // Trừ lượt cho FREE user
        user.setDailyImageTranslations(user.getDailyImageTranslations() - 1);
        user.setLastImageTranslationDate(LocalDateTime.now(zoneId));
        usersRepository.save(user);

        log.info(
                "[QUOTA] User {} (FREE) còn {}/2 lượt dịch ảnh hôm nay",
                user.getEmail(),
                user.getDailyImageTranslations());
    }
}
