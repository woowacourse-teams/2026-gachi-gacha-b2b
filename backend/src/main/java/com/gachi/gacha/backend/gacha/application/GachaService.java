package com.gachi.gacha.backend.gacha.application;

import com.gachi.gacha.backend.common.infra.application.ImageUploader;
import com.gachi.gacha.backend.common.infra.domain.ImageType;
import com.gachi.gacha.backend.common.util.S3TransactionManager;
import com.gachi.gacha.backend.gacha.application.dto.GachaCreateCommand;
import com.gachi.gacha.backend.gacha.application.dto.GachaDeleteResult;
import com.gachi.gacha.backend.gacha.application.dto.GachaInfo;
import com.gachi.gacha.backend.gacha.application.dto.GachaResult;
import com.gachi.gacha.backend.gacha.application.dto.GachaUpdateCommand;
import com.gachi.gacha.backend.gacha.domain.Category;
import com.gachi.gacha.backend.gacha.domain.Gacha;
import com.gachi.gacha.backend.gacha.domain.GachaJpaRepository;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class GachaService {

    private final GachaJpaRepository gachaRepository;
    private final S3TransactionManager s3TransactionManager;
    private final ImageUploader imageUploader;
    private final CategoryService categoryService;
    @Value("${cloud.aws.s3.folder}")
    private final String s3RootFolder;

    @Transactional
    public GachaInfo addGacha(final GachaCreateCommand command) {
        List<Category> categories = categoryService.resolve(command.categories());
        Gacha gacha = command.toEntity(categories);
        Gacha savedGacha = gachaRepository.save(gacha);
        return GachaInfo.from(savedGacha);
    }

    @Transactional
    public GachaResult modify(final Long gachaId, final GachaUpdateCommand command) {
        Gacha gacha = gachaRepository.getById(gachaId);
        List<Category> categories = command.categories() == null
                ? null
                : categoryService.resolveByIds(command.categories());
        gacha.patch(command.name(), command.caption(), command.thumbnailUrl(), categories);
        Gacha saved = gachaRepository.save(gacha);
        return GachaResult.from(saved);
    }

    @Transactional
    public GachaInfo addCategory(final Long gachaId, final Long categoryId) {
        Gacha gacha = gachaRepository.getById(gachaId);
        Category category = categoryService.resolveByIds(List.of(categoryId)).getFirst();
        gacha.addCategory(category);
        return GachaInfo.from(gachaRepository.save(gacha));
    }

    @Transactional
    public GachaInfo updateThumbnail(final Long gachaId, final MultipartFile image) {
        Gacha gacha = gachaRepository.getById(gachaId);
        String oldImageUrl = gacha.getThumbnailUrl();
        String newImageUrl = imageUploader.upload(image, ImageType.GACHA.buildPath(s3RootFolder));

        gacha.updateThumbnailUrl(newImageUrl);
        Gacha savedGacha = gachaRepository.save(gacha);

        if (oldImageUrl == null || oldImageUrl.isBlank()) {
            s3TransactionManager.deleteImagesOnRollback(ImageType.GACHA, gachaId, List.of(newImageUrl));
        } else {
            s3TransactionManager.cleanupAfterImageReplaced(
                    ImageType.GACHA,
                    gachaId,
                    oldImageUrl,
                    newImageUrl
            );
        }
        return GachaInfo.from(savedGacha);
    }

    @Transactional
    public GachaInfo removeThumbnail(final Long gachaId) {
        Gacha gacha = gachaRepository.getById(gachaId);
        String oldImageUrl = gacha.getThumbnailUrl();

        gacha.removeThumbnailUrl();
        Gacha savedGacha = gachaRepository.save(gacha);

        if (oldImageUrl != null && !oldImageUrl.isBlank()) {
            s3TransactionManager.trashImagesAfterRemoved(ImageType.GACHA, gachaId, List.of(oldImageUrl));
        }
        return GachaInfo.from(savedGacha);
    }

    @Transactional
    public GachaDeleteResult remove(final Long gachaId) {
        Gacha gacha = gachaRepository.getById(gachaId);

        gachaRepository.deleteById(gachaId);

        List<String> imageUrls = gacha.getThumbnailUrl() == null || gacha.getThumbnailUrl().isBlank()
                ? List.of()
                : List.of(gacha.getThumbnailUrl());
        s3TransactionManager.trashImagesAfterRemoved(ImageType.GACHA, gachaId, imageUrls);

        return GachaDeleteResult.from(gacha);
    }

    public Page<GachaInfo> findAllGacha(@Nullable final String keyword, final Pageable pageable) {
        if (keyword == null || keyword.isBlank()) {
            return toOrderedPage(gachaRepository.findGachaIds(pageable))
                    .map(GachaInfo::from);
        }
        return toOrderedPage(gachaRepository.findGachaIdsByNameContaining(keyword, pageable))
                .map(GachaInfo::from);
    }

    public GachaInfo findGachaById(final Long gachaId) {
        return GachaInfo.from(gachaRepository.getById(gachaId));
    }

    public Gacha findByGachaId(final Long gachaId) {
        return gachaRepository.getById(gachaId);
    }

    private Page<Gacha> toOrderedPage(final Page<Long> idPage) {
        List<Gacha> gachas = gachaRepository.findByIdsWithCategories(idPage.getContent());

        Map<Long, Gacha> gachaById = gachas.stream()
                .collect(Collectors.toMap(Gacha::getId, Function.identity()));

        List<Gacha> ordered = idPage.getContent().stream()
                .map(gachaById::get)
                .toList();

        return new PageImpl<>(ordered, idPage.getPageable(), idPage.getTotalElements());
    }
}
