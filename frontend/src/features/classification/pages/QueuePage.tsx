import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getErrorMessage } from '@/utils/getErrorMessage';

import {
  CategoryFilterButton,
  CategoryFilterHint,
  CategoryFilterList,
  CategoryFilterPanel,
  CategoryFilterSearch,
  CategoryTag,
  CategoryTags,
  ClearFilterButton,
  Description,
  ErrorMessage,
  Header,
  HeaderActions,
  Heading,
  IdCell,
  IdInput,
  IdRangeForm,
  List,
  ListActionButton,
  ListCategoryCell,
  ListFooter,
  ListHeader,
  ListMetaCell,
  ListNameCell,
  ListRow,
  LoadMoreButton,
  Page,
  PrimaryButton,
  RangeButton,
  SearchLabel,
  Stat,
  StatePanel,
  Stats,
  StatusBadge,
  Toolbar,
  FilterLabel,
} from './QueuePage.styles';
import {
  getCategories,
  getClassificationQueue,
  restoreGacha,
} from '../api/classificationApi';
import { toggleCategory } from '../model/category';
import type {
  Category,
  ClassificationIdRange,
  ClassificationItem,
  ClassificationQueue,
} from '../model/classification';

interface QueuePageProps {
  initialMinId: number | undefined;
  initialMaxId: number | undefined;
  status: 'UNCLASSIFIED' | 'CLASSIFIED' | 'SKIPPED';
  onNavigate: (path: string) => void;
}

export default function QueuePage({
  initialMinId,
  initialMaxId,
  status,
  onNavigate,
}: QueuePageProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [minIdInput, setMinIdInput] = useState(
    initialMinId === undefined ? '' : String(initialMinId),
  );
  const [maxIdInput, setMaxIdInput] = useState(
    initialMaxId === undefined ? '' : String(initialMaxId),
  );
  const [queue, setQueue] = useState<ClassificationQueue | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [categoryFilterQuery, setCategoryFilterQuery] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [restoringId, setRestoringId] = useState<number | null>(null);
  const latestRequestIdRef = useRef(0);
  const queueAbortControllerRef = useRef<AbortController | null>(null);
  const isSkippedView = status === 'SKIPPED';
  const isClassifiedView = status === 'CLASSIFIED';

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedQuery(query), 300);
    return () => window.clearTimeout(timeoutId);
  }, [query]);

  useEffect(() => {
    if (!isClassifiedView) {
      setCategories([]);
      return;
    }

    let isCurrent = true;

    void getCategories()
      .then((loadedCategories) => {
        if (isCurrent) setCategories(loadedCategories);
      })
      .catch((cause) => {
        if (isCurrent) setError(getErrorMessage(cause));
      });

    return () => {
      isCurrent = false;
    };
  }, [isClassifiedView]);

  const loadQueue = useCallback(
    async (cursor?: number) => {
      const requestId = latestRequestIdRef.current + 1;
      latestRequestIdRef.current = requestId;
      const isAppending = cursor !== undefined;
      queueAbortControllerRef.current?.abort();
      const abortController = new AbortController();
      queueAbortControllerRef.current = abortController;

      if (isAppending) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
        setQueue(null);
      }
      setError('');

      try {
        const queueQuery = {
          status,
          query: debouncedQuery,
          ...(initialMinId === undefined ? {} : { minId: initialMinId }),
          ...(initialMaxId === undefined ? {} : { maxId: initialMaxId }),
          ...(status === 'CLASSIFIED' && selectedCategoryIds.length > 0
            ? { categoryIds: selectedCategoryIds }
            : {}),
          ...(cursor === undefined ? {} : { cursor }),
          signal: abortController.signal,
        };
        const loadedQueue = await getClassificationQueue(queueQuery);

        if (requestId !== latestRequestIdRef.current) return;

        setQueue((current) =>
          isAppending && current
            ? {
                ...loadedQueue,
                items: [...current.items, ...loadedQueue.items],
              }
            : loadedQueue,
        );
      } catch (cause) {
        if (requestId !== latestRequestIdRef.current) return;
        if (cause instanceof DOMException && cause.name === 'AbortError')
          return;
        setError(getErrorMessage(cause));
      } finally {
        if (requestId === latestRequestIdRef.current) {
          setIsLoading(false);
          setIsLoadingMore(false);
        }
        if (queueAbortControllerRef.current === abortController) {
          queueAbortControllerRef.current = null;
        }
      }
    },
    [debouncedQuery, initialMaxId, initialMinId, selectedCategoryIds, status],
  );

  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  useEffect(
    () => () => {
      latestRequestIdRef.current += 1;
      queueAbortControllerRef.current?.abort();
    },
    [],
  );

  useEffect(() => {
    setMinIdInput(initialMinId === undefined ? '' : String(initialMinId));
    setMaxIdInput(initialMaxId === undefined ? '' : String(initialMaxId));
  }, [initialMaxId, initialMinId]);

  const getListPath = (idRange: ClassificationIdRange = {}) => {
    const pathname =
      status === 'CLASSIFIED'
        ? '/classified'
        : status === 'SKIPPED'
          ? '/skipped'
          : '/';
    const searchParams = new URLSearchParams();

    if (idRange.minId !== undefined) {
      searchParams.set('minId', String(idRange.minId));
    }
    if (idRange.maxId !== undefined) {
      searchParams.set('maxId', String(idRange.maxId));
    }

    return searchParams.size
      ? `${pathname}?${searchParams.toString()}`
      : pathname;
  };

  const getClassifyPath = (itemId: number) => {
    const searchParams = new URLSearchParams();

    if (initialMinId !== undefined) {
      searchParams.set('minId', String(initialMinId));
    }
    if (initialMaxId !== undefined) {
      searchParams.set('maxId', String(initialMaxId));
    }
    if (isClassifiedView) {
      searchParams.set('mode', 'edit');
    }

    const queryString = searchParams.toString();
    return `/classify/${itemId}${queryString ? `?${queryString}` : ''}`;
  };

  const parseIdInput = (value: string) => {
    if (!value.trim()) return undefined;

    const parsed = Number(value);
    return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
  };

  const handleIdRangeSubmit = () => {
    const minId = parseIdInput(minIdInput);
    const maxId = parseIdInput(maxIdInput);

    if (minId === null || maxId === null) {
      setError('ID는 1 이상의 정수로 입력해 주세요.');
      return;
    }

    if (minId !== undefined && maxId !== undefined && minId > maxId) {
      setError('시작 ID는 종료 ID보다 클 수 없습니다.');
      return;
    }

    setError('');
    onNavigate(
      getListPath({
        ...(minId === undefined ? {} : { minId }),
        ...(maxId === undefined ? {} : { maxId }),
      }),
    );
  };

  const handleRestore = async (item: ClassificationItem) => {
    setRestoringId(item.id);
    setError('');

    try {
      await restoreGacha(item);
      await loadQueue();
    } catch (cause) {
      setError(getErrorMessage(cause));
    } finally {
      setRestoringId(null);
    }
  };

  const firstItem = queue?.items[0];
  const selectedCategoryIdSet = useMemo(
    () => new Set(selectedCategoryIds),
    [selectedCategoryIds],
  );
  const categoryById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );
  const visibleFilterCategories = useMemo(() => {
    const normalizedQuery = categoryFilterQuery.trim().toLocaleLowerCase();
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
  }, [categories, categoryFilterQuery, selectedCategoryIdSet]);
  const title = isSkippedView
    ? '건너뛴 데이터'
    : isClassifiedView
      ? '분류 완료 데이터'
      : '미분류 데이터';
  const description = isSkippedView
    ? '제외했던 데이터를 확인하고 분류 대기 상태로 복구합니다.'
    : isClassifiedView
      ? __USE_MOCK_API__
        ? '저장된 이름과 카테고리를 확인합니다. MSW에서는 새로고침 전까지 유지됩니다.'
        : '실제 DB에 저장된 이름과 카테고리를 확인합니다.'
      : 'DB ID 오름차순으로 확인하고 담당 범위를 지정해 분류합니다.';
  const statusLabel = isSkippedView
    ? '건너뜀'
    : isClassifiedView
      ? '분류 완료'
      : '분류 대기';

  return (
    <Page>
      <Header>
        <div>
          <Heading>{title}</Heading>
          <Description>{description}</Description>
        </div>
        <HeaderActions>
          <PrimaryButton type="button" onClick={() => onNavigate('/register')}>
            + 사진 추가
          </PrimaryButton>
          <Stats aria-label="분류 현황">
            <Stat>
              <strong>{queue?.totalCount ?? '-'}</strong>
              <span>{__USE_MOCK_API__ ? '분류 대기' : '전체 데이터'}</span>
            </Stat>
            {__USE_MOCK_API__ && (
              <Stat>
                <strong>{queue?.skippedCount ?? '-'}</strong>
                <span>건너뜀</span>
              </Stat>
            )}
          </Stats>
        </HeaderActions>
      </Header>

      <Toolbar>
        <SearchLabel>
          <span aria-hidden>⌕&nbsp;</span>
          <input
            aria-label="가챠 데이터 검색"
            placeholder={
              isClassifiedView
                ? '등록된 가챠 이름으로 검색'
                : __USE_MOCK_API__
                  ? '이름, 설명, 출처, 지역으로 검색'
                  : '등록된 가챠 이름으로 검색'
            }
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </SearchLabel>
        <IdRangeForm
          aria-label="담당 ID 범위"
          onSubmit={(event) => {
            event.preventDefault();
            handleIdRangeSubmit();
          }}
        >
          <IdInput
            aria-label="시작 ID"
            min="1"
            placeholder="시작 ID"
            type="number"
            value={minIdInput}
            onChange={(event) => setMinIdInput(event.target.value)}
          />
          <span aria-hidden>~</span>
          <IdInput
            aria-label="종료 ID"
            min="1"
            placeholder="종료 ID"
            type="number"
            value={maxIdInput}
            onChange={(event) => setMaxIdInput(event.target.value)}
          />
          <RangeButton type="submit">범위 적용</RangeButton>
          {(initialMinId !== undefined || initialMaxId !== undefined) && (
            <RangeButton
              type="button"
              onClick={() => onNavigate(getListPath())}
            >
              초기화
            </RangeButton>
          )}
        </IdRangeForm>
        {status === 'UNCLASSIFIED' && (
          <PrimaryButton
            disabled={!firstItem}
            type="button"
            onClick={() =>
              firstItem && onNavigate(getClassifyPath(firstItem.id))
            }
          >
            바로 분류하기
          </PrimaryButton>
        )}
      </Toolbar>

      {error && <ErrorMessage role="alert">{error}</ErrorMessage>}

      {isLoading && !queue ? (
        <StatePanel aria-live="polite">
          분류 데이터를 불러오는 중입니다.
        </StatePanel>
      ) : queue?.items.length ? (
        <>
          <ListHeader aria-hidden="true">
            <span>ID · 상태</span>
            <span>가챠 이름</span>
            <span>출처 · 위치</span>
            <span>카테고리</span>
            <span>작업</span>
          </ListHeader>
          <List>
            {queue.items.map((item) => (
              <ListRow key={item.id}>
                <IdCell>
                  <strong>#{item.id}</strong>
                  <StatusBadge status={status}>{statusLabel}</StatusBadge>
                </IdCell>
                <ListNameCell>
                  <strong>{item.name || '이름을 입력해 주세요'}</strong>
                  <span>{item.description || item.originalFileName}</span>
                </ListNameCell>
                <ListMetaCell>
                  <strong>{item.source}</strong>
                  <span>{item.locationLabel}</span>
                </ListMetaCell>
                <ListCategoryCell>
                  {isClassifiedView ? (
                    <CategoryTags aria-label="저장된 카테고리">
                      {item.categoryIds.map((categoryId) => {
                        const category = categoryById.get(categoryId);

                        return category ? (
                          <CategoryTag key={category.id}>
                            {category.name}
                          </CategoryTag>
                        ) : null;
                      })}
                    </CategoryTags>
                  ) : (
                    <span>미분류</span>
                  )}
                </ListCategoryCell>
                {isSkippedView ? (
                  <ListActionButton
                    secondary
                    disabled={restoringId === item.id}
                    type="button"
                    onClick={() => void handleRestore(item)}
                  >
                    {restoringId === item.id
                      ? '복구 중...'
                      : '분류 대기로 복구'}
                  </ListActionButton>
                ) : status === 'UNCLASSIFIED' ? (
                  <ListActionButton
                    type="button"
                    onClick={() => onNavigate(getClassifyPath(item.id))}
                  >
                    분류하기 →
                  </ListActionButton>
                ) : (
                  <ListActionButton
                    secondary
                    type="button"
                    onClick={() => onNavigate(getClassifyPath(item.id))}
                  >
                    수정하기 →
                  </ListActionButton>
                )}
              </ListRow>
            ))}
          </List>
          <ListFooter>
            <span>
              {__USE_MOCK_API__
                ? `${queue.filteredCount.toLocaleString()}개 중 ${queue.items.length.toLocaleString()}개 표시`
                : `${queue.items.length.toLocaleString()}개 표시 · 전체 ${queue.totalCount.toLocaleString()}개`}
            </span>
            {queue.nextCursor !== null && (
              <LoadMoreButton
                disabled={isLoadingMore}
                type="button"
                onClick={() => void loadQueue(queue.nextCursor ?? undefined)}
              >
                {isLoadingMore ? '불러오는 중...' : '다음 50개 불러오기'}
              </LoadMoreButton>
            )}
          </ListFooter>
        </>
      ) : (
        <StatePanel>
          <div>
            <strong>
              {query ? '검색 결과가 없습니다.' : '표시할 데이터가 없습니다.'}
            </strong>
            {isSkippedView
              ? __USE_MOCK_API__
                ? '건너뛴 데이터가 생기면 이곳에서 복구할 수 있습니다.'
                : '현재 백엔드는 복구 가능한 건너뛰기 상태를 지원하지 않습니다.'
              : isClassifiedView
                ? '분류를 완료하면 저장 결과가 이곳에 표시됩니다.'
                : '선택한 ID 범위에 분류 대기 데이터가 없습니다.'}
          </div>
        </StatePanel>
      )}

      {isClassifiedView && (
        <CategoryFilterPanel aria-label="카테고리 다중 필터">
          <FilterLabel>카테고리로 결과 좁히기</FilterLabel>
          <CategoryFilterSearch>
            <span aria-hidden>⌕</span>
            <input
              aria-label="필터 카테고리 검색"
              placeholder="카테고리명 검색"
              type="search"
              value={categoryFilterQuery}
              onChange={(event) => setCategoryFilterQuery(event.target.value)}
            />
          </CategoryFilterSearch>
          <CategoryFilterList>
            {visibleFilterCategories.map((category) => {
              const selected = selectedCategoryIdSet.has(category.id);

              return (
                <CategoryFilterButton
                  key={category.id}
                  aria-pressed={selected}
                  selected={selected}
                  type="button"
                  onClick={() =>
                    setSelectedCategoryIds((current) =>
                      toggleCategory(current, category.id),
                    )
                  }
                >
                  {category.name}
                </CategoryFilterButton>
              );
            })}
            <CategoryFilterHint>
              전체 {categories.length.toLocaleString()}개 중 최대 40개를
              표시합니다.
            </CategoryFilterHint>
          </CategoryFilterList>
          {selectedCategoryIds.length > 0 && (
            <ClearFilterButton
              type="button"
              onClick={() => setSelectedCategoryIds([])}
            >
              선택 초기화
            </ClearFilterButton>
          )}
        </CategoryFilterPanel>
      )}
    </Page>
  );
}
