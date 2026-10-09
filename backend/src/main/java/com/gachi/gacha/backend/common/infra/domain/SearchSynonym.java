package com.gachi.gacha.backend.common.infra.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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

@Getter
@Table(
        uniqueConstraints = @UniqueConstraint(columnNames = {"synonym_set", "rule_key"})
)
@Entity
@Builder
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SearchSynonym {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String synonymSet;

    @Column(nullable = false, length = 100)
    private String ruleKey;

    @Column(nullable = false, length = 500)
    private String synonyms;

    public void updateSynonyms(String synonyms) {
        this.synonyms = synonyms;
    }
}
