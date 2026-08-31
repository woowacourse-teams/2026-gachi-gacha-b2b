package com.gachi.gacha.backend.gacha.domain;

import com.gachi.gacha.backend.collection.domain.CollectionSource;
import com.gachi.gacha.backend.common.domain.BaseTimeEntity;
import com.gachi.gacha.backend.common.exception.BusinessException;
import com.gachi.gacha.backend.common.exception.ErrorCode;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
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

    @Column(length = 255)
    private String category;

    public Gacha(
            final String name,
            final String thumbnailUrl,
            final CollectionSource source,
            final String productCode,
            final String category
    ) {
        this.name = name;
        this.thumbnailUrl = thumbnailUrl;
        this.source = source;
        this.productCode = productCode;
        this.category = category;
    }

    public void update(final String name, final String caption, final String thumbnailUrl) {
        update(name, caption, thumbnailUrl, category);
    }

    public void update(
            final String name,
            final String caption,
            final String thumbnailUrl,
            final String category
    ) {
        validateName(name);
        this.name = name;
        this.caption = caption;
        this.thumbnailUrl = thumbnailUrl;
        this.category = category;
    }

    private void validateName(final String name) {
        if (name == null || name.isBlank()) {
            throw new BusinessException(ErrorCode.INVALID_GACHA_POLICY);
        }
    }
}
