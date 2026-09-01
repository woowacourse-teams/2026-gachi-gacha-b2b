export type AiSuggestionStatus = 'IDLE' | 'LOADING' | 'READY' | 'FAILED';

export interface AiCategorySuggestion {
  categoryNames: string[];
  model: string;
  generatedAt: string;
}
