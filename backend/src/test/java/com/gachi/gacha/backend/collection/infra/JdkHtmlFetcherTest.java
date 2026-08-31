package com.gachi.gacha.backend.collection.infra;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class JdkHtmlFetcherTest {

    @Test
    @SuppressWarnings("unchecked")
    void 설정한_UserAgent로_HTML을_요청한다() throws Exception {
        final HttpClient httpClient = mock(HttpClient.class);
        final HttpResponse<String> response = mock(HttpResponse.class);
        given(response.statusCode()).willReturn(200);
        given(response.body()).willReturn("<html></html>");
        given(httpClient.send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class)))
                .willReturn(response);
        final String userAgent = "Mozilla/5.0 test-browser";
        final JdkHtmlFetcher htmlFetcher = new JdkHtmlFetcher(
                httpClient,
                Duration.ofSeconds(1),
                Duration.ZERO,
                userAgent
        );

        final String body = htmlFetcher.fetch("https://example.com/items");

        final ArgumentCaptor<HttpRequest> requestCaptor = ArgumentCaptor.forClass(HttpRequest.class);
        verify(httpClient).send(requestCaptor.capture(), any(HttpResponse.BodyHandler.class));
        assertThat(requestCaptor.getValue().headers().firstValue("User-Agent"))
                .contains(userAgent);
        assertThat(body).isEqualTo("<html></html>");
    }
}
