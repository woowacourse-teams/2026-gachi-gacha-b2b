package com.gachi.gacha.backend.common.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    // Common
    INVALID_INPUT_VALUE(HttpStatus.BAD_REQUEST, "CE001", "유효하지 않은 입력값입니다."),
    METHOD_NOT_ALLOWED(HttpStatus.METHOD_NOT_ALLOWED, "CE002", "지원하지 않는 HTTP 메서드입니다."),
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "CE003", "서버 내부 오류가 발생했습니다."),
    INVALID_PAGE_REQUEST(HttpStatus.BAD_REQUEST, "CE004", "유효하지 않은 페이지 요청입니다."),

    // Gacha
    GACHA_NOT_FOUND(HttpStatus.NOT_FOUND, "GE001", "존재하지 않는 가챠입니다."),
    INVALID_GACHA_POLICY(HttpStatus.BAD_REQUEST, "GE002", "유효하지 않은 가챠 정책입니다."),

    // Category
    CATEGORY_NOT_FOUND(HttpStatus.NOT_FOUND, "CAE01", "존재하지 않는 카테고리입니다."),
    CATEGORY_ALREADY_EXISTS(HttpStatus.CONFLICT, "CAE02", "이미 존재하는 카테고리입니다."),
    INVALID_CATEGORY_POLICY(HttpStatus.BAD_REQUEST, "CAE03", "유효하지 않은 카테고리입니다."),

    // Store
    STORE_NOT_FOUND(HttpStatus.NOT_FOUND, "SE001", "존재하지 않는 매장입니다."),
    INVALID_STORE_POLICY(HttpStatus.BAD_REQUEST, "SE002", "유효하지 않은 매장 정보입니다."),
    INVALID_NEARBY_REQUEST(HttpStatus.BAD_REQUEST, "SE003", "유효하지 않은 주변 매장 조회 요청입니다."),

    // Store Image
    STORE_IMAGE_NOT_FOUND(HttpStatus.NOT_FOUND, "SIE01", "존재하지 않는 매장 사진입니다."),
    INVALID_STORE_IMAGE_POLICY(HttpStatus.BAD_REQUEST, "SIE02", "유효하지 않은 매장 사진입니다."),

    // S3
    S3_IMAGE_INVALID_POLICY(HttpStatus.BAD_REQUEST, "S3E01", "지원하지 않는 이미지 형식입니다."),
    S3_IMAGE_READ_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "S3E02", "이미지 파일을 읽는 중 오류가 발생했습니다."),
    S3_IMAGE_UPLOAD_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "S3E03", "이미지 업로드 중 오류가 발생했습니다."),
    S3_IMAGE_DELETE_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "S3E04", "이미지 삭제 중 오류가 발생했습니다."),
    S3_IMAGE_MOVE_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "S3E05", "이미지를 휴지통으로 이동하는 중 오류가 발생했습니다."),
    S3_IMAGE_DOWNLOAD_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "S3E06", "원본 이미지를 다운로드하는 중 오류가 발생했습니다."),

    // Gacha Collection
    GACHA_COLLECTION_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "GCE01", "가챠 수집에 실패했습니다."),
    INVALID_COLLECTION_SOURCE(HttpStatus.BAD_REQUEST, "GCE02", "유효하지 않은 가챠 수집 출처입니다."),
    INVALID_COLLECTED_GACHA(HttpStatus.BAD_REQUEST, "GCE03", "유효하지 않은 수집 가챠 데이터입니다."),
    COLLECTION_SOURCE_MISMATCH(HttpStatus.BAD_REQUEST, "GCE04", "요청한 수집 출처와 가챠 데이터 출처가 일치하지 않습니다."),
    INVALID_COLLECTION_CONFIGURATION(HttpStatus.INTERNAL_SERVER_ERROR, "GCE05", "가챠 수집 설정이 유효하지 않습니다."),
    COLLECTION_ITEM_PARSE_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "GCE06", "수집 상품 정보를 해석하지 못했습니다."),
    COLLECTION_HTTP_REQUEST_FAILED(HttpStatus.BAD_GATEWAY, "GCE07", "가챠 수집 사이트 요청에 실패했습니다."),
    COLLECTION_INTERRUPTED(HttpStatus.INTERNAL_SERVER_ERROR, "GCE08", "가챠 수집 작업이 중단되었습니다.");

    private final HttpStatus status;
    private final String code;
    private final String message;
}
