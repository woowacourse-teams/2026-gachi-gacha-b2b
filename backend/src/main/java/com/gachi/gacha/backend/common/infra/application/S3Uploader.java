package com.gachi.gacha.backend.common.infra.application;

import com.gachi.gacha.backend.common.exception.ErrorCode;
import com.gachi.gacha.backend.common.infra.domain.DomainType;
import com.gachi.gacha.backend.common.infra.exception.S3Exception;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.core.exception.SdkException;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.CopyObjectRequest;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

/**
 * S3 조작만 담당한다. 파일이 이미지인지 아닌지, 검증 정책이 무엇인지는 모른다 — 그건 이 클래스를
 * 호출하는 쪽(MultipartUploader)의 책임이다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class S3Uploader {

    private final S3Client s3Client;

    @Value("${cloud.aws.s3.bucket}")
    private String bucket;

    @Value("${cloud.aws.s3.folder}")
    private String rootFolder;

    public String upload(
            final RequestBody body,
            final DomainType domainType,
            final String extension,
            final String contentType,
            final String contentDisposition
    ) {
        String key = generateUniqueKey(domainType.buildPath(rootFolder), extension);

        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .contentType(contentType)
                .contentDisposition(contentDisposition)
                .build();

        try {
            s3Client.putObject(request, body);
        } catch (SdkException e) {
            log.error("이미지 업로드 중 오류가 발생했습니다. key={}", key, e);
            throw new S3Exception(ErrorCode.S3_UPLOAD_ERROR);
        }

        return convertToS3Url(key);
    }

    public void delete(final String fileUrl) {
        String key = extractKeyFromUrl(fileUrl);

        DeleteObjectRequest request = DeleteObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .build();

        try {
            s3Client.deleteObject(request);
        } catch (SdkException e) {
            log.error("이미지 삭제 중 오류가 발생했습니다. key={}", key, e);
            throw new S3Exception(ErrorCode.S3_DELETE_ERROR);
        }
    }

    /**
     * 파일을 영구 삭제하지 않고 trash 하위 경로로 이동한다(soft delete). S3는 원자적인 이동 연산이 없어서
     * 복사 후 원본 삭제로 구현한다. 예: gachigacha/store/xxx.png -> gachigacha/trash/store/xxx.png
     */
    public void moveToTrash(final String fileUrl) {
        String key = extractKeyFromUrl(fileUrl);
        String trashKey = generateTrashKey(key);

        CopyObjectRequest copyRequest = CopyObjectRequest.builder()
                .sourceBucket(bucket)
                .sourceKey(key)
                .destinationBucket(bucket)
                .destinationKey(trashKey)
                .build();

        DeleteObjectRequest deleteRequest = DeleteObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .build();

        try {
            s3Client.copyObject(copyRequest);
            s3Client.deleteObject(deleteRequest);
        } catch (SdkException e) {
            log.error("이미지를 휴지통으로 이동하는 중 오류가 발생했습니다. key={}, trashKey={}", key, trashKey, e);
            throw new S3Exception(ErrorCode.S3_MOVE_ERROR);
        }
    }

    /**
     * 원본 파일명은 키에 넣지 않고 UUID + 검증된 확장자로만 키를 생성한다. 원본 파일명을 그대로 쓰면
     * 특수문자/경로 문자로 키 구조를 조작당할 수 있기 때문이다.
     */
    private String generateUniqueKey(final String path, final String extension) {
        return "%s/%s.%s".formatted(path, UUID.randomUUID(), extension);
    }

    /**
     * 키의 최상위 폴더(root)는 유지하고, 그 다음 위치에 trash를 끼워 넣는다. 예: gachigacha/store/xxx.png ->
     * gachigacha/trash/store/xxx.png gachigacha/gacha/xxx.png -> gachigacha/trash/gacha/xxx.png
     */
    private String generateTrashKey(final String key) {
        int rootFolderEndIndex = key.indexOf('/');
        String keyRootFolder = key.substring(0, rootFolderEndIndex);
        String pathAfterRootFolder = key.substring(rootFolderEndIndex + 1);

        return "%s/trash/%s".formatted(keyRootFolder, pathAfterRootFolder);
    }

    /**
     * S3 객체 키로부터 접근 가능한 URL을 조립한다.
     */
    private String convertToS3Url(final String key) {
        return "https://%s.s3.amazonaws.com/%s".formatted(bucket, key);
    }

    /**
     * S3 URL에서 객체 키만 역추출한다. (삭제 요청 시 필요)
     */
    private String extractKeyFromUrl(final String fileUrl) {
        int index = fileUrl.indexOf(".amazonaws.com/");
        return fileUrl.substring(index + ".amazonaws.com/".length());
    }
}
