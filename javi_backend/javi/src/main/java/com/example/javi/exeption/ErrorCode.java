package com.example.javi.exeption;

import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

import lombok.Getter;

@Getter
public enum ErrorCode {
    UNCATEGORIZED_EXCEPTION(9999, "Uncategorized error", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_KEY(1001, "Uncategorized error", HttpStatus.BAD_REQUEST),
    UNAUTHENTICATED(
            1006,
            "Token không hợp lệ (hết hạn, không đúng định dạng, hoặc không truyền JWT ở header)...",
            HttpStatus.UNAUTHORIZED),
    UNAUTHORIZED(1007, "Bạn không c quyền để dùng chức năng này", HttpStatus.FORBIDDEN),

    // USER
    USER_EXISTED(1002, "Người dùng đã tồn tại", HttpStatus.BAD_REQUEST),
    USER_NOT_FOUND(1005, "Không tìm thấy người dùng", HttpStatus.NOT_FOUND),
    USER_HAS_BEEN_BLOCK(1043, "Tài khoản của bạn đã bị chặn, vui lòng liên hệ admin", HttpStatus.FORBIDDEN),

    // LOGIN
    INCORRECT_LOGIN_INFORMATION(1006, "Đăng nhập thất bại. Email hoặc mật khẩu không đúng", HttpStatus.BAD_REQUEST),

    // EMAIL
    EMAIL_CANNOT_BLANK(1009, "Email không được bỏ trống", HttpStatus.BAD_REQUEST),
    INVALID_EMAIL(1012, "Email không hợp lệ, mời nhập lại", HttpStatus.BAD_REQUEST),
    EXIST_EMAIL(1013, "Email đã tồn tại, xin mời nhập email khác", HttpStatus.BAD_REQUEST),

    // USERNAME
    USERNAME_CANNOT_BLANK(1010, "Tên người dùng không được bỏ trống", HttpStatus.BAD_REQUEST),
    EXIST_USERNAME(1014, "Tên người dùng đã tồn tại, mời nhập tên khác", HttpStatus.BAD_REQUEST),
    USERNAME_INVALID(1003, "Tên người dùng phải có ít nhất 4 kí tự", HttpStatus.BAD_REQUEST),

    // PASSWORD
    PASSWORD_CANNOT_BLANK(1011, "Mật khẩu không được bỏ trống", HttpStatus.BAD_REQUEST),
    MISMATCH_PASSWORD(1015, "Không trùng mật khẩu đã nhập ở trên, mời nhập lại", HttpStatus.BAD_REQUEST),
    INVALID_PASSWORD(1004, "Mật khẩu phải có ít nhất 6 kí tự", HttpStatus.BAD_REQUEST),
    INCORRECT_PASSWORD(1019, "Mật khẩu cũ không chính xác", HttpStatus.BAD_REQUEST),

    // FILE
    EMPTY_FILE(1016, "File rỗng, mời chọn file", HttpStatus.BAD_REQUEST),
    INVALID_FILE_NAME(1017, "Tên file ảnh không hợp lệ hoặc quá dài, mời chọn file mới", HttpStatus.BAD_REQUEST),
    INVALID_FILE_TYPE(1018, "Loại file không phải file ảnh, vui lòng chọn file khác", HttpStatus.BAD_REQUEST),
    FILE_TOO_LARGE(1017, "File quá lớn, vui lòng chọn file khác", HttpStatus.BAD_REQUEST),

    // VOCAB
    EMPTY_WORD(1020, "Từ vựng rỗng, mời nhập từ vựng", HttpStatus.BAD_REQUEST),
    INVALID_WORD(1021, "Từ vựng không phải tiếng Nhật, mời nhập tiếng Nhật", HttpStatus.BAD_REQUEST),
    EXIST_WORD(1023, "Từ vựng đã tồn tại", HttpStatus.BAD_REQUEST),
    WORD_NOT_FOUND(1024, "Không tìm thấy từ vựng tương ứng", HttpStatus.NOT_FOUND),
    EMPTY_MEANING(1022, "Từ vựng đang không có nghĩa, mời nhập nghĩa", HttpStatus.BAD_REQUEST),

    // KANJI
    EMPTY_KANJI(1025, "Kanji không được để trống, mời nhập lại", HttpStatus.BAD_REQUEST),
    NOT_KANJI(1027, "Ký tự bạn nhập không phải Kanji, mời nhập lại", HttpStatus.BAD_REQUEST),
    KANJI_NOT_FOUND(1026, "Không có dữ liệu về chữ Kanji bạn cần tìm, mời nhập lại hán tự", HttpStatus.NOT_FOUND),
    KANJI_HAS_NO_MEANING(1027, "Kanji đang không có nghĩa", HttpStatus.BAD_REQUEST), // có dùng ở kanjiRequest mục valid
    KANJI_STILL_IN_USE(
            1028, "Không thể xóa Kanji. Kanji vẫn đang được sử dụng bởi từ vựng khác", HttpStatus.BAD_REQUEST),

    // GRAMMAR
    GRAMMAR_HAS_NO_ID(1040, "Id ngữ pháp không được để trống", HttpStatus.BAD_REQUEST),
    EMPTY_GRAMMAR(1029, "Ngữ pháp cần tìm không được để trống", HttpStatus.BAD_REQUEST),
    GRAMMAR_HAS_NO_PATTERN(1030, "Mẫu câu ngữ pháp không được để trống", HttpStatus.BAD_REQUEST),
    GRAMMAR_HAS_NO_MEANING(1031, "Nghĩa của ngữ pháp không được để trống", HttpStatus.BAD_REQUEST),
    GRAMMAR_HAS_NO_STRUCTURE(1032, "Cách chia ngữ pháp không được để trống", HttpStatus.BAD_REQUEST),
    GRAMMAR_HAS_NO_USAGE_NOTE(1033, "Phạm vi sử dụng ngữ pháp không được để trống", HttpStatus.BAD_REQUEST),
    GRAMMAR_NOT_FOUND(1034, "Không có dữ liệu về ngữ pháp bạn vừa tìm, mời tìm lại", HttpStatus.NOT_FOUND),
    EXISTING_GRAMMAR_PATTERN(1035, "Ngữ pháp này đã tồn tại rồi", HttpStatus.BAD_REQUEST),

    // GRAMMAR_EXAMPLE
    GRAMMAR_EXAMPLE_HAS_NO_JA_SENTENCE(1036, "Ví dụ tiếng Nhật không được bỏ trống", HttpStatus.BAD_REQUEST),
    GRAMMAR_EXAMPLE_HAS_NO_TRANSCRIPTION(1037, "Câu không có kanji không được bỏ trống", HttpStatus.BAD_REQUEST),
    GRAMMAR_EXAMPLE_HAS_NO_VI_SENTENCE(1038, "Nghĩa tiếng Việt không được để trống", HttpStatus.BAD_REQUEST),
    GRAMMAR_EXAMPLE_NOT_FOUND(1039, "Không có dữ liệu về ví dụ này", HttpStatus.NOT_FOUND),

    // TOKEN
    TOKEN_GENERATION_FAILED(1041, "Không thể tạo token", HttpStatus.BAD_REQUEST),
    REFRESH_TOKEN_NOT_FOUND(1042, "Không tìm thấy refresh token tương ứng", HttpStatus.NOT_FOUND),
    REFRESH_TOKEN_HAS_EXPIRED(1043, "Refresh token hết hạn", HttpStatus.BAD_REQUEST),
    REFRESH_TOKEN_REVOKED(1045, "Refresh token bị thu hồi", HttpStatus.BAD_REQUEST),
    TOKEN_HAS_EXPIRED(1043, "Token đã hết hạn", HttpStatus.BAD_REQUEST),

    // ROLE
    ROLE_HAS_NO_NAME(1046, "Tên của role không được để trống", HttpStatus.BAD_REQUEST),
    ROLE_NOT_FOUND(1047, "Không có dữ liệu về role cần tìm", HttpStatus.NOT_FOUND),
    ROLE_NAME_ALREADY_EXISTING(1048, "Tên role đã tồn tại", HttpStatus.BAD_REQUEST),
    SYSTEM_ROLE_CANNOT_DELETE(1052, "Không thể xóa role hệ thống", HttpStatus.BAD_REQUEST),
    SYSTEM_ROLE_CANNOT_RENAME(1053, "Role hệ thống, không thể đổi tên", HttpStatus.BAD_REQUEST),
    ROLE_IN_USE(1054, "Role đang được sử dụng bởi người dùng khác", HttpStatus.BAD_REQUEST),

    // PERMISSION
    PERMISSION_HAS_NO_NAME(1049, "Tên của quyền không được để trống", HttpStatus.BAD_REQUEST),
    PERMISSION_NOT_FOUND(1050, "Không có dữ liệu về quyền cần tìm", HttpStatus.BAD_REQUEST),
    PERMISSION_NAME_ALREADY_EXISTING(1051, "Tên quyền đã tồn tại", HttpStatus.BAD_REQUEST),
    ;

    ErrorCode(int code, String message, HttpStatusCode statusCode) {
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
    }

    private final int code;
    private final String message;
    private final HttpStatusCode statusCode;
}
