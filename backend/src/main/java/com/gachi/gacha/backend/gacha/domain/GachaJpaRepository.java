package com.gachi.gacha.backend.gacha.domain;

import com.gachi.gacha.backend.collection.domain.CollectionSource;
import com.gachi.gacha.backend.common.exception.ErrorCode;
import com.gachi.gacha.backend.gacha.domain.exception.GachaNotFoundException;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.jspecify.annotations.NonNull;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface GachaJpaRepository extends JpaRepository<Gacha, Long> {

    default Gacha getById(@NonNull final Long gachaId) {
        return findByIdWithCategories(gachaId).orElseThrow(() -> new GachaNotFoundException(ErrorCode.GACHA_NOT_FOUND));
    }

    @Query("SELECT g FROM Gacha g " +
            "LEFT JOIN FETCH g.gachaCategories gc " +
            "LEFT JOIN FETCH gc.category c " +
            "WHERE g.id = :id")
    Optional<Gacha> findByIdWithCategories(@Param("id") final Long id);

    @Query("SELECT g.id FROM Gacha g")
    Page<Long> findGachaIds(Pageable pageable);

    @Query(value = """
            SELECT g.id
            FROM Gacha g
            WHERE LOWER(g.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR EXISTS (
                   SELECT gc.id
                   FROM GachaCategory gc
                   WHERE gc.gacha = g
                     AND LOWER(gc.category.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
               )
            """,
            countQuery = """
                    SELECT COUNT(g)
                    FROM Gacha g
                    WHERE LOWER(g.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
                       OR EXISTS (
                           SELECT gc.id
                           FROM GachaCategory gc
                           WHERE gc.gacha = g
                             AND LOWER(gc.category.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
                       )
                    """)
    Page<Long> findGachaIdsByKeyword(@Param("keyword") final String keyword, final Pageable pageable);

    @Query("SELECT DISTINCT g FROM Gacha g " +
            "LEFT JOIN FETCH g.gachaCategories gc " +
            "LEFT JOIN FETCH gc.category c " +
            "WHERE g.id IN :ids")
    List<Gacha> findByIdsWithCategories(@Param("ids") List<Long> ids);

    List<String> findInstagramMediaIdByInstagramMediaIdIn(final List<String> instagramMediaIds);

    @Query("""
            select g.productCode
            from Gacha g
            where g.source = :source
              and g.productCode in :productCodes
            """)
    Set<String> findExistingProductCodes(
            @Param("source") CollectionSource source,
            @Param("productCodes") Collection<String> productCodes
    );
}
