import { useCallback, useEffect, useState } from 'react';

export type AppRoute =
  | { page: 'sources' }
  | {
      page: 'queue';
      status: 'UNCLASSIFIED' | 'CLASSIFIED' | 'SKIPPED';
      source?: string;
    }
  | { page: 'classify'; itemId: number };

const ROUTE_CHANGE_EVENT = 'gachi-gacha:route-change';

const parseRoute = (): AppRoute => {
  const classifyMatch = window.location.pathname.match(/^\/classify\/(\d+)$/);

  if (classifyMatch) {
    return { page: 'classify', itemId: Number(classifyMatch[1]) };
  }

  const sourceMatch = window.location.pathname.match(/^\/sources\/([^/]+)$/);
  const encodedSource = sourceMatch?.[1];

  if (encodedSource) {
    return {
      page: 'queue',
      status: 'UNCLASSIFIED',
      source: decodeURIComponent(encodedSource),
    };
  }

  if (window.location.pathname === '/classified') {
    return { page: 'queue', status: 'CLASSIFIED' };
  }

  if (window.location.pathname === '/skipped') {
    return { page: 'queue', status: 'SKIPPED' };
  }

  return { page: 'sources' };
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
