package com.example.javi.repository;

import com.example.javi.entity.Vocabularies;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VocabulariesRepository extends JpaRepository<Vocabularies, Long>, JpaSpecificationExecutor<Vocabularies> {
    Optional<Vocabularies> findByWord(String word);
    List<Vocabularies> findByWordContainingIgnoreCase(String keyword); //

    @Query("SELECT DISTINCT v FROM Vocabularies v " +
            "LEFT JOIN v.meanings m " +
            "WHERE " +
            "   UPPER(v.hiragana) LIKE CONCAT('%', UPPER(:keyword), '%') OR " +
            "   UPPER(m.meaningVn) LIKE CONCAT('%', UPPER(:keyword), '%')")
    List<Vocabularies> findFuzzySearch(String keyword);
}
