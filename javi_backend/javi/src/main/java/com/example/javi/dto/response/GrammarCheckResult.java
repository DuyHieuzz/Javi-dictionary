package com.example.javi.dto.response;

import java.util.List;

public record GrammarCheckResult(
        String sourceText,
        String sourceLang,
        Integer score,
        boolean isValidGrammar,
        List<GrammarSuggest> suggest,
        String result,
        String mean) {}
