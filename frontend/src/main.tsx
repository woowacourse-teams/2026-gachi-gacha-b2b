import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from '@/App';

const container = document.getElementById('root');

if (!container) {
  throw new Error('#root 엘리먼트를 찾을 수 없습니다.');
}

const root = createRoot(container);

const renderApp = () => {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
};

if (__USE_MOCK_API__) {
  import('@/mocks/browser')
    .then(({ worker }) => worker.start({ onUnhandledRequest: 'bypass' }))
    .then(renderApp)
    .catch((cause: unknown) => {
      console.error('목 API를 시작하지 못했습니다.', cause);
      renderApp();
    });
} else {
  renderApp();
}
