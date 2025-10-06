package com.example.javi.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.example.javi.entity.Grammar;

@Repository
public interface GrammarRepository extends JpaRepository<Grammar, Long>, JpaSpecificationExecutor<Grammar> {
    boolean existsByPattern(String pattern);

    boolean existsByPatternAndGrammarIdNot(String pattern, Long id);
}
