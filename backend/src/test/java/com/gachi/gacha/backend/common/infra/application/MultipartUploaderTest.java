package com.gachi.gacha.backend.common.infra.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.gachi.gacha.backend.common.infra.domain.DomainType;
import com.gachi.gacha.backend.common.infra.exception.ImageInvalidValueException;
import com.gachi.gacha.backend.common.infra.exception.S3Exception;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;

@ExtendWith(MockitoExtension.class)
class MultipartUploaderTest {

    @Mock
    private S3Uploader s3Uploader;

    @Mock
    private RestTemplate restTemplate;

    private MultipartUploader multipartUploader() {
        MultipartUploader multipartUploader = new MultipartUploader(s3Uploader, restTemplate);
        ReflectionTestUtils.setField(multipartUploader, "externalImageUserAgent", "test-browser");
        return multipartUploader;
    }

    @Test
    @DisplayName("upload는 검증 후 path/확장자/contentType과 함께 S3Uploader에 위임하고, contentDisposition은 null(인라인)로 넘긴다.")
    void upload_delegatesToS3Uploader() {
        // given
        MultipartUploader multipartUploader = multipartUploader();
        MultipartFile file = new MockMultipartFile("image", "photo.png", "image/png", new byte[]{1, 2, 3});
        when(s3Uploader.upload(any(RequestBody.class), eq(DomainType.STORE), eq("png"), eq("image/png"), isNull()))
                .thenReturn("https://test-bucket.s3.amazonaws.com/gachigacha/store/uuid.png");

        // when
        String result = multipartUploader.upload(file, DomainType.STORE);

        // then
        assertThat(result).isEqualTo("https://test-bucket.s3.amazonaws.com/gachigacha/store/uuid.png");
    }

    @Test
    @DisplayName("허용되지 않은 확장자면 S3Uploader를 호출하지 않고 예외를 던진다.")
    void upload_invalidExtension_throws() {
        // given
        MultipartUploader multipartUploader = multipartUploader();
        MultipartFile file = new MockMultipartFile("image", "malware.exe", "image/png", new byte[]{1, 2, 3});

        // when & then
        assertThatThrownBy(() -> multipartUploader.upload(file, DomainType.STORE))
                .isInstanceOf(ImageInvalidValueException.class);
        verify(s3Uploader, never()).upload(any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("허용되지 않은 content-type이면 S3Uploader를 호출하지 않고 예외를 던진다.")
    void upload_invalidContentType_throws() {
        // given
        MultipartUploader multipartUploader = multipartUploader();
        MultipartFile file = new MockMultipartFile("image", "photo.png", "text/html", new byte[]{1, 2, 3});

        // when & then
        assertThatThrownBy(() -> multipartUploader.upload(file, DomainType.STORE))
                .isInstanceOf(ImageInvalidValueException.class);
        verify(s3Uploader, never()).upload(any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("delete는 그대로 S3Uploader.delete로 위임한다.")
    void delete_delegatesToS3Uploader() {
        // given
        MultipartUploader multipartUploader = multipartUploader();

        // when
        multipartUploader.delete("https://test-bucket.s3.amazonaws.com/gachigacha/store/abc.png");

        // then
        verify(s3Uploader).delete("https://test-bucket.s3.amazonaws.com/gachigacha/store/abc.png");
    }

    @Test
    @DisplayName("moveToTrash는 그대로 S3Uploader.moveToTrash로 위임한다.")
    void moveToTrash_delegatesToS3Uploader() {
        // given
        MultipartUploader multipartUploader = multipartUploader();

        // when
        multipartUploader.moveToTrash("https://test-bucket.s3.amazonaws.com/gachigacha/store/abc.png");

        // then
        verify(s3Uploader).moveToTrash("https://test-bucket.s3.amazonaws.com/gachigacha/store/abc.png");
    }

    @Test
    @DisplayName("uploadFromUrl은 원본 URL의 이미지를 내려받아 content-type에 맞는 확장자로 S3Uploader에 위임한다.")
    void uploadFromUrl_success() {
        // given
        byte[] body = {1, 2, 3};
        ResponseEntity<byte[]> response = ResponseEntity.ok()
                .contentType(MediaType.IMAGE_JPEG)
                .body(body);
        when(restTemplate.exchange(
                eq("https://cdn.instagram.com/photo"),
                eq(HttpMethod.GET),
                any(HttpEntity.class),
                eq(byte[].class)
        )).thenReturn(response);
        when(s3Uploader.upload(any(RequestBody.class), eq(DomainType.GACHA), eq("jpg"), eq("image/jpeg"), isNull()))
                .thenReturn("https://test-bucket.s3.amazonaws.com/gachigacha/gacha/uuid.jpg");
        MultipartUploader multipartUploader = multipartUploader();

        // when
        String result = multipartUploader.uploadFromUrl("https://cdn.instagram.com/photo", DomainType.GACHA);

        // then
        assertThat(result).isEqualTo("https://test-bucket.s3.amazonaws.com/gachigacha/gacha/uuid.jpg");
    }

    @Test
    @DisplayName("허용되지 않은 content-type이면 S3Uploader를 호출하지 않고 예외를 던진다.")
    void uploadFromUrl_invalidContentType_throws() {
        // given
        ResponseEntity<byte[]> response = ResponseEntity.ok()
                .contentType(MediaType.TEXT_HTML)
                .body(new byte[]{1, 2, 3});
        when(restTemplate.exchange(
                eq("https://cdn.instagram.com/photo"),
                eq(HttpMethod.GET),
                any(HttpEntity.class),
                eq(byte[].class)
        )).thenReturn(response);
        MultipartUploader multipartUploader = multipartUploader();

        // when & then
        assertThatThrownBy(() -> multipartUploader.uploadFromUrl("https://cdn.instagram.com/photo", DomainType.GACHA))
                .isInstanceOf(ImageInvalidValueException.class);
        verify(s3Uploader, never()).upload(any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("응답 body가 비어있으면 S3Uploader를 호출하지 않고 예외를 던진다.")
    void uploadFromUrl_emptyBody_throws() {
        // given
        ResponseEntity<byte[]> response = ResponseEntity.ok()
                .contentType(MediaType.IMAGE_JPEG)
                .body(new byte[0]);
        when(restTemplate.exchange(
                eq("https://cdn.instagram.com/photo"),
                eq(HttpMethod.GET),
                any(HttpEntity.class),
                eq(byte[].class)
        )).thenReturn(response);
        MultipartUploader multipartUploader = multipartUploader();

        // when & then
        assertThatThrownBy(() -> multipartUploader.uploadFromUrl("https://cdn.instagram.com/photo", DomainType.GACHA))
                .isInstanceOf(S3Exception.class);
        verify(s3Uploader, never()).upload(any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("원본 이미지 다운로드가 실패하면 S3Uploader를 호출하지 않고 예외를 던진다.")
    void uploadFromUrl_downloadFails_throws() {
        // given
        when(restTemplate.exchange(
                eq("https://cdn.instagram.com/dead-link"),
                eq(HttpMethod.GET),
                any(HttpEntity.class),
                eq(byte[].class)
        ))
                .thenThrow(HttpClientErrorException.create(HttpStatus.NOT_FOUND, "Not Found", null, null, null));
        MultipartUploader multipartUploader = multipartUploader();

        // when & then
        assertThatThrownBy(() -> multipartUploader.uploadFromUrl("https://cdn.instagram.com/dead-link", DomainType.GACHA))
                .isInstanceOf(S3Exception.class);
        verify(s3Uploader, never()).upload(any(), any(), any(), any(), any());
    }
}
