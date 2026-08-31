package com.gachi.gacha.backend.store.domain;

import com.gachi.gacha.backend.common.exception.ErrorCode;
import com.gachi.gacha.backend.store.domain.exception.StoreNotFoundException;
import org.jspecify.annotations.NonNull;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StoreJpaRepository extends JpaRepository<Store, Long> {

    default Store getById(@NonNull final Long storeId) {
        return findById(storeId).orElseThrow(() -> new StoreNotFoundException(ErrorCode.STORE_NOT_FOUND));
    }

    @Override
    Page<Store> findAll(final Pageable pageable);
}
