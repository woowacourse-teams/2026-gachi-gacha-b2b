export type AiSuggestionStatus = 'IDLE' | 'LOADING' | 'READY' | 'FAILED';

export interface AiCategorySuggestion {
  translatedName: string;
  workNames: string[];
  characterNames: string[];
  categoryNames: string[];
  model: string;
  generatedAt: string;
}
