export const CLASSIFICATION_STATUSES = [
  'UNCLASSIFIED',
  'CLASSIFIED',
  'SKIPPED',
] as const;

export type ClassificationStatus = (typeof CLASSIFICATION_STATUSES)[number];

export interface Category {
  id: number;
  name: string;
}

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
}

export interface SourceFolder {
  name: string;
  pendingCount: number;
}

export interface ClassificationQueue {
  items: ClassificationItem[];
  totalCount: number;
  skippedCount: number;
}

export interface ClassificationDraft {
  name: string;
  categoryIds: number[];
}

export interface ClassificationResult {
  nextItemId: number | null;
}
