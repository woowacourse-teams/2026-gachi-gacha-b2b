package com.gachi.gacha.backend.collection.application;

import com.gachi.gacha.backend.collection.domain.CollectedGacha;
import com.gachi.gacha.backend.collection.domain.CollectionSource;
import com.gachi.gacha.backend.common.infra.application.ImageUploader;
import com.gachi.gacha.backend.common.infra.domain.ImageType;
import com.gachi.gacha.backend.common.util.S3TransactionManager;
import com.gachi.gacha.backend.gacha.domain.Gacha;
import com.gachi.gacha.backend.gacha.domain.GachaJpaRepository;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GachaCollectionService {

    private final GachaJpaRepository gachaRepository;
    private final ImageUploader imageUploader;
    private final S3TransactionManager s3TransactionManager;
    private final String s3RootFolder;

    public GachaCollectionService(
            final GachaJpaRepository gachaRepository,
            final ImageUploader imageUploader,
            final S3TransactionManager s3TransactionManager,
            @Value("${cloud.aws.s3.folder}") final String s3RootFolder
    ) {
        this.gachaRepository = gachaRepository;
        this.imageUploader = imageUploader;
        this.s3TransactionManager = s3TransactionManager;
        this.s3RootFolder = s3RootFolder;
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
        final List<CollectedGacha> newCollectedGachas = uniqueGachas.values().stream()
                .filter(gacha -> !existingProductCodes.contains(gacha.productCode()))
                .toList();
        if (newCollectedGachas.isEmpty()) {
            return 0;
        }

        final List<String> uploadedImageUrls = new ArrayList<>();
        s3TransactionManager.deleteImagesOnRollback(ImageType.GACHA, null, uploadedImageUrls);
        final List<Gacha> newGachas = newCollectedGachas.stream()
                .map(gacha -> uploadImageAndConvert(gacha, uploadedImageUrls))
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

    private Gacha uploadImageAndConvert(
            final CollectedGacha collectedGacha,
            final List<String> uploadedImageUrls
    ) {
        final String s3ImageUrl = imageUploader.uploadFromUrl(
                collectedGacha.imageUrl(),
                ImageType.GACHA.buildPath(s3RootFolder)
        );
        uploadedImageUrls.add(s3ImageUrl);

        return new Gacha(
                collectedGacha.name(),
                s3ImageUrl,
                collectedGacha.source(),
                collectedGacha.productCode(),
                collectedGacha.category()
        );
    }
}
