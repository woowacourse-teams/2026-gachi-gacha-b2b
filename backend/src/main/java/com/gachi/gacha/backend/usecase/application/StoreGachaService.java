package com.gachi.gacha.backend.usecase.application;

import static com.gachi.gacha.backend.common.exception.ErrorCode.STORE_GACHA_NOT_FOUND;

import com.gachi.gacha.backend.gacha.application.event.GachaChangedEvent;
import com.gachi.gacha.backend.gacha.domain.Gacha;
import com.gachi.gacha.backend.store.application.dto.StoreGachaInfo;
import com.gachi.gacha.backend.usecase.application.dto.GachaSummaryInfo;
import com.gachi.gacha.backend.usecase.application.dto.StoreGachaCreatCommand;
import com.gachi.gacha.backend.usecase.application.dto.StoreGachaDeleteCommand;
import com.gachi.gacha.backend.usecase.domain.StoreGacha;
import com.gachi.gacha.backend.usecase.domain.StoreGachaJpaRepository;
import com.gachi.gacha.backend.usecase.domain.exception.StoreGachaNotFoundException;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class StoreGachaService {

    private final ApplicationEventPublisher publisher;
    private final StoreGachaJpaRepository storeGachaJpaRepository;

    @Transactional
    public StoreGachaInfo addStoreGacha(final StoreGachaCreatCommand command) {
        StoreGacha storeGacha = StoreGacha.builder()
                .store(command.store())
                .gacha(command.gacha())
                .build();
        StoreGacha saved = storeGachaJpaRepository.save(storeGacha);
        publisher.publishEvent(GachaChangedEvent.change(List.of(saved.getGacha().getId())));
        return StoreGachaInfo.from(saved);
    }

    public Page<GachaSummaryInfo> findGachasByStoreId(final Long storeId, final Pageable pageable) {
        Page<Gacha> gachas = storeGachaJpaRepository.findGachasByStoreId(storeId, pageable);
        return gachas.map(GachaSummaryInfo::from);
    }

    @Transactional
    public StoreGachaInfo removeStoreGacha(final StoreGachaDeleteCommand storeGachaDeleteCommand) {
        Gacha gacha = storeGachaDeleteCommand.gacha();
        StoreGacha storeGacha = storeGachaJpaRepository.deleteStoreGachaByStoreAndGacha(
                storeGachaDeleteCommand.store(), gacha
        );
        if (storeGacha == null) {
            throw new StoreGachaNotFoundException(STORE_GACHA_NOT_FOUND);
        }
        publisher.publishEvent(GachaChangedEvent.change(List.of(gacha.getId())));
        return StoreGachaInfo.from(storeGacha);
    }

    @Transactional
    public void removeAllByStoreId(final Long storeId) {
        List<Long> gachaIds = storeGachaJpaRepository.findGachaIdsByStoreId(storeId);
        if (!gachaIds.isEmpty()) {
            publisher.publishEvent(GachaChangedEvent.change(gachaIds));
        }
        storeGachaJpaRepository.deleteAllByStoreId(storeId);
    }

    @Transactional
    public void removeAllByGachaId(final Long gachaId) {
        storeGachaJpaRepository.deleteAllByGachaId(gachaId);
    }
}
