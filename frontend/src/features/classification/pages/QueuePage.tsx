import { useCallback, useEffect, useState } from 'react';

import { getErrorMessage } from '@/utils/getErrorMessage';

import {
  Caption,
  Card,
  CardBody,
  CardButton,
  CardGrid,
  CardTitle,
  CategoryTag,
  CategoryTags,
  Description,
  ErrorMessage,
  FolderBackButton,
  Header,
  Heading,
  ImageWrap,
  Page,
  PrimaryButton,
  SearchLabel,
  Source,
  Stat,
  StatePanel,
  Stats,
  StatusBadge,
  Toolbar,
} from './QueuePage.styles';
import {
  getCategories,
  getClassificationQueue,
  restoreGacha,
} from '../api/classificationApi';
import type {
  Category,
  ClassificationItem,
  ClassificationQueue,
} from '../model/classification';

interface QueuePageProps {
  source: string | undefined;
  status: 'UNCLASSIFIED' | 'CLASSIFIED' | 'SKIPPED';
  onNavigate: (path: string) => void;
}

export default function QueuePage({
  source,
  status,
  onNavigate,
}: QueuePageProps) {
  const [query, setQuery] = useState('');
  const [queue, setQueue] = useState<ClassificationQueue | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<number | null>(null);

  const loadQueue = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const queueQuery = source ? { status, query, source } : { status, query };
      const [loadedQueue, loadedCategories] = await Promise.all([
        getClassificationQueue(queueQuery),
        getCategories(),
      ]);

      setQueue(loadedQueue);
      setCategories(loadedCategories);
    } catch (cause) {
      setError(getErrorMessage(cause));
    } finally {
      setIsLoading(false);
    }
  }, [query, source, status]);

  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

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
      : `${source ?? '미분류'} 폴더`;
  const description = isSkippedView
    ? '제외했던 데이터를 확인하고 분류 대기 상태로 복구합니다.'
    : isClassifiedView
      ? '저장된 이름과 카테고리를 확인합니다. MSW에서는 새로고침 전까지 유지됩니다.'
      : `${source ?? '선택한 출처'}에서 수집한 가챠 데이터만 분류합니다.`;
  const statusLabel = isSkippedView
    ? '건너뜀'
    : isClassifiedView
      ? '분류 완료'
      : '분류 대기';

  return (
    <Page>
      <Header>
        <div>
          {status === 'UNCLASSIFIED' && source && (
            <FolderBackButton type="button" onClick={() => onNavigate('/')}>
              ← 출처 폴더로
            </FolderBackButton>
          )}
          <Heading>{title}</Heading>
          <Description>{description}</Description>
        </div>
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
      </Header>

      <Toolbar>
        <SearchLabel>
          <span aria-hidden>⌕&nbsp;</span>
          <input
            aria-label="가챠 데이터 검색"
            placeholder="이름, 설명, 출처, 지역으로 검색"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </SearchLabel>
        {status === 'UNCLASSIFIED' && (
          <PrimaryButton
            disabled={!firstItem}
            type="button"
            onClick={() => firstItem && onNavigate(`/classify/${firstItem.id}`)}
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
        <CardGrid>
          {queue.items.map((item) => (
            <Card key={item.id}>
              <ImageWrap>
                <img
                  src={item.imageUrl}
                  alt={`${item.name || '이름 미정'} 이미지`}
                />
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
                    onClick={() => onNavigate(`/classify/${item.id}`)}
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
                : '이 출처의 분류 대기 데이터가 없습니다.'}
          </div>
        </StatePanel>
      )}
    </Page>
  );
}
