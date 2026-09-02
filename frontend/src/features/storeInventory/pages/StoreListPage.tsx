import { useEffect, useMemo, useState } from 'react';

import { getErrorMessage } from '@/utils/getErrorMessage';

import {
  CountBadge,
  CreateStoreButton,
  Description,
  Header,
  HeaderActions,
  Heading,
  Page,
  SearchForm,
  StatePanel,
  StoreCard,
  StoreGrid,
  StoreThumbnail,
} from './StoreInventory.styles';
import { getAllStores } from '../api/storeInventoryApi';
import type { StoreSummary } from '../model/storeInventory';

interface StoreListPageProps {
  onNavigate: (path: string) => void;
}

export default function StoreListPage({ onNavigate }: StoreListPageProps) {
  const [stores, setStores] = useState<StoreSummary[]>([]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isCurrent = true;

    getAllStores()
      .then((loadedStores) => {
        if (isCurrent) setStores(loadedStores);
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
  }, []);

  const filteredStores = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('ko-KR');
    if (!normalizedQuery) return stores;

    return stores.filter((store) =>
      `${store.name} ${store.address}`
        .toLocaleLowerCase('ko-KR')
        .includes(normalizedQuery),
    );
  }, [query, stores]);

  return (
    <Page>
      <Header>
        <div>
          <Heading>매장 가챠 관리</Heading>
          <Description>
            조사할 매장을 선택한 뒤, 분류가 끝난 가챠를 검색해 현재 보유 목록에
            등록합니다.
          </Description>
        </div>
        <HeaderActions>
          <CountBadge>
            <strong>{stores.length}</strong>
            <span>등록 매장</span>
          </CountBadge>
          <CreateStoreButton
            type="button"
            onClick={() => onNavigate('/stores/new')}
          >
            + 새 매장 등록
          </CreateStoreButton>
        </HeaderActions>
      </Header>

      <SearchForm onSubmit={(event) => event.preventDefault()}>
        <label>
          <input
            aria-label="매장 이름 또는 주소 검색"
            placeholder="매장 이름 또는 주소로 검색"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </SearchForm>

      {isLoading ? (
        <StatePanel>매장 목록을 불러오고 있습니다.</StatePanel>
      ) : error ? (
        <StatePanel role="alert">
          <div>
            <strong>매장 목록을 불러오지 못했습니다.</strong>
            {error}
          </div>
        </StatePanel>
      ) : filteredStores.length === 0 ? (
        <StatePanel>
          <div>
            <strong>조건에 맞는 매장이 없습니다.</strong>
            다른 이름이나 주소로 검색해 주세요.
          </div>
        </StatePanel>
      ) : (
        <StoreGrid>
          {filteredStores.map((store) => (
            <li key={store.id}>
              <StoreCard
                aria-label={`${store.name} 보유 가챠 관리`}
                type="button"
                onClick={() => onNavigate(`/stores/${store.id}/gachas`)}
              >
                <StoreThumbnail>
                  {store.imageUrl ? (
                    <img alt="" src={store.imageUrl} />
                  ) : (
                    <span aria-hidden>店</span>
                  )}
                </StoreThumbnail>
                <span>
                  <h2>{store.name}</h2>
                  <p>{store.address}</p>
                  <small>기계 {store.machineCount}대 · 목록 관리 →</small>
                </span>
              </StoreCard>
            </li>
          ))}
        </StoreGrid>
      )}
    </Page>
  );
}
