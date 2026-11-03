export interface StoreSummary {
  id: number;
  name: string;
  imageUrl: string;
  address: string;
  machineCount: number;
  coinPrice: number | null;
}

export interface AssignedGachaSummary {
  id: number;
  imageUrl: string;
}

export interface StoreInventoryRelation {
  storeId: number;
  gachaId: number;
}

export interface CreatedStore {
  id: number;
  createdAt: string;
}
