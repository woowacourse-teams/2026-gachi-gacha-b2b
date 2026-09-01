package com.gachi.gacha.backend.gacha.application;

import com.gachi.gacha.backend.common.exception.BusinessException;
import com.gachi.gacha.backend.common.exception.ErrorCode;
import com.gachi.gacha.backend.gacha.application.dto.CategoryInfo;
import com.gachi.gacha.backend.gacha.domain.Category;
import com.gachi.gacha.backend.gacha.domain.CategoryJpaRepository;
import com.gachi.gacha.backend.gacha.domain.GachaCategoryJpaRepository;
import com.gachi.gacha.backend.gacha.domain.exception.CategoryAlreadyExistsException;
import com.gachi.gacha.backend.gacha.domain.exception.CategoryNotFoundException;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class CategoryService {

    private final CategoryJpaRepository categoryRepository;
    private final GachaCategoryJpaRepository gachaCategoryRepository;

    public CategoryService(
            final CategoryJpaRepository categoryRepository,
            final GachaCategoryJpaRepository gachaCategoryRepository
    ) {
        this.categoryRepository = categoryRepository;
        this.gachaCategoryRepository = gachaCategoryRepository;
    }

    @Transactional
    public CategoryInfo add(final String name) {
        String normalizedName = normalize(name);
        validateDuplicate(normalizedName);
        return CategoryInfo.from(categoryRepository.save(new Category(normalizedName)));
    }

    public List<CategoryInfo> findAll() {
        return categoryRepository.findAllByOrderByNameAsc().stream()
                .map(CategoryInfo::from)
                .toList();
    }

    public CategoryInfo findById(final Long categoryId) {
        return CategoryInfo.from(getById(categoryId));
    }

    public List<Category> resolveByIds(final List<Long> categoryIds) {
        if (categoryIds == null || categoryIds.isEmpty()) {
            return List.of();
        }

        List<Long> normalizedIds = new ArrayList<>(new LinkedHashSet<>(categoryIds));
        Map<Long, Category> categoriesById = categoryRepository.findAllById(normalizedIds).stream()
                .collect(Collectors.toMap(Category::getId, Function.identity()));
        if (categoriesById.size() != normalizedIds.size()) {
            throw new CategoryNotFoundException();
        }
        return normalizedIds.stream()
                .map(categoriesById::get)
                .toList();
    }

    @Transactional
    public CategoryInfo modify(final Long categoryId, final String name) {
        Category category = getById(categoryId);
        String normalizedName = normalize(name);
        if (category.getName().equals(normalizedName)) {
            return CategoryInfo.from(category);
        }

        validateDuplicate(normalizedName);
        category.rename(normalizedName);
        return CategoryInfo.from(category);
    }

    @Transactional
    public Long remove(final Long categoryId) {
        Category category = getById(categoryId);
        gachaCategoryRepository.deleteAllByCategoryId(categoryId);
        categoryRepository.delete(category);
        return categoryId;
    }

    @Transactional
    public List<Category> resolve(final List<String> categoryNames) {
        List<String> normalizedNames = normalize(categoryNames);
        if (normalizedNames.isEmpty()) {
            return List.of();
        }

        Map<String, Category> categoriesByName = categoryRepository.findAllByNameIn(normalizedNames).stream()
                .collect(Collectors.toMap(Category::getName, Function.identity()));
        List<Category> newCategories = normalizedNames.stream()
                .filter(name -> !categoriesByName.containsKey(name))
                .map(Category::new)
                .toList();
        categoryRepository.saveAll(newCategories)
                .forEach(category -> categoriesByName.put(category.getName(), category));

        return normalizedNames.stream()
                .map(categoriesByName::get)
                .toList();
    }

    private List<String> normalize(final List<String> categoryNames) {
        if (categoryNames == null) {
            return List.of();
        }
        return new ArrayList<>(categoryNames.stream()
                .filter(name -> name != null && !name.isBlank())
                .map(String::trim)
                .collect(Collectors.toCollection(LinkedHashSet::new)));
    }

    private String normalize(final String categoryName) {
        if (categoryName == null || categoryName.isBlank()) {
            throw new BusinessException(ErrorCode.INVALID_CATEGORY_POLICY);
        }
        return categoryName.trim();
    }

    private Category getById(final Long categoryId) {
        return categoryRepository.findById(categoryId)
                .orElseThrow(CategoryNotFoundException::new);
    }

    private void validateDuplicate(final String name) {
        if (categoryRepository.existsByName(name)) {
            throw new CategoryAlreadyExistsException();
        }
    }
}
