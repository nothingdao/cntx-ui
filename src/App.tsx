// src/App.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FileWatcherProvider } from './contexts/FileWatcherProvider';
import { ApplicationContainer } from './components/ApplicationContainer';
import { ThemeProvider } from "@/components/theme-provider"


const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <FileWatcherProvider>
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
          <ApplicationContainer />
        </ThemeProvider>
      </FileWatcherProvider>
    </QueryClientProvider>
  );
}
