package com.gachi.gacha.backend.collection.scheduler;

import java.time.Clock;
import java.time.ZoneId;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@Configuration
public class CollectionSchedulingConfig {

    @Bean
    Clock collectionClock(@Value("${collection.scheduling.zone:Asia/Seoul}") final String zone) {
        return Clock.system(ZoneId.of(zone));
    }
}
