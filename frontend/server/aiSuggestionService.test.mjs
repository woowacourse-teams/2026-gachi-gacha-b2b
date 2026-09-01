import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  createAiCategorySuggestion,
  SuggestionError,
} from './aiSuggestionService.mjs';

const request = {
  itemId: 101,
  itemVersion: 1,
  imageUrl: 'https://images.example.com/gacha/101.jpg',
  name: 'サンリオ ミニフィギュア',
  allowedCategoryNames: ['산리오', '피규어', '키링'],
};

const aiResult = {
  translatedName: '산리오 미니 피규어',
  workNames: ['산리오 캐릭터즈'],
  characterNames: ['마이멜로디', '쿠로미'],
  categoryNames: ['피규어', '산리오 캐릭터즈'],
};

describe('AI category suggestion service', () => {
  it('개인 API 키가 없으면 외부 AI를 호출하지 않는다', async () => {
    await assert.rejects(
      createAiCategorySuggestion(request, {
        provider: 'GEMINI',
        imageHostAllowlist: 'images.example.com',
        fetchImpl: () => {
          throw new Error('호출되면 안 됩니다.');
        },
      }),
      (error) =>
        error instanceof SuggestionError &&
        error.message === '사용할 AI 서비스의 API 키가 필요합니다.',
    );
  });

  it('허용되지 않은 이미지 호스트 요청을 거절한다', async () => {
    await assert.rejects(
      createAiCategorySuggestion(
        { ...request, imageUrl: 'https://untrusted.example/gacha.jpg' },
        {
          provider: 'GEMINI',
          apiKey: 'test-key',
          imageHostAllowlist: 'images.example.com',
          fetchImpl: () => {
            throw new Error('호출되면 안 됩니다.');
          },
        },
      ),
      (error) =>
        error instanceof SuggestionError &&
        error.message === '허용되지 않은 이미지 호스트입니다.',
    );
  });

  it('OpenAI에 개인 키와 저해상도 이미지를 보내고 구조화된 결과를 반환한다', async () => {
    let sentUrl;
    let sentHeaders;
    let sentBody;
    const suggestion = await createAiCategorySuggestion(request, {
      provider: 'OPENAI',
      apiKey: 'openai-test-key',
      imageHostAllowlist: 'images.example.com',
      fetchImpl: async (url, options) => {
        sentUrl = url;
        sentHeaders = options.headers;
        sentBody = JSON.parse(options.body);
        return new Response(
          JSON.stringify({
            model: 'gpt-4o-mini-test',
            output: [
              {
                content: [
                  {
                    type: 'output_text',
                    text: JSON.stringify(aiResult),
                  },
                ],
              },
            ],
          }),
          { status: 200 },
        );
      },
    });

    assert.equal(sentUrl, 'https://api.openai.com/v1/responses');
    assert.equal(sentHeaders.Authorization, 'Bearer openai-test-key');
    assert.equal(sentBody.store, false);
    assert.equal(sentBody.input[0].content[1].detail, 'low');
    assert.equal(sentBody.text.format.type, 'json_schema');
    assert.deepEqual(suggestion, {
      translatedName: '산리오 미니 피규어',
      workNames: ['산리오 캐릭터즈'],
      characterNames: ['마이멜로디', '쿠로미'],
      categoryNames: ['산리오 캐릭터즈', '마이멜로디', '쿠로미', '피규어'],
      model: 'gpt-4o-mini-test',
      generatedAt: suggestion.generatedAt,
    });
  });

  it('Gemini에 개인 키와 공개 이미지 URL을 보내고 구조화된 결과를 반환한다', async () => {
    let sentUrl;
    let sentHeaders;
    let sentBody;
    const suggestion = await createAiCategorySuggestion(request, {
      provider: 'GEMINI',
      apiKey: 'gemini-test-key',
      geminiModel: 'gemini-test-model',
      imageHostAllowlist: 'images.example.com',
      fetchImpl: async (url, options) => {
        sentUrl = url;
        sentHeaders = options.headers;
        sentBody = JSON.parse(options.body);
        return new Response(
          JSON.stringify({
            model: 'gemini-test-model',
            steps: [
              {
                type: 'model_output',
                content: [{ type: 'text', text: JSON.stringify(aiResult) }],
              },
            ],
          }),
          { status: 200 },
        );
      },
    });

    assert.equal(
      sentUrl,
      'https://generativelanguage.googleapis.com/v1beta/interactions',
    );
    assert.equal(sentHeaders['x-goog-api-key'], 'gemini-test-key');
    assert.deepEqual(sentBody.input[1], {
      type: 'image',
      uri: request.imageUrl,
      mime_type: 'image/jpeg',
    });
    assert.equal(sentBody.response_format[0].mime_type, 'application/json');
    assert.equal(suggestion.translatedName, '산리오 미니 피규어');
    assert.deepEqual(suggestion.workNames, ['산리오 캐릭터즈']);
    assert.deepEqual(suggestion.characterNames, ['마이멜로디', '쿠로미']);
    assert.deepEqual(suggestion.categoryNames, [
      '산리오 캐릭터즈',
      '마이멜로디',
      '쿠로미',
      '피규어',
    ]);
  });
});
