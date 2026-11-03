import { useEffect, useMemo, useState } from 'react';

import type {
  CatalogMetadataStatus,
  ClassificationItem,
} from '@/features/classification/model/classification';
import { getErrorMessage } from '@/utils/getErrorMessage';

import {
  BackButton,
  Description,
  Heading,
  Page,
  StatePanel,
} from './StoreInventory.styles';
import {
  FactCard,
  FactGrid,
  Intro,
  JumpLinks,
  Notice,
  PreviewHeading,
  PreviewSection,
  StatusPill,
} from './StoreOperationsPreviewPage.styles';
import { getCatalogItemsByIds } from '../api/catalogSearchApi';
import { getAssignedGachas, getStoreSummary } from '../api/storeInventoryApi';
import KujiBoardDraft from '../components/KujiBoardDraft';
import MachinePlacementDraft from '../components/MachinePlacementDraft';
import type { DraftGacha } from '../components/MachinePlacementDraft';
import type {
  AssignedGachaSummary,
  StoreSummary,
} from '../model/storeInventory';

interface StoreOperationsPreviewPageProps {
  storeId: number;
  onNavigate: (path: string) => void;
}

export default function StoreOperationsPreviewPage({
  storeId,
  onNavigate,
}: StoreOperationsPreviewPageProps) {
  const [store, setStore] = useState<StoreSummary | null>(null);
  const [assignments, setAssignments] = useState<AssignedGachaSummary[]>([]);
  const [details, setDetails] = useState<ClassificationItem[]>([]);
  const [metadataStatus, setMetadataStatus] =
    useState<CatalogMetadataStatus>('disabled');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [detailError, setDetailError] = useState('');

  useEffect(() => {
    let isCurrent = true;

    const load = async () => {
      setIsLoading(true);
      setError('');
      setDetailError('');

      try {
        const [nextStore, nextAssignments] = await Promise.all([
          getStoreSummary(storeId),
          getAssignedGachas(storeId),
        ]);
        if (!isCurrent) return;
        setStore(nextStore);
        setAssignments(nextAssignments);

        if (nextAssignments.length > 0) {
          try {
            const result = await getCatalogItemsByIds(
              nextAssignments.map(({ id }) => id),
            );
            if (!isCurrent) return;
            setDetails(result.items);
            setMetadataStatus(result.metadataStatus);
          } catch (cause) {
            if (!isCurrent) return;
            setDetails([]);
            setDetailError(getErrorMessage(cause));
          }
        } else {
          setDetails([]);
          setMetadataStatus('disabled');
        }
      } catch (cause) {
        if (isCurrent) setError(getErrorMessage(cause));
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    };

    void load();
    return () => {
      isCurrent = false;
    };
  }, [storeId]);

  const gachas = useMemo<DraftGacha[]>(() => {
    const detailById = new Map(details.map((item) => [item.id, item]));
    return assignments.map(({ id, imageUrl }) => {
      const detail = detailById.get(id);
      const nameJa = detail?.metadata?.nameJa;
      const thumbnailUrl = detail?.imageUrl || imageUrl;
      return {
        id,
        name: detail?.metadata?.nameKo || detail?.name || `가챠 #${id}`,
        ...(nameJa ? { nameJa } : {}),
        ...(thumbnailUrl ? { imageUrl: thumbnailUrl } : {}),
      };
    });
  }, [assignments, details]);

  if (isLoading) {
    return <StatePanel>운영 화면 시안을 준비하고 있습니다.</StatePanel>;
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
      <BackButton
        type="button"
        onClick={() => onNavigate(`/stores/${storeId}/gachas`)}
      >
        ← 보유 가챠 관리로
      </BackButton>
      <Intro>
        <div>
          <StatusPill>운영 화면 시안 · 서버 미연결</StatusPill>
          <Heading>{store.name} 운영 보드</Heading>
          <Description>
            실제 매장에 등록된 가챠를 바탕으로 기기 배치를 시험하고, 쿠지 상자별
            현황판을 구성해 볼 수 있습니다.
          </Description>
        </div>
        <FactGrid aria-label="현재 연결된 매장 정보">
          <FactCard>
            <strong>{store.machineCount}대</strong>
            <span>기존 매장 기계 대수</span>
          </FactCard>
          <FactCard>
            <strong>{assignments.length}종</strong>
            <span>매장에 연결된 가챠</span>
          </FactCard>
          <FactCard>
            <strong>미연결</strong>
            <span>수량·배치 저장 API</span>
          </FactCard>
        </FactGrid>
      </Intro>

      <Notice role="status">
        이 페이지의 기기·재고·쿠지 숫자는 서버에 저장되지 않는 체험용
        초안입니다. 새로고침하거나 페이지를 벗어나면 입력값이 사라집니다. 실제
        판매·매출이나 소비자용 재고로 표시되지 않습니다.
      </Notice>
      {detailError && (
        <Notice role="alert">
          상품 상세정보를 가져오지 못했습니다: {detailError}. 기기 초안에서는
          상품 ID로 표시합니다.
        </Notice>
      )}
      {metadataStatus === 'disabled' && assignments.length > 0 && (
        <Notice>
          한·일 이름 입력 칸은 공개 상품정보 시트의 <code>name_ko</code>와{' '}
          <code>name_ja</code>로 이미 분리되어 있습니다. 현재 시트 URL이
          연결되지 않아 기존 카탈로그 이름만 보일 수 있습니다.
        </Notice>
      )}
      <JumpLinks aria-label="운영 시안 영역 이동">
        <a href="#machine-placement">기기 배치 초안</a>
        <a href="#kuji-board">쿠지 현황판 초안</a>
      </JumpLinks>

      <PreviewSection id="machine-placement" aria-labelledby="machine-title">
        <PreviewHeading>
          <div>
            <span>01 / GACHA</span>
            <h2 id="machine-title">기기 배치 초안</h2>
          </div>
          <p>기기 위치와 가챠 종류를 연결하고 수량 입력 흐름을 확인합니다.</p>
        </PreviewHeading>
        <MachinePlacementDraft
          storeId={store.id}
          storeName={store.name}
          machineCount={store.machineCount}
          gachas={gachas}
        />
      </PreviewSection>

      <PreviewSection id="kuji-board" aria-labelledby="kuji-title">
        <PreviewHeading>
          <div>
            <span>02 / KUJI</span>
            <h2 id="kuji-title">쿠지 현황판 초안</h2>
          </div>
          <p>한 타이틀의 상자를 기준으로 등급과 잔여 장수를 편집해 봅니다.</p>
        </PreviewHeading>
        <KujiBoardDraft storeId={store.id} storeName={store.name} />
      </PreviewSection>
    </Page>
  );
}
