package com.gachi.gacha.backend.gacha.presentation;

import com.gachi.gacha.backend.common.domain.dto.BaseResponse;
import com.gachi.gacha.backend.gacha.application.CategoryService;
import com.gachi.gacha.backend.gacha.application.dto.CategoryInfo;
import com.gachi.gacha.backend.gacha.presentation.dto.CategoryCreateRequest;
import com.gachi.gacha.backend.gacha.presentation.dto.CategoryDeleteResponse;
import com.gachi.gacha.backend.gacha.presentation.dto.CategoryResponse;
import com.gachi.gacha.backend.gacha.presentation.dto.CategoryUpdateRequest;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@RestController
@RequestMapping("/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @PostMapping
    public ResponseEntity<BaseResponse<CategoryResponse>> createCategory(
            @Valid @RequestBody final CategoryCreateRequest request
    ) {
        CategoryResponse response = CategoryResponse.from(categoryService.add(request.name()));
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(response.categoryId())
                .toUri();
        return BaseResponse.created(location, response);
    }

    @GetMapping
    public BaseResponse<List<CategoryResponse>> readCategories() {
        List<CategoryResponse> responses = categoryService.findAll().stream()
                .map(CategoryResponse::from)
                .toList();
        return BaseResponse.ok(responses);
    }

    @GetMapping("/{categoryId}")
    public BaseResponse<CategoryResponse> readCategory(@PathVariable final Long categoryId) {
        CategoryInfo category = categoryService.findById(categoryId);
        return BaseResponse.ok(CategoryResponse.from(category));
    }

    @PatchMapping("/{categoryId}")
    public BaseResponse<CategoryResponse> updateCategory(
            @PathVariable final Long categoryId,
            @Valid @RequestBody final CategoryUpdateRequest request
    ) {
        CategoryInfo category = categoryService.modify(categoryId, request.name());
        return BaseResponse.updated(CategoryResponse.from(category));
    }

    @DeleteMapping("/{categoryId}")
    public BaseResponse<CategoryDeleteResponse> deleteCategory(@PathVariable final Long categoryId) {
        Long deletedCategoryId = categoryService.remove(categoryId);
        return BaseResponse.deleted(new CategoryDeleteResponse(deletedCategoryId));
    }
}
