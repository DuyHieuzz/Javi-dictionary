package com.example.javi.utils;

import com.example.javi.dto.request.AuthenticationRequest;
import com.example.javi.dto.response.AuthenticationResponse;
import com.example.javi.entity.Status;
import com.example.javi.entity.Token;
import com.example.javi.entity.Users;
import com.example.javi.exeption.AppException;
import com.example.javi.exeption.ErrorCode;
import com.example.javi.repository.TokenRepository;
import com.example.javi.repository.UsersRepository;
import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jose.util.Base64;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import java.text.ParseException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.StringJoiner;
import java.util.UUID;
import java.util.function.Function;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class SecurityUtil {

    UsersRepository usersRepository;
    TokenRepository tokenRepository;
    PasswordEncoder passwordEncoder;

    @NonFinal
    @Value("${jwt.signerKey}")
    private String SIGNER_KEY;

    @NonFinal
    @Value("${jwt.valid-duration}")
    private long VALID_DURATION;

    @NonFinal
    @Value("${jwt.refreshable-duration}")
    private long REFRESHABLE_DURATION;

    public static final JWSAlgorithm JWT_ALGORITHM = JWSAlgorithm.HS512;

    /**
     * Đăng nhập và tạo JWT token
     */
    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        Users user = usersRepository
                .findByEmail(request.getEmail())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        var token = generateToken(user);
        return AuthenticationResponse.builder().token(token).authenticated(true).build();
    }

    /**
     * Sinh JWT token bằng Nimbus
     */
    public String generateToken(Users user) {
        try {
            byte[] keyBytes = Base64.from(SIGNER_KEY).decode();
            if (keyBytes.length < 64) {
                log.error(
                        "JWT SIGNER_KEY for HS512 must be at least 64 bytes (512 bits). Current length: {}",
                        keyBytes.length);
                throw new AppException(ErrorCode.TOKEN_GENERATION_FAILED);
            }

            JWSHeader header = new JWSHeader(JWT_ALGORITHM);
            JWTClaimsSet jwtClaimsSet = new JWTClaimsSet.Builder()
                    .subject(user.getEmail())
                    .issuer("javi.com")
                    .issueTime(new Date())
                    .expirationTime(new Date(Instant.now()
                            .plus(VALID_DURATION, ChronoUnit.SECONDS)
                            .toEpochMilli()))
                    .jwtID(UUID.randomUUID().toString())
                    .claim("userId", user.getId())
                    .claim("permission", buildScope(user))
                    .build();

            SignedJWT signedJWT = new SignedJWT(header, jwtClaimsSet);
            signedJWT.sign(new MACSigner(keyBytes));
            return signedJWT.serialize();

        } catch (JOSEException e) {
            log.error("Cannot create token (JOSEException)", e);
            throw new AppException(ErrorCode.TOKEN_GENERATION_FAILED);
        }
    }

    /**
     * Giải mã và xác thực chữ ký của token
     */
    private JWTClaimsSet extractAllClaims(String token) throws ParseException, JOSEException {
        SignedJWT signedJWT = SignedJWT.parse(token);
        byte[] keyBytes = Base64.from(SIGNER_KEY).decode();

        MACVerifier verifier = new MACVerifier(keyBytes);
        if (!signedJWT.verify(verifier)) {
            log.warn("Token signature verification failed for token: {}", token);
            throw new JOSEException("Invalid signature or secret key.");
        }
        return signedJWT.getJWTClaimsSet();
    }

    public <T> T extractClaim(String token, Function<JWTClaimsSet, T> claimsResolver) throws Exception {
        final JWTClaimsSet claims = this.extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    public boolean isTokenExpired(String token) {
        try {
            Date expirationDate = extractClaim(token, JWTClaimsSet::getExpirationTime);
            return expirationDate.before(new Date());
        } catch (Exception e) {
            log.warn("Error checking token expiration: {}", e.getMessage());
            return true;
        }
    }

    /**
     * Validate token toàn diện
     */
    public boolean validateToken(String token, Users userDetails) {
        try {
            JWTClaimsSet claims = extractAllClaims(token);
            String subject = claims.getSubject();

            Token existingToken = tokenRepository.findByToken(token);
            if (existingToken != null && (existingToken.isRevoked() || existingToken.isExpired())) {
                log.warn("Validation failed: Token revoked or expired in DB");
                return false;
            }

            if (userDetails.getStatus() != Status.ACTIVE) {
                log.warn("Validation failed: User is not ACTIVE");
                return false;
            }

            return subject.equals(userDetails.getEmail()) && !isTokenExpired(token);

        } catch (Exception e) {
            log.error("JWT validation error: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Tạo chuỗi quyền hạn người dùng
     */
    private String buildScope(Users user) {
        StringJoiner joiner = new StringJoiner(" ");
        if (user.getRole() != null && !CollectionUtils.isEmpty(user.getRole().getPermissions())) {
            user.getRole().getPermissions().forEach(permission -> joiner.add(permission.getName()));
        }
        return joiner.toString();
    }

    /**
     * Lấy thông tin người dùng đễ sau này so sánh cho dễ
     */
    public Users getCurrentUser() {
        try {
            var authentication = SecurityContextHolder.getContext().getAuthentication();

            if (authentication == null || !authentication.isAuthenticated()) {
                throw new AppException(ErrorCode.UNAUTHENTICATED);
            }

            String email = authentication.getName();
            return usersRepository.findByEmail(email)
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        } catch (Exception e) {
            log.error("Không thể lấy user hiện tại từ SecurityContext: {}", e.getMessage());
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
    }

}
