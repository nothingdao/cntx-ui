// src/App.tsx
// hi
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CntxProvider } from '@/contexts/CntxProvider';
import { ApplicationContainer } from './components/ApplicationContainer';
import { ThemeProvider } from "@/components/theme/theme-provider"

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CntxProvider>
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
          <ApplicationContainer />
        </ThemeProvider>
      </CntxProvider>
    </QueryClientProvider>
  );
}
