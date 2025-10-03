package com.example.javi.service.Impl;

import com.example.javi.dto.request.CreateGrammarRequest;
import com.example.javi.dto.request.GrammarExampleRequest;
import com.example.javi.dto.request.GrammarSearchRequest;
import com.example.javi.dto.request.UpdateGrammarRequest;
import com.example.javi.dto.response.GrammarResponse;
import com.example.javi.entity.Grammar;
import com.example.javi.entity.GrammarExample;
import com.example.javi.exeption.AppException;
import com.example.javi.exeption.ErrorCode;
import com.example.javi.mapper.GrammarExampleMapper;
import com.example.javi.mapper.GrammarMapper;
import com.example.javi.repository.GrammarExampleRepository;
import com.example.javi.repository.GrammarRepository;
import com.example.javi.service.GrammarService;
import com.example.javi.specification.GrammarSpecification;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class GrammarServiceImpl implements GrammarService {
    GrammarRepository grammarRepository;
    GrammarMapper grammarMapper;
    GrammarExampleMapper grammarExampleMapper;
    GrammarExampleRepository grammarExampleRepository;

    @Override
    @Transactional
    public GrammarResponse createGrammar(CreateGrammarRequest request) {

        if (grammarRepository.existsByPattern(request.getPattern())) {
            throw new AppException(ErrorCode.EXISTING_GRAMMAR_PATTERN);
        }

        Grammar grammar = grammarMapper.toGrammar(request);

        final Grammar finalGrammar = grammar;

        List<GrammarExample> examples = Optional.ofNullable(request.getExamples()).orElse(Collections.emptyList())
                .stream()
                .map(grammarExampleMapper::toGrammarExample)
                // Gán Foreign Key: example.setGrammar(grammar)
                .peek(example -> example.setGrammar(finalGrammar))
                .collect(Collectors.toCollection(ArrayList::new));

        grammar.setExamples(examples);

        grammar = grammarRepository.save(grammar);

        return grammarMapper.toGrammarResponse(grammar);
    }

    @Override
    @Transactional
    public GrammarResponse updateGrammar(Long id, UpdateGrammarRequest request) {
        Grammar existingGrammar = grammarRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.GRAMMAR_NOT_FOUND));

        // Kiểm tra pattern đã tồn tại ở grammar khác chưa
        if (grammarRepository.existsByPatternAndGrammarIdNot(request.getPattern(), id)) {
            throw new AppException(ErrorCode.EXISTING_GRAMMAR_PATTERN);
        }
        grammarMapper.updateGrammarFromRequest(request, existingGrammar);

        List<GrammarExampleRequest> exampleRequests =
                Optional.ofNullable(request.getExamples()).orElse(Collections.emptyList());

        // Lấy danh sách ID từ request (chỉ lấy cái có ID)
        List<Long> updatedExampleIds = exampleRequests.stream()
                .map(GrammarExampleRequest::getId)
                .filter(Objects::nonNull)
                .toList();

        // Xóa hết example cũ không có trong danh sách updated IDs
        if (!updatedExampleIds.isEmpty()) {
            grammarExampleRepository.bulkDeleteExamplesNotIn(existingGrammar.getGrammarId(), updatedExampleIds);
        } else {
            // Nếu request không gửi example nào => xóa sạch tất cả example cũ
            grammarExampleRepository.deleteByGrammarId(existingGrammar.getGrammarId());
        }
        List<GrammarExample> examplesToSaveOrUpdate = exampleRequests.stream()
                .map(req -> {
                    if (req.getId() != null) {
                        // Cập nhật ví dụ cũ
                        GrammarExample example = grammarExampleRepository.findById(req.getId())
                                .orElseThrow(() -> new AppException(ErrorCode.GRAMMAR_EXAMPLE_NOT_FOUND));
                        grammarExampleMapper.updateGrammarExampleFromRequest(req, example);
                        return example;
                    } else {
                        // Tạo mới ví dụ
                        GrammarExample newExample = grammarExampleMapper.toGrammarExample(req);
                        newExample.setGrammar(existingGrammar);
                        return newExample;
                    }
                })
                .collect(Collectors.toCollection(ArrayList::new));
        existingGrammar.setExamples(examplesToSaveOrUpdate);
        Grammar updatedGrammar = grammarRepository.save(existingGrammar);
        return grammarMapper.toGrammarResponse(updatedGrammar);
    }

    @Override
    public void deleteGrammar(Long id) {
        if (!grammarRepository.existsById(id)) {
            throw new AppException(ErrorCode.GRAMMAR_NOT_FOUND);
        }
        grammarRepository.deleteById(id);
    }

    @Override
    public GrammarResponse getGrammarById(Long id) {
        Optional<Grammar> grammar = grammarRepository.findById(id);
        if (grammar.isEmpty()) {
            throw new AppException(ErrorCode.GRAMMAR_NOT_FOUND);
        }
        return grammarMapper.toGrammarResponse(grammar.get());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<GrammarResponse> searchGrammars(GrammarSearchRequest request, Pageable pageable) {
        Specification<Grammar> spec = GrammarSpecification.buildSpecification(
                request.getKeyword(),
                request.getLevel()
        );
        Page<Grammar> grammarPage = grammarRepository.findAll(spec, pageable);
        return grammarPage.map(grammarMapper::toGrammarResponse);
    }


}
