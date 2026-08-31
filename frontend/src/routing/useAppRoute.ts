import { useCallback, useEffect, useState } from 'react';

export type AppRoute =
  | { page: 'queue'; status: 'UNCLASSIFIED' | 'SKIPPED' }
  | { page: 'classify'; itemId: number };

const ROUTE_CHANGE_EVENT = 'gachi-gacha:route-change';

const parseRoute = (): AppRoute => {
  const match = window.location.pathname.match(/^\/classify\/(\d+)$/);

  if (match) {
    return { page: 'classify', itemId: Number(match[1]) };
  }

  if (window.location.pathname === '/skipped') {
    return { page: 'queue', status: 'SKIPPED' };
  }

  return { page: 'queue', status: 'UNCLASSIFIED' };
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
