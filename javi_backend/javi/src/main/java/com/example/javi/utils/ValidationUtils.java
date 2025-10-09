package com.example.javi.utils;

import java.util.Collections;
import java.util.List;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

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

    public static boolean isSingleKanji(String input) {
        if (input == null || input.isBlank()) return false;
        return input.codePointCount(0, input.length()) == 1
                && Character.UnicodeScript.of(input.codePointAt(0)) == Character.UnicodeScript.HAN;
    }

    public static boolean isAllKanji(String input) {
        if (input == null || input.isBlank()) return false;
        return input.codePoints().allMatch(cp -> Character.UnicodeScript.of(cp) == Character.UnicodeScript.HAN);
    }

    public static boolean containsKana(String input) {
        if (input == null || input.isBlank()) return false;
        return input.codePoints().anyMatch(cp -> {
            Character.UnicodeScript script = Character.UnicodeScript.of(cp);
            return script == Character.UnicodeScript.HIRAGANA || script == Character.UnicodeScript.KATAKANA;
        });
    }

    public static List<String> extractKanjiChars(String input) {
        if (input == null) return Collections.emptyList();
        return input.codePoints()
                .filter(cp -> Character.UnicodeScript.of(cp) == Character.UnicodeScript.HAN)
                .mapToObj(cp -> String.valueOf(Character.toChars(cp)))
                .distinct()
                .collect(Collectors.toList());
    }
}
