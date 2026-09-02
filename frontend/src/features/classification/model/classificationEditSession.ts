import type { ClassificationIdRange } from './classification';

const EDIT_SESSION_KEY = 'gachi-gacha:classification-edit-session';
const EDIT_SESSION_VERSION = 1;

export interface ClassificationEditSession extends ClassificationIdRange {
  version: typeof EDIT_SESSION_VERSION;
  itemIds: number[];
  query: string;
  categoryIds: number[];
  nextCursor: number | null;
}

interface StartClassificationEditSessionParams extends ClassificationIdRange {
  itemIds: number[];
  query: string;
  categoryIds: number[];
  nextCursor: number | null;
}

const isNonNegativeInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;

const isPositiveInteger = (value: unknown): value is number =>
  isNonNegativeInteger(value) && value > 0;

const isOptionalPositiveInteger = (value: unknown) =>
  value === undefined || isPositiveInteger(value);

const isClassificationEditSession = (
  value: unknown,
): value is ClassificationEditSession => {
  if (typeof value !== 'object' || value === null) return false;

  const session = value as Partial<ClassificationEditSession>;

  return (
    session.version === EDIT_SESSION_VERSION &&
    Array.isArray(session.itemIds) &&
    session.itemIds.length > 0 &&
    session.itemIds.every(isPositiveInteger) &&
    typeof session.query === 'string' &&
    Array.isArray(session.categoryIds) &&
    session.categoryIds.every(isPositiveInteger) &&
    (session.nextCursor === null || isNonNegativeInteger(session.nextCursor)) &&
    isOptionalPositiveInteger(session.minId) &&
    isOptionalPositiveInteger(session.maxId)
  );
};

const writeClassificationEditSession = (session: ClassificationEditSession) => {
  sessionStorage.setItem(EDIT_SESSION_KEY, JSON.stringify(session));
};

export const getClassificationEditSession = () => {
  const storedSession = sessionStorage.getItem(EDIT_SESSION_KEY);
  if (!storedSession) return null;

  try {
    const parsedSession: unknown = JSON.parse(storedSession);
    if (isClassificationEditSession(parsedSession)) return parsedSession;
  } catch {
    // 손상된 세션은 아래에서 제거하고 단건 수정 흐름으로 복구한다.
  }

  sessionStorage.removeItem(EDIT_SESSION_KEY);
  return null;
};

export const startClassificationEditSession = ({
  itemIds,
  query,
  categoryIds,
  nextCursor,
  minId,
  maxId,
}: StartClassificationEditSessionParams) => {
  const session: ClassificationEditSession = {
    version: EDIT_SESSION_VERSION,
    itemIds: [...new Set(itemIds)],
    query,
    categoryIds: [...new Set(categoryIds)],
    nextCursor,
    ...(minId === undefined ? {} : { minId }),
    ...(maxId === undefined ? {} : { maxId }),
  };

  writeClassificationEditSession(session);
};

export const extendClassificationEditSession = (
  session: ClassificationEditSession,
  itemIds: number[],
  nextCursor: number | null,
) => {
  const extendedSession: ClassificationEditSession = {
    ...session,
    itemIds: [...new Set([...session.itemIds, ...itemIds])],
    nextCursor,
  };

  writeClassificationEditSession(extendedSession);
  return extendedSession;
};

export const getNextLoadedEditItemId = (
  session: ClassificationEditSession,
  currentItemId: number,
) => {
  const currentIndex = session.itemIds.indexOf(currentItemId);
  return currentIndex < 0 ? null : (session.itemIds[currentIndex + 1] ?? null);
};

export const getClassificationEditProgress = (currentItemId: number) => {
  const session = getClassificationEditSession();
  if (!session) return null;

  const currentIndex = session.itemIds.indexOf(currentItemId);
  if (currentIndex < 0) return null;

  return {
    position: currentIndex + 1,
    loadedCount: session.itemIds.length,
    hasNext:
      currentIndex < session.itemIds.length - 1 || session.nextCursor !== null,
  };
};

export const clearClassificationEditSession = () => {
  sessionStorage.removeItem(EDIT_SESSION_KEY);
};
