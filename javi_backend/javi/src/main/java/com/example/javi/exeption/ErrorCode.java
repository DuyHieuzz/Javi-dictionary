package com.example.javi.exeption;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
public enum ErrorCode {
    UNCATEGORIZED_EXCEPTION(9999, "Uncategorized error", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_KEY(1001, "Uncategorized error", HttpStatus.BAD_REQUEST),
    USER_EXISTED(1002, "Người dùng đã tồn tại", HttpStatus.BAD_REQUEST),
    USER_NOT_FOUND(1005, "Không tìm thấy người dùng", HttpStatus.NOT_FOUND),
    UNAUTHENTICATED(1006, "Unauthenticated", HttpStatus.UNAUTHORIZED),
    UNAUTHORIZED(1007, "You do not have permission", HttpStatus.FORBIDDEN),


    //EMAIL
    EMAIL_CANNOT_BLANK(1009, "Trường email không được bỏ trống", HttpStatus.BAD_REQUEST),
    INVALID_EMAIL(1012, "Email không hợp lệ, mời nhập lại", HttpStatus.BAD_REQUEST),
    EXIST_EMAIL(1013, "Email đã tồn tại, xin mời nhập email khác", HttpStatus.BAD_REQUEST),


    //USERNAME
    USERNAME_CANNOT_BLANK(1010, "Tên người dùng không được bỏ trống", HttpStatus.BAD_REQUEST),
    EXIST_USERNAME(1014, "Tên người dùng đã tồn tại, xin mời nhập tên khác", HttpStatus.BAD_REQUEST),
    USERNAME_INVALID(1003, "Tên người dùng phải có ít nhất 4 kí tự", HttpStatus.BAD_REQUEST),


    //PASSWORD
    PASSWORD_CANNOT_BLANK(1011, "Mật khẩu không được bỏ trống", HttpStatus.BAD_REQUEST),
    MISMATCH_PASSWORD(1015, "Không trùng mật khẩu đã nhập ở trên, mời nhập lại", HttpStatus.BAD_REQUEST),
    INVALID_PASSWORD(1004, "Mật khẩu phải có ít nhất 6 kí tự", HttpStatus.BAD_REQUEST),
    INCORRECT_PASSWORD(1019, "Mật khẩu cũ không chính xác", HttpStatus.BAD_REQUEST),


    //FILE
    EMPTY_FILE(1016, "File rỗng, mời chọn file", HttpStatus.BAD_REQUEST),
    INVALID_FILE_NAME(1017, "Tên file ảnh không hợp lệ hoặc quá dài, mời chọn file mới", HttpStatus.BAD_REQUEST),
    INVALID_FILE_TYPE(1018, "Loại file không phải file ảnh, vui lòng chọn file khác", HttpStatus.BAD_REQUEST),
    FILE_TOO_LARGE(1017, "File quá lớn, vui lòng chọn file khác", HttpStatus.BAD_REQUEST),

    //VOCAB
    EMPTY_WORD(1020, "Từ vựng rỗng, mời nhập từ vựng", HttpStatus.BAD_REQUEST),
    INVALID_WORD(1021, "Từ vựng không phải tiếng Nhật, mời nhập tiếng Nhật", HttpStatus.BAD_REQUEST),
    EXIST_WORD(1023, "Từ vựng đã tồn tại", HttpStatus.BAD_REQUEST),
    WORD_NOT_FOUND(1024, "Không tìm thấy từ vựng tương ứng", HttpStatus.NOT_FOUND),

    //MEANING
    EMPTY_MEANING(1022, "Từ vựng đang không có nghĩa, mời nhập nghĩa", HttpStatus.BAD_REQUEST),

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
