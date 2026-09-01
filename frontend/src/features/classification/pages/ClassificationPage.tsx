import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getErrorMessage } from '@/utils/getErrorMessage';

import {
  ActionButton,
  Actions,
  BackButton,
  FieldHeader,
  FormBody,
  FormError,
  FormPanel,
  GachaImage,
  Header,
  HeaderTitle,
  ImagePanel,
  ImageError,
  ImageStage,
  ItemCount,
  NameInputWrap,
  Page,
  PanelHeader,
  StatePanel,
  Workspace,
  ZoomControls,
} from './ClassificationPage.styles';
import { getAiCategorySuggestion } from '../api/aiSuggestionApi';
import { clearCachedAiSuggestion } from '../api/aiSuggestionCache';
import {
  classifyGacha,
  createCategory,
  deleteCategory,
  getCategories,
  getClassificationItem,
  getClassificationQueue,
  skipGacha,
} from '../api/classificationApi';
import CategoryDialog from '../components/CategoryDialog';
import CategoryTextEditor from '../components/CategoryTextEditor';
import SkipDialog from '../components/SkipDialog';
import type { AiSuggestionStatus } from '../model/aiSuggestion';
import {
  appendCategoryText,
  formatCategoryText,
  formatCategoryTextByIds,
  removeCategoryText,
  resolveCategoryText,
} from '../model/categoryText';
import type {
  Category,
  ClassificationIdRange,
  ClassificationItem,
} from '../model/classification';

interface ClassificationPageProps {
  itemId: number;
  minId: number | undefined;
  maxId: number | undefined;
  onNavigate: (path: string) => void;
}

const hasSameCategories = (left: number[], right: number[]) =>
  left.length === right.length && left.every((id) => right.includes(id));

const isTextInput = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  Boolean(target.closest('input, textarea, select, [contenteditable="true"]'));

const withIdRange = (
  pathname: string,
  { minId, maxId }: ClassificationIdRange,
) => {
  const searchParams = new URLSearchParams();

  if (minId !== undefined) searchParams.set('minId', String(minId));
  if (maxId !== undefined) searchParams.set('maxId', String(maxId));

  return searchParams.size
    ? `${pathname}?${searchParams.toString()}`
    : pathname;
};

export default function ClassificationPage({
  itemId,
  minId,
  maxId,
  onNavigate,
}: ClassificationPageProps) {
  const [item, setItem] = useState<ClassificationItem | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [categoryText, setCategoryText] = useState('');
  const [aiStatus, setAiStatus] = useState<AiSuggestionStatus>('IDLE');
  const [aiModel, setAiModel] = useState('');
  const [aiError, setAiError] = useState('');
  const [remainingCount, setRemainingCount] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isSkipDialogOpen, setIsSkipDialogOpen] = useState(false);
  const [skipError, setSkipError] = useState('');
  const [zoom, setZoom] = useState(1);
  const [hasImageError, setHasImageError] = useState(false);
  const hasEditedCategoryTextRef = useRef(false);
  const aiRequestIdRef = useRef(0);
  const idRange = useMemo<ClassificationIdRange>(
    () => ({
      ...(minId === undefined ? {} : { minId }),
      ...(maxId === undefined ? {} : { maxId }),
    }),
    [maxId, minId],
  );

  useEffect(() => {
    let isCurrent = true;

    const loadPage = async () => {
      setIsLoading(true);
      setError('');
      setItem(null);
      setName('');
      setCategoryText('');
      setAiStatus('IDLE');
      setAiModel('');
      setAiError('');
      setZoom(1);
      setHasImageError(false);
      hasEditedCategoryTextRef.current = false;

      try {
        const [loadedItem, loadedCategories] = await Promise.all([
          getClassificationItem(itemId),
          getCategories(),
        ]);
        const queue = await getClassificationQueue({
          status: 'UNCLASSIFIED',
          query: '',
          ...idRange,
        });

        if (!isCurrent) return;

        setItem(loadedItem);
        setCategories(loadedCategories);
        setName(loadedItem.name);
        setCategoryText(
          formatCategoryTextByIds(loadedItem.categoryIds, loadedCategories),
        );
        setRemainingCount(queue.filteredCount);
      } catch (cause) {
        if (isCurrent) setError(getErrorMessage(cause));
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    };

    void loadPage();

    return () => {
      isCurrent = false;
      aiRequestIdRef.current += 1;
    };
  }, [idRange, itemId]);

  const categoryResolution = useMemo(
    () => resolveCategoryText(categoryText, categories),
    [categories, categoryText],
  );

  const loadAiSuggestion = useCallback(
    async (force = false) => {
      if (!item || categories.length === 0) return;

      if (!item.imageUrl) {
        setAiStatus('FAILED');
        setAiError('분석할 썸네일 이미지가 없습니다.');
        return;
      }

      if (force) clearCachedAiSuggestion(item.id, item.version);
      const requestId = aiRequestIdRef.current + 1;
      aiRequestIdRef.current = requestId;

      setAiStatus('LOADING');
      setAiError('');

      try {
        const suggestion = await getAiCategorySuggestion(
          item,
          categories,
          force,
        );

        if (requestId !== aiRequestIdRef.current) return;

        if (!hasEditedCategoryTextRef.current) {
          setCategoryText(formatCategoryText(suggestion.categoryNames));
          hasEditedCategoryTextRef.current = false;
        }

        setAiModel(suggestion.model);
        setAiStatus('READY');
      } catch (cause) {
        if (requestId !== aiRequestIdRef.current) return;
        setAiError(getErrorMessage(cause));
        setAiStatus('FAILED');
      }
    },
    [categories, item],
  );

  useEffect(() => {
    void loadAiSuggestion();
  }, [loadAiSuggestion]);

  const isDirty = useMemo(
    () =>
      Boolean(
        item &&
        (item.name !== name ||
          categoryResolution.unknownCategoryNames.length > 0 ||
          !hasSameCategories(item.categoryIds, categoryResolution.categoryIds)),
      ),
    [categoryResolution, item, name],
  );

  useEffect(() => {
    if (!isDirty) return;

    const preventUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };

    window.addEventListener('beforeunload', preventUnload);
    return () => window.removeEventListener('beforeunload', preventUnload);
  }, [isDirty]);

  const canSave = Boolean(
    item &&
    name.trim() &&
    categoryResolution.categoryIds.length > 0 &&
    categoryResolution.unknownCategoryNames.length === 0 &&
    !isSubmitting,
  );

  const moveToNext = useCallback(
    (nextItemId: number | null) => {
      if (nextItemId === null) {
        onNavigate(withIdRange('/', idRange));
        return;
      }

      onNavigate(withIdRange(`/classify/${nextItemId}`, idRange));
    },
    [idRange, onNavigate],
  );

  const handleSave = useCallback(async () => {
    if (
      !item ||
      !name.trim() ||
      categoryResolution.categoryIds.length === 0 ||
      categoryResolution.unknownCategoryNames.length > 0
    ) {
      setError(
        categoryResolution.unknownCategoryNames.length > 0
          ? '등록되지 않은 카테고리는 관리 메뉴에서 먼저 추가해 주세요.'
          : '이름과 카테고리를 한 개 이상 입력해 주세요.',
      );
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const result = await classifyGacha(
        item,
        { name, categoryIds: categoryResolution.categoryIds },
        idRange,
      );
      moveToNext(result.nextItemId);
    } catch (cause) {
      setError(getErrorMessage(cause));
    } finally {
      setIsSubmitting(false);
    }
  }, [categoryResolution, idRange, item, moveToNext, name]);

  const handleSkip = async (reason: string) => {
    if (!item) return;

    setIsSubmitting(true);
    setSkipError('');

    try {
      const result = await skipGacha(item, reason, idRange);
      setIsSkipDialogOpen(false);
      moveToNext(result.nextItemId);
    } catch (cause) {
      setSkipError(getErrorMessage(cause));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateCategory = async (name: string) => {
    const category = await createCategory(name);

    setCategories((current) => [...current, category]);
    setCategoryText((current) => appendCategoryText(current, category.name));
    hasEditedCategoryTextRef.current = true;
  };

  const handleDeleteCategory = async (categoryId: number) => {
    await deleteCategory(categoryId);
    setCategories((current) =>
      current.filter((category) => category.id !== categoryId),
    );
    const deletedCategory = categories.find(({ id }) => id === categoryId);
    if (deletedCategory) {
      setCategoryText((current) =>
        removeCategoryText(current, deletedCategory.name),
      );
      hasEditedCategoryTextRef.current = true;
    }
  };

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (
        isTextInput(event.target) ||
        isCategoryDialogOpen ||
        isSkipDialogOpen ||
        isSubmitting
      ) {
        return;
      }

      if (event.key === 'Enter' && canSave) {
        event.preventDefault();
        void handleSave();
      }
    };

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [
    canSave,
    handleSave,
    isCategoryDialogOpen,
    isSkipDialogOpen,
    isSubmitting,
  ]);

  const handleBack = () => {
    if (!item) {
      onNavigate('/');
      return;
    }

    if (
      isDirty &&
      !window.confirm('저장하지 않은 변경사항이 있습니다. 나갈까요?')
    ) {
      return;
    }

    onNavigate(withIdRange('/', idRange));
  };

  if (isLoading) {
    return (
      <StatePanel aria-live="polite">분류 작업을 준비하고 있습니다.</StatePanel>
    );
  }

  if (!item) {
    return (
      <StatePanel>
        <div>
          <h1>데이터를 열 수 없습니다.</h1>
          <p>{error || '분류 데이터를 찾을 수 없습니다.'}</p>
          <button type="button" onClick={() => onNavigate('/')}>
            목록으로 돌아가기
          </button>
        </div>
      </StatePanel>
    );
  }

  return (
    <Page>
      <Header>
        <BackButton type="button" onClick={handleBack}>
          ← 목록으로
        </BackButton>
        <HeaderTitle>데이터 분류 작업</HeaderTitle>
        <ItemCount>
          ID #{item.id} · {item.source} · {item.locationLabel} ·{' '}
          {__USE_MOCK_API__ ? '남은 항목' : '전체 데이터'}{' '}
          {remainingCount ?? '-'}개
        </ItemCount>
      </Header>

      <Workspace>
        <ImagePanel aria-labelledby="image-panel-title">
          <PanelHeader>
            <h2 id="image-panel-title">이미지 확인</h2>
            <ZoomControls aria-label="이미지 확대 및 축소">
              <button
                aria-label="이미지 축소"
                disabled={zoom <= 0.8}
                type="button"
                onClick={() =>
                  setZoom((current) => Math.max(0.8, current - 0.2))
                }
              >
                −
              </button>
              <button
                aria-label="이미지 확대"
                disabled={zoom >= 1.8}
                type="button"
                onClick={() =>
                  setZoom((current) => Math.min(1.8, current + 0.2))
                }
              >
                +
              </button>
            </ZoomControls>
          </PanelHeader>
          <ImageStage>
            {hasImageError || !item.imageUrl ? (
              <ImageError role="alert">
                {item.imageUrl
                  ? '이미지를 불러오지 못했습니다. 이미지 URL 또는 접근 권한을 확인해 주세요.'
                  : '등록된 썸네일 이미지가 없습니다.'}
              </ImageError>
            ) : (
              <GachaImage
                alt={`${name || '이름 미정 가챠'} 분류 이미지`}
                src={item.imageUrl}
                zoom={zoom}
                onError={() => setHasImageError(true)}
              />
            )}
          </ImageStage>
        </ImagePanel>

        <FormPanel aria-labelledby="classification-form-title">
          <FormBody>
            <FieldHeader>
              <label id="classification-form-title" htmlFor="gacha-name">
                이름 수정
              </label>
              <span title={item.originalFileName}>
                원본: {item.originalFileName}
              </span>
            </FieldHeader>
            <NameInputWrap>
              <input
                id="gacha-name"
                maxLength={100}
                placeholder="가챠 이름을 입력해 주세요"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setError('');
                }}
              />
              {name && (
                <button
                  aria-label="이름 지우기"
                  type="button"
                  onClick={() => setName('')}
                >
                  ×
                </button>
              )}
            </NameInputWrap>

            <CategoryTextEditor
              aiError={aiError}
              aiModel={aiModel}
              aiStatus={aiStatus}
              categories={categories}
              disabled={isSubmitting}
              selectedCategoryIds={categoryResolution.categoryIds}
              unknownCategoryNames={categoryResolution.unknownCategoryNames}
              value={categoryText}
              onChange={(value) => {
                hasEditedCategoryTextRef.current = true;
                setCategoryText(value);
                setError('');
              }}
              onManage={() => setIsCategoryDialogOpen(true)}
              onRetry={() => {
                hasEditedCategoryTextRef.current = false;
                setError('');
                void loadAiSuggestion(true);
              }}
              onToggle={(category) => {
                const isSelected = categoryResolution.categoryIds.includes(
                  category.id,
                );

                hasEditedCategoryTextRef.current = true;
                setCategoryText((current) =>
                  isSelected
                    ? removeCategoryText(current, category.name)
                    : appendCategoryText(current, category.name),
                );
                setError('');
              }}
            />

            {error && <FormError role="alert">{error}</FormError>}
          </FormBody>

          <Actions>
            {__USE_MOCK_API__ && (
              <ActionButton
                disabled={isSubmitting}
                type="button"
                onClick={() => {
                  setSkipError('');
                  setIsSkipDialogOpen(true);
                }}
              >
                건너뛰기
              </ActionButton>
            )}
            <ActionButton
              disabled={!canSave}
              kind="primary"
              type="button"
              onClick={() => void handleSave()}
            >
              {isSubmitting ? '저장 중...' : '저장 후 다음 →'}
            </ActionButton>
          </Actions>
        </FormPanel>
      </Workspace>

      {isCategoryDialogOpen && (
        <CategoryDialog
          categories={categories}
          onClose={() => setIsCategoryDialogOpen(false)}
          onCreate={handleCreateCategory}
          onDelete={handleDeleteCategory}
        />
      )}
      {isSkipDialogOpen && (
        <SkipDialog
          error={skipError}
          isSubmitting={isSubmitting}
          itemName={name}
          onClose={() => setIsSkipDialogOpen(false)}
          onConfirm={(reason) => void handleSkip(reason)}
        />
      )}
    </Page>
  );
}
