package com.example.javi.service.Impl;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.example.javi.dto.request.GrammarCheckSourceText;
import com.example.javi.dto.request.TranslateRequest;
import com.example.javi.dto.response.GrammarCheckResult;
import com.example.javi.dto.response.TranslateResponse;
import com.example.javi.entity.AccountType;
import com.example.javi.entity.EngineType;
import com.example.javi.entity.Translation;
import com.example.javi.entity.Users;
import com.example.javi.exeption.AppException;
import com.example.javi.exeption.ErrorCode;
import com.example.javi.mapper.TranslationMapper;
import com.example.javi.repository.TranslationRepository;
import com.example.javi.service.GeminiService;
import com.example.javi.service.OcrService;
import com.example.javi.service.UsersService;
import com.example.javi.utils.SecurityUtil;
import com.github.pemistahl.lingua.api.Language;
import com.github.pemistahl.lingua.api.LanguageDetector;
import com.github.pemistahl.lingua.api.LanguageDetectorBuilder;

import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class GeminiServiceImpl implements GeminiService {
    ChatClient chatClient;
    SecurityUtil securityUtil;
    TranslationMapper translationMapper;
    TranslationRepository translationRepository;
    OcrService ocrService;
    UsersService usersService;

    public GeminiServiceImpl(
            ChatClient.Builder builder,
            SecurityUtil securityUtil,
            TranslationMapper translationMapper,
            TranslationRepository translationRepository,
            OcrService ocrService,
            UsersService usersService) {
        this.chatClient = builder.build();
        this.securityUtil = securityUtil;
        this.translationMapper = translationMapper;
        this.translationRepository = translationRepository;
        this.ocrService = ocrService;
        this.usersService = usersService;
    }

    LanguageDetector detector = LanguageDetectorBuilder.fromLanguages(
                    Language.VIETNAMESE, Language.JAPANESE, Language.ENGLISH)
            .build();

    @Override
    @Transactional
    public TranslateResponse translateText(TranslateRequest request) {
        Users currentUser = securityUtil.getCurrentUser();
        if (currentUser == null) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        if (currentUser.getAccountType() == AccountType.FREE) {
            usersService.checkAndUpdateImageQuota(currentUser);
        }

        String text = request.getSourceText();
        if (text == null || text.isBlank()) {
            throw new AppException(ErrorCode.SOURCE_TEXT_CANNOT_EMPTY);
        }
        if (text.length() > 5000) {
            throw new AppException(ErrorCode.SOURCE_TEXT_TOO_LONG);
        }

        Language detectedLang = detector.detectLanguageOf(request.getSourceText());
        String detectedLangCode = detectedLang.getIsoCode639_1().toString();
        String currentLang = request.getSourceLang();
        if (currentLang == null || currentLang.isBlank() || !detectedLangCode.equalsIgnoreCase(currentLang)) {
            log.info(
                    "[LANG DETECT] Phát hiện ngôn ngữ thực tế là '{}', cập nhật sourceLang từ '{}' → '{}'",
                    detectedLangCode,
                    currentLang,
                    detectedLangCode);
            request.setSourceLang(detectedLangCode);
        }
        // dịch vẫn sượng do prompt chưa chuẩn
        String prompt = String.format(
                """
						Please translate this paragraph into %s so that it sounds natural, easy to read,
						and conveys the original feeling.
						Output only the final translation — do not include explanations, brackets, or notes.
						The paragraph to be translated is: %s
						""",
                request.getTargetLang(), request.getSourceText());

        String translatedText = chatClient.prompt().user(prompt).call().content();

        Translation translation = translationMapper.toTranslation(request);
        translation.setUser(currentUser);
        translation.setTranslatedText(translatedText);
        translation.setEngine(EngineType.AI);
        translationRepository.save(translation);

        return translationMapper.translationToTranslateResponse(translation);
    }

    @Override
    @Transactional
    public TranslateResponse translateImage(MultipartFile imageFile, String targetLang, String sourceLang) {
        Users user = securityUtil.getCurrentUser();
        if (user == null) throw new AppException(ErrorCode.UNAUTHENTICATED);

        // Chỉ Premium mới được phép dịch ảnh
        if (user.getAccountType() == AccountType.FREE) throw new AppException(ErrorCode.REQUIRE_PREMIUM);

        // OCR ảnh
        String extractedText = ocrService.extractTextFromImage(imageFile);
        if (extractedText == null || extractedText.isBlank())
            throw new AppException(ErrorCode.CANNOT_DETECTED_TEXT_IN_IMAGE);

        // Gọi translateText (vì Premium user luôn hợp lệ)
        TranslateRequest translateRequest = new TranslateRequest();
        translateRequest.setTargetLang(targetLang);
        translateRequest.setSourceText(extractedText);
        translateRequest.setSourceLang(sourceLang);
        return translateText(translateRequest);
    }

    @Override
    public String explainWord(String word) {
        String prompt = String.format(
                """
						Bạn là một giáo viên người Nhật chuyên dạy tiếng Nhật cho người Việt.
						Hãy giải thích từ vựng: "%s" một cách tự nhiên.
						Cách trình bày mong muốn:
						1. Dòng đầu: Viết từ vựng gốc bằng tiếng Nhật.
						Ví dụ: 「飲む」(のむ, nomu)
						2. Viết một đoạn ngắn giải thích ý nghĩa tổng quát, phạm vi sử dụng của từ, dễ hiểu, tự nhiên.
						3. Sau đó liệt kê các cách dùng phổ biến nhất theo dạng:
							1. Nghĩa 1 (mô tả nghĩa, dùng khi nào)
								Ví dụ: Câu ví dụ tiếng Nhật (Phiên âm Romaji)
								Dịch nghĩa tiếng Việt
							2. Nghĩa 2 ...
						4. Nếu có thể, chọn ví dụ sinh động, gần gũi (đời sống, công việc, học tập).
						5. Tuyệt đối không dùng ký tự đặc biệt như *, **, #, hoặc markdown.
						6. Trình bày rõ ràng, có dấu xuống dòng tự nhiên, dễ hiển thị trên web.
						7. Trả về hoàn toàn bằng tiếng Việt (ngoại trừ từ và ví dụ tiếng Nhật).
						8. Không thêm phần tiêu đề, giới thiệu hay lời chào.
						""",
                word);

        String result = chatClient.prompt().user(prompt).call().content();

        log.info("AI explanation for {}: {}", word, result);
        return result;
    }

    @Override
    public GrammarCheckResult checkGrammar(GrammarCheckSourceText request) {
        Users currentUser = securityUtil.getCurrentUser();
        if (currentUser == null) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        if (currentUser.getAccountType() != AccountType.PREMIUM) {
            throw new AppException(ErrorCode.REQUIRE_PREMIUM);
        }

        String prompt = String.format(
                """
				Bạn là chuyên gia ngữ pháp tiếng Nhật.
				Hãy kiểm tra và sửa ngữ pháp của đoạn văn sau, sau đó giải thích các lỗi một cách dễ hiểu vì sao phải sửa.
				Yêu cầu quan trọng:
				1. Nếu có lỗi, giải thích (explanation) nên trình bày rõ ràng theo từng câu
				hoặc cấu trúc ngữ pháp, nêu rõ và chi tiết vì sao phải sửa — không liệt kê từng chữ,
				không giải thích bằng ngôn ngữ đoạn văn cần kiểm tra ngữ pháp.
				2. Các phần (explanation, mean) phải được viết bằng ngôn ngữ %s.
				""",
                request.getTargetLang());

        SystemMessage system = new SystemMessage(prompt);
        UserMessage user = new UserMessage(request.getSourceText());
        Prompt grammarPrompt = new Prompt(system, user);

        return chatClient.prompt(grammarPrompt).call().entity(GrammarCheckResult.class);
    }
}
