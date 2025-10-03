package com.example.javi.repository;

import com.example.javi.entity.GrammarExample;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface GrammarExampleRepository extends JpaRepository<GrammarExample, Long> {
    @Modifying
    @Transactional
    @Query("DELETE FROM GrammarExample e WHERE e.grammar.grammarId = :grammarId AND e.id NOT IN :ids")
    void bulkDeleteExamplesNotIn(@Param("grammarId") Long grammarId, @Param("ids") List<Long> ids);

    @Modifying
    @Query("DELETE FROM GrammarExample e WHERE e.grammar.grammarId = :grammarId")
    void deleteByGrammarId(@Param("grammarId") Long grammarId);
}
