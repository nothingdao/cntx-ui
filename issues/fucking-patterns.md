Looking at FileContext.tsx:

```typescript
export function FileProvider({ children }: { children: React.ReactNode }) {
  const { directoryHandle, isWatching, recentChanges } = useDirectory();
  const { ignorePatterns } = useProjectConfig();
```

And we're using ignorePatterns in processDirectory:

```typescript
const refreshFiles = useCallback(async () => {
  if (!directoryHandle || !isWatching) return;
  try {
    const files = await processDirectory(directoryHandle, '', ignorePatterns);
    // ...
```

FileContext can see the patterns from ProjectConfigContext. And when patterns change, FileContext's refreshFiles should run because `ignorePatterns` is in its dependency array.

So now we just need to verify that:

1. ConfigPanel changes patterns
2. FileContext sees those changes (through ignorePatterns)
3. refreshFiles runs with new patterns
4. DirectoryTree gets updated files list
