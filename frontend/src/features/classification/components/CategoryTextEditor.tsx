import { useMemo, useState } from 'react';

import {
  CatalogHeader,
  CatalogHint,
  CatalogSearch,
  CategoryCatalog,
  Editor,
  EditorHeader,
  HelperText,
  ManageButton,
  UnknownCategoryMessage,
} from './CategoryTextEditor.styles';
import type { Category } from '../model/classification';

interface CategoryTextEditorProps {
  value: string;
  categories: Category[];
  selectedCategoryIds: number[];
  unknownCategoryNames: string[];
  disabled?: boolean;
  onChange: (value: string) => void;
  onManage: () => void;
  onToggle: (category: Category) => void;
}

export default function CategoryTextEditor({
  value,
  categories,
  selectedCategoryIds,
  unknownCategoryNames,
  disabled = false,
  onChange,
  onManage,
  onToggle,
}: CategoryTextEditorProps) {
  const [categoryQuery, setCategoryQuery] = useState('');
  const selectedCategoryIdSet = useMemo(
    () => new Set(selectedCategoryIds),
    [selectedCategoryIds],
  );
  const visibleCategories = useMemo(() => {
    const normalizedQuery = categoryQuery.trim().toLocaleLowerCase();
    const selected = categories.filter((category) =>
      selectedCategoryIdSet.has(category.id),
    );
    const candidates = normalizedQuery
      ? categories.filter((category) =>
          category.name.toLocaleLowerCase().includes(normalizedQuery),
        )
      : categories;
    const visible = new Map(
      selected.map((category) => [category.id, category]),
    );

    for (const category of candidates) {
      if (visible.size >= 40) break;
      visible.set(category.id, category);
    }

    return [...visible.values()];
  }, [categories, categoryQuery, selectedCategoryIdSet]);

  return (
    <Editor>
      <EditorHeader>
        <label htmlFor="gacha-categories">카테고리 수정</label>
        <ManageButton disabled={disabled} type="button" onClick={onManage}>
          + 카테고리 관리
        </ManageButton>
      </EditorHeader>

      <textarea
        id="gacha-categories"
        aria-describedby="category-editor-help"
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
      {unknownCategoryNames.length > 0 && (
        <UnknownCategoryMessage role="alert">
          저장 시 새로 등록할 카테고리: {unknownCategoryNames.join(', ')}
        </UnknownCategoryMessage>
      )}

      <CategoryCatalog>
        <CatalogHeader>
          <strong>빠른 카테고리 선택</strong>
          <CatalogSearch>
            <span aria-hidden>⌕</span>
            <input
              aria-label="빠른 선택 카테고리 검색"
              disabled={disabled}
              placeholder="카테고리명 검색"
              type="search"
              value={categoryQuery}
              onChange={(event) => setCategoryQuery(event.target.value)}
            />
          </CatalogSearch>
        </CatalogHeader>
        <div aria-label="등록된 카테고리 빠른 선택" role="group">
          {visibleCategories.map((category) => {
            const selected = selectedCategoryIdSet.has(category.id);

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
        <CatalogHint>
          전체 {categories.length.toLocaleString()}개 중 최대 40개를 표시합니다.
        </CatalogHint>
      </CategoryCatalog>
    </Editor>
  );
}
