package com.example.javi.repository;

import com.example.javi.entity.Kanji;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface KanjiRepository extends JpaRepository<Kanji, Long> {
    boolean existsByCharacterName(String characterName);

    Optional<Kanji> findByCharacterName(String japaneseCharacter);
}
