package com.gachi.gacha.backend.gacha.presentation;

import com.gachi.gacha.backend.collection.application.GachaCollectionFacade;
import com.gachi.gacha.backend.common.domain.dto.BaseResponse;
import com.gachi.gacha.backend.gacha.presentation.dto.GachaCollectResponse;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/gachas")
public class AdminGachaController {

    private final GachaCollectionFacade gachaCollectionFacade;

    public AdminGachaController(final GachaCollectionFacade gachaCollectionFacade) {
        this.gachaCollectionFacade = gachaCollectionFacade;
    }

    @PostMapping("/collect")
    public BaseResponse<GachaCollectResponse> collectGachaDataManually() {
        int collectedCount = gachaCollectionFacade.collectAllGachas();
        return BaseResponse.ok(GachaCollectResponse.from(collectedCount));
    }
}
