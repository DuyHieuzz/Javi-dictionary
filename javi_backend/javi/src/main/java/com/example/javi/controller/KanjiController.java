package com.example.javi.controller;

import com.example.javi.dto.request.KanjiRequest;
import com.example.javi.dto.response.ApiResponse;
import com.example.javi.dto.response.KanjiDetailResponse;
import com.example.javi.dto.response.KanjiResponse;
import com.example.javi.entity.Kanji;
import com.example.javi.entity.Vocabularies;
import com.example.javi.exeption.AppException;
import com.example.javi.exeption.ErrorCode;
import com.example.javi.service.KanjiService;
import com.example.javi.utils.ValidationUtils;
import com.turkraft.springfilter.boot.Filter;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("${api.prefix}/kanji")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class KanjiController {
    KanjiService kanjiService;

    @PostMapping("")
    public ApiResponse createOrUpdateKanji(@Valid @RequestBody KanjiRequest request) {
        if (!ValidationUtils.isKanji(request.getCharacterName())) {
            throw new AppException(ErrorCode.NOT_KANJI);
        }
        return ApiResponse.builder()
                .message("Thành công")
                .result(kanjiService.createOrUpdateKanji(request))
                .build();
    }

    @DeleteMapping("")
    public ApiResponse deleteKanjiByCharacterName(@RequestParam String characterName) {
        if (!ValidationUtils.isKanji(characterName)) {
            throw new AppException(ErrorCode.NOT_KANJI);
        }
        kanjiService.deleteKanjiByCharacterName(characterName);
        return ApiResponse.builder()
                .message("Xóa kanji" + characterName + " thành công")
                .build();
    }

    @GetMapping("/search")
    public ApiResponse searchKanji(@RequestParam String keyword) {

        return ApiResponse.builder()
                .result(kanjiService.getKanjiByKeyWord(keyword))
                .message("Lấy Kanji thành công")
                .build();
    }

    @GetMapping("/search/get-mean")
    public ApiResponse searchDetailKanji(@RequestBody KanjiResponse kanji) {
        if (!ValidationUtils.isKanji(kanji.getCharacterName())) {
            throw new AppException(ErrorCode.NOT_KANJI);
        }
        KanjiDetailResponse kanjiDetailResponse = kanjiService.getKanjiDetailByCharacterName(kanji.getCharacterName());
        return ApiResponse.builder()
                .result(kanjiDetailResponse)
                .message("Lấy chi tiết kanji thành công")
                .build();
    }

    @GetMapping("")
// ... (các annotations khác)
    public ApiResponse findByKanjiByFilter(
            @Filter Specification<Kanji> spec,
            @PageableDefault(size = 20, sort = "Id") Pageable pageable) {
        int page = pageable.getPageNumber();
        if (page > 0) {
            page = page - 1;
        }
        Pageable oneIndexedPageable = PageRequest.of(page, pageable.getPageSize(), pageable.getSort());
        return ApiResponse.builder()
                .message("Lấy danh sách kanji thành công")
                .result(kanjiService.getAllKanjiByFilter(spec, oneIndexedPageable))
                .build();
    }
}
