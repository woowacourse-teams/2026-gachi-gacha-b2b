package com.gachi.gacha.backend.gacha.domain;

import com.gachi.gacha.backend.collection.domain.CollectionSource;
import com.gachi.gacha.backend.common.exception.ErrorCode;
import com.gachi.gacha.backend.gacha.domain.exception.GachaNotFoundException;
import java.util.Collection;
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
        return findById(gachaId).orElseThrow(() -> new GachaNotFoundException(ErrorCode.GACHA_NOT_FOUND));
    }

    Page<Gacha> findByNameContaining(final String keyword, final Pageable pageable);

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
