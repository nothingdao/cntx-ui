// src/App.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FileWatcherProvider } from './contexts/FileWatcherProvider';
import { ChatContainer } from './components/Chat/ChatContainer';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <FileWatcherProvider>
        <ChatContainer />
      </FileWatcherProvider>
    </QueryClientProvider>
  );
}
