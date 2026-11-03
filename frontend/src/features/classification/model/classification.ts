export const CLASSIFICATION_STATUSES = [
  'UNCLASSIFIED',
  'CLASSIFIED',
  'SKIPPED',
] as const;

export type ClassificationStatus = (typeof CLASSIFICATION_STATUSES)[number];

export interface QueueQuery {
  status: ClassificationStatus;
  query: string;
  minId?: number;
  maxId?: number;
  categoryIds?: number[];
  cursor?: number;
  limit?: number;
  signal?: AbortSignal;
}

export interface Category {
  id: number;
  name: string;
}

export interface CatalogMetadata {
  nameKo: string;
  nameJa: string;
  aliases: string[];
  work: string;
  series: string;
  characters: string[];
  reviewedAt: string;
}

export type CatalogMetadataStatus =
  'disabled' | 'fresh' | 'stale' | 'unavailable';

export interface ClassificationItem {
  id: number;
  imageUrl: string;
  name: string;
  originalFileName: string;
  source: string;
  locationLabel: string;
  description: string;
  categoryIds: number[];
  status: ClassificationStatus;
  version: number;
  createdAt: string;
  metadata?: CatalogMetadata;
}

export interface ClassificationIdRange {
  minId?: number;
  maxId?: number;
}

export interface ClassificationQueue {
  items: ClassificationItem[];
  totalCount: number;
  skippedCount: number;
  filteredCount: number;
  nextCursor: number | null;
  metadataStatus?: CatalogMetadataStatus;
  metadataAsOf?: string | null;
}

export interface ClassificationDraft {
  name: string;
  categoryIds: number[];
}

export interface ClassificationResult {
  nextItemId: number | null;
}
