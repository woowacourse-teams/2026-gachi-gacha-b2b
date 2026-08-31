package com.gachi.gacha.backend.collection.application;

import com.gachi.gacha.backend.gacha.domain.Gacha;
import com.gachi.gacha.backend.store.application.StoreService;
import com.gachi.gacha.backend.store.domain.Store;
import com.gachi.gacha.backend.store.domain.StoreDetail;
import com.gachi.gacha.backend.usecase.application.StoreGachaService;
import com.gachi.gacha.backend.usecase.application.dto.StoreGachaCreatCommand;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "collection.instagram", name = "enabled", havingValue = "true")
public class InstagramGachaCollectionFacade {

    private static final int PAGE_SIZE = 50;

    private final StoreService storeService;
    private final InstagramGachaCollectionService collectionService;
    private final StoreGachaService storeGachaService;

    public int collectAllGachas() {
        int collectedCount = 0;
        Pageable pageable = PageRequest.of(0, PAGE_SIZE, Sort.by("id"));
        Slice<StoreDetail> page;

        do {
            page = storeService.findStoresWithInstagram(pageable);
            collectedCount += page.getContent().stream()
                    .mapToInt(this::processStore)
                    .sum();
            pageable = pageable.next();
        } while (page.hasNext());

        log.info("Instagram 가챠 데이터 수집 완료. inserted={}", collectedCount);
        return collectedCount;
    }

    private int processStore(final StoreDetail storeDetail) {
        final Store store = storeDetail.getStore();
        try {
            final List<Gacha> collectedGachas = collectionService.collectPostsForShop(storeDetail.getInstagramId());
            addStoreGachas(collectedGachas, store);
            return collectedGachas.size();
        } catch (final RuntimeException exception) {
            log.error("Instagram 상점 처리 실패. storeId={}, instagramId={}",
                    store.getId(), storeDetail.getInstagramId(), exception);
            return 0;
        }
    }

    private void addStoreGachas(final List<Gacha> collectedGachas, final Store store) {
        for (final Gacha gacha : collectedGachas) {
            final StoreGachaCreatCommand command = StoreGachaCreatCommand.builder()
                    .store(store)
                    .gacha(gacha)
                    .build();
            storeGachaService.addStoreGacha(command);
        }
    }
}
