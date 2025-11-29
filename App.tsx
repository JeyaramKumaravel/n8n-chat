import React, { useState, useEffect, useCallback } from 'react';
import { Message, MessageContent, AuthConfig, Tool, WebhookConfig } from './types';
import MessageList from './components/MessageList';
import ChatInput from './components/ChatInput';
import SettingsModal from './components/SettingsModal';
import { SettingsIcon } from './components/icons/SettingsIcon';
import { sendToWebhook } from './services/webhookService';

const App: React.FC = () => {

  const [messages, setMessages] = useState<Message[]>([]);

  // Migration and Initialization of Webhooks
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>(() => {
    const savedWebhooks = localStorage.getItem('n8nWebhooks');
    if (savedWebhooks) {
      try {
        return JSON.parse(savedWebhooks);
      } catch (e) {
        console.error("Failed to parse webhooks", e);
      }
    }

    // Migration from legacy single URL/Auth
    const legacyUrl = localStorage.getItem('n8nWebhookUrl');
    const legacyAuth = localStorage.getItem('n8nWebhookAuth');

    if (legacyUrl) {
      let auth: AuthConfig = { type: 'none' };
      try {
        if (legacyAuth) auth = JSON.parse(legacyAuth);
      } catch { }

      const migratedWebhook: WebhookConfig = {
        id: crypto.randomUUID(),
        name: 'Default Webhook',
        url: legacyUrl,
        auth: auth
      };

      // Save immediately to new format
      localStorage.setItem('n8nWebhooks', JSON.stringify([migratedWebhook]));
      // Optional: Clear legacy keys? Keeping them for safety for now.

      return [migratedWebhook];
    }

    return [];
  });

  const [activeWebhookId, setActiveWebhookId] = useState<string | null>(() => {
    const savedId = localStorage.getItem('n8nActiveWebhookId');
    if (savedId) return savedId;

    // If we just migrated or have webhooks, default to the first one
    const savedWebhooks = localStorage.getItem('n8nWebhooks');
    if (savedWebhooks) {
      try {
        const parsed = JSON.parse(savedWebhooks);
        if (parsed.length > 0) return parsed[0].id;
      } catch { }
    }
    // Fallback for migration case if state initializer runs before the above check (it won't, but good for safety)
    const legacyUrl = localStorage.getItem('n8nWebhookUrl');
    if (legacyUrl) {
      // We can't easily get the ID generated in the webhooks initializer here without duplicating logic or using an effect.
      // So we'll handle setting the active ID in an effect if it's missing but webhooks exist.
      return null;
    }
    return null;
  });

  // Derived state for current active webhook
  const activeWebhook = webhooks.find(w => w.id === activeWebhookId);
  const webhookUrl = activeWebhook?.url || '';
  const authConfig = activeWebhook?.auth || { type: 'none' };

  // Ensure activeWebhookId is set if we have webhooks but no active ID (e.g. after first migration)
  useEffect(() => {
    if (webhooks.length > 0 && !activeWebhookId) {
      setActiveWebhookId(webhooks[0].id);
      localStorage.setItem('n8nActiveWebhookId', webhooks[0].id);
    }
  }, [webhooks, activeWebhookId]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // For "Bot is typing..." indicator
  const [error, setError] = useState<string | null>(null);

  // New states for queue management
  const [messageQueue, setMessageQueue] = useState<{ content: MessageContent; userMessageIds: string[] }[]>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);

  const [tools, setTools] = useState<Tool[]>(() => {
    const savedTools = localStorage.getItem('chatTools');
    try {
      if (savedTools) {
        return JSON.parse(savedTools);
      }
    } catch (e) {
      console.error("Failed to parse tools from localStorage", e);
    }
    // Default tools
    return [
      { id: 'deep-research', name: 'Deep Research', icon: 'deep-research', prompt: 'Perform a deep research on: ' },
    ];
  });


  useEffect(() => {
    const initialMessages: Message[] = webhookUrl
      ? [
        {
          id: 'initial-1',
          sender: 'bot',
          type: 'text',
          content: "I'm ready! Send a message to start interacting with your n8n workflow.",
          timestamp: new Date().toISOString(),
        },
      ]
      : [
        {
          id: 'initial-1',
          sender: 'bot',
          type: 'text',
          content: 'Welcome! Please set your n8n Webhook URL in the settings to get started.',
          timestamp: new Date().toISOString(),
        },
      ];
    setMessages(initialMessages);
  }, [webhookUrl]);


  const handleSendMessage = useCallback(async (content: MessageContent) => {
    if (!webhookUrl) {
      setError('Webhook URL is not set. Please configure it in the settings.');
      return;
    }
    setError(null);

    const userMessages: Message[] = [];
    const timestamp = new Date().toISOString();
    let messageIdCounter = 0;

    const getMessageType = (
      fileType: string
    ): 'image' | 'video' | 'audio' | 'file' => {
      if (fileType.startsWith('image/')) return 'image';
      if (fileType.startsWith('video/')) return 'video';
      if (fileType.startsWith('audio/')) return 'audio';
      return 'file';
    };

    const textForDisplay = content.displayText ?? content.text;

    if (textForDisplay.trim()) {
      userMessages.push({
        id: `user-text-${Date.now()}-${messageIdCounter++}`,
        sender: 'user',
        type: 'text',
        content: textForDisplay,
        timestamp,
        status: 'sending',
      });
    }

    content.files.forEach((file) => {
      userMessages.push({
        id: `user-file-${Date.now()}-${messageIdCounter++}`,
        sender: 'user',
        type: getMessageType(file.type),
        content: URL.createObjectURL(file),
        fileName: file.name,
        timestamp,
        status: 'sending',
      });
    });

    setMessages((prev) => [...prev, ...userMessages]);

    const userMessageIds = userMessages.map(m => m.id);
    setMessageQueue(prev => [...prev, { content, userMessageIds }]);
  }, [webhookUrl]);

  // Effect to process the message queue
  useEffect(() => {
    if (isProcessingQueue || messageQueue.length === 0) {
      return;
    }

    const processNextMessage = async () => {
      setIsProcessingQueue(true);
      const { content, userMessageIds } = messageQueue[0];

      setIsLoading(true); // Show "Bot is typing..."

      try {
        const chatId = crypto.randomUUID();
        const botResponses = await sendToWebhook(webhookUrl, content.text, content.files, authConfig, chatId);

        const responseMessages: Message[] = botResponses.map((res, index) => {
          let finalContent = res.content;
          const isBase64Like = res.content && !/^(https?|blob|data):/.test(res.content);

          if (res.type !== 'text' && res.mimeType && isBase64Like) {
            finalContent = `data:${res.mimeType};base64,${res.content}`;
          }

          return {
            id: `bot-${Date.now()}-${index}`,
            sender: 'bot',
            timestamp: new Date().toISOString(),
            ...res,
            content: finalContent,
          };
        });

        setMessages(prev => {
          const updatedMessages = prev.map(m =>
            userMessageIds.includes(m.id) ? { ...m, status: 'sent' as const } : m
          );
          return [...updatedMessages, ...responseMessages];
        });

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(errorMessage);
        const errorBotMessage: Message = {
          id: `bot-error-${Date.now()}`,
          sender: 'bot',
          type: 'text',
          content: `Error: ${errorMessage}`,
          timestamp: new Date().toISOString(),
        };

        setMessages(prev => {
          const updatedMessages = prev.map(m =>
            userMessageIds.includes(m.id) ? { ...m, status: 'error' as const } : m
          );
          return [...updatedMessages, errorBotMessage];
        });
      } finally {
        setIsLoading(false);
        setMessageQueue(prev => prev.slice(1));
        setIsProcessingQueue(false);
      }
    };

    processNextMessage();
  }, [messageQueue, isProcessingQueue, webhookUrl, authConfig]);

  const handleSaveSettings = (newWebhooks: WebhookConfig[], newActiveId: string | null, newTools: Tool[]) => {
    setWebhooks(newWebhooks);
    setActiveWebhookId(newActiveId);
    setTools(newTools);

    localStorage.setItem('n8nWebhooks', JSON.stringify(newWebhooks));
    if (newActiveId) {
      localStorage.setItem('n8nActiveWebhookId', newActiveId);
    } else {
      localStorage.removeItem('n8nActiveWebhookId');
    }
    localStorage.setItem('chatTools', JSON.stringify(newTools));
    setIsSettingsOpen(false);
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-black/50 text-neutral-200 font-sans">
      <header className="bg-neutral-950/80 backdrop-blur-lg border-b border-neutral-800 p-4 flex justify-between items-center shadow-lg z-10">
        <h1 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
          n8n Webhook Chat
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-full text-neutral-400 hover:bg-neutral-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
            aria-label="Open settings"
          >
            <SettingsIcon className="w-6 h-6" />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <MessageList messages={messages} isLoading={isLoading} />
      </main>

      {error && (
        <div className="p-2 bg-red-500/80 text-white text-center text-sm font-medium">
          {error}
        </div>
      )}

      <footer className="p-4 bg-transparent" style={{ paddingBottom: `calc(1rem + env(safe-area-inset-bottom, 0rem))` }}>
        <ChatInput onSendMessage={handleSendMessage} disabled={!webhookUrl} tools={tools} />
      </footer>

      {isSettingsOpen && (
        <SettingsModal
          webhooks={webhooks}
          activeWebhookId={activeWebhookId}
          currentTools={tools}
          onSave={handleSaveSettings}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  );
};

export default App;