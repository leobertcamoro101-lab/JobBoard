import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { LoadingProvider } from './context/LoadingProvider';
import router from './router/router';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LoadingProvider>
        <RouterProvider router={router}/>
      </LoadingProvider>
    </QueryClientProvider>
  );
}

export default App;
