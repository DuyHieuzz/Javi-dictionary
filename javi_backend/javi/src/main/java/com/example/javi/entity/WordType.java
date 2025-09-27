package com.example.javi.entity;

import lombok.Getter;

@Getter
public enum WordType {
    // TỪ LOẠI CƠ BẢN
    NOUN("Danh từ"),
    PRONOUN("Đại từ"),
    ADJECTIVE_I("Tính từ đuôi -i"),
    ADJECTIVE_NA("Tính từ đuôi -na"),
    ADVERB("Trạng từ"),
    PARTICLE("Trợ từ"),
    CONJUNCTION("Liên từ"),
    INTERJECTION("Thán từ"),

    // ĐỘNG TỪ
    VERB("Động từ"),
    VERB_GROUP_1("Động từ nhóm 1 (Godan)"),
    VERB_GROUP_2("Động từ nhóm 2 (Ichidan)"),
    VERB_GROUP_3("Động từ nhóm 3 (Bất quy tắc)"),
    AUXILIARY_VERB("Trợ động từ"), // Đã thêm

    // KHÁC
    IDIOM("Thành ngữ"),
    PHRASE("Cụm từ"),
    CUSTOM("Khác");

    private final String vietnameseName;

    WordType(String vietnameseName) {
        this.vietnameseName = vietnameseName;
    }

    public String getVietnameseName() {
        return vietnameseName;
    }
}
