import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@radix-ui/react-select";
import { Button } from "./ui/button";
import { Bot, MessageSquare, Send } from "lucide-react";
import { Input } from "./ui/input";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { useMutation } from "@tanstack/react-query";
import { sendMessage, type ClaudeModel } from '../services/claude';
import { useDirectoryWatcher } from '../hooks/useDirectoryWatcher';
import { useState } from "react";

const MODELS: { value: ClaudeModel; label: string }[] = [
  { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
  { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet' },
  { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' }
];

export default function ClaudeChat() {


  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState<ClaudeModel>('claude-3-opus-20240229');

  const { watchedFiles } = useDirectoryWatcher();

  const sendMessageMutation = useMutation({
    mutationFn: async (newMessage: string) => {
      const updatedMessages = [...messages, { role: 'user', content: newMessage }];

      const fileContext = watchedFiles
        .map(file => `<document>\n<source>${file.path}</source>\n<content>${file.content}</content>\n</document>`)
        .join('\n\n');

      const messagesWithContext = [...updatedMessages] as { role: 'user' | 'assistant'; content: string; }[];
      if (fileContext) {
        messagesWithContext[messagesWithContext.length - 1] = {
          ...messagesWithContext[messagesWithContext.length - 1],
          content: `${fileContext}\n\n${messagesWithContext[messagesWithContext.length - 1].content}`
        };
      }

      const response = await sendMessage(messagesWithContext, selectedModel);
      return response;
    },
    // ... rest of the code remains the same
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setMessages(prev => [...prev, { role: 'user', content: input }]);
    sendMessageMutation.mutate(input);
  };

  return (
    <>
      <div className="flex items-center justify-center space-x-2 py-2 border-b">
        <Bot className="h-5 w-5" />
        <h1 className="text-lg font-semibold">Chat with Claude</h1>
      </div>

      <ScrollArea className="flex-1 px-4">
        <div className="space-y-4 py-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex items-start space-x-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
            >
              {message.role === 'assistant' && <Bot className="h-6 w-6 mt-1" />}
              <div
                className={`p-4 rounded-lg max-w-[80%] ${message.role === 'user'
                  ? 'bg-blue-100 text-blue-900'
                  : 'bg-gray-100 text-gray-900'
                  }`}
              >
                {message.content}
              </div>
              {message.role === 'user' && <MessageSquare className="h-6 w-6 mt-1" />}
            </div>
          ))}
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="sticky bottom-0 p-4 border-t space-y-4">
        <Select
          value={selectedModel}
          onValueChange={(value) => setSelectedModel(value as ClaudeModel)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MODELS.map((model) => (
              <SelectItem key={model.value} value={model.value}>
                {model.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1"
          />
          <Button type="submit" disabled={sendMessageMutation.isPending}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </>
  );
}
