package com.example.javi.specification;

import com.example.javi.entity.Grammar;
import com.example.javi.entity.JlptLevel;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;

public class GrammarSpecification {
    public static Specification<Grammar> buildSpecification(String q, JlptLevel level) {

        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (level != null) {
                predicates.add(criteriaBuilder.equal(root.get("level"), level));
            }
            if (StringUtils.hasText(q)) {
                String likePattern = "%" + q.toLowerCase() + "%";
                Predicate qSearchPredicate = criteriaBuilder.or(
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("pattern")), likePattern),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("meaning")), likePattern)
                );
                predicates.add(qSearchPredicate);
            }
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
