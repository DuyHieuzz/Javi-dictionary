package com.example.javi.repository;

import com.example.javi.dto.response.KanjiResponse;
import com.example.javi.entity.Kanji;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface KanjiRepository extends JpaRepository<Kanji, Long>, JpaSpecificationExecutor<Kanji> {
    boolean existsByCharacterName(String characterName);
    Optional<Kanji> findByCharacterName(String japaneseCharacter);
    void deleteKanjiByCharacterName(String characterName);
    List<Kanji> findBySinoViNameContainingIgnoreCase(String sinoViName);
}
