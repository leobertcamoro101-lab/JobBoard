import { useCallback, useRef, type ReactNode, useEffect, useMemo } from 'react';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import { LoadingContext } from './loading-context';
import { registerLoadingHandlers } from './loading-bridge';

interface LoadingProviderProps {
  children: ReactNode;
}
// NProgress.configure({ showSpinner: false }); // remove the small spinner at the side uncomment this if you want // NEW
export function LoadingProvider({ children }: LoadingProviderProps) {
  const activeRequests = useRef(0);

  const startLoading = useCallback(() => {
    activeRequests.current += 1;
    if (activeRequests.current === 1) {
      NProgress.start();
    }
  }, []);

  const stopLoading = useCallback(() => {
    activeRequests.current = Math.max(0, activeRequests.current - 1);
    if (activeRequests.current === 0) {
      NProgress.done();
    }
  }, []);

   useEffect(() => {
    registerLoadingHandlers({ start: startLoading, stop: stopLoading });
  }, [startLoading, stopLoading]);

  const value = useMemo(() => ({ startLoading, stopLoading }), [startLoading, stopLoading]);
  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
}