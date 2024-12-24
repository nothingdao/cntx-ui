// src/App.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DirectoryWatcherProvider } from './contexts/DirectoryWatcherProvider';
import { ApplicationContainer } from './components/ApplicationContainer';
import { ThemeProvider } from "@/components/theme-provider"


const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DirectoryWatcherProvider>
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
          <ApplicationContainer />
        </ThemeProvider>
      </DirectoryWatcherProvider>
    </QueryClientProvider>
  );
}
