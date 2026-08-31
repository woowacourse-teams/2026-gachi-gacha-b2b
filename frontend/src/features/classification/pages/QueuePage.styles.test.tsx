import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Card, ImageWrap } from './QueuePage.styles';

describe('QueuePage styles', () => {
  it('Emotion 컴파일러 플러그인 없이 데이터 카드를 렌더링한다', () => {
    expect(() =>
      render(
        <Card>
          <ImageWrap>
            <img src="/mock/gacha-pink.svg" alt="가챠 목 이미지" />
          </ImageWrap>
        </Card>,
      ),
    ).not.toThrow();
  });
});
