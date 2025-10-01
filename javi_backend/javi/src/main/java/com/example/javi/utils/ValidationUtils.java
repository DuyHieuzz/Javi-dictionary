package com.example.javi.utils;

import java.util.regex.Pattern;

public class ValidationUtils {
    public static boolean isValidEmail(String email) {
        String emailRegex = "^[a-zA-Z0-9_+&*-]+(?:\\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,7}$";
        Pattern pattern = Pattern.compile(emailRegex);
        return email != null && pattern.matcher(email).matches();
    }

    public static boolean isJapanese(String text) {
        if (text == null || text.isEmpty()) {
            return false;
        }
        String japaneseRegex = "^[\\p{IsHiragana}\\p{IsKatakana}\\p{IsHan}\\u30fc\\u3005]+$";
        return text.matches(japaneseRegex);
    }

    public static boolean isKanji(String character) {
        String kanjiRegex = "^[\\p{IsHan}]+$";
        return character.matches(kanjiRegex);
    }

    public static boolean containsKanji(String input) {
        if (input == null || input.trim().isEmpty()) {
            return false;
        }
        return input.trim().matches(".*\\p{IsHan}.*");
    }

}
