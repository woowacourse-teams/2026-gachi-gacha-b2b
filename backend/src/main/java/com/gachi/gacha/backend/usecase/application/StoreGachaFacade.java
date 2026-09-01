package com.gachi.gacha.backend.usecase.application;

import com.gachi.gacha.backend.gacha.application.GachaService;
import com.gachi.gacha.backend.gacha.application.dto.GachaDeleteResult;
import com.gachi.gacha.backend.gacha.domain.Gacha;
import com.gachi.gacha.backend.store.application.StoreService;
import com.gachi.gacha.backend.store.application.dto.StoreGachaInfo;
import com.gachi.gacha.backend.store.application.dto.StoreDeleteResult;
import com.gachi.gacha.backend.store.domain.Store;
import com.gachi.gacha.backend.usecase.application.dto.GachaSummaryInfo;
import com.gachi.gacha.backend.usecase.application.dto.StoreGachaCreatCommand;
import com.gachi.gacha.backend.usecase.application.dto.StoreGachaDeleteCommand;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class StoreGachaFacade {

    private final StoreGachaService storeGachaService;
    private final GachaService gachaService;
    private final StoreService storeService;

    public StoreGachaInfo addStoreGacha(final Long storeId, final Long gachaId) {
        Store store = storeService.findByStoreId(storeId);
        Gacha gacha = gachaService.findByGachaId(gachaId);
        return storeGachaService.addStoreGacha(StoreGachaCreatCommand.fromCommand(store, gacha));
    }

    public Page<GachaSummaryInfo> getGachas(final Long storeId, final Pageable pageable) {
        return storeGachaService.findGachasByStoreId(storeId, pageable);
    }

    public StoreGachaInfo removeStoreGacha(final Long storeId, final Long gachaId) {
        Store store = storeService.findByStoreId(storeId);
        Gacha gacha = gachaService.findByGachaId(gachaId);
        return storeGachaService.removeStoreGacha(StoreGachaDeleteCommand.fromCommand(store, gacha));
    }

    @Transactional
    public StoreDeleteResult removeStore(final Long storeId) {
        storeGachaService.removeAllByStoreId(storeId);
        return storeService.removeStore(storeId);
    }

    @Transactional
    public GachaDeleteResult removeGacha(final Long gachaId) {
        storeGachaService.removeAllByGachaId(gachaId);
        return gachaService.remove(gachaId);
    }
}
