import {
  AiState,
  CategoryCatalog,
  Editor,
  EditorHeader,
  HelperText,
  ManageButton,
  RetryButton,
  UnknownCategoryMessage,
  AiEvidence,
} from './CategoryTextEditor.styles';
import type { AiSuggestionStatus } from '../model/aiSuggestion';
import type { Category } from '../model/classification';

interface CategoryTextEditorProps {
  value: string;
  categories: Category[];
  selectedCategoryIds: number[];
  unknownCategoryNames: string[];
  aiStatus: AiSuggestionStatus;
  aiModel: string;
  aiError: string;
  aiEnabled: boolean;
  aiWorkNames: string[];
  aiCharacterNames: string[];
  disabled?: boolean;
  onChange: (value: string) => void;
  onManage: () => void;
  onRetry: () => void;
  onToggle: (category: Category) => void;
}

const getAiStateText = (
  status: AiSuggestionStatus,
  model: string,
  error: string,
  enabled: boolean,
) => {
  if (!enabled) return 'AI 보조가 꺼져 있습니다. 직접 입력해 주세요.';
  if (status === 'LOADING') return 'AI가 이미지를 분석하고 있습니다.';
  if (status === 'READY')
    return `AI 추천을 입력했습니다${model ? ` · ${model}` : ''}`;
  if (status === 'FAILED') return error || 'AI 추천을 불러오지 못했습니다.';
  return 'AI 추천 전입니다.';
};

export default function CategoryTextEditor({
  value,
  categories,
  selectedCategoryIds,
  unknownCategoryNames,
  aiStatus,
  aiModel,
  aiError,
  aiEnabled,
  aiWorkNames,
  aiCharacterNames,
  disabled = false,
  onChange,
  onManage,
  onRetry,
  onToggle,
}: CategoryTextEditorProps) {
  return (
    <Editor>
      <EditorHeader>
        <label htmlFor="gacha-categories">카테고리 수정</label>
        <div>
          <RetryButton
            disabled={disabled || !aiEnabled || aiStatus === 'LOADING'}
            type="button"
            onClick={onRetry}
          >
            {aiStatus === 'LOADING'
              ? 'AI 분석 중...'
              : aiEnabled
                ? 'AI 다시 추천'
                : 'AI 추천 꺼짐'}
          </RetryButton>
          <ManageButton disabled={disabled} type="button" onClick={onManage}>
            + 카테고리 관리
          </ManageButton>
        </div>
      </EditorHeader>

      <textarea
        id="gacha-categories"
        aria-describedby="category-editor-help category-ai-state"
        aria-invalid={unknownCategoryNames.length > 0}
        disabled={disabled}
        maxLength={500}
        placeholder="예: 산리오, 캐릭터, 피규어"
        rows={3}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />

      <HelperText id="category-editor-help">
        쉼표로 구분해 수정해 주세요. 등록되지 않은 이름은 저장 전에 새 공용
        카테고리로 추가할지 확인합니다.
      </HelperText>
      <AiState id="category-ai-state" status={aiStatus}>
        {getAiStateText(aiStatus, aiModel, aiError, aiEnabled)}
      </AiState>

      {aiStatus === 'READY' &&
        (aiWorkNames.length > 0 || aiCharacterNames.length > 0) && (
          <AiEvidence>
            {aiWorkNames.length > 0 && (
              <span>작품: {aiWorkNames.join(', ')}</span>
            )}
            {aiCharacterNames.length > 0 && (
              <span>캐릭터: {aiCharacterNames.join(', ')}</span>
            )}
          </AiEvidence>
        )}

      {unknownCategoryNames.length > 0 && (
        <UnknownCategoryMessage role="alert">
          저장 시 새로 등록할 카테고리: {unknownCategoryNames.join(', ')}
        </UnknownCategoryMessage>
      )}

      <CategoryCatalog>
        <strong>빠른 카테고리 선택</strong>
        <div aria-label="등록된 카테고리 빠른 선택" role="group">
          {categories.map((category) => {
            const selected = selectedCategoryIds.includes(category.id);

            return (
              <button
                key={category.id}
                aria-pressed={selected}
                disabled={disabled}
                type="button"
                onClick={() => onToggle(category)}
              >
                {selected ? '✓ ' : ''}
                {category.name}
              </button>
            );
          })}
          <button
            className="add-category"
            disabled={disabled}
            type="button"
            onClick={onManage}
          >
            + 카테고리 추가
          </button>
        </div>
      </CategoryCatalog>
    </Editor>
  );
}
