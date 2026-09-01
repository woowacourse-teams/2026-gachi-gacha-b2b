import { useEffect, useRef, useState } from 'react';

import {
  DialogActions,
  DialogButton,
  DialogError,
  DialogPanel,
  FieldLabel,
  Overlay,
} from '@/components/Modal.styles';

import {
  Control,
  ControlActions,
  ControlDescription,
  ControlHeader,
  KeyField,
  KeyHelp,
  KeyHelpButton,
  KeyHelpTooltip,
  KeyLabelRow,
  SecurityNotice,
  SettingsFields,
  SettingsPanel,
  Status,
} from './AiControl.styles';
import { useAiSettings } from '../context/AiSettingsContext';
import { AI_PROVIDERS } from '../model/aiSettings';
import type { AiProvider } from '../model/aiSettings';

export default function AiControl() {
  const { credentials, disable, enable, isEnabled, requestCount } =
    useAiSettings();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [provider, setProvider] = useState<AiProvider>('GEMINI');
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');
  const keyInputRef = useRef<HTMLInputElement>(null);
  const providerGuide = AI_PROVIDERS[provider];

  useEffect(() => {
    if (!isDialogOpen) return;

    keyInputRef.current?.focus();
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsDialogOpen(false);
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isDialogOpen]);

  const openSettings = () => {
    setProvider(credentials?.provider ?? 'GEMINI');
    setApiKey('');
    setError('');
    setIsDialogOpen(true);
  };

  const handleEnable = () => {
    if (!apiKey.trim()) {
      setError('사용할 AI 서비스의 API 키를 입력해 주세요.');
      return;
    }

    enable({ provider, apiKey });
    setApiKey('');
    setIsDialogOpen(false);
  };

  return (
    <>
      <Control aria-label="AI 분류 보조 설정">
        <ControlHeader>
          <strong>AI 자동 보조</strong>
          <Status enabled={isEnabled}>{isEnabled ? 'ON' : 'OFF'}</Status>
        </ControlHeader>
        <ControlDescription>
          {isEnabled && credentials
            ? `${AI_PROVIDERS[credentials.provider].label} · 이번 탭 ${requestCount}회 요청`
            : '기본값은 꺼짐이며 AI 요청과 과금이 발생하지 않습니다.'}
        </ControlDescription>
        <ControlActions>
          <button type="button" onClick={openSettings}>
            {isEnabled ? '키 변경' : 'AI 설정'}
          </button>
          {isEnabled && (
            <button type="button" onClick={disable}>
              AI 끄기
            </button>
          )}
        </ControlActions>
      </Control>

      {isDialogOpen && (
        <Overlay
          role="presentation"
          onMouseDown={(event) =>
            event.target === event.currentTarget && setIsDialogOpen(false)
          }
        >
          <DialogPanel
            as={SettingsPanel}
            aria-labelledby="ai-settings-title"
            aria-modal="true"
            role="dialog"
          >
            <h2 id="ai-settings-title">AI 자동 분류 설정</h2>
            <p>
              활성화하면 분류 화면에 처음 들어갈 때 현재 항목을 AI가 한 번
              분석합니다.
            </p>
            <SettingsFields>
              <FieldLabel>
                AI 서비스
                <select
                  value={provider}
                  onChange={(event) => {
                    setProvider(event.target.value as AiProvider);
                    setError('');
                  }}
                >
                  {Object.entries(AI_PROVIDERS).map(([value, option]) => (
                    <option key={value} value={value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </FieldLabel>
              <KeyField>
                <KeyLabelRow>
                  <label htmlFor="personal-ai-api-key">개인 API 키</label>
                  <KeyHelp>
                    <KeyHelpButton
                      aria-describedby="ai-api-key-guide"
                      aria-label={`${providerGuide.label} API 키 발급 안내`}
                      type="button"
                    >
                      ?
                    </KeyHelpButton>
                    <KeyHelpTooltip id="ai-api-key-guide" role="tooltip">
                      <strong>{providerGuide.label} 키를 가져오는 순서</strong>
                      <ol>
                        {providerGuide.keySteps.map((step) => (
                          <li key={step}>{step}</li>
                        ))}
                      </ol>
                      <a
                        href={providerGuide.keyUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {providerGuide.keyUrlLabel} 열기 ↗
                      </a>
                      <small>
                        ChatGPT·Codex·Gemini 웹 구독용 로그인 정보가 아니라,
                        선택한 개발자 플랫폼에서 만든 API 키를 입력해야 합니다.
                      </small>
                    </KeyHelpTooltip>
                  </KeyHelp>
                </KeyLabelRow>
                <input
                  id="personal-ai-api-key"
                  ref={keyInputRef}
                  autoComplete="off"
                  maxLength={512}
                  placeholder={AI_PROVIDERS[provider].keyPlaceholder}
                  spellCheck={false}
                  type="password"
                  value={apiKey}
                  onChange={(event) => {
                    setApiKey(event.target.value);
                    setError('');
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') handleEnable();
                  }}
                />
              </KeyField>
            </SettingsFields>
            <SecurityNotice>
              <strong>API 사용료는 입력한 키의 소유자에게 부과됩니다.</strong>{' '}
              키는 현재 탭의 메모리에만 보관하며 새로고침하거나 AI를 끄면
              삭제합니다. 추천 결과는 저장 전 반드시 확인해 주세요.
            </SecurityNotice>
            {error && <DialogError role="alert">{error}</DialogError>}
            <DialogActions>
              <DialogButton
                type="button"
                onClick={() => setIsDialogOpen(false)}
              >
                취소
              </DialogButton>
              <DialogButton kind="primary" type="button" onClick={handleEnable}>
                AI 보조 켜기
              </DialogButton>
            </DialogActions>
          </DialogPanel>
        </Overlay>
      )}
    </>
  );
}
