package com.gachi.gacha.backend.common.infra.config;

import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.core.retry.RetryPolicy;
import software.amazon.awssdk.http.apache.ApacheHttpClient;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;

/**
 * b2b의 S3 업로드는 서버(EC2)가 같은 리전 S3로 이미지를 한 장씩 올리는 구조이고, 수집 배치는 여러 장을 한 트랜잭션 안에서
 * 순차로 올린다. 막힌 호출이 길어지면 그만큼 DB 커넥션을 붙잡고 배치 전체가 늦어지므로, 막힌 호출은 빨리 끊고
 * (socketTimeout, apiCallTimeout) 금방 실패하는 일시 오류만 재시도로 살린다.
 */
@Configuration
public class S3Config {

    private static final Duration SOCKET_TIMEOUT = Duration.ofSeconds(10);
    private static final Duration API_CALL_TIMEOUT = Duration.ofSeconds(30);
    private static final int MAX_RETRIES = 2;

    @Value("${cloud.aws.region}")
    private String region;

    @Bean
    public S3Client s3Client() {
        return S3Client.builder()
                .region(Region.of(region))
                .httpClientBuilder(ApacheHttpClient.builder()
                        .socketTimeout(SOCKET_TIMEOUT))
                .overrideConfiguration(config -> config
                        .apiCallTimeout(API_CALL_TIMEOUT)
                        .retryPolicy(RetryPolicy.builder()
                                .numRetries(MAX_RETRIES)
                                .build()))
                .build();
    }
}
