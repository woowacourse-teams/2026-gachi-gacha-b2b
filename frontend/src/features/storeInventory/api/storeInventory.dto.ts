export interface BackendStoreSummaryDto {
  storeId: number;
  name: string;
  thumbnailUrl: string | null;
  address: string;
  latitude: number;
  longitude: number;
  gachaMachineAmount: number | null;
}

export interface BackendStoreDetailDto {
  storeId: number;
  name: string;
  thumbnailUrl: string | null;
  address: string;
  gachaMachineAmount: number | null;
  ownedGachaAmount: number;
}

export interface BackendStoreGachaSummaryDto {
  gachaId: number;
  thumbnailUrl: string | null;
}

export interface BackendStoreGachaRelationDto {
  storeId: number;
  gachaId: number;
}
