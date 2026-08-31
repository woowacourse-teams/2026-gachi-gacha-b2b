import { useCallback, useEffect, useState } from 'react';

export type AppRoute =
  | {
      page: 'queue';
      status: 'UNCLASSIFIED' | 'CLASSIFIED' | 'SKIPPED';
      minId?: number;
      maxId?: number;
    }
  | { page: 'classify'; itemId: number; minId?: number; maxId?: number };

const ROUTE_CHANGE_EVENT = 'gachi-gacha:route-change';

const getPositiveInteger = (value: string | null) => {
  const parsed = value ? Number(value) : undefined;
  return parsed !== undefined && Number.isSafeInteger(parsed) && parsed > 0
    ? parsed
    : undefined;
};

const getIdRangeFromUrl = () => {
  const searchParams = new URLSearchParams(window.location.search);
  const minId = getPositiveInteger(searchParams.get('minId'));
  const maxId = getPositiveInteger(searchParams.get('maxId'));

  return {
    ...(minId === undefined ? {} : { minId }),
    ...(maxId === undefined ? {} : { maxId }),
  };
};

const parseRoute = (): AppRoute => {
  const classifyMatch = window.location.pathname.match(/^\/classify\/(\d+)$/);

  if (classifyMatch) {
    return {
      page: 'classify',
      itemId: Number(classifyMatch[1]),
      ...getIdRangeFromUrl(),
    };
  }

  if (window.location.pathname === '/classified') {
    return {
      page: 'queue',
      status: 'CLASSIFIED',
      ...getIdRangeFromUrl(),
    };
  }

  if (window.location.pathname === '/skipped') {
    return { page: 'queue', status: 'SKIPPED', ...getIdRangeFromUrl() };
  }

  return { page: 'queue', status: 'UNCLASSIFIED', ...getIdRangeFromUrl() };
};

export const useAppRoute = () => {
  const [route, setRoute] = useState<AppRoute>(parseRoute);

  useEffect(() => {
    const updateRoute = () => setRoute(parseRoute());

    window.addEventListener('popstate', updateRoute);
    window.addEventListener(ROUTE_CHANGE_EVENT, updateRoute);

    return () => {
      window.removeEventListener('popstate', updateRoute);
      window.removeEventListener(ROUTE_CHANGE_EVENT, updateRoute);
    };
  }, []);

  const navigate = useCallback((path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new Event(ROUTE_CHANGE_EVENT));
  }, []);

  return { route, navigate };
};
