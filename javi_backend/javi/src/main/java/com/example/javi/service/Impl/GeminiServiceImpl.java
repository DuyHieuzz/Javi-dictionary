package com.example.javi.service.Impl;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import com.example.javi.dto.request.TranslateRequest;
import com.example.javi.dto.response.TranslateResponse;
import com.example.javi.entity.Translation;
import com.example.javi.entity.Users;
import com.example.javi.mapper.TranslationMapper;
import com.example.javi.repository.TranslationRepository;
import com.example.javi.service.GeminiService;
import com.example.javi.utils.SecurityUtil;

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

    public GeminiServiceImpl(
            ChatClient.Builder builder,
            SecurityUtil securityUtil,
            TranslationMapper translationMapper,
            TranslationRepository translationRepository) {
        this.chatClient = builder.build();
        this.securityUtil = securityUtil;
        this.translationMapper = translationMapper;
        this.translationRepository = translationRepository;
    }

    @Override
    public TranslateResponse translateText(TranslateRequest request, Authentication authentication) {
        String prompt = String.format(
                """
						You are a professional literary translator and creative writer.
						Translate the following text into %s.
						Output only the final translation — do not include explanations, brackets, or notes.
						Text to translate:
						%s
						""",
                request.getTargetLang(), request.getSourceText());

        String translatedText = chatClient.prompt().user(prompt).call().content();

        if (authentication != null) {
            Users currentUser = securityUtil.getCurrentUser();
            Translation translation = translationMapper.toTranslation(request);
            translation.setUser(currentUser);
            translation.setTranslatedText(translatedText);
            translationRepository.save(translation);
        }

        TranslateResponse translateResponse = translationMapper.toTranslateResponse(request);
        translateResponse.setTranslatedText(translatedText);

        return translateResponse;
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
}
