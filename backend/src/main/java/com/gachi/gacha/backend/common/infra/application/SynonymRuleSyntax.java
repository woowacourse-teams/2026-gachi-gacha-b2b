package com.gachi.gacha.backend.common.infra.application;

import com.gachi.gacha.backend.common.infra.exception.InvalidSynonymRuleException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

final class SynonymRuleSyntax {

    private static final int MAX_LENGTH = 500;
    private static final int EQUIVALENT_RULE_SIDE_COUNT = 1;
    private static final int MAX_MAPPING_SIDE_COUNT = 2;
    private static final int MIN_EQUIVALENT_RULE_TERMS = 2;
    private static final int MIN_MAPPING_SIDE_TERMS = 1;
    private static final int UNPAIRED_ESCAPE_LENGTH = 1;
    private static final int UNICODE_LINE_SEPARATOR = 0x2028;
    private static final int UNICODE_PARAGRAPH_SEPARATOR = 0x2029;

    private static final Pattern MAPPING_SEPARATOR = Pattern.compile("\\\\(?:.|$)|=>");
    private static final Pattern TERM_SEPARATOR = Pattern.compile("\\\\(?:.|$)|,");
    private static final Pattern ESCAPED_CHARACTER = Pattern.compile("\\\\(.)");

    private SynonymRuleSyntax() {
    }

    public static void validate(final String rule) {
        validate(rule, MIN_EQUIVALENT_RULE_TERMS);
    }

    static void validateAddition(final String rule) {
        validate(rule, MIN_MAPPING_SIDE_TERMS);
    }

    static String merge(final String existing, final String incoming) {
        validate(existing);
        if (isDirectional(existing) && isDirectional(incoming)) {
            return incoming;
        }
        if (isDirectional(existing) || isDirectional(incoming)) {
            throw new InvalidSynonymRuleException("동등 규칙과 방향 규칙은 같은 키에서 합칠 수 없습니다.");
        }

        Set<String> knownTerms = new HashSet<>();
        splitOnUnescapedSeparator(existing, TERM_SEPARATOR)
                .forEach(term -> knownTerms.add(normalizeTerm(term)));

        StringBuilder merged = new StringBuilder(existing);
        for (String term : splitOnUnescapedSeparator(incoming, TERM_SEPARATOR)) {
            if (knownTerms.add(normalizeTerm(term))) {
                merged.append(", ").append(term.stripLeading());
            }
        }
        String result = merged.toString();
        validate(result);
        return result;
    }

    private static boolean isDirectional(final String rule) {
        return splitOnUnescapedSeparator(rule, MAPPING_SEPARATOR).size() > EQUIVALENT_RULE_SIDE_COUNT;
    }

    private static String normalizeTerm(final String term) {
        return ESCAPED_CHARACTER.matcher(term).replaceAll("$1").strip();
    }

    private static void validate(final String rule, final int minimumEquivalentTerms) {
        validateRuleText(rule);

        List<String> mappingSides = splitOnUnescapedSeparator(rule, MAPPING_SEPARATOR);
        validateMappingCount(mappingSides.size());

        int minimumTerms = (mappingSides.size() == EQUIVALENT_RULE_SIDE_COUNT)
                ? minimumEquivalentTerms : MIN_MAPPING_SIDE_TERMS;
        for (String side : mappingSides) {
            List<String> terms = splitOnUnescapedSeparator(side, TERM_SEPARATOR);
            terms.forEach(SynonymRuleSyntax::validateTerm);
            validateTermCount(terms.size(), minimumTerms);
        }
    }

    private static List<String> splitOnUnescapedSeparator(final String text, final Pattern separatorPattern) {
        List<String> parts = new ArrayList<>();
        Matcher matcher = separatorPattern.matcher(text);
        int partStart = 0;
        while (matcher.find()) {
            String match = matcher.group();
            if (match.startsWith("\\")) {
                validateEscape(match);
                continue;
            }
            parts.add(text.substring(partStart, matcher.start()));
            partStart = matcher.end();
        }
        parts.add(text.substring(partStart));
        return parts;
    }

    private static void validateEscape(final String match) {
        if (match.length() == UNPAIRED_ESCAPE_LENGTH) {
            throw new InvalidSynonymRuleException("이스케이프 기호 뒤에는 문자가 필요합니다.");
        }
    }

    private static void validateRuleText(final String rule) {
        if (rule == null || rule.isBlank()) {
            throw new InvalidSynonymRuleException("동의어 규칙은 필수입니다.");
        }
        if (rule.length() > MAX_LENGTH) {
            throw new InvalidSynonymRuleException("동의어 규칙은 " + MAX_LENGTH + "자 이하여야 합니다.");
        }
        if (rule.stripLeading().startsWith("#") || rule.chars().anyMatch(SynonymRuleSyntax::isUnsupportedCharacter)) {
            throw new InvalidSynonymRuleException("동의어 규칙에는 주석, 줄바꿈 또는 지원하지 않는 제어 문자를 사용할 수 없습니다.");
        }
    }

    private static boolean isUnsupportedCharacter(final int character) {
        return character != '\t' && (Character.isISOControl(character)
                || character == UNICODE_LINE_SEPARATOR
                || character == UNICODE_PARAGRAPH_SEPARATOR);
    }

    private static void validateTerm(final String term) {
        String content = ESCAPED_CHARACTER.matcher(term).replaceAll("$1");
        if (content.chars().allMatch(c -> Character.isWhitespace(c) || Character.isSpaceChar(c))) {
            throw new InvalidSynonymRuleException("동의어 규칙에 빈 항목이 있습니다.");
        }
    }

    private static void validateMappingCount(final int sideCount) {
        if (sideCount > MAX_MAPPING_SIDE_COUNT) {
            throw new InvalidSynonymRuleException("동의어 규칙에는 매핑 구분자(=>)를 한 번만 사용할 수 있습니다.");
        }
    }

    private static void validateTermCount(int termCount, int minimumTerms) {
        if (termCount < minimumTerms) {
            throw new InvalidSynonymRuleException("쉼표 또는 매핑 구분자(=>)로 동의어를 연결해야 합니다.");
        }
    }
}
