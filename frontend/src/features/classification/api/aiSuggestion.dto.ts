export interface AiCategorySuggestionRequestDto {
  itemId: number;
  itemVersion: number;
  imageUrl: string;
  name: string;
  allowedCategoryNames: string[];
}

export interface AiCategorySuggestionDto {
  categoryNames: string[];
  model: string;
  generatedAt: string;
}
