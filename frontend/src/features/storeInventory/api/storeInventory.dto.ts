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

export interface BackendStoreCreateRequestDto {
  name: string;
  thumbnailUrl: string | null;
  latitude: number;
  longitude: number;
  phoneNumber: string | null;
  instagramId: string | null;
  address: string;
  floor: number | null;
  unit: string | null;
  businessHours: string | null;
  paymentMethods: string | null;
  gachaMachineAmount: number | null;
  coinPrice: number | null;
  gachaPriceMin: number | null;
  gachaPriceMax: number | null;
  kujiAmount: number | null;
  kujiPriceMin: number | null;
  kujiPriceMax: number | null;
  hasSelectGacha: boolean;
  selectGachaPriceMin: number | null;
  selectGachaPriceMax: number | null;
  facilities: string[];
  hasRandomBox: boolean;
}

export interface BackendStoreCreateResponseDto {
  storeId: number;
  createdAt: string;
}
