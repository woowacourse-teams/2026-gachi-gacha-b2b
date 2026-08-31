package com.gachi.gacha.backend.gacha.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface GachaCategoryJpaRepository extends JpaRepository<GachaCategory, Long> {

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM GachaCategory gc WHERE gc.category.id = :categoryId")
    int deleteAllByCategoryId(@Param("categoryId") Long categoryId);
}
