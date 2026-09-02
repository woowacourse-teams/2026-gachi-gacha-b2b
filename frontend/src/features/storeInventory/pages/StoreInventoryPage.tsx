import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ApiError } from '@/apis/httpClient';
import { getCategories } from '@/features/classification/api/classificationApi';
import type {
  Category,
  ClassificationItem,
} from '@/features/classification/model/classification';
import { getErrorMessage } from '@/utils/getErrorMessage';

import {
  AssignedCard,
  AssignedList,
  BackButton,
  CatalogList,
  CatalogRow,
  CategoryList,
  CategoryToolbar,
  CountBadge,
  Description,
  Feedback,
  FilterPanel,
  GachaName,
  GachaThumbnail,
  Header,
  Heading,
  LoadMoreButton,
  Page,
  RelationButton,
  SearchForm,
  Section,
  SectionHeader,
  StatePanel,
  StoreMeta,
  Tags,
} from './StoreInventory.styles';
import {
  assignGachaToStore,
  getAssignableGachaPage,
  getAssignedGachas,
  getStoreSummary,
  removeGachaFromStore,
} from '../api/storeInventoryApi';
import type {
  AssignedGachaSummary,
  StoreSummary,
} from '../model/storeInventory';

interface StoreInventoryPageProps {
  storeId: number;
  onNavigate: (path: string) => void;
}

const appendUniqueItems = (
  current: ClassificationItem[],
  incoming: ClassificationItem[],
) => {
  const items = new Map(current.map((item) => [item.id, item]));
  incoming.forEach((item) => items.set(item.id, item));
  return [...items.values()];
};

export default function StoreInventoryPage({
  storeId,
  onNavigate,
}: StoreInventoryPageProps) {
  const [store, setStore] = useState<StoreSummary | null>(null);
  const [assignedGachas, setAssignedGachas] = useState<AssignedGachaSummary[]>(
    [],
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [catalogItems, setCatalogItems] = useState<ClassificationItem[]>([]);
  const [queryInput, setQueryInput] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [categoryQuery, setCategoryQuery] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [appliedCategoryIds, setAppliedCategoryIds] = useState<number[]>([]);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [searchVersion, setSearchVersion] = useState(0);
  const [pendingGachaIds, setPendingGachaIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCatalogLoading, setIsCatalogLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [feedbackIsError, setFeedbackIsError] = useState(false);
  const catalogRequestIdRef = useRef(0);
  const pendingGachaIdsRef = useRef(new Set<number>());

  useEffect(() => {
    let isCurrent = true;
    setIsLoading(true);
    setError('');

    Promise.all([
      getStoreSummary(storeId),
      getAssignedGachas(storeId),
      getCategories(),
    ])
      .then(([loadedStore, loadedAssignments, loadedCategories]) => {
        if (!isCurrent) return;
        setStore(loadedStore);
        setAssignedGachas(loadedAssignments);
        setCategories(loadedCategories);
      })
      .catch((cause) => {
        if (isCurrent) setError(getErrorMessage(cause));
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [storeId]);

  const loadCatalog = useCallback(
    async (cursor = 0, append = false) => {
      const requestId = catalogRequestIdRef.current + 1;
      catalogRequestIdRef.current = requestId;
      setIsCatalogLoading(true);
      setFeedback('');

      try {
        const queue = await getAssignableGachaPage({
          query: appliedQuery,
          categoryIds: appliedCategoryIds,
          cursor,
          limit: 50,
        });
        if (requestId !== catalogRequestIdRef.current) return;

        setCatalogItems((current) =>
          append ? appendUniqueItems(current, queue.items) : queue.items,
        );
        setNextCursor(queue.nextCursor);
      } catch (cause) {
        if (requestId !== catalogRequestIdRef.current) return;
        setFeedback(getErrorMessage(cause));
        setFeedbackIsError(true);
      } finally {
        if (requestId === catalogRequestIdRef.current) {
          setIsCatalogLoading(false);
        }
      }
    },
    [appliedCategoryIds, appliedQuery],
  );

  useEffect(() => {
    setCatalogItems([]);
    setNextCursor(null);
    void loadCatalog();
  }, [loadCatalog, searchVersion]);

  const assignedIds = useMemo(
    () => new Set(assignedGachas.map(({ id }) => id)),
    [assignedGachas],
  );
  const catalogById = useMemo(
    () => new Map(catalogItems.map((item) => [item.id, item])),
    [catalogItems],
  );
  const categoryById = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );
  const visibleCategories = useMemo(() => {
    const query = categoryQuery.trim().toLocaleLowerCase('ko-KR');
    if (!query) return categories;
    return categories.filter(({ name }) =>
      name.toLocaleLowerCase('ko-KR').includes(query),
    );
  }, [categories, categoryQuery]);

  const togglePending = (gachaId: number, pending: boolean) => {
    if (pending) {
      pendingGachaIdsRef.current.add(gachaId);
    } else {
      pendingGachaIdsRef.current.delete(gachaId);
    }
    setPendingGachaIds((current) =>
      pending
        ? [...new Set([...current, gachaId])]
        : current.filter((id) => id !== gachaId),
    );
  };

  const handleAssign = async (item: ClassificationItem) => {
    if (assignedIds.has(item.id) || pendingGachaIdsRef.current.has(item.id)) {
      return;
    }

    togglePending(item.id, true);
    setFeedback('');

    try {
      await assignGachaToStore(storeId, item.id);
      setAssignedGachas((current) => [
        ...current,
        { id: item.id, imageUrl: item.imageUrl },
      ]);
      setFeedback(`가챠 #${item.id}을(를) 매장에 등록했습니다.`);
      setFeedbackIsError(false);
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 409) {
        const refreshed = await getAssignedGachas(storeId).catch(() => null);
        if (refreshed) setAssignedGachas(refreshed);
      }
      setFeedback(getErrorMessage(cause));
      setFeedbackIsError(true);
    } finally {
      togglePending(item.id, false);
    }
  };

  const handleRemove = async (gachaId: number) => {
    if (pendingGachaIdsRef.current.has(gachaId)) return;
    if (!window.confirm(`가챠 #${gachaId}을(를) 이 매장에서 제거할까요?`)) {
      return;
    }

    togglePending(gachaId, true);
    setFeedback('');

    try {
      await removeGachaFromStore(storeId, gachaId);
      setAssignedGachas((current) =>
        current.filter(({ id }) => id !== gachaId),
      );
      setFeedback(`가챠 #${gachaId}을(를) 매장 목록에서 제거했습니다.`);
      setFeedbackIsError(false);
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 404) {
        const refreshed = await getAssignedGachas(storeId).catch(() => null);
        if (refreshed) setAssignedGachas(refreshed);
      }
      setFeedback(getErrorMessage(cause));
      setFeedbackIsError(true);
    } finally {
      togglePending(gachaId, false);
    }
  };

  const applyFilters = () => {
    setAppliedQuery(queryInput.trim());
    setAppliedCategoryIds(selectedCategoryIds);
    setSearchVersion((current) => current + 1);
  };

  if (isLoading) {
    return <StatePanel>매장과 보유 가챠 정보를 준비하고 있습니다.</StatePanel>;
  }

  if (!store) {
    return (
      <StatePanel role="alert">
        <div>
          <strong>매장 정보를 열 수 없습니다.</strong>
          {error || '매장을 찾을 수 없습니다.'}
        </div>
      </StatePanel>
    );
  }

  return (
    <Page>
      <BackButton type="button" onClick={() => onNavigate('/stores')}>
        ← 매장 선택으로
      </BackButton>
      <Header>
        <div>
          <Heading>{store.name}</Heading>
          <StoreMeta>
            <span>{store.address}</span>
            <span>가챠 기계 {store.machineCount}대</span>
          </StoreMeta>
          <Description>
            분류 완료된 가챠만 검색됩니다. 등록 결과는 소비자용 매장 상세의 가챠
            목록 API에 바로 반영됩니다.
          </Description>
        </div>
        <CountBadge>
          <strong>{assignedGachas.length}</strong>
          <span>현재 보유 가챠</span>
        </CountBadge>
      </Header>

      <Section aria-labelledby="assigned-gacha-title">
        <SectionHeader>
          <div>
            <h2 id="assigned-gacha-title">현재 매장에 등록된 가챠</h2>
            <p>백엔드 요약 응답에 이름이 없는 항목은 DB ID로 표시합니다.</p>
          </div>
          <strong>{assignedGachas.length}개</strong>
        </SectionHeader>

        {assignedGachas.length === 0 ? (
          <StatePanel>
            아직 등록된 가챠가 없습니다. 아래 목록에서 추가해 주세요.
          </StatePanel>
        ) : (
          <AssignedList>
            {assignedGachas.map((gacha) => {
              const detail = catalogById.get(gacha.id);
              return (
                <AssignedCard key={gacha.id}>
                  {gacha.imageUrl ? (
                    <img alt="" src={gacha.imageUrl} />
                  ) : (
                    <span aria-hidden>?</span>
                  )}
                  <span>
                    <strong>{detail?.name || `가챠 #${gacha.id}`}</strong>
                    <small>DB ID #{gacha.id}</small>
                  </span>
                  <button
                    disabled={pendingGachaIds.includes(gacha.id)}
                    type="button"
                    onClick={() => void handleRemove(gacha.id)}
                  >
                    제거
                  </button>
                </AssignedCard>
              );
            })}
          </AssignedList>
        )}
      </Section>

      <Section aria-labelledby="catalog-title">
        <SectionHeader>
          <div>
            <h2 id="catalog-title">분류 완료 가챠 찾기</h2>
            <p>
              이름 또는 카테고리명에 포함된 단어로 검색하고, 카테고리 버튼으로
              결과를 좁힐 수 있습니다.
            </p>
          </div>
          <strong>{catalogItems.length}개 표시</strong>
        </SectionHeader>

        <FilterPanel>
          <SearchForm
            onSubmit={(event) => {
              event.preventDefault();
              applyFilters();
            }}
          >
            <label>
              <input
                aria-label="가챠 이름 또는 카테고리 검색"
                placeholder="가챠 이름 또는 카테고리명 검색"
                value={queryInput}
                onChange={(event) => setQueryInput(event.target.value)}
              />
            </label>
            <button type="submit">검색 적용</button>
          </SearchForm>

          <CategoryToolbar>
            <strong>카테고리</strong>
            <input
              aria-label="카테고리 이름 검색"
              placeholder="카테고리 빠르게 찾기"
              value={categoryQuery}
              onChange={(event) => setCategoryQuery(event.target.value)}
            />
          </CategoryToolbar>
          <CategoryList aria-label="가챠 카테고리 필터">
            {visibleCategories.map((category) => {
              const selected = selectedCategoryIds.includes(category.id);
              return (
                <button
                  key={category.id}
                  aria-pressed={selected}
                  type="button"
                  onClick={() =>
                    setSelectedCategoryIds((current) =>
                      selected
                        ? current.filter((id) => id !== category.id)
                        : [...current, category.id],
                    )
                  }
                >
                  {selected ? '✓ ' : ''}
                  {category.name}
                </button>
              );
            })}
          </CategoryList>
          {selectedCategoryIds.length > 0 && (
            <small>
              선택:{' '}
              {selectedCategoryIds.map((id) => categoryById.get(id)).join(', ')}
            </small>
          )}
        </FilterPanel>

        {feedback && (
          <Feedback
            error={feedbackIsError}
            role={feedbackIsError ? 'alert' : 'status'}
          >
            {feedback}
          </Feedback>
        )}

        {isCatalogLoading && catalogItems.length === 0 ? (
          <StatePanel>분류 완료 가챠를 불러오고 있습니다.</StatePanel>
        ) : catalogItems.length === 0 ? (
          <StatePanel>
            조건에 맞는 분류 완료 가챠가 없습니다. 검색어나 카테고리를 바꿔
            주세요.
          </StatePanel>
        ) : (
          <CatalogList>
            {catalogItems.map((item) => {
              const assigned = assignedIds.has(item.id);
              const pending = pendingGachaIds.includes(item.id);
              return (
                <CatalogRow key={item.id}>
                  <strong>#{item.id}</strong>
                  <GachaThumbnail>
                    {item.imageUrl ? (
                      <img alt="" src={item.imageUrl} />
                    ) : (
                      <span aria-hidden>?</span>
                    )}
                  </GachaThumbnail>
                  <GachaName>
                    <strong>{item.name}</strong>
                    <small>{item.description || item.source}</small>
                  </GachaName>
                  <Tags>
                    {item.categoryIds.map((categoryId) => (
                      <span key={categoryId}>
                        {categoryById.get(categoryId) ?? `#${categoryId}`}
                      </span>
                    ))}
                  </Tags>
                  <RelationButton
                    assigned={assigned}
                    disabled={pending}
                    type="button"
                    onClick={() =>
                      assigned
                        ? void handleRemove(item.id)
                        : void handleAssign(item)
                    }
                  >
                    {pending
                      ? '처리 중...'
                      : assigned
                        ? '매장에서 제거'
                        : '매장에 추가'}
                  </RelationButton>
                </CatalogRow>
              );
            })}
          </CatalogList>
        )}

        {nextCursor !== null && (
          <LoadMoreButton
            disabled={isCatalogLoading}
            type="button"
            onClick={() => void loadCatalog(nextCursor, true)}
          >
            {isCatalogLoading ? '불러오는 중...' : '가챠 더 불러오기'}
          </LoadMoreButton>
        )}
      </Section>
    </Page>
  );
}
