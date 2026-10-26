package com.gachi.gacha.backend.usecase.application.event;

import com.gachi.gacha.backend.gacha.application.event.GachaChangedEvent;
import com.gachi.gacha.backend.store.application.event.StoreChangedEvent;
import com.gachi.gacha.backend.usecase.domain.StoreGachaJpaRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class StoreChangedEventListener {

    private final StoreGachaJpaRepository storeGachaJpaRepository;
    private final ApplicationEventPublisher publisher;

    @EventListener(StoreChangedEvent.class)
    public void handle(final StoreChangedEvent event) {
        List<Long> gachaIds = storeGachaJpaRepository.findGachaIdsByStoreId(event.storeId());
        if (gachaIds.isEmpty()) {
            return;
        }
        publisher.publishEvent(GachaChangedEvent.change(gachaIds));
    }
}
