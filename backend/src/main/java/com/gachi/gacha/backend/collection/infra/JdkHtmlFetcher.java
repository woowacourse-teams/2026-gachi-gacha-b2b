package com.gachi.gacha.backend.collection.infra;

import com.gachi.gacha.backend.collection.domain.GachaCollectionException;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class JdkHtmlFetcher implements HtmlFetcher {

    private final HttpClient httpClient;
    private final Duration readTimeout;
    private final Duration requestDelay;
    private final String userAgent;

    private long lastRequestNanos;

    public JdkHtmlFetcher(
            final HttpClient httpClient,
            @Value("${collection.http.read-timeout:15s}") final Duration readTimeout,
            @Value("${collection.http.request-delay:1s}") final Duration requestDelay,
            @Value("${collection.http.user-agent:Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36}") final String userAgent
    ) {
        this.httpClient = httpClient;
        this.readTimeout = readTimeout;
        this.requestDelay = requestDelay;
        this.userAgent = userAgent;
    }

    @Override
    public synchronized String fetch(final String url) {
        waitForRequestInterval();

        final HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                .timeout(readTimeout)
                .header("User-Agent", userAgent)
                .header("Accept", "text/html,application/xhtml+xml")
                .GET()
                .build();

        try {
            lastRequestNanos = System.nanoTime();
            final HttpResponse<String> response = httpClient.send(
                    request,
                    HttpResponse.BodyHandlers.ofString()
            );
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new GachaCollectionException(
                        "HTML 요청에 실패했습니다. status=" + response.statusCode() + ", url=" + url
                );
            }
            return response.body();
        } catch (final InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new GachaCollectionException("HTML 요청 중 인터럽트가 발생했습니다. url=" + url, exception);
        } catch (final IOException exception) {
            throw new GachaCollectionException("HTML 요청에 실패했습니다. url=" + url, exception);
        }
    }

    private void waitForRequestInterval() {
        if (lastRequestNanos == 0L || requestDelay.isZero() || requestDelay.isNegative()) {
            return;
        }

        final long elapsedNanos = System.nanoTime() - lastRequestNanos;
        final long remainingNanos = requestDelay.toNanos() - elapsedNanos;
        if (remainingNanos <= 0L) {
            return;
        }

        try {
            final long millis = remainingNanos / 1_000_000L;
            final int nanos = (int) (remainingNanos % 1_000_000L);
            Thread.sleep(millis, nanos);
        } catch (final InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new GachaCollectionException("요청 대기 중 인터럽트가 발생했습니다.", exception);
        }
    }
}
