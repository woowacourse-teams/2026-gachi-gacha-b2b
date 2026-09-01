import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { IdCell, List, ListNameCell, ListRow } from './QueuePage.styles';

describe('QueuePage styles', () => {
  it('Emotion 컴파일러 플러그인 없이 데이터 목록을 렌더링한다', () => {
    expect(() =>
      render(
        <List>
          <ListRow>
            <IdCell>#101</IdCell>
            <ListNameCell>가챠 이름</ListNameCell>
          </ListRow>
        </List>,
      ),
    ).not.toThrow();
  });
});
