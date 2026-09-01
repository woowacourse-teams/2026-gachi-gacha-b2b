package com.gachi.gacha.backend.collection.presentation;

import com.gachi.gacha.backend.collection.application.InstagramGachaCollectionFacade;
import com.gachi.gacha.backend.collection.presentation.dto.InstagramCollectionResponse;
import com.gachi.gacha.backend.common.domain.dto.BaseResponse;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/gachas")
@ConditionalOnProperty(prefix = "collection.instagram", name = "enabled", havingValue = "true")
public class InstagramGachaCollectionController {

    private final InstagramGachaCollectionFacade collectionFacade;

    public InstagramGachaCollectionController(final InstagramGachaCollectionFacade collectionFacade) {
        this.collectionFacade = collectionFacade;
    }

    @PostMapping("/collect")
    public BaseResponse<InstagramCollectionResponse> collectGachaDataManually() {
        return BaseResponse.ok(InstagramCollectionResponse.from(collectionFacade.collectAllGachas()));
    }
}
