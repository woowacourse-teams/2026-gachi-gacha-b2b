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
  name: '산리오 미니 피규어',
  allowedCategoryNames: ['산리오', '피규어', '키링'],
};

describe('AI category suggestion service', () => {
  it('허용되지 않은 이미지 호스트 요청을 거절한다', async () => {
    await assert.rejects(
      createAiCategorySuggestion(
        { ...request, imageUrl: 'https://untrusted.example/gacha.jpg' },
        {
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

  it('이미지와 이름을 보내고 허용된 카테고리만 반환한다', async () => {
    let sentBody;
    const suggestion = await createAiCategorySuggestion(request, {
      apiKey: 'test-key',
      imageHostAllowlist: 'images.example.com',
      fetchImpl: async (_url, options) => {
        sentBody = JSON.parse(options.body);
        return new Response(
          JSON.stringify({
            model: 'gpt-4o-mini-test',
            output: [
              {
                content: [
                  {
                    type: 'output_text',
                    text: JSON.stringify({
                      categoryNames: ['산리오', '피규어', '허용 안 됨'],
                    }),
                  },
                ],
              },
            ],
          }),
          { status: 200 },
        );
      },
    });

    assert.equal(sentBody.input[0].content[1].detail, 'low');
    assert.equal(sentBody.text.format.type, 'json_schema');
    assert.deepEqual(suggestion.categoryNames, ['산리오', '피규어']);
    assert.equal(suggestion.model, 'gpt-4o-mini-test');
  });
});
