package com.gachi.gacha.backend.collection.application;

import com.gachi.gacha.backend.collection.domain.CollectionSource;
import com.gachi.gacha.backend.collection.domain.GachaKeyword;
import com.gachi.gacha.backend.collection.infra.platform.PlatformClient;
import com.gachi.gacha.backend.collection.infra.platform.dto.PlatformPostDto;
import com.gachi.gacha.backend.common.infra.application.ImageUploader;
import com.gachi.gacha.backend.common.infra.domain.ImageType;
import com.gachi.gacha.backend.common.infra.exception.ImageInvalidValueException;
import com.gachi.gacha.backend.common.infra.exception.S3Exception;
import com.gachi.gacha.backend.gacha.domain.Gacha;
import com.gachi.gacha.backend.gacha.domain.GachaJpaRepository;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@ConditionalOnProperty(prefix = "collection.instagram", name = "enabled", havingValue = "true")
public class InstagramGachaCollectionService {

    private static final int MAX_UPLOAD_ATTEMPTS = 2;
    private static final long UPLOAD_RETRY_DELAY_MS = 500;

    private final List<PlatformClient> platformClients;
    private final GachaJpaRepository gachaRepository;
    private final ImageUploader imageUploader;
    private final ExecutorService imageUploadExecutor;
    private final String s3RootFolder;

    public InstagramGachaCollectionService(
            final List<PlatformClient> platformClients,
            final GachaJpaRepository gachaRepository,
            final ImageUploader imageUploader,
            @Qualifier("instagramImageUploadExecutor") final ExecutorService imageUploadExecutor,
            @Value("${cloud.aws.s3.folder}") final String s3RootFolder
    ) {
        this.platformClients = platformClients;
        this.gachaRepository = gachaRepository;
        this.imageUploader = imageUploader;
        this.imageUploadExecutor = imageUploadExecutor;
        this.s3RootFolder = s3RootFolder;
    }

    public List<Gacha> collectPostsForShop(final String shopInstagramId) {
        final List<Gacha> savedGachas = new ArrayList<>();
        for (final PlatformClient platformClient : platformClients) {
            savedGachas.addAll(collectFromPlatform(platformClient, shopInstagramId));
        }
        return savedGachas;
    }

    private List<Gacha> collectFromPlatform(
            final PlatformClient platformClient,
            final String shopInstagramId
    ) {
        try {
            final List<PlatformPostDto> posts = platformClient.fetchRecentPosts(
                    shopInstagramId,
                    this::hasAlreadyCollectedPost
            );
            return uploadAndSaveInParallel(filterPostsToUpload(posts));
        } catch (final RuntimeException exception) {
            log.error("{} 계정 수집 실패", shopInstagramId, exception);
            return List.of();
        }
    }

    private boolean hasAlreadyCollectedPost(final List<PlatformPostDto> posts) {
        final List<String> mediaIds = posts.stream()
                .map(PlatformPostDto::originalId)
                .toList();
        return !gachaRepository.findInstagramMediaIdByInstagramMediaIdIn(mediaIds).isEmpty();
    }

    private List<PlatformPostDto> filterPostsToUpload(final List<PlatformPostDto> posts) {
        final List<String> mediaIds = posts.stream()
                .map(PlatformPostDto::originalId)
                .toList();
        final Set<String> existingMediaIds = new HashSet<>(
                gachaRepository.findInstagramMediaIdByInstagramMediaIdIn(mediaIds)
        );

        return posts.stream()
                .takeWhile(post -> !existingMediaIds.contains(post.originalId()))
                .filter(post -> post.content() != null && GachaKeyword.isIncludedIn(post.content()))
                .toList();
    }

    private List<Gacha> uploadAndSaveInParallel(final List<PlatformPostDto> postsToUpload) {
        final List<CompletableFuture<Optional<Gacha>>> futures = postsToUpload.stream()
                .map(post -> CompletableFuture.supplyAsync(() -> uploadAndSave(post), imageUploadExecutor))
                .toList();

        return futures.stream()
                .map(CompletableFuture::join)
                .flatMap(Optional::stream)
                .toList();
    }

    private Optional<Gacha> uploadAndSave(final PlatformPostDto post) {
        for (int attempt = 1; attempt <= MAX_UPLOAD_ATTEMPTS; attempt++) {
            if (attempt > 1) {
                sleepBeforeRetry();
            }
            final AttemptResult result = attemptUploadAndSave(post, attempt);
            if (!result.retryable()) {
                return result.gacha();
            }
        }
        log.error("가챠 이미지 업로드/저장 실패. mediaId={}, 최대 재시도 횟수 초과", post.originalId());
        return Optional.empty();
    }

    private AttemptResult attemptUploadAndSave(final PlatformPostDto post, final int attempt) {
        String uploadedImageUrl = null;
        try {
            uploadedImageUrl = imageUploader.uploadFromUrl(
                    post.imageUrl(),
                    ImageType.GACHA.buildPath(s3RootFolder)
            );
            return new AttemptResult(Optional.of(saveGacha(post, uploadedImageUrl)), false);
        } catch (final ImageInvalidValueException exception) {
            deleteUploadedImage(uploadedImageUrl);
            log.error("가챠 이미지 형식 오류. mediaId={}", post.originalId(), exception);
            return new AttemptResult(Optional.empty(), false);
        } catch (final S3Exception exception) {
            deleteUploadedImage(uploadedImageUrl);
            log.warn("가챠 이미지 업로드 재시도. mediaId={}, attempt={}/{}",
                    post.originalId(), attempt, MAX_UPLOAD_ATTEMPTS, exception);
            return new AttemptResult(Optional.empty(), true);
        } catch (final DataAccessException exception) {
            deleteUploadedImage(uploadedImageUrl);
            log.warn("가챠 저장 재시도. mediaId={}, attempt={}/{}",
                    post.originalId(), attempt, MAX_UPLOAD_ATTEMPTS, exception);
            return new AttemptResult(Optional.empty(), true);
        } catch (final RuntimeException exception) {
            deleteUploadedImage(uploadedImageUrl);
            log.error("가챠 이미지 업로드/저장 실패. mediaId={}", post.originalId(), exception);
            return new AttemptResult(Optional.empty(), false);
        }
    }

    private Gacha saveGacha(final PlatformPostDto post, final String s3ImageUrl) {
        final Gacha newGacha = Gacha.builder()
                .caption(post.content())
                .thumbnailUrl(s3ImageUrl)
                .instagramMediaId(post.originalId())
                .source(CollectionSource.INSTAGRAM)
                .productCode(post.originalId())
                .build();
        return gachaRepository.save(newGacha);
    }

    private void deleteUploadedImage(final String imageUrl) {
        if (imageUrl == null) {
            return;
        }
        try {
            imageUploader.delete(imageUrl);
        } catch (final RuntimeException exception) {
            log.error("Instagram 수집 실패 이미지 정리에 실패했습니다. imageUrl={}", imageUrl, exception);
        }
    }

    private void sleepBeforeRetry() {
        try {
            Thread.sleep(UPLOAD_RETRY_DELAY_MS);
        } catch (final InterruptedException exception) {
            Thread.currentThread().interrupt();
        }
    }

    private record AttemptResult(Optional<Gacha> gacha, boolean retryable) {
    }
}
