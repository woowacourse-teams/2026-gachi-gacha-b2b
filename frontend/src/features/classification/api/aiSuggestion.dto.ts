export interface AiCategorySuggestionRequestDto {
  itemId: number;
  itemVersion: number;
  imageUrl: string;
  name: string;
  allowedCategoryNames: string[];
}

export interface AiCategorySuggestionDto {
  translatedName: string;
  workNames: string[];
  characterNames: string[];
  categoryNames: string[];
  model: string;
  generatedAt: string;
}
