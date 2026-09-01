import type {
  CategoryDto,
  ClassificationItemDto,
} from '@/features/classification/api/classification.dto';
import type { CreateUploadUrlRequestDto } from '@/features/registration/api/registration.dto';

const initialCategories: CategoryDto[] = [
  { categoryId: 1, categoryName: '제일복권' },
  { categoryId: 2, categoryName: '산리오' },
  { categoryId: 3, categoryName: '캐릭터' },
  { categoryId: 4, categoryName: '캡슐토이' },
  { categoryId: 5, categoryName: '피규어' },
  { categoryId: 6, categoryName: '가챠' },
  { categoryId: 7, categoryName: '미니어처' },
];

const initialClassificationItems: ClassificationItemDto[] = [
  {
    gachaId: 101,
    thumbnailUrl: '/mock/gacha-pink.svg',
    displayName: '귀여운 토끼 피규어',
    originalFileName: 'instagram_2026_0829_001.jpg',
    source: 'BANDAI',
    location: '홍대',
    caption: '핑크 컬러 캐릭터 피규어 신상품',
    categoryIds: [],
    status: 'UNCLASSIFIED',
    version: 1,
    createdAt: '2026-08-29T10:31:00+09:00',
  },
  {
    gachaId: 102,
    thumbnailUrl: '/mock/gacha-blue.svg',
    displayName: '로봇 전사 블루',
    originalFileName: 'instagram_2026_0829_002.jpg',
    source: 'BANDAI',
    location: '홍대',
    caption: '메카 컬렉션 시리즈',
    categoryIds: [],
    status: 'UNCLASSIFIED',
    version: 1,
    createdAt: '2026-08-29T10:32:00+09:00',
  },
  {
    gachaId: 103,
    thumbnailUrl: '/mock/gacha-green.svg',
    displayName: null,
    originalFileName: 'instagram_2026_0829_003.jpg',
    source: 'AMUSE',
    location: '국제전자센터 9층',
    caption: '내용물 미확인 캡슐',
    categoryIds: [],
    status: 'UNCLASSIFIED',
    version: 2,
    createdAt: '2026-08-29T10:33:00+09:00',
  },
  {
    gachaId: 104,
    thumbnailUrl: '/mock/gacha-sushi.svg',
    displayName: '미니어처 초밥 세트',
    originalFileName: 'instagram_2026_0829_004.jpg',
    source: 'AMUSE',
    location: '국제전자센터 9층',
    caption: '초밥 미니어처 5종 세트',
    categoryIds: [],
    status: 'UNCLASSIFIED',
    version: 1,
    createdAt: '2026-08-29T10:34:00+09:00',
  },
  {
    gachaId: 105,
    thumbnailUrl: '/mock/gacha-pink.svg',
    displayName: '산리오 미니 피규어',
    originalFileName: 'instagram_2026_0829_005.jpg',
    source: 'INSTAGRAM',
    location: '홍대',
    caption: '산리오 캐릭터 미니 피규어',
    categoryIds: [2, 3, 5],
    status: 'CLASSIFIED',
    version: 1,
    createdAt: '2026-08-29T10:35:00+09:00',
  },
  {
    gachaId: 106,
    thumbnailUrl: '/mock/gacha-blue.svg',
    displayName: '중복 수집 이미지',
    originalFileName: 'instagram_2026_0829_006.jpg',
    source: 'INSTAGRAM',
    location: '홍대',
    caption: '분류 중 중복으로 확인된 데이터',
    categoryIds: [],
    status: 'SKIPPED',
    version: 3,
    createdAt: '2026-08-29T10:36:00+09:00',
  },
  {
    gachaId: 107,
    thumbnailUrl: '/mock/gacha-blue.svg',
    displayName: '건담 캡슐 피규어',
    originalFileName: 'bandai_2026_0829_007.jpg',
    source: 'BANDAI',
    location: '국제전자센터 9층',
    caption: '모빌 슈트 미니 피규어 컬렉션',
    categoryIds: [5],
    status: 'CLASSIFIED',
    version: 1,
    createdAt: '2026-08-29T10:37:00+09:00',
  },
  {
    gachaId: 108,
    thumbnailUrl: '/mock/gacha-sushi.svg',
    displayName: '편의점 음식 미니어처',
    originalFileName: 'amuse_2026_0829_008.jpg',
    source: 'AMUSE',
    location: '홍대',
    caption: '작은 음식 소품 컬렉션',
    categoryIds: [7],
    status: 'CLASSIFIED',
    version: 1,
    createdAt: '2026-08-29T10:38:00+09:00',
  },
];

export interface MockStore {
  storeId: number;
  name: string;
  thumbnailUrl: string | null;
  address: string;
  latitude: number;
  longitude: number;
  gachaMachineAmount: number | null;
}

const initialStores: MockStore[] = [
  {
    storeId: 1,
    name: '가챠샵 홍대점',
    thumbnailUrl: '/mock/gacha-pink.svg',
    address: '서울특별시 마포구 와우산로 1층',
    latitude: 37.5563,
    longitude: 126.9236,
    gachaMachineAmount: 48,
  },
  {
    storeId: 2,
    name: '국제전자센터 가챠존',
    thumbnailUrl: '/mock/gacha-blue.svg',
    address: '서울특별시 서초구 효령로 304 9층',
    latitude: 37.4847,
    longitude: 127.0177,
    gachaMachineAmount: 72,
  },
  {
    storeId: 3,
    name: '캡슐 스테이션 연남',
    thumbnailUrl: null,
    address: '서울특별시 마포구 동교로 2층',
    latitude: 37.5621,
    longitude: 126.9252,
    gachaMachineAmount: 24,
  },
];

const initialStoreGachaAssignments: Array<[number, number[]]> = [
  [1, [105]],
  [2, [107]],
  [3, []],
];

export interface MockFieldUpload extends CreateUploadUrlRequestDto {
  uploadId: string;
  objectKey: string;
  content: ArrayBuffer | null;
  registeredGachaId: number | null;
}

let nextUploadSequence = 1;

export const fieldUploads = new Map<string, MockFieldUpload>();

export const createMockFieldUpload = (
  request: CreateUploadUrlRequestDto,
): MockFieldUpload => {
  const uploadId = `field-upload-${nextUploadSequence}`;
  nextUploadSequence += 1;
  const upload: MockFieldUpload = {
    ...request,
    uploadId,
    objectKey: `field/${uploadId}/${encodeURIComponent(request.originalFileName)}`,
    content: null,
    registeredGachaId: null,
  };

  fieldUploads.set(uploadId, upload);
  return upload;
};

const cloneCategories = () =>
  initialCategories.map((category) => ({ ...category }));
const cloneItems = () =>
  initialClassificationItems.map((item) => ({
    ...item,
    categoryIds: [...item.categoryIds],
  }));
const cloneStores = () => initialStores.map((store) => ({ ...store }));
const cloneAssignments = () =>
  new Map(
    initialStoreGachaAssignments.map(([storeId, gachaIds]) => [
      storeId,
      new Set(gachaIds),
    ]),
  );

export const categories = cloneCategories();
export const classificationItems = cloneItems();
export const stores = cloneStores();
export const storeGachaAssignments = cloneAssignments();

export const resetMockData = () => {
  categories.splice(0, categories.length, ...cloneCategories());
  classificationItems.splice(0, classificationItems.length, ...cloneItems());
  stores.splice(0, stores.length, ...cloneStores());
  storeGachaAssignments.clear();
  cloneAssignments().forEach((gachaIds, storeId) => {
    storeGachaAssignments.set(storeId, gachaIds);
  });
  fieldUploads.clear();
  nextUploadSequence = 1;
};
