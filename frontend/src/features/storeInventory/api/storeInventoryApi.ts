import { requestData } from '@/apis/httpClient';
import type { BackendPageDto } from '@/features/classification/api/classification.dto';
import { getClassificationQueue } from '@/features/classification/api/classificationApi';
import type { ClassificationQueue } from '@/features/classification/model/classification';

import type {
  BackendStoreDetailDto,
  BackendStoreGachaRelationDto,
  BackendStoreGachaSummaryDto,
  BackendStoreSummaryDto,
} from './storeInventory.dto';
import type {
  AssignedGachaSummary,
  StoreInventoryRelation,
  StoreSummary,
} from '../model/storeInventory';

const STORE_PAGE_SIZE = 100;
const ASSIGNED_GACHA_PAGE_SIZE = 100;
const MAX_PAGE_REQUESTS = 100;

const toStoreSummary = (
  dto: BackendStoreSummaryDto | BackendStoreDetailDto,
): StoreSummary => ({
  id: dto.storeId,
  name: dto.name,
  imageUrl: dto.thumbnailUrl ?? '',
  address: dto.address,
  machineCount: dto.gachaMachineAmount ?? 0,
});

const toAssignedGacha = (
  dto: BackendStoreGachaSummaryDto,
): AssignedGachaSummary => ({
  id: dto.gachaId,
  imageUrl: dto.thumbnailUrl ?? '',
});

export const getAllStores = async (): Promise<StoreSummary[]> => {
  const stores: StoreSummary[] = [];

  for (let pageNumber = 0; pageNumber < MAX_PAGE_REQUESTS; pageNumber += 1) {
    const searchParams = new URLSearchParams({
      page: String(pageNumber),
      size: String(STORE_PAGE_SIZE),
      sort: 'id,asc',
    });
    const page = await requestData<BackendPageDto<BackendStoreSummaryDto>>(
      `/stores?${searchParams.toString()}`,
    );

    stores.push(...page.content.map(toStoreSummary));
    if (page.last) return stores;
  }

  throw new Error('매장 목록 페이지가 너무 많아 조회를 중단했습니다.');
};

export const getStoreSummary = async (
  storeId: number,
): Promise<StoreSummary> => {
  const store = await requestData<BackendStoreDetailDto>(`/stores/${storeId}`);
  return toStoreSummary(store);
};

export const getAssignedGachas = async (
  storeId: number,
): Promise<AssignedGachaSummary[]> => {
  const assigned = new Map<number, AssignedGachaSummary>();

  for (let pageNumber = 0; pageNumber < MAX_PAGE_REQUESTS; pageNumber += 1) {
    const searchParams = new URLSearchParams({
      page: String(pageNumber),
      size: String(ASSIGNED_GACHA_PAGE_SIZE),
    });
    const page = await requestData<BackendPageDto<BackendStoreGachaSummaryDto>>(
      `/stores/${storeId}/gachas?${searchParams.toString()}`,
    );

    page.content.map(toAssignedGacha).forEach((gacha) => {
      assigned.set(gacha.id, gacha);
    });
    if (page.last) return [...assigned.values()];
  }

  throw new Error('매장 보유 가챠 페이지가 너무 많아 조회를 중단했습니다.');
};

export const getAssignableGachaPage = ({
  query,
  categoryIds,
  cursor = 0,
  limit = 50,
}: {
  query: string;
  categoryIds: number[];
  cursor?: number;
  limit?: number;
}): Promise<ClassificationQueue> =>
  getClassificationQueue({
    status: 'CLASSIFIED',
    query,
    categoryIds,
    cursor,
    limit,
  });

export const assignGachaToStore = async (
  storeId: number,
  gachaId: number,
): Promise<StoreInventoryRelation> => {
  const relation = await requestData<BackendStoreGachaRelationDto>(
    `/stores/${storeId}/gachas/${gachaId}`,
    { method: 'POST' },
  );

  return { storeId: relation.storeId, gachaId: relation.gachaId };
};

export const removeGachaFromStore = async (
  storeId: number,
  gachaId: number,
): Promise<void> => {
  await requestData<BackendStoreGachaRelationDto>(
    `/stores/${storeId}/gachas/${gachaId}`,
    { method: 'DELETE' },
  );
};
