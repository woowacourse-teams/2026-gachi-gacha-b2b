package com.gachi.gacha.backend.usecase.application;

import com.gachi.gacha.backend.gacha.domain.Gacha;
import com.gachi.gacha.backend.store.application.dto.StoreGachaInfo;
import com.gachi.gacha.backend.usecase.application.dto.GachaSummaryInfo;
import com.gachi.gacha.backend.usecase.application.dto.StoreGachaCreatCommand;
import com.gachi.gacha.backend.usecase.application.dto.StoreGachaDeleteCommand;
import com.gachi.gacha.backend.usecase.domain.StoreGacha;
import com.gachi.gacha.backend.usecase.domain.StoreGachaJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class StoreGachaService {

    private final StoreGachaJpaRepository storeGachaJpaRepository;

    @Transactional
    public StoreGachaInfo addStoreGacha(final StoreGachaCreatCommand command) {
        StoreGacha storeGacha = StoreGacha.builder()
                .store(command.store())
                .gacha(command.gacha())
                .build();
        return StoreGachaInfo.from(storeGachaJpaRepository.save(storeGacha));
    }

    public Page<GachaSummaryInfo> findGachasByStoreId(final Long storeId, final Pageable pageable) {
        Page<Gacha> gachas = storeGachaJpaRepository.findGachasByStoreId(storeId, pageable);
        return gachas.map(GachaSummaryInfo::from);
    }

    @Transactional
    public StoreGachaInfo removeStoreGacha(final StoreGachaDeleteCommand storeGachaDeleteCommand) {
        return StoreGachaInfo.from(
                storeGachaJpaRepository.deleteStoreGachaByStoreAndGacha(
                        storeGachaDeleteCommand.store(), storeGachaDeleteCommand.gacha()
                )
        );
    }
}
