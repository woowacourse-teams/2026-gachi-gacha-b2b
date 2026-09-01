package com.gachi.gacha.backend.collection.application;

import static com.gachi.gacha.backend.common.exception.ErrorCode.COLLECTION_SOURCE_MISMATCH;

import com.gachi.gacha.backend.collection.domain.CollectedGacha;
import com.gachi.gacha.backend.collection.domain.CollectionSource;
import com.gachi.gacha.backend.collection.domain.GachaCollectionException;
import com.gachi.gacha.backend.common.infra.application.ImageUploader;
import com.gachi.gacha.backend.common.infra.domain.ImageType;
import com.gachi.gacha.backend.common.util.S3TransactionManager;
import com.gachi.gacha.backend.gacha.domain.Gacha;
import com.gachi.gacha.backend.gacha.domain.GachaJpaRepository;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class GachaCollectionService {

    private final GachaJpaRepository gachaRepository;
    private final ImageUploader imageUploader;
    private final S3TransactionManager s3TransactionManager;

    @Value("${cloud.aws.s3.folder}")
    private String s3RootFolder;

    @Transactional
    public int saveNewGachas(
            final CollectionSource source,
            final List<CollectedGacha> collectedGachas
    ) {
        List<CollectedGacha> newCollectedGachas = findNewGachas(source, collectedGachas);
        if (newCollectedGachas.isEmpty()) {
            return 0;
        }

        List<Gacha> newGachas = createGachas(newCollectedGachas);
        gachaRepository.saveAll(newGachas);
        return newGachas.size();
    }

    private List<CollectedGacha> findNewGachas(
            final CollectionSource source,
            final List<CollectedGacha> collectedGachas
    ) {
        Map<String, CollectedGacha> uniqueGachas = deduplicate(source, collectedGachas);
        if (uniqueGachas.isEmpty()) {
            return List.of();
        }

        Set<String> existingProductCodes = gachaRepository.findExistingProductCodes(
                source,
                uniqueGachas.keySet()
        );
        return uniqueGachas.values().stream()
                .filter(gacha -> !existingProductCodes.contains(gacha.productCode()))
                .toList();
    }

    private List<Gacha> createGachas(final List<CollectedGacha> collectedGachas) {
        List<String> uploadedImageUrls = new ArrayList<>();
        s3TransactionManager.deleteImagesOnRollback(ImageType.GACHA, null, uploadedImageUrls);
        return collectedGachas.stream()
                .map(gacha -> uploadImageAndConvert(gacha, uploadedImageUrls))
                .toList();
    }

    private Map<String, CollectedGacha> deduplicate(
            final CollectionSource source,
            final List<CollectedGacha> collectedGachas
    ) {
        Map<String, CollectedGacha> uniqueGachas = new LinkedHashMap<>();
        for (CollectedGacha collectedGacha : collectedGachas) {
            if (collectedGacha.source() != source) {
                throw new GachaCollectionException(COLLECTION_SOURCE_MISMATCH);
            }
            uniqueGachas.putIfAbsent(collectedGacha.productCode(), collectedGacha);
        }
        return uniqueGachas;
    }

    private Gacha uploadImageAndConvert(
            final CollectedGacha collectedGacha,
            final List<String> uploadedImageUrls
    ) {
        String s3ImageUrl = imageUploader.uploadFromUrl(
                collectedGacha.imageUrl(),
                ImageType.GACHA.buildPath(s3RootFolder)
        );
        uploadedImageUrls.add(s3ImageUrl);

        return new Gacha(
                collectedGacha.name(),
                s3ImageUrl,
                collectedGacha.source(),
                collectedGacha.productCode(),
                List.of()
        );
    }
}
