package com.gachi.gacha.backend.common.infra.presentation;

import com.gachi.gacha.backend.common.domain.dto.BaseResponse;
import com.gachi.gacha.backend.common.infra.application.SearchSynonymService;
import com.gachi.gacha.backend.common.infra.application.dto.SearchSynonymInfo;
import com.gachi.gacha.backend.common.infra.presentation.dto.SearchSynonymRequest;
import com.gachi.gacha.backend.common.infra.presentation.dto.SearchSynonymResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/synonyms")
public class SearchSynonymController {

    private final SearchSynonymService searchSynonymService;

    @PostMapping
    public void createSearchSynonym(@RequestBody final SearchSynonymRequest searchSynonymRequest) {
        searchSynonymService.addSearchSynonym(searchSynonymRequest.toCommand());
    }

    @GetMapping("/{synonymSet}")
    public BaseResponse<List<SearchSynonymResponse>> readSynonyms(@PathVariable final String synonymSet) {
        List<SearchSynonymInfo> info = searchSynonymService.findAllBySynonymSet(synonymSet);
        List<SearchSynonymResponse> responses = info.stream()
                .map(SearchSynonymResponse::from)
                .toList();
        return BaseResponse.ok(responses);
    }
}
