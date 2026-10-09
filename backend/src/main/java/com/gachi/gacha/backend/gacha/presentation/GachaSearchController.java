package com.gachi.gacha.backend.gacha.presentation;

import com.gachi.gacha.backend.gacha.application.GachaSearchService;
import com.gachi.gacha.backend.gacha.application.dto.GachaDocument;
import com.gachi.gacha.backend.gacha.application.dto.GachaSearchCondition;
import java.io.IOException;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/gachas/search")
public class GachaSearchController {

    private final GachaSearchService gachaSearchService;

    @GetMapping
    public List<GachaDocument> search(
            @RequestParam(required = false) final String keyword,
            @RequestParam(required = false) final List<Long> categoryIds,
            @RequestParam(required = false) final Double lat,
            @RequestParam(required = false) final Double lon,
            @RequestParam(required = false) final Double distanceKm,
            @RequestParam(defaultValue = "0") final int page,
            @RequestParam(defaultValue = "20") final int size) throws IOException {
        return gachaSearchService.search(new GachaSearchCondition(keyword, categoryIds, lat, lon, distanceKm, page, Math.min(size, 50)));
    }
}
