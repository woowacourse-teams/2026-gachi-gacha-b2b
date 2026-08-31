package com.gachi.gacha.backend.collection.application;

import com.gachi.gacha.backend.collection.domain.CollectedGacha;
import com.gachi.gacha.backend.collection.domain.CollectionSource;
import com.gachi.gacha.backend.gacha.domain.Gacha;
import com.gachi.gacha.backend.gacha.domain.GachaJpaRepository;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GachaCollectionService {

    private final GachaJpaRepository gachaRepository;

    public GachaCollectionService(final GachaJpaRepository gachaRepository) {
        this.gachaRepository = gachaRepository;
    }

    @Transactional
    public int saveNewGachas(
            final CollectionSource source,
            final Collection<CollectedGacha> collectedGachas
    ) {
        final Map<String, CollectedGacha> uniqueGachas = deduplicate(source, collectedGachas);
        if (uniqueGachas.isEmpty()) {
            return 0;
        }

        final Set<String> existingProductCodes = gachaRepository.findExistingProductCodes(
                source,
                uniqueGachas.keySet()
        );
        final List<Gacha> newGachas = uniqueGachas.values().stream()
                .filter(gacha -> !existingProductCodes.contains(gacha.productCode()))
                .map(this::toEntity)
                .toList();

        gachaRepository.saveAll(newGachas);
        return newGachas.size();
    }

    private Map<String, CollectedGacha> deduplicate(
            final CollectionSource source,
            final Collection<CollectedGacha> collectedGachas
    ) {
        final Map<String, CollectedGacha> uniqueGachas = new LinkedHashMap<>();
        for (final CollectedGacha collectedGacha : collectedGachas) {
            if (collectedGacha.source() != source) {
                throw new IllegalArgumentException("수집 출처가 일치하지 않습니다.");
            }
            uniqueGachas.putIfAbsent(collectedGacha.productCode(), collectedGacha);
        }
        return uniqueGachas;
    }

    private Gacha toEntity(final CollectedGacha collectedGacha) {
        return new Gacha(
                collectedGacha.name(),
                collectedGacha.imageUrl(),
                collectedGacha.source(),
                collectedGacha.productCode(),
                collectedGacha.category()
        );
    }
}
