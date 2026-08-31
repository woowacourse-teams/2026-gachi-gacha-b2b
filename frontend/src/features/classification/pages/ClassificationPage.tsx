import { useCallback, useEffect, useMemo, useState } from 'react';

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
import CategorySelector from '../components/CategorySelector';
import SkipDialog from '../components/SkipDialog';
import { toggleCategory } from '../model/category';
import type {
  Category,
  ClassificationDraft,
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
  const [draft, setDraft] = useState<ClassificationDraft | null>(null);
  const [remainingCount, setRemainingCount] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isSkipDialogOpen, setIsSkipDialogOpen] = useState(false);
  const [skipError, setSkipError] = useState('');
  const [zoom, setZoom] = useState(1);
  const [hasImageError, setHasImageError] = useState(false);
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
      setDraft(null);
      setZoom(1);
      setHasImageError(false);

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
        setDraft({
          name: loadedItem.name,
          categoryIds: loadedItem.categoryIds,
        });
        setRemainingCount(queue.items.length);
      } catch (cause) {
        if (isCurrent) setError(getErrorMessage(cause));
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    };

    void loadPage();

    return () => {
      isCurrent = false;
    };
  }, [idRange, itemId]);

  const isDirty = useMemo(
    () =>
      Boolean(
        item &&
        draft &&
        (item.name !== draft.name ||
          !hasSameCategories(item.categoryIds, draft.categoryIds)),
      ),
    [draft, item],
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
    item && draft?.name.trim() && draft.categoryIds.length > 0 && !isSubmitting,
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
      !draft ||
      !draft.name.trim() ||
      draft.categoryIds.length === 0
    ) {
      setError('이름을 입력하고 카테고리를 한 개 이상 선택해 주세요.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const result = await classifyGacha(item, draft, idRange);
      moveToNext(result.nextItemId);
    } catch (cause) {
      setError(getErrorMessage(cause));
    } finally {
      setIsSubmitting(false);
    }
  }, [draft, idRange, item, moveToNext]);

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
    setDraft((current) =>
      current
        ? { ...current, categoryIds: [...current.categoryIds, category.id] }
        : current,
    );
  };

  const handleDeleteCategory = async (categoryId: number) => {
    await deleteCategory(categoryId);
    setCategories((current) =>
      current.filter((category) => category.id !== categoryId),
    );
    setDraft((current) =>
      current
        ? {
            ...current,
            categoryIds: current.categoryIds.filter((id) => id !== categoryId),
          }
        : current,
    );
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

      const shortcutIndex = Number(event.key) - 1;
      const category = categories[shortcutIndex];

      if (category && shortcutIndex >= 0 && shortcutIndex < 9) {
        event.preventDefault();
        setDraft((current) =>
          current
            ? {
                ...current,
                categoryIds: toggleCategory(current.categoryIds, category.id),
              }
            : current,
        );
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
    categories,
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

  if (!item || !draft) {
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
          ID #{item.id} · {item.source} · {item.locationLabel} · 남은 항목{' '}
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
            {hasImageError ? (
              <ImageError role="alert">
                이미지를 불러오지 못했습니다. 이미지 URL 또는 접근 권한을 확인해
                주세요.
              </ImageError>
            ) : (
              <GachaImage
                alt={`${draft.name || '이름 미정 가챠'} 분류 이미지`}
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
                value={draft.name}
                onChange={(event) => {
                  setDraft({ ...draft, name: event.target.value });
                  setError('');
                }}
              />
              {draft.name && (
                <button
                  aria-label="이름 지우기"
                  type="button"
                  onClick={() => setDraft({ ...draft, name: '' })}
                >
                  ×
                </button>
              )}
            </NameInputWrap>

            <CategorySelector
              categories={categories}
              selectedCategoryIds={draft.categoryIds}
              onManage={() => setIsCategoryDialogOpen(true)}
              onToggle={(categoryId) => {
                setDraft({
                  ...draft,
                  categoryIds: toggleCategory(draft.categoryIds, categoryId),
                });
                setError('');
              }}
            />

            {error && <FormError role="alert">{error}</FormError>}
          </FormBody>

          <Actions>
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
          itemName={draft.name}
          onClose={() => setIsSkipDialogOpen(false)}
          onConfirm={(reason) => void handleSkip(reason)}
        />
      )}
    </Page>
  );
}
