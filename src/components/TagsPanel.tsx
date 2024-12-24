import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDirectoryWatcher } from '@/hooks/useDirectoryWatcher';

export function TagsPanel() {
  const [newTag, setNewTag] = useState('');
  const { tags, addTag } = useDirectoryWatcher();

  const handleAddTag = () => {
    if (newTag.trim()) {
      addTag(newTag.trim());
      setNewTag('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <Input
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          placeholder="Enter a new tag"
        />
        <Button onClick={handleAddTag}>Add Tag</Button>
      </div>
      <ul className="space-y-2">
        {Object.entries(tags).map(([tagName, filePaths]) => (
          <li key={tagName}>
            <span className="font-medium">{tagName}</span>
            <span className="ml-2 text-sm text-muted">({filePaths.length} files)</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
