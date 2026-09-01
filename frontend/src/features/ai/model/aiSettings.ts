export const AI_PROVIDERS = {
  GEMINI: {
    label: 'Google Gemini',
    keyPlaceholder: 'Google AI Studio API 키',
    keyUrl: 'https://aistudio.google.com/apikey',
    keyUrlLabel: 'Google AI Studio API 키 페이지',
    keySteps: [
      'Google 계정으로 AI Studio에 로그인합니다.',
      'API 키 만들기를 누르고 프로젝트를 선택하거나 새로 만듭니다.',
      '생성된 AIza로 시작하는 키를 복사해 이 칸에 붙여넣습니다.',
    ],
  },
  OPENAI: {
    label: 'OpenAI',
    keyPlaceholder: 'OpenAI API 키',
    keyUrl: 'https://platform.openai.com/api-keys',
    keyUrlLabel: 'OpenAI API 키 페이지',
    keySteps: [
      'OpenAI Platform에 로그인하고 사용할 Project를 선택합니다.',
      'Create new secret key를 눌러 비밀 키를 생성합니다.',
      '한 번만 표시되는 sk-로 시작하는 키를 복사해 이 칸에 붙여넣습니다.',
    ],
  },
} as const;

export type AiProvider = keyof typeof AI_PROVIDERS;

export interface AiCredentials {
  provider: AiProvider;
  apiKey: string;
}
