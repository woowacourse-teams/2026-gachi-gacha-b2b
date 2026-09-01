import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';

import type { AiCredentials } from '../model/aiSettings';

interface AiSettingsContextValue {
  credentials: AiCredentials | null;
  isEnabled: boolean;
  requestCount: number;
  disable: () => void;
  enable: (credentials: AiCredentials) => void;
  recordRequest: () => void;
}

const AiSettingsContext = createContext<AiSettingsContextValue | null>(null);

interface AiSettingsProviderProps {
  children: ReactNode;
}

export function AiSettingsProvider({ children }: AiSettingsProviderProps) {
  const [credentials, setCredentials] = useState<AiCredentials | null>(null);
  const [requestCount, setRequestCount] = useState(0);

  const enable = useCallback((nextCredentials: AiCredentials) => {
    setCredentials({
      provider: nextCredentials.provider,
      apiKey: nextCredentials.apiKey.trim(),
    });
  }, []);

  const disable = useCallback(() => {
    setCredentials(null);
  }, []);

  const recordRequest = useCallback(() => {
    setRequestCount((current) => current + 1);
  }, []);

  const value = useMemo<AiSettingsContextValue>(
    () => ({
      credentials,
      isEnabled: credentials !== null,
      requestCount,
      disable,
      enable,
      recordRequest,
    }),
    [credentials, disable, enable, recordRequest, requestCount],
  );

  return (
    <AiSettingsContext.Provider value={value}>
      {children}
    </AiSettingsContext.Provider>
  );
}

export const useAiSettings = () => {
  const context = useContext(AiSettingsContext);

  if (!context) {
    throw new Error(
      'useAiSettings는 AiSettingsProvider 안에서 사용해야 합니다.',
    );
  }

  return context;
};
