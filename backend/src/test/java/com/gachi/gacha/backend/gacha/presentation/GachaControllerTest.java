package com.gachi.gacha.backend.gacha.presentation;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

import com.gachi.gacha.backend.common.infra.application.ImageUploader;
import com.gachi.gacha.backend.gacha.domain.Gacha;
import com.gachi.gacha.backend.gacha.domain.GachaJpaRepository;
import com.gachi.gacha.backend.store.domain.Store;
import com.gachi.gacha.backend.store.domain.StoreJpaRepository;
import com.gachi.gacha.backend.usecase.domain.StoreGacha;
import com.gachi.gacha.backend.usecase.domain.StoreGachaJpaRepository;
import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import io.restassured.response.ExtractableResponse;
import io.restassured.response.Response;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.web.client.RestTemplate;

@ActiveProfiles("test")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class GachaControllerTest {

    @LocalServerPort
    private int port;

    @MockitoBean
    private RestTemplate restTemplate;

    @MockitoBean
    private ImageUploader imageUploader;

    @Autowired
    private GachaJpaRepository gachaRepository;

    @Autowired
    private StoreJpaRepository storeRepository;

    @Autowired
    private StoreGachaJpaRepository storeGachaRepository;

    @BeforeEach
    void setUp() {
        RestAssured.port = port;
        when(imageUploader.upload(any(), anyString()))
                .thenReturn("https://test-bucket.s3.amazonaws.com/test/gacha/uploaded.png");
    }

    @Nested
    @DisplayName("PUT /gachas/{gachaId}/thumbnail - 가챠 썸네일 저장 API")
    class UpdateThumbnail {

        @Test
        @DisplayName("이미지를 업로드하면 S3 URL을 Gacha의 thumbnailUrl에 저장한다.")
        void updateThumbnail_success() {
            // given
            Long gachaId = createTargetGacha();

            // when
            ExtractableResponse<Response> response = RestAssured.given().log().all()
                    .multiPart("image", "thumbnail.png", "image-content".getBytes(), "image/png")
                    .when()
                    .put("/api/v1/gachas/{gachaId}/thumbnail", gachaId)
                    .then().log().all()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.OK.value());
            assertThat(response.jsonPath().getString("data.thumbnailUrl"))
                    .isEqualTo("https://test-bucket.s3.amazonaws.com/test/gacha/uploaded.png");
            assertThat(gachaRepository.getById(gachaId).getThumbnailUrl())
                    .isEqualTo("https://test-bucket.s3.amazonaws.com/test/gacha/uploaded.png");
        }

        @Test
        @DisplayName("존재하지 않는 가챠에 이미지를 업로드하면 404 Not Found를 반환한다.")
        void updateThumbnail_gachaNotFound() {
            // when
            ExtractableResponse<Response> response = RestAssured.given().log().all()
                    .multiPart("image", "thumbnail.png", "image-content".getBytes(), "image/png")
                    .when()
                    .put("/api/v1/gachas/{gachaId}/thumbnail", 999_999L)
                    .then().log().all()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.NOT_FOUND.value());
        }
    }

    @Nested
    @DisplayName("DELETE /gachas/{gachaId}/thumbnail - 가챠 썸네일 삭제 API")
    class DeleteThumbnail {

        @Test
        @DisplayName("썸네일을 삭제하면 Gacha의 thumbnailUrl을 비운다.")
        void deleteThumbnail_success() {
            // given
            Long gachaId = createTargetGacha();

            // when
            ExtractableResponse<Response> response = RestAssured.given().log().all()
                    .when()
                    .delete("/api/v1/gachas/{gachaId}/thumbnail", gachaId)
                    .then().log().all()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.OK.value());
            assertThat(response.jsonPath().getString("data.thumbnailUrl")).isNull();
            assertThat(gachaRepository.getById(gachaId).getThumbnailUrl()).isNull();
        }
    }

    @Nested
    @DisplayName("POST /gachas - 가챠 생성 API")
    class CreateGacha {

        @Test
        @DisplayName("올바른 요청 파라미터가 들어오면 201 Created 응답과 Location 헤더를 반환한다.")
        void createGacha_success() {
            // given
            Map<String, Object> request = Map.of(
                    "name", "신규 가챠",
                    "caption", "가챠 설명입니다.",
                    "thumbnailUrl", "https://example.com/image.png",
                    "categories", List.of("피규어")
            );

            // when
            ExtractableResponse<Response> response = RestAssured.given().log().all()
                    .contentType(ContentType.JSON)
                    .body(request)
                    .when()
                    .post("/api/v1/gachas")
                    .then().log().all()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.CREATED.value());
            assertThat(response.header("Location")).isNotNull();
            assertThat(response.jsonPath().getString("code")).isEqualTo("C001");
            assertThat(response.jsonPath().getLong("data.gachaId")).isNotNull();
            assertThat(response.jsonPath().getList("data.categories", String.class))
                    .containsExactly("피규어");
            assertThat(response.jsonPath().getString("data.source")).isEqualTo("MANUAL");
        }

        @Test
        @DisplayName("유효하지 않은 요청(빈 값)이 들어오면 400 Bad Request를 반환한다.")
        void createGacha_invalidRequest() {
            // given - 필수 값이 공백인 유효하지 않은 요청
            Map<String, Object> request = Map.of(
                    "name", "",
                    "caption", "",
                    "thumbnailUrl", ""
            );

            // when
            ExtractableResponse<Response> response = RestAssured.given().log().all()
                    .contentType(ContentType.JSON)
                    .body(request)
                    .when()
                    .post("/api/v1/gachas")
                    .then().log().all()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.BAD_REQUEST.value());
        }
    }

    @Nested
    @DisplayName("PATCH /gachas/{gachaId} - 가챠 수정 API")
    class UpdateGacha {

        @Test
        @DisplayName("가챠 정보 수정 요청에 성공하면 200 OK를 반환한다.")
        void updateGacha_success() {
            // given
            Long gachaId = createTargetGacha();
            Long categoryId = createCategory("수정 API 카테고리");
            Map<String, Object> updateRequest = Map.of(
                    "name", "수정된 가챠 이름",
                    "caption", "수정된 설명",
                    "thumbnailUrl", "https://example.com/updated.png",
                    "categories", List.of(categoryId)
            );

            // when
            ExtractableResponse<Response> response = RestAssured.given().log().all()
                    .contentType(ContentType.JSON)
                    .body(updateRequest)
                    .when()
                    .patch("/api/v1/gachas/{gachaId}", gachaId)
                    .then().log().all()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.OK.value());
            assertThat(response.jsonPath().getString("code")).isEqualTo("C002");
            assertThat(response.jsonPath().getLong("data.gachaId")).isEqualTo(gachaId);

            ExtractableResponse<Response> detailResponse = RestAssured.given()
                    .when()
                    .get("/api/v1/gachas/{gachaId}", gachaId)
                    .then()
                    .extract();
            assertThat(detailResponse.jsonPath().getList("data.categories", String.class))
                    .containsExactly("수정 API 카테고리");
            assertThat(detailResponse.jsonPath().getString("data.thumbnailUrl"))
                    .isEqualTo("https://example.com/updated.png");
            assertThat(detailResponse.jsonPath().getString("data.source")).isEqualTo("MANUAL");
        }

        @Test
        @DisplayName("존재하지 않는 가챠 ID로 수정 시 404 Not Found를 반환한다.")
        void updateGacha_notFound() {
            // given
            Long nonExistentGachaId = 999999L;
            Map<String, Object> updateRequest = Map.of(
                    "name", "수정된 가챠 이름",
                    "caption", "수정된 설명",
                    "categories", List.of(1L)
            );

            // when
            ExtractableResponse<Response> response = RestAssured.given().log().all()
                    .contentType(ContentType.JSON)
                    .body(updateRequest)
                    .when()
                    .patch("/api/v1/gachas/{gachaId}", nonExistentGachaId)
                    .then().log().all()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.NOT_FOUND.value());
        }

        @Test
        @DisplayName("존재하지 않는 카테고리 ID로 수정 시 404 Not Found를 반환한다.")
        void updateGacha_categoryNotFound() {
            Long gachaId = createTargetGacha("카테고리 수정 실패 검증 가챠");
            Map<String, Object> updateRequest = Map.of(
                    "categories", List.of(999_999L)
            );

            ExtractableResponse<Response> response = RestAssured.given()
                    .contentType(ContentType.JSON)
                    .body(updateRequest)
                    .when()
                    .patch("/api/v1/gachas/{gachaId}", gachaId)
                    .then()
                    .extract();

            assertThat(response.statusCode()).isEqualTo(HttpStatus.NOT_FOUND.value());
            assertThat(response.jsonPath().getString("code")).isEqualTo("CAE01");
        }
    }

    @Nested
    @DisplayName("POST /gachas/{gachaId}/categories/{categoryId} - 가챠 카테고리 추가 API")
    class AddGachaCategory {

        @Test
        @DisplayName("기존 가챠에 카테고리를 추가한다.")
        void addCategory_success() {
            Long gachaId = createTargetGacha("카테고리 추가 검증 가챠");
            Long categoryId = createCategory("추가 API 카테고리");

            ExtractableResponse<Response> response = RestAssured.given()
                    .when()
                    .post(
                            "/api/v1/gachas/{gachaId}/categories/{categoryId}",
                            gachaId,
                            categoryId
                    )
                    .then()
                    .extract();

            assertThat(response.statusCode()).isEqualTo(HttpStatus.CREATED.value());
            assertThat(response.jsonPath().getString("code")).isEqualTo("C001");
            assertThat(response.jsonPath().getList("data.categories", String.class))
                    .contains("피규어", "추가 API 카테고리");
        }

        @Test
        @DisplayName("이미 연결된 카테고리를 다시 추가해도 중복 연결하지 않는다.")
        void addCategory_isIdempotentForDuplicateCategory() {
            Long gachaId = createTargetGacha("카테고리 중복 추가 검증 가챠");
            Long categoryId = createCategory("중복 추가 API 카테고리");

            RestAssured.given()
                    .post("/api/v1/gachas/{gachaId}/categories/{categoryId}", gachaId, categoryId);
            ExtractableResponse<Response> response = RestAssured.given()
                    .post("/api/v1/gachas/{gachaId}/categories/{categoryId}", gachaId, categoryId)
                    .then()
                    .extract();

            assertThat(response.statusCode()).isEqualTo(HttpStatus.CREATED.value());
            assertThat(response.jsonPath().getList("data.categories", String.class))
                    .containsOnlyOnce("중복 추가 API 카테고리");
        }

        @Test
        @DisplayName("존재하지 않는 카테고리를 추가하면 404 Not Found를 반환한다.")
        void addCategory_categoryNotFound() {
            Long gachaId = createTargetGacha("카테고리 추가 실패 검증 가챠");

            ExtractableResponse<Response> response = RestAssured.given()
                    .when()
                    .post("/api/v1/gachas/{gachaId}/categories/{categoryId}", gachaId, 999_999L)
                    .then()
                    .extract();

            assertThat(response.statusCode()).isEqualTo(HttpStatus.NOT_FOUND.value());
            assertThat(response.jsonPath().getString("code")).isEqualTo("CAE01");
        }
    }

    @Nested
    @DisplayName("DELETE /gachas/{gachaId} - 가챠 삭제 API")
    class DeleteGacha {

        @Test
        @DisplayName("가챠 삭제 요청에 성공하면 200 OK를 반환한다.")
        void deleteGacha_success() {
            // given
            Long gachaId = createTargetGacha();

            // when
            ExtractableResponse<Response> response = RestAssured.given().log().all()
                    .when()
                    .delete("/api/v1/gachas/{gachaId}", gachaId)
                    .then().log().all()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.OK.value());
        }

        @Test
        @DisplayName("존재하지 않는 가챠 ID 삭제 시 404 Not Found를 반환한다.")
        void deleteGacha_notFound() {
            // given
            Long nonExistentGachaId = 999999L;

            // when
            ExtractableResponse<Response> response = RestAssured.given().log().all()
                    .when()
                    .delete("/api/v1/gachas/{gachaId}", nonExistentGachaId)
                    .then().log().all()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.NOT_FOUND.value());
        }

        @Test
        @DisplayName("매장에 연결된 가챠를 삭제하면 연결 정보도 함께 삭제한다.")
        void deleteGacha_removesStoreGachaConnections() {
            // given
            Long gachaId = createTargetGacha();
            Gacha gacha = gachaRepository.getById(gachaId);
            Store store = storeRepository.save(Store.builder()
                    .name("가챠 삭제 테스트 매장")
                    .address("서울특별시 테스트구")
                    .latitude(37.5)
                    .longitude(127.0)
                    .build());
            storeGachaRepository.save(StoreGacha.builder()
                    .store(store)
                    .gacha(gacha)
                    .build());

            // when
            ExtractableResponse<Response> response = RestAssured.given().log().all()
                    .when()
                    .delete("/api/v1/gachas/{gachaId}", gachaId)
                    .then().log().all()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.OK.value());
            assertThat(storeGachaRepository.existsByGachaId(gachaId)).isFalse();
        }
    }

    @Nested
    @DisplayName("GET /gachas - 가챠 목록 조회 API")
    class ReadGachaList {

        @Test
        @DisplayName("가챠 목록 조회를 요청하면 200 OK와 페이징된 데이터 목록을 반환한다.")
        void readGacha_success() {
            // given
            createTargetGacha();

            // when
            ExtractableResponse<Response> response = RestAssured.given().log().all()
                    .param("page", 0)
                    .param("size", 10)
                    .when()
                    .get("/api/v1/gachas")
                    .then().log().all()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.OK.value());
            assertThat(response.jsonPath().getList("data.content")).isNotEmpty();
        }

        @Test
        @DisplayName("키워드가 이름 또는 카테고리명에 포함된 가챠 목록을 반환한다.")
        void readGacha_withKeyword_success() {
            // given
            Long nameMatchedGachaId = createTargetGacha("디저트 제목 가챠");
            createCategory("작은 뽀송뽀송 디저트");
            Long categoryMatchedGachaId = createTargetGacha(
                    "포근한 미니어처 컬렉션",
                    List.of("작은 뽀송뽀송 디저트")
            );

            // when
            ExtractableResponse<Response> response = RestAssured.given().log().all()
                    .param("keyword", "디저트")
                    .when()
                    .get("/api/v1/gachas")
                    .then().log().all()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.OK.value());
            assertThat(response.jsonPath().getList("data.content.gachaId", Long.class))
                    .contains(nameMatchedGachaId, categoryMatchedGachaId);
        }
    }

    @Nested
    @DisplayName("GET /gachas/{gachaId} - 가챠 단건 조회 API")
    class ReadGachaDetail {

        @Test
        @DisplayName("가챠 단건 조회에 성공하면 200 OK와 상세 정보를 반환한다.")
        void readGachaById_success() {
            // given
            Long gachaId = createTargetGacha();

            // when
            ExtractableResponse<Response> response = RestAssured.given().log().all()
                    .when()
                    .get("/api/v1/gachas/{gachaId}", gachaId)
                    .then().log().all()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.OK.value());
            assertThat(response.jsonPath().getLong("data.gachaId")).isEqualTo(gachaId);
        }

        @Test
        @DisplayName("존재하지 않는 가챠 ID 조회 시 404 Not Found를 반환한다.")
        void readGachaById_notFound() {
            // given
            Long nonExistentGachaId = 999999L;

            // when
            ExtractableResponse<Response> response = RestAssured.given().log().all()
                    .when()
                    .get("/api/v1/gachas/{gachaId}", nonExistentGachaId)
                    .then().log().all()
                    .extract();

            // then
            assertThat(response.statusCode()).isEqualTo(HttpStatus.NOT_FOUND.value());
        }
    }

    private Long createTargetGacha() {
        return createTargetGacha("테스트 가챠");
    }

    private Long createTargetGacha(String name) {
        return createTargetGacha(name, List.of("피규어"));
    }

    private Long createTargetGacha(String name, List<String> categories) {
        Map<String, Object> request = Map.of(
                "name", name,
                "caption", "가챠 설명",
                "thumbnailUrl", "https://example.com/image.png",
                "categories", categories
        );

        return RestAssured.given()
                .contentType(ContentType.JSON)
                .body(request)
                .when()
                .post("/api/v1/gachas")
                .jsonPath()
                .getLong("data.gachaId");
    }

    private Long createCategory(final String name) {
        return RestAssured.given()
                .contentType(ContentType.JSON)
                .body(Map.of("name", name))
                .when()
                .post("/api/v1/categories")
                .jsonPath()
                .getLong("data.categoryId");
    }
}
