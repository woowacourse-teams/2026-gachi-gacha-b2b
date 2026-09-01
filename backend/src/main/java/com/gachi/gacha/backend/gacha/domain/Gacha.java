package com.gachi.gacha.backend.gacha.domain;

import com.gachi.gacha.backend.collection.domain.CollectionSource;
import com.gachi.gacha.backend.common.domain.BaseTimeEntity;
import com.gachi.gacha.backend.common.exception.BusinessException;
import com.gachi.gacha.backend.common.exception.ErrorCode;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(
        name = "gacha",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_gacha_source_product_code",
                columnNames = {"source", "product_code"}
        )
)
@Builder
@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Gacha extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(columnDefinition = "TEXT")
    private String caption;

    @Column(name = "thumbnail_url", length = 1000)
    private String thumbnailUrl;

    @Column(name = "instagram_media_id", unique = true)
    private String instagramMediaId;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private CollectionSource source = CollectionSource.MANUAL;

    @Column(name = "product_code", length = 255)
    private String productCode;

    @Builder.Default
    @OneToMany(mappedBy = "gacha", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<GachaCategory> gachaCategories = new ArrayList<>();

    public Gacha(
            final String name,
            final String thumbnailUrl,
            final CollectionSource source,
            final String productCode,
            final List<Category> categories
    ) {
        this.name = name;
        this.thumbnailUrl = thumbnailUrl;
        this.source = source;
        this.productCode = productCode;
        replaceCategories(categories);
    }

    public void patch(
            final String name,
            final String caption,
            final String thumbnailUrl,
            final List<Category> categories
    ) {
        if (name != null) {
            validateName(name);
            this.name = name;
        }
        if (caption != null) {
            this.caption = caption;
        }
        if (thumbnailUrl != null) {
            this.thumbnailUrl = thumbnailUrl;
        }
        if (categories != null) {
            replaceCategories(categories);
        }
    }

    public void updateThumbnailUrl(final String thumbnailUrl) {
        this.thumbnailUrl = thumbnailUrl;
    }

    public void removeThumbnailUrl() {
        this.thumbnailUrl = null;
    }

    public void addCategory(final Category category) {
        if (gachaCategories == null) {
            gachaCategories = new ArrayList<>();
        }
        boolean alreadyAdded = gachaCategories.stream()
                .map(GachaCategory::getCategory)
                .anyMatch(existingCategory -> existingCategory.getName().equals(category.getName()));
        if (!alreadyAdded) {
            gachaCategories.add(new GachaCategory(this, category));
        }
    }

    private void replaceCategories(final List<Category> categories) {
        if (gachaCategories == null) {
            gachaCategories = new ArrayList<>();
        }
        Set<String> categoryNames = categories.stream()
                .map(Category::getName)
                .collect(Collectors.toSet());
        gachaCategories.removeIf(gachaCategory ->
                !categoryNames.contains(gachaCategory.getCategory().getName())
        );

        Set<String> existingCategoryNames = gachaCategories.stream()
                .map(GachaCategory::getCategory)
                .map(Category::getName)
                .collect(Collectors.toSet());
        categories.stream()
                .filter(category -> !existingCategoryNames.contains(category.getName()))
                .map(category -> new GachaCategory(this, category))
                .forEach(gachaCategories::add);
    }

    private void validateName(final String name) {
        if (name == null || name.isBlank()) {
            throw new BusinessException(ErrorCode.INVALID_GACHA_POLICY);
        }
    }
}
