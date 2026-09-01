package com.gachi.gacha.backend.collection.infra;

import java.net.http.HttpClient;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class CollectionHttpConfig {

    @Bean
    HttpClient collectionHttpClient(
            @Value("${collection.http.connect-timeout:5s}") final Duration connectTimeout
    ) {
        return HttpClient.newBuilder()
                .connectTimeout(connectTimeout)
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build();
    }
}
