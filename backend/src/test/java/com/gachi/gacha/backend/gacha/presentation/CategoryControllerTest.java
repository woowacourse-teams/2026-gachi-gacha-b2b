package com.gachi.gacha.backend.gacha.presentation;

import static org.assertj.core.api.Assertions.assertThat;

import com.gachi.gacha.backend.common.infra.application.ImageUploader;
import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import io.restassured.response.ExtractableResponse;
import io.restassured.response.Response;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.web.client.RestTemplate;

@ActiveProfiles("test")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class CategoryControllerTest {

    @LocalServerPort
    private int port;

    @MockitoBean
    private ImageUploader imageUploader;

    @MockitoBean
    private RestTemplate restTemplate;

    @BeforeEach
    void setUp() {
        RestAssured.port = port;
    }

    @Test
    @DisplayName("카테고리를 생성하고 조회, 수정, 삭제할 수 있다.")
    void categoryCrud() {
        ExtractableResponse<Response> createResponse = createCategory("  CRUD 전용 카테고리  ");
        Long categoryId = createResponse.jsonPath().getLong("data.categoryId");

        assertThat(createResponse.statusCode()).isEqualTo(HttpStatus.CREATED.value());
        assertThat(createResponse.header("Location")).endsWith("/api/v1/categories/" + categoryId);
        assertThat(createResponse.jsonPath().getString("data.name")).isEqualTo("CRUD 전용 카테고리");

        ExtractableResponse<Response> listResponse = RestAssured.given()
                .when()
                .get("/api/v1/categories")
                .then()
                .extract();
        assertThat(listResponse.statusCode()).isEqualTo(HttpStatus.OK.value());
        assertThat(listResponse.jsonPath().getList("data.categoryId", Long.class)).contains(categoryId);

        ExtractableResponse<Response> detailResponse = RestAssured.given()
                .when()
                .get("/api/v1/categories/{categoryId}", categoryId)
                .then()
                .extract();
        assertThat(detailResponse.statusCode()).isEqualTo(HttpStatus.OK.value());
        assertThat(detailResponse.jsonPath().getString("data.name")).isEqualTo("CRUD 전용 카테고리");

        ExtractableResponse<Response> updateResponse = RestAssured.given()
                .contentType(ContentType.JSON)
                .body(Map.of("name", "수정된 CRUD 전용 카테고리"))
                .when()
                .patch("/api/v1/categories/{categoryId}", categoryId)
                .then()
                .extract();
        assertThat(updateResponse.statusCode()).isEqualTo(HttpStatus.OK.value());
        assertThat(updateResponse.jsonPath().getString("code")).isEqualTo("C002");
        assertThat(updateResponse.jsonPath().getString("data.name"))
                .isEqualTo("수정된 CRUD 전용 카테고리");

        ExtractableResponse<Response> deleteResponse = RestAssured.given()
                .when()
                .delete("/api/v1/categories/{categoryId}", categoryId)
                .then()
                .extract();
        assertThat(deleteResponse.statusCode()).isEqualTo(HttpStatus.OK.value());
        assertThat(deleteResponse.jsonPath().getString("code")).isEqualTo("C003");
        assertThat(deleteResponse.jsonPath().getLong("data.categoryId")).isEqualTo(categoryId);

        ExtractableResponse<Response> deletedCategoryResponse = RestAssured.given()
                .when()
                .get("/api/v1/categories/{categoryId}", categoryId)
                .then()
                .extract();
        assertThat(deletedCategoryResponse.statusCode()).isEqualTo(HttpStatus.NOT_FOUND.value());
        assertThat(deletedCategoryResponse.jsonPath().getString("code")).isEqualTo("CAE01");
    }

    @Test
    @DisplayName("이미 존재하는 이름으로 카테고리를 생성하면 409 Conflict를 반환한다.")
    void createDuplicateCategory() {
        createCategory("중복 카테고리");

        ExtractableResponse<Response> response = createCategory(" 중복 카테고리 ");

        assertThat(response.statusCode()).isEqualTo(HttpStatus.CONFLICT.value());
        assertThat(response.jsonPath().getString("code")).isEqualTo("CAE02");
    }

    @Test
    @DisplayName("빈 이름으로 카테고리를 생성하면 400 Bad Request를 반환한다.")
    void createCategoryWithBlankName() {
        ExtractableResponse<Response> response = createCategory(" ");

        assertThat(response.statusCode()).isEqualTo(HttpStatus.BAD_REQUEST.value());
        assertThat(response.jsonPath().getString("code")).isEqualTo("CE001");
    }

    @Test
    @DisplayName("가챠에 연결된 카테고리를 삭제하면 연결 정보도 함께 제거된다.")
    void deleteCategoryLinkedToGacha() {
        Long categoryId = createCategory("연결 삭제 카테고리")
                .jsonPath()
                .getLong("data.categoryId");
        Long gachaId = RestAssured.given()
                .contentType(ContentType.JSON)
                .body(Map.of(
                        "name", "카테고리 삭제 검증 가챠",
                        "categories", List.of("연결 삭제 카테고리")
                ))
                .when()
                .post("/api/v1/gachas")
                .jsonPath()
                .getLong("data.gachaId");

        ExtractableResponse<Response> deleteResponse = RestAssured.given()
                .when()
                .delete("/api/v1/categories/{categoryId}", categoryId)
                .then()
                .extract();

        assertThat(deleteResponse.statusCode()).isEqualTo(HttpStatus.OK.value());
        ExtractableResponse<Response> gachaResponse = RestAssured.given()
                .when()
                .get("/api/v1/gachas/{gachaId}", gachaId)
                .then()
                .extract();
        assertThat(gachaResponse.statusCode()).isEqualTo(HttpStatus.OK.value());
        assertThat(gachaResponse.jsonPath().getList("data.categories", String.class)).isEmpty();
    }

    private ExtractableResponse<Response> createCategory(final String name) {
        return RestAssured.given()
                .contentType(ContentType.JSON)
                .body(Map.of("name", name))
                .when()
                .post("/api/v1/categories")
                .then()
                .extract();
    }
}
