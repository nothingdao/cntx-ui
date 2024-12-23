// src/App.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FileWatcherProvider } from './contexts/FileWatcherProvider';
import { ApplicationContainer } from './components/ApplicationContainer';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <FileWatcherProvider>
        <ApplicationContainer />
      </FileWatcherProvider>
    </QueryClientProvider>
  );
}
