// src/App.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RufasProvider } from '@/contexts/RufasProvider';
import { ApplicationContainer } from './components/ApplicationContainer';
import { ThemeProvider } from "@/components/theme/theme-provider"

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RufasProvider>
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
          <ApplicationContainer />
        </ThemeProvider>
      </RufasProvider>
    </QueryClientProvider>
  );
}
