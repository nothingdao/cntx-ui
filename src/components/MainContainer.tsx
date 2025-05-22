// src/components/MainContainer.tsx
import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LayoutDashboard, Archive, Tags, Settings } from "lucide-react";
import { Dashboard } from './Dashboard'; // Import the new Dashboard component
// import { StateWatcher } from './StateWatcher'; // Keep for developer use if needed
import { BundleMainViewer } from './BundleMainViewer';
import { TagsMainViewer } from './TagsMainViewer';
import { ConfigPanel } from './ConfigPanel';

export function MainContainer() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="p-4">
      <Tabs defaultValue="dashboard" onValueChange={setActiveTab} value={activeTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="dashboard" className="flex items-center">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="bundles" className="flex items-center">
            <Archive className="mr-2 h-4 w-4" />
            Bundles
          </TabsTrigger>
          <TabsTrigger value="tags" className="flex items-center">
            <Tags className="mr-2 h-4 w-4" />
            Tags
          </TabsTrigger>
          <TabsTrigger value="config" className="flex items-center">
            <Settings className="mr-2 h-4 w-4" />
            Config
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <Dashboard />
        </TabsContent>

        <TabsContent value="bundles">
          <BundleMainViewer />
        </TabsContent>

        <TabsContent value="tags">
          <TagsMainViewer />
        </TabsContent>

        <TabsContent value="config">
          <ConfigPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
