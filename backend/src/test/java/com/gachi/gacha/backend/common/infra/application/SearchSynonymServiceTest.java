package com.gachi.gacha.backend.common.infra.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.gachi.gacha.backend.common.infra.application.dto.SearchSynonymCommand;
import com.gachi.gacha.backend.common.infra.application.event.SearchSynonymChangedEvent;
import com.gachi.gacha.backend.common.infra.domain.SearchSynonym;
import com.gachi.gacha.backend.common.infra.domain.SearchSynonymJpaRepository;
import com.gachi.gacha.backend.common.infra.exception.InvalidSynonymRuleException;
import java.util.Optional;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

@ExtendWith(MockitoExtension.class)
class SearchSynonymServiceTest {

    private static final String SYNONYM_SET = "gacha-synonyms";
    private static final String RULE_KEY = "capsule-toy";

    @Mock
    private ApplicationEventPublisher publisher;

    @Mock
    private SearchSynonymJpaRepository repository;

    @InjectMocks
    private SearchSynonymService service;

    @ParameterizedTest
    @MethodSource("validRules")
    void savesValidRuleAndPublishesChangedEvent(String rule) {
        service.addSearchSynonym(new SearchSynonymCommand(SYNONYM_SET, RULE_KEY, rule));

        ArgumentCaptor<SearchSynonym> saved = ArgumentCaptor.forClass(SearchSynonym.class);
        verify(repository).save(saved.capture());
        assertThat(saved.getValue().getSynonyms()).isEqualTo(rule);
        verify(publisher).publishEvent(new SearchSynonymChangedEvent(SYNONYM_SET, RULE_KEY));
    }

    @ParameterizedTest
    @MethodSource("invalidRules")
    void rejectsInvalidRuleBeforeAccessingDatabaseOrPublishingEvent(String rule) {
        assertThatThrownBy(() -> service.addSearchSynonym(new SearchSynonymCommand(SYNONYM_SET, RULE_KEY, rule)))
                .isInstanceOf(InvalidSynonymRuleException.class);

        verifyNoInteractions(repository, publisher);
    }

    @Test
    void appendsNewTermsToExistingRuleAndSkipsDuplicateTerms() {
        SearchSynonym existing = givenExistingRule("가히리, 가정교사 히트맨 리본");

        service.addSearchSynonym(new SearchSynonymCommand(SYNONYM_SET, RULE_KEY, "test추가2"));
        service.addSearchSynonym(new SearchSynonymCommand(
                SYNONYM_SET, RULE_KEY, "가히리, test추가2, 츠나, 츠나"));

        assertThat(existing.getSynonyms()).isEqualTo("가히리, 가정교사 히트맨 리본, test추가2, 츠나");
        verify(repository, never()).save(any(SearchSynonym.class));
    }

    @Test
    void rejectsSingleTermWhenCreatingNewRule() {
        assertThatThrownBy(() -> service.addSearchSynonym(new SearchSynonymCommand(SYNONYM_SET, RULE_KEY, "가히리")))
                .isInstanceOf(InvalidSynonymRuleException.class);

        verify(repository, never()).save(any(SearchSynonym.class));
        verifyNoInteractions(publisher);
    }

    @Test
    void rejectsAppendWhenMergedRuleWouldExceedLengthLimit() {
        String original = "a," + "b".repeat(498);
        SearchSynonym existing = givenExistingRule(original);

        assertThatThrownBy(() -> service.addSearchSynonym(new SearchSynonymCommand(SYNONYM_SET, RULE_KEY, "c")))
                .isInstanceOf(InvalidSynonymRuleException.class);

        assertThat(existing.getSynonyms()).isEqualTo(original);
        verifyNoInteractions(publisher);
    }

    @Test
    void rejectsAppendingAnEquivalentTermToDirectionalRule() {
        SearchSynonym existing = givenExistingRule("가히리 => 리본");

        assertThatThrownBy(() -> service.addSearchSynonym(new SearchSynonymCommand(SYNONYM_SET, RULE_KEY, "츠나")))
                .isInstanceOf(InvalidSynonymRuleException.class);

        assertThat(existing.getSynonyms()).isEqualTo("가히리 => 리본");
        verifyNoInteractions(publisher);
    }

    private SearchSynonym givenExistingRule(String rule) {
        SearchSynonym existing = new SearchSynonymCommand(SYNONYM_SET, RULE_KEY, rule).toEntity();
        when(repository.findForUpdateBySynonymSetAndRuleKey(SYNONYM_SET, RULE_KEY))
                .thenReturn(Optional.of(existing));
        return existing;
    }

    private static Stream<String> validRules() {
        return Stream.of(
                "가챠, 캡슐 토이",
                "가챠 => 캡슐 토이",
                "가챠, 캡슐 => 캡슐 토이, 뽑기",
                "a\\,b, c",
                "a\\=>b, c",
                "a\\\\, b",
                "a," + "b".repeat(498)
        );
    }

    private static Stream<String> invalidRules() {
        return Stream.of(
                null, "", " \t ", ",가챠", "가챠,", "가챠,,캡슐", "가챠, ,캡슐",
                "=> 캡슐", "가챠 =>", "가챠 => 캡슐 => 뽑기",
                "a,\\ ,b", "a, b\\",
                "가챠,\n캡슐", " #가챠, 캡슐", "a," + "b".repeat(499)
        );
    }
}
