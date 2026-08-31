import { useCallback, useEffect, useRef, useState } from 'react';

import { getErrorMessage } from '@/utils/getErrorMessage';

import {
  Caption,
  Card,
  CardBody,
  CardButton,
  CardGrid,
  CardTitle,
  CategoryFilterButton,
  CategoryFilterList,
  CategoryFilterPanel,
  CategoryTag,
  CategoryTags,
  ClearFilterButton,
  Description,
  ErrorMessage,
  Header,
  HeaderActions,
  Heading,
  IdBadge,
  IdInput,
  IdRangeForm,
  ImageWrap,
  Page,
  PrimaryButton,
  RangeButton,
  SearchLabel,
  Source,
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
  const [minIdInput, setMinIdInput] = useState(
    initialMinId === undefined ? '' : String(initialMinId),
  );
  const [maxIdInput, setMaxIdInput] = useState(
    initialMaxId === undefined ? '' : String(initialMaxId),
  );
  const [queue, setQueue] = useState<ClassificationQueue | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<number | null>(null);
  const latestRequestIdRef = useRef(0);

  const loadQueue = useCallback(async () => {
    const requestId = latestRequestIdRef.current + 1;
    latestRequestIdRef.current = requestId;
    setIsLoading(true);
    setError('');

    try {
      const queueQuery = {
        status,
        query,
        ...(initialMinId === undefined ? {} : { minId: initialMinId }),
        ...(initialMaxId === undefined ? {} : { maxId: initialMaxId }),
        ...(status === 'CLASSIFIED' && selectedCategoryIds.length > 0
          ? { categoryIds: selectedCategoryIds }
          : {}),
      };
      const [loadedQueue, loadedCategories] = await Promise.all([
        getClassificationQueue(queueQuery),
        getCategories(),
      ]);

      if (requestId !== latestRequestIdRef.current) return;

      setQueue(loadedQueue);
      setCategories(loadedCategories);
    } catch (cause) {
      if (requestId !== latestRequestIdRef.current) return;
      setError(getErrorMessage(cause));
    } finally {
      if (requestId === latestRequestIdRef.current) setIsLoading(false);
    }
  }, [initialMaxId, initialMinId, query, selectedCategoryIds, status]);

  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

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
  const isSkippedView = status === 'SKIPPED';
  const isClassifiedView = status === 'CLASSIFIED';
  const title = isSkippedView
    ? '건너뛴 데이터'
    : isClassifiedView
      ? '분류 완료 데이터'
      : '미분류 데이터';
  const description = isSkippedView
    ? '제외했던 데이터를 확인하고 분류 대기 상태로 복구합니다.'
    : isClassifiedView
      ? '저장된 이름과 카테고리를 확인합니다. MSW에서는 새로고침 전까지 유지됩니다.'
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
              <span>분류 대기</span>
            </Stat>
            <Stat>
              <strong>{queue?.skippedCount ?? '-'}</strong>
              <span>건너뜀</span>
            </Stat>
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
                : '이름, 설명, 출처, 지역으로 검색'
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

      {isClassifiedView && (
        <CategoryFilterPanel aria-label="카테고리 다중 필터">
          <FilterLabel>카테고리</FilterLabel>
          <CategoryFilterList>
            {categories.map((category) => {
              const selected = selectedCategoryIds.includes(category.id);

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

      {error && <ErrorMessage role="alert">{error}</ErrorMessage>}

      {isLoading && !queue ? (
        <StatePanel aria-live="polite">
          분류 데이터를 불러오는 중입니다.
        </StatePanel>
      ) : queue?.items.length ? (
        <CardGrid>
          {queue.items.map((item) => (
            <Card key={item.id}>
              <ImageWrap>
                <img
                  src={item.imageUrl}
                  alt={`${item.name || '이름 미정'} 이미지`}
                />
                <IdBadge>ID #{item.id}</IdBadge>
                <StatusBadge status={status}>{statusLabel}</StatusBadge>
              </ImageWrap>
              <CardBody>
                <Source>
                  {item.source} · {item.locationLabel}
                </Source>
                <CardTitle>{item.name || '이름을 입력해 주세요'}</CardTitle>
                <Caption>{item.description || item.originalFileName}</Caption>
                {isSkippedView ? (
                  <CardButton
                    secondary
                    disabled={restoringId === item.id}
                    type="button"
                    onClick={() => void handleRestore(item)}
                  >
                    {restoringId === item.id
                      ? '복구 중...'
                      : '분류 대기로 복구'}
                  </CardButton>
                ) : status === 'UNCLASSIFIED' ? (
                  <CardButton
                    type="button"
                    onClick={() => onNavigate(getClassifyPath(item.id))}
                  >
                    분류하기&nbsp; →
                  </CardButton>
                ) : (
                  <CategoryTags aria-label="저장된 카테고리">
                    {item.categoryIds.map((categoryId) => {
                      const category = categories.find(
                        ({ id }) => id === categoryId,
                      );

                      return category ? (
                        <CategoryTag key={category.id}>
                          {category.name}
                        </CategoryTag>
                      ) : null;
                    })}
                  </CategoryTags>
                )}
              </CardBody>
            </Card>
          ))}
        </CardGrid>
      ) : (
        <StatePanel>
          <div>
            <strong>
              {query ? '검색 결과가 없습니다.' : '표시할 데이터가 없습니다.'}
            </strong>
            {isSkippedView
              ? '건너뛴 데이터가 생기면 이곳에서 복구할 수 있습니다.'
              : isClassifiedView
                ? '분류를 완료하면 저장 결과가 이곳에 표시됩니다.'
                : '선택한 ID 범위에 분류 대기 데이터가 없습니다.'}
          </div>
        </StatePanel>
      )}
    </Page>
  );
}
