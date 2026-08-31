import { describe, expect, it } from 'vitest';

import { MAX_FIELD_IMAGE_SIZE, validateFieldImage } from './registration';

describe('field image validation', () => {
  it('JPG, PNG, WebP 이미지 파일을 허용한다', () => {
    const file = new File(['image'], 'gacha.png', { type: 'image/png' });

    expect(validateFieldImage(file)).toBeNull();
  });

  it('지원하지 않는 형식과 10MB를 초과한 파일을 거부한다', () => {
    const unsupported = new File(['image'], 'gacha.gif', {
      type: 'image/gif',
    });
    const oversized = new File(
      [new Uint8Array(MAX_FIELD_IMAGE_SIZE + 1)],
      'gacha.jpg',
      { type: 'image/jpeg' },
    );

    expect(validateFieldImage(unsupported)).toContain('JPG');
    expect(validateFieldImage(oversized)).toContain('10MB');
  });
});
