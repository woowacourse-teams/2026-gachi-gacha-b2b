import { Global, css } from '@emotion/react';

import { colors } from './tokens';

const globalStyles = css`
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  html {
    color: ${colors.text};
    background: ${colors.background};
  }

  body {
    min-width: 320px;
    margin: 0;
    font-family:
      'Pretendard', 'IBM Plex Sans KR', 'Apple SD Gothic Neo', sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  button,
  input,
  select,
  textarea {
    font: inherit;
  }

  button,
  a {
    -webkit-tap-highlight-color: transparent;
  }

  button:not(:disabled) {
    cursor: pointer;
  }

  :focus-visible {
    outline: 3px solid rgba(173, 40, 49, 0.3);
    outline-offset: 2px;
  }
`;

export default function GlobalStyles() {
  return <Global styles={globalStyles} />;
}
