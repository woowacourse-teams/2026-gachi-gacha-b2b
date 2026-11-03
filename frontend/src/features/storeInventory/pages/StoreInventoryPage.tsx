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
  AssignedToolbar,
  BackButton,
  CatalogList,
  CatalogRow,
  CategoryList,
  CategoryToolbar,
  CountBadge,
  Description,
  ExportButton,
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
  SectionActions,
  SectionHeader,
  StatePanel,
  StoreMeta,
  Tags,
} from './StoreInventory.styles';
import { getCatalogItemsByIds } from '../api/catalogSearchApi';
import {
  assignGachaToStore,
  getAssignableGachaPage,
  getAssignedGachas,
  getStoreSummary,
  removeGachaFromStore,
} from '../api/storeInventoryApi';
import GachaImagePreviewDialog from '../components/GachaImagePreviewDialog';
import type {
  AssignedGachaSummary,
  StoreSummary,
} from '../model/storeInventory';
import { createStoreCatalogCsv } from '../model/storeInventoryCsv';

interface StoreInventoryPageProps {
  storeId: number;
  onNavigate: (path: string) => void;
}

const SEARCH_DEBOUNCE_MS = 300;
const nameCollator = new Intl.Collator('ko-KR', { numeric: true });
const normalizeInventoryText = (value: string) =>
  value.normalize('NFKC').toLocaleLowerCase('ko-KR').replace(/\s+/gu, '');

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
  const [assignedDetails, setAssignedDetails] = useState<ClassificationItem[]>(
    [],
  );
  const [isAssignedDetailsLoading, setIsAssignedDetailsLoading] =
    useState(false);
  const [assignedDetailsError, setAssignedDetailsError] = useState('');
  const [assignedDetailsRefresh, setAssignedDetailsRefresh] = useState(0);
  const [assignedQuery, setAssignedQuery] = useState('');
  const [assignedCategoryFilter, setAssignedCategoryFilter] = useState('');
  const [assignedSort, setAssignedSort] = useState<'name' | 'id'>('name');
  const [categories, setCategories] = useState<Category[]>([]);
  const [catalogItems, setCatalogItems] = useState<ClassificationItem[]>([]);
  const [queryInput, setQueryInput] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [isQueryDirty, setIsQueryDirty] = useState(false);
  const [categoryQuery, setCategoryQuery] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [totalCatalogCount, setTotalCatalogCount] = useState(0);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [searchVersion, setSearchVersion] = useState(0);
  const [pendingGachaIds, setPendingGachaIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCatalogLoading, setIsCatalogLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [feedbackIsError, setFeedbackIsError] = useState(false);
  const [previewItem, setPreviewItem] = useState<ClassificationItem | null>(
    null,
  );
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

  useEffect(() => {
    let isCurrent = true;
    const ids = assignedGachas.map(({ id }) => id);

    if (ids.length === 0) {
      setAssignedDetails([]);
      setIsAssignedDetailsLoading(false);
      setAssignedDetailsError('');
      return;
    }

    setIsAssignedDetailsLoading(true);
    setAssignedDetailsError('');

    void getCatalogItemsByIds(ids)
      .then((items) => {
        if (isCurrent) setAssignedDetails(items);
      })
      .catch((cause) => {
        if (!isCurrent) return;
        setAssignedDetails([]);
        setAssignedDetailsError(getErrorMessage(cause));
      })
      .finally(() => {
        if (isCurrent) setIsAssignedDetailsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [assignedGachas, assignedDetailsRefresh]);

  const invalidateCatalog = useCallback(() => {
    catalogRequestIdRef.current += 1;
    setCatalogItems([]);
    setTotalCatalogCount(0);
    setNextCursor(null);
    setIsCatalogLoading(true);
    setFeedback('');
  }, []);

  const loadCatalog = useCallback(
    async (cursor = 0, append = false) => {
      const requestId = catalogRequestIdRef.current + 1;
      catalogRequestIdRef.current = requestId;
      setIsCatalogLoading(true);
      setFeedback('');

      try {
        const queue = await getAssignableGachaPage({
          query: appliedQuery,
          categoryIds: selectedCategoryIds,
          cursor,
          limit: 50,
        });
        if (requestId !== catalogRequestIdRef.current) return;

        setCatalogItems((current) =>
          append ? appendUniqueItems(current, queue.items) : queue.items,
        );
        setTotalCatalogCount(queue.filteredCount);
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
    [appliedQuery, selectedCategoryIds],
  );

  useEffect(() => {
    if (isQueryDirty) return;

    setCatalogItems([]);
    setTotalCatalogCount(0);
    setNextCursor(null);
    void loadCatalog();
  }, [isQueryDirty, loadCatalog, searchVersion]);

  useEffect(() => {
    if (!isQueryDirty) return;

    const timeoutId = window.setTimeout(() => {
      setAppliedQuery(queryInput.trim());
      setIsQueryDirty(false);
      setSearchVersion((current) => current + 1);
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [isQueryDirty, queryInput]);

  const assignedIds = useMemo(
    () => new Set(assignedGachas.map(({ id }) => id)),
    [assignedGachas],
  );
  const catalogById = useMemo(
    () => new Map(catalogItems.map((item) => [item.id, item])),
    [catalogItems],
  );
  const assignedDetailById = useMemo(
    () => new Map(assignedDetails.map((item) => [item.id, item])),
    [assignedDetails],
  );
  const missingAssignedDetailsCount = assignedGachas.filter(
    ({ id }) => !assignedDetailById.has(id),
  ).length;
  const categoryById = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );
  const visibleAssignedGachas = useMemo(() => {
    const query = normalizeInventoryText(assignedQuery);
    const categoryId = Number(assignedCategoryFilter);

    return assignedGachas
      .filter((gacha) => {
        const detail = assignedDetailById.get(gacha.id);
        const categoryNames = (detail?.categoryIds ?? []).map(
          (id) => categoryById.get(id) ?? '',
        );
        return (
          (!assignedCategoryFilter ||
            detail?.categoryIds.includes(categoryId)) &&
          (!query ||
            String(gacha.id).includes(query) ||
            normalizeInventoryText(detail?.name ?? '').includes(query) ||
            categoryNames.some((name) =>
              normalizeInventoryText(name).includes(query),
            ))
        );
      })
      .sort((left, right) => {
        if (assignedSort === 'id') return left.id - right.id;
        const leftName = assignedDetailById.get(left.id)?.name ?? '';
        const rightName = assignedDetailById.get(right.id)?.name ?? '';
        return nameCollator.compare(leftName, rightName) || left.id - right.id;
      });
  }, [
    assignedGachas,
    assignedDetailById,
    assignedQuery,
    assignedCategoryFilter,
    assignedSort,
    categoryById,
  ]);
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

  const applySearchImmediately = () => {
    invalidateCatalog();
    setAppliedQuery(queryInput.trim());
    setIsQueryDirty(false);
    setSearchVersion((current) => current + 1);
  };

  const resetFilters = () => {
    invalidateCatalog();
    setQueryInput('');
    setAppliedQuery('');
    setIsQueryDirty(false);
    setCategoryQuery('');
    setSelectedCategoryIds([]);
    setSearchVersion((current) => current + 1);
  };

  const hasFilters =
    Boolean(queryInput || appliedQuery || categoryQuery) ||
    selectedCategoryIds.length > 0;

  const exportAssignedCatalog = () => {
    if (!store) return;

    const csv = createStoreCatalogCsv(
      store.id,
      store.name,
      assignedGachas.map((gacha) => {
        const detail =
          assignedDetailById.get(gacha.id) ?? catalogById.get(gacha.id);
        return {
          gachaId: gacha.id,
          name: detail?.name || `가챠 #${gacha.id}`,
          categories: (detail?.categoryIds ?? []).map(
            (id) => categoryById.get(id) ?? `#${id}`,
          ),
          source: detail?.source ?? '',
          catalogCreatedAt: detail?.createdAt.slice(0, 10) ?? '',
          catalogStatus: assignedDetailById.has(gacha.id) ? '확인됨' : '미확인',
        };
      }),
    );
    const url = URL.createObjectURL(
      new Blob([csv], { type: 'text/csv;charset=utf-8' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = `gachi-gacha-store-${store.id}-catalog.csv`;
    link.click();
    URL.revokeObjectURL(url);
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
          <span>등록 가챠 종류</span>
        </CountBadge>
      </Header>

      <Section aria-labelledby="assigned-gacha-title">
        <SectionHeader>
          <div>
            <h2 id="assigned-gacha-title">매장에 등록된 가챠</h2>
            <p>등록된 종류를 표시합니다. 수량 정보는 아직 제공되지 않습니다.</p>
          </div>
          <SectionActions>
            <strong>
              {visibleAssignedGachas.length}/{assignedGachas.length}종류
            </strong>
            <ExportButton
              disabled={
                assignedGachas.length === 0 ||
                isAssignedDetailsLoading ||
                Boolean(assignedDetailsError)
              }
              type="button"
              onClick={exportAssignedCatalog}
            >
              전체 종류 CSV
            </ExportButton>
          </SectionActions>
        </SectionHeader>

        {assignedDetailsError ? (
          <Feedback error role="alert">
            등록 가챠의 상세정보를 불러오지 못했습니다: {assignedDetailsError}{' '}
            <button
              type="button"
              onClick={() => setAssignedDetailsRefresh((value) => value + 1)}
            >
              다시 시도
            </button>
          </Feedback>
        ) : !isAssignedDetailsLoading && missingAssignedDetailsCount > 0 ? (
          <Feedback error role="status">
            카탈로그에서 찾을 수 없는 등록 가챠가 {missingAssignedDetailsCount}
            종류 있습니다. CSV에는 미확인으로 표시합니다.
          </Feedback>
        ) : null}

        {assignedGachas.length > 0 && (
          <AssignedToolbar>
            <label>
              등록 가챠 검색
              <input
                placeholder="이름, 카테고리 또는 ID"
                value={assignedQuery}
                onChange={(event) => setAssignedQuery(event.target.value)}
              />
            </label>
            <label>
              카테고리
              <select
                value={assignedCategoryFilter}
                onChange={(event) =>
                  setAssignedCategoryFilter(event.target.value)
                }
              >
                <option value="">전체 카테고리</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              정렬
              <select
                value={assignedSort}
                onChange={(event) =>
                  setAssignedSort(event.target.value as 'name' | 'id')
                }
              >
                <option value="name">이름순</option>
                <option value="id">ID순</option>
              </select>
            </label>
          </AssignedToolbar>
        )}

        {assignedGachas.length === 0 ? (
          <StatePanel>
            아직 등록된 가챠가 없습니다. 아래 목록에서 추가해 주세요.
          </StatePanel>
        ) : isAssignedDetailsLoading && visibleAssignedGachas.length === 0 ? (
          <StatePanel>
            등록 가챠의 이름과 카테고리를 불러오고 있습니다.
          </StatePanel>
        ) : visibleAssignedGachas.length === 0 ? (
          <StatePanel>
            조건에 맞는 등록 가챠가 없습니다. 검색어 또는 카테고리를 바꿔
            주세요.
          </StatePanel>
        ) : (
          <AssignedList>
            {visibleAssignedGachas.map((gacha) => {
              const detail =
                assignedDetailById.get(gacha.id) ?? catalogById.get(gacha.id);
              return (
                <AssignedCard key={gacha.id}>
                  {detail?.imageUrl || gacha.imageUrl ? (
                    <img alt="" src={detail?.imageUrl || gacha.imageUrl} />
                  ) : (
                    <span aria-hidden className="assigned-placeholder">
                      ?
                    </span>
                  )}
                  <span className="assigned-detail">
                    <strong>{detail?.name || `가챠 #${gacha.id}`}</strong>
                    <small>DB ID #{gacha.id}</small>
                    {detail && (
                      <>
                        <small>
                          {detail.categoryIds
                            .map((id) => categoryById.get(id) ?? `#${id}`)
                            .join(' · ') || '카테고리 없음'}
                        </small>
                        <small>
                          출처 {detail.source} · 카탈로그 등록일{' '}
                          {detail.createdAt.slice(0, 10)}
                        </small>
                      </>
                    )}
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
          <strong>
            {isCatalogLoading && catalogItems.length === 0
              ? '검색 중...'
              : `총 ${totalCatalogCount}개 중 ${catalogItems.length}개 표시`}
          </strong>
        </SectionHeader>

        <FilterPanel>
          <SearchForm
            onSubmit={(event) => {
              event.preventDefault();
              applySearchImmediately();
            }}
          >
            <label>
              <input
                aria-label="가챠 이름 또는 카테고리 검색"
                placeholder="가챠 이름 또는 카테고리명 검색"
                value={queryInput}
                onChange={(event) => {
                  invalidateCatalog();
                  setQueryInput(event.target.value);
                  setIsQueryDirty(true);
                }}
              />
            </label>
            <button type="submit">즉시 검색</button>
            <button
              data-variant="secondary"
              disabled={!hasFilters}
              type="button"
              onClick={resetFilters}
            >
              필터 초기화
            </button>
          </SearchForm>

          <CategoryToolbar>
            <strong>카테고리 (선택 즉시 적용)</strong>
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
                  onClick={() => {
                    invalidateCatalog();
                    setSelectedCategoryIds((current) =>
                      selected
                        ? current.filter((id) => id !== category.id)
                        : [...current, category.id],
                    );
                  }}
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

        {isQueryDirty ? (
          <StatePanel aria-live="polite">
            입력한 검색어를 적용하고 있습니다.
          </StatePanel>
        ) : isCatalogLoading && catalogItems.length === 0 ? (
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
                  <GachaThumbnail
                    aria-label={
                      item.imageUrl
                        ? `가챠 #${item.id} ${item.name} 이미지 확대`
                        : `가챠 #${item.id} 이미지 없음`
                    }
                    disabled={!item.imageUrl}
                    title={item.imageUrl ? '이미지 확대' : undefined}
                    type="button"
                    onClick={() => setPreviewItem(item)}
                  >
                    {item.imageUrl ? (
                      <img alt="" src={item.imageUrl} />
                    ) : (
                      <span aria-hidden>?</span>
                    )}
                  </GachaThumbnail>
                  <GachaName>
                    <strong>{item.name}</strong>
                    {item.description && <small>{item.description}</small>}
                    <small>
                      출처 {item.source} · 카탈로그 등록일{' '}
                      {item.createdAt.slice(0, 10)}
                    </small>
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
      {previewItem?.imageUrl && (
        <GachaImagePreviewDialog
          gachaId={previewItem.id}
          imageUrl={previewItem.imageUrl}
          name={previewItem.name}
          onClose={() => setPreviewItem(null)}
        />
      )}
    </Page>
  );
}
