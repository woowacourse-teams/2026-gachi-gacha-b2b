package com.gachi.gacha.backend.collection.infra.instagram;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConditionalOnProperty(prefix = "collection.instagram", name = "enabled", havingValue = "true")
public class InstagramCollectionConfig {

    private static final int THREAD_POOL_SIZE = 4;

    @Bean(name = "instagramImageUploadExecutor", destroyMethod = "shutdown")
    ExecutorService instagramImageUploadExecutor() {
        return Executors.newFixedThreadPool(THREAD_POOL_SIZE);
    }
}
