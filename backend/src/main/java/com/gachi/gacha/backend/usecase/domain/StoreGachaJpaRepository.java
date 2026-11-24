package com.gachi.gacha.backend.usecase.domain;

import com.gachi.gacha.backend.gacha.domain.Gacha;
import com.gachi.gacha.backend.store.domain.Store;
import java.util.Collection;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface StoreGachaJpaRepository extends JpaRepository<StoreGacha, Long> {

    @Query(
            value = "select sg.gacha from StoreGacha sg where sg.store.id = :storeId",
            countQuery = "select count(sg) from StoreGacha sg where sg.store.id = :storeId"
    )
    Page<Gacha> findGachasByStoreId(final Long storeId, final Pageable pageable);

    @Query("SELECT sg FROM StoreGacha sg JOIN FETCH sg.store WHERE sg.gacha.id IN :gachaIds")
    List<StoreGacha> findAllWithStoreByGachaIdIn(@Param("gachaIds") final Collection<Long> gachaIds);

    StoreGacha deleteStoreGachaByStoreAndGacha(final Store store, final Gacha gacha);

    @Query("select sg.gacha.id from StoreGacha sg where sg.store.id = :storeId")
    List<Long> findGachaIdsByStoreId(@Param("storeId") final Long storeId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from StoreGacha sg where sg.store.id = :storeId")
    void deleteAllByStoreId(@Param("storeId") final Long storeId);

    void deleteAllByGachaId(final Long gachaId);

    boolean existsByStoreId(final Long storeId);

    boolean existsByGachaId(final Long gachaId);
}
