package com.gachi.gacha.backend.collection.domain;

import java.util.List;

public interface GachaCollector {

    CollectionSource source();

    List<CollectedGacha> collect();
}
