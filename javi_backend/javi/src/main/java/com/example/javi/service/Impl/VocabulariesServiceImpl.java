package com.example.javi.service.Impl;

import com.example.javi.dto.request.MeaningRequest;
import com.example.javi.dto.request.VocabRequest;
import com.example.javi.dto.request.VocabUpdateDTO;
import com.example.javi.dto.response.VocabUpdateResponse;
import com.example.javi.entity.Kanji;
import com.example.javi.entity.Meaning;
import com.example.javi.entity.MeaningExample;
import com.example.javi.entity.Vocabularies;
import com.example.javi.exeption.AppException;
import com.example.javi.exeption.ErrorCode;
import com.example.javi.mapper.VocabulariesMapper;
import com.example.javi.repository.KanjiRepository;
import com.example.javi.repository.VocabulariesRepository;
import com.example.javi.service.VocabulariesService;
import com.example.javi.utils.ValidationUtils;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class VocabulariesServiceImpl implements VocabulariesService {
    VocabulariesRepository vocabulariesRepository;
    KanjiRepository kanjiRepository;
    VocabulariesMapper vocabulariesMapper;

    @Override
    public String createVocabulary(VocabRequest request) {
        Optional<Vocabularies> existWord = vocabulariesRepository.findByWord(request.getWord());
        if (existWord.isPresent()) {
            throw new AppException(ErrorCode.EXIST_WORD);
        }

        // DANH SÁCH ĐỂ LƯU TRỮ CÁC ENTITY KANJI ĐÃ TÌM HOẶC TẠO
        List<Kanji> associatedKanjis = new ArrayList<>();

        request.getWord().codePoints().forEach(c -> {
            String japaneseCharacter = Character.toString(c);
            // Tách từng kí tự, nếu là kanji cho vào trong
            if (ValidationUtils.isKanji(japaneseCharacter)) {
                // 1. Kiểm tra sự tồn tại
                Optional<Kanji> existingKanji = kanjiRepository.findByCharacterName(japaneseCharacter);

                Kanji kanji;
                if (existingKanji.isEmpty()) {
                    // 2. Nếu chưa tồn tại, tạo mới (placeholder) và lưu
                    kanji = new Kanji();
                    kanji.setCharacterName(japaneseCharacter);
                    kanji = kanjiRepository.save(kanji); // Phải lưu để có ID
                } else {
                    // 3. Nếu tồn tại, lấy đối tượng đó
                    kanji = existingKanji.get();
                }

                // 4. Thêm vào danh sách liên kết
                associatedKanjis.add(kanji);
            }
        });

        Vocabularies vocab = Vocabularies.builder()
                .word(request.getWord())
                .romaji(request.getRomaji())
                .hiragana(request.getHiragana())
                .katakana(request.getKatakana())
                .wordType(request.getWordType())
                .level(request.getLevel())
                .build();

        // ... (Phần ánh xạ MEANING và MEANING EXAMPLE - giữ nguyên)
        List<Meaning> meanings = new ArrayList<>();
        for (MeaningRequest meaningDto : request.getMeanings()) {
            Meaning meaning = Meaning.builder()
                    .meaningVn(meaningDto.getMeaningVn())
                    .description(meaningDto.getDescription())
                    .vocabularies(vocab)
                    .build();

            List<MeaningExample> examples = meaningDto.getExamples().stream()
                    .map(exampleDto -> MeaningExample.builder()
                            .jaSentence(exampleDto.getJaSentence())
                            .viSentence(exampleDto.getViSentence())
                            .meaning(meaning)
                            .build())
                    .toList();

            meaning.setExamples(examples);
            meanings.add(meaning);
        }

        // 3. XỬ LÝ LIÊN KẾT KANJI THIẾU
        // Gán danh sách Kanji đã tìm/tạo vào đối tượng Vocabularies
        vocab.setKanjis(associatedKanjis);

        // Gán ngược lại Meaning vào Vocabularies
        vocab.setMeanings(meanings);

        // Lưu Vocabularies sẽ lưu:
        // - Lưu Vocabularies
        // - Lưu Meanings và Examples (do cascade)
        // - Lưu các liên kết Many-to-Many vào bảng 'vocabulary_kanji' (do đã setKanjis)
        vocabulariesRepository.save(vocab);
        return "";
    }

//    @Override
//    public Vocabularies updateVocabulary(Long id, VocabUpdateDTO request) {
//        Optional<Vocabularies> existingWord = vocabulariesRepository.findById(id);
//        if (existingWord.isEmpty()) {
//            throw new AppException(ErrorCode.WORD_NOT_FOUND);
//        }
//        if (request.getMeanings() == null || request.getMeanings().isEmpty()) {
//            throw new AppException(ErrorCode.EMPTY_MEANING);
//        }
//        Vocabularies vocab = existingWord.get();
//        vocabulariesMapper.toVocabularies(vocab, request);
//        // 3. Xử lý Cập nhật Nghĩa (Logic phức tạp hơn do quan hệ 1-Nhiều)
//        // Để cập nhật nghĩa, bạn thường phải XÓA nghĩa cũ (nếu không còn trong request)
//        // và THÊM nghĩa mới/cập nhật nghĩa hiện có.
//
//        // Ví dụ đơn giản: Xóa toàn bộ nghĩa cũ, tạo lại toàn bộ nghĩa mới (Dùng khi CascadeType.ALL)
//        vocab.getMeanings().clear(); // Xóa tất cả các nghĩa cũ (và ví dụ do cascade)
//
//        List<Meaning> newMeanings = request.getMeanings().stream()
//                .map(meaningDto -> {
//                    Meaning meaning = Meaning.builder()
//                            .meaningVn(meaningDto.getMeaningVn())
//                            .description(meaningDto.getDescription())
//                            .vocabularies(vocab)
//                            .build();
//
//                    List<MeaningExample> examples = meaningDto.getExamples().stream()
//                            .map(exampleDto -> MeaningExample.builder()
//                                    .jaSentence(exampleDto.getJaSentence())
//                                    .viSentence(exampleDto.getViSentence())
//                                    .meaning(meaning)
//                                    .build())
//                            .collect(Collectors.toList()); // ✅ mutable
//
//                    meaning.setExamples(examples);
//                    return meaning;
//                })
//                .collect(Collectors.toList()); // ✅ mutable
//
//        vocab.setMeanings(new ArrayList<>(newMeanings)); // ✅ mutable
//
//        // 4. Lưu và Trả về: JPA sẽ tự động cập nhật mọi thứ trong transaction
//        return vocabulariesRepository.save(vocab);
//    }

    @Override
    @Transactional
    public VocabUpdateResponse updateVocabulary(Long id, VocabUpdateDTO request) {
        Vocabularies vocab = vocabulariesRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.WORD_NOT_FOUND));

        if (request.getMeanings() == null || request.getMeanings().isEmpty()) {
            throw new AppException(ErrorCode.EMPTY_MEANING);
        }

        if (!request.getWord().equals(vocab.getWord())) {
            List<Kanji> associatedKanjis = new ArrayList<>();

            request.getWord().codePoints().forEach(c -> {
                String japaneseCharacter = Character.toString(c);
                if (ValidationUtils.isKanji(japaneseCharacter)) {
                    Optional<Kanji> existingKanji = kanjiRepository.findByCharacterName(japaneseCharacter);

                    Kanji kanji;
                    if (existingKanji.isEmpty()) {
                        kanji = new Kanji();
                        kanji.setCharacterName(japaneseCharacter);
                        kanji = kanjiRepository.save(kanji);
                    } else {
                        kanji = existingKanji.get();
                    }

                    associatedKanjis.add(kanji);
                }
            });

            vocab.getKanjis().clear();
            vocab.getKanjis().addAll(associatedKanjis);
        }

        // Map các field cơ bản từ request sang entity
        vocabulariesMapper.toVocabularies(vocab, request);

        // Xoá nghĩa cũ
        vocab.getMeanings().clear();

        // Thêm nghĩa mới từ DTO
        for (MeaningRequest mDto : request.getMeanings()) {
            Meaning meaning = Meaning.builder()
                    .meaningVn(mDto.getMeaningVn())
                    .description(mDto.getDescription())
                    .vocabularies(vocab)
                    .build();

            // Thêm ví dụ cho nghĩa
            List<MeaningExample> examples = mDto.getExamples().stream()
                    .map(exDto -> MeaningExample.builder()
                            .jaSentence(exDto.getJaSentence())
                            .viSentence(exDto.getViSentence())
                            .meaning(meaning)
                            .build())
                    .collect(Collectors.toList());

            meaning.setExamples(examples);

            vocab.getMeanings().add(meaning);
        }

        // Lưu entity
        Vocabularies saved = vocabulariesRepository.save(vocab);

        // Trả về DTO để tránh recursion JSON
        return vocabulariesMapper.toDto(saved);
    }

    @Override
    public List<Vocabularies> searchVocabularies(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return List.of();
        }
        //ĐIỀU KIỆN 1: Nếu chứa kanji sẽ tìm chính xác trong word trước
        if (ValidationUtils.containsKanji(keyword.trim())) {
            // Tìm kiếm chính xác (EQUAL) - chỉ trả về một kết quả nếu khớp 100%
            Optional<Vocabularies> exactResult = vocabulariesRepository.findByWord(keyword.trim());
            if (exactResult.isPresent()) {
                return List.of(exactResult.get());
            }

            //Không có chính xác sẽ tìm kiếm like bởi có thể user điền thiếu từ
            List<Vocabularies> likeResult = vocabulariesRepository.findByWordContainingIgnoreCase(keyword.trim());
            if (!likeResult.isEmpty()) {
                return likeResult;
            }
            throw new AppException(ErrorCode.WORD_NOT_FOUND);
        }

        // KIỂM TRA ĐIỀU KIỆN 2: Không có Kanji (là Hiragana/Tiếng Việt), tìm kiếm MỜ
        // Chạy truy vấn LIKE trên Hiragana và MeaningVn
        List<Vocabularies> fuzzyResults = vocabulariesRepository.findFuzzySearch(keyword.trim());

        if (fuzzyResults.isEmpty()) {
            throw new AppException(ErrorCode.WORD_NOT_FOUND);
        }
        return fuzzyResults;
    }

    @Override
    public Vocabularies getVocabularyByWord(String word) {
        Optional<Vocabularies> vocabulary = vocabulariesRepository.findByWord(word);
        if (vocabulary.isEmpty()) {
            throw new AppException(ErrorCode.WORD_NOT_FOUND);
        }
        return vocabulary.get();
    }

    @Override
    public Vocabularies getVocabularyById(Long id) {
        return vocabulariesRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.WORD_NOT_FOUND));
    }

    @Override
    public Page<Vocabularies> getAllVocabulariesByFilter(Specification<Vocabularies> spec, Pageable pageable) {
        return vocabulariesRepository.findAll(spec, pageable);
    }

    @Override
    public void deleteVocabularyById(Long id) {
        Vocabularies vocabularies = vocabulariesRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.WORD_NOT_FOUND));
        vocabulariesRepository.delete(vocabularies);
    }

}
