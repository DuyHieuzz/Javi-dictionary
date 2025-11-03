package com.example.javi.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.javi.entity.HistorySearch;
import com.example.javi.entity.Users;

@Repository
public interface HistorySearchRepository
        extends JpaRepository<HistorySearch, Long>, JpaSpecificationExecutor<HistorySearch> {
    Page<HistorySearch> findByUserOrderBySearchedAtDesc(Users user, Pageable pageable);

    void deleteByUser(Users user);

    void deleteByIdInAndUser(List<Long> ids, Users user);

    @SuppressWarnings("SqlNoDataSourceInspection")
    @Modifying
    @Query(
            value =
                    """
				DELETE FROM history_search
				WHERE user_id = :userId
				AND id NOT IN (
					SELECT id FROM (
						SELECT id FROM history_search
						WHERE user_id = :userId
						ORDER BY searched_at DESC
						LIMIT :limitCount
					) tmp
				)
			""",
            nativeQuery = true)
    void trimOldHistory(@Param("userId") Long userId, @Param("limitCount") int limitCount);
}
