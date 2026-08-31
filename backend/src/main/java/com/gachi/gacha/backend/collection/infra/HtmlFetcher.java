package com.gachi.gacha.backend.collection.infra;

@FunctionalInterface
public interface HtmlFetcher {

    String fetch(String url);
}
