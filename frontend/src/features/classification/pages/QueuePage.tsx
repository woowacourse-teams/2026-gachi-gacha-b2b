import { useCallback, useEffect, useState } from 'react';

import { getErrorMessage } from '@/utils/getErrorMessage';

import {
  Caption,
  Card,
  CardBody,
  CardButton,
  CardGrid,
  CardTitle,
  Description,
  ErrorMessage,
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
import { getClassificationQueue, restoreGacha } from '../api/classificationApi';
import type {
  ClassificationItem,
  ClassificationQueue,
} from '../model/classification';

interface QueuePageProps {
  status: 'UNCLASSIFIED' | 'SKIPPED';
  onNavigate: (path: string) => void;
}

export default function QueuePage({ status, onNavigate }: QueuePageProps) {
  const [query, setQuery] = useState('');
  const [queue, setQueue] = useState<ClassificationQueue | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<number | null>(null);

  const loadQueue = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      setQueue(await getClassificationQueue({ status, query }));
    } catch (cause) {
      setError(getErrorMessage(cause));
    } finally {
      setIsLoading(false);
    }
  }, [query, status]);

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

  return (
    <Page>
      <Header>
        <div>
          <Heading>{isSkippedView ? '건너뛴 데이터' : '미분류 데이터'}</Heading>
          <Description>
            {isSkippedView
              ? '제외했던 데이터를 확인하고 분류 대기 상태로 복구합니다.'
              : '크롤링된 가챠 이미지와 이름을 확인하고 카테고리를 지정합니다.'}
          </Description>
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
            placeholder="이름, 설명, 매장으로 검색"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </SearchLabel>
        {!isSkippedView && (
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
                <StatusBadge status={status}>
                  {isSkippedView ? '건너뜀' : '분류 대기'}
                </StatusBadge>
              </ImageWrap>
              <CardBody>
                <Source>{item.sourceLabel}</Source>
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
                ) : (
                  <CardButton
                    type="button"
                    onClick={() => onNavigate(`/classify/${item.id}`)}
                  >
                    분류하기&nbsp; →
                  </CardButton>
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
              : '새로운 크롤링 데이터가 들어오면 이곳에 표시됩니다.'}
          </div>
        </StatePanel>
      )}
    </Page>
  );
}
