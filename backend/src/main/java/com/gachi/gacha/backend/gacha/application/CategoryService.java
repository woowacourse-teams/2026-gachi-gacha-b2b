package com.gachi.gacha.backend.gacha.application;

import com.gachi.gacha.backend.gacha.domain.Category;
import com.gachi.gacha.backend.gacha.domain.CategoryJpaRepository;
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

    public CategoryService(final CategoryJpaRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
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
}
