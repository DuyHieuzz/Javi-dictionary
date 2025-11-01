package com.example.javi.dto.response;

import java.util.List;

public record KanjiDecompositionResult(
        String kanji, String sinoViName, String explanation, List<ComponentNode> components) {
    public record ComponentNode(String kanji, String sinoViName, String explanation, List<ComponentNode> components) {}
}
