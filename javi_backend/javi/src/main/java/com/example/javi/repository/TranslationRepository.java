package com.example.javi.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.javi.entity.Translation;

@Repository
public interface TranslationRepository extends JpaRepository<Translation, Long> {}
