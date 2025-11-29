import React, { useState, useRef, useEffect } from 'react';
import { XIcon } from './icons/XIcon';
import { AuthConfig, AuthType, Tool, ToolIconName, WebhookConfig } from '../types';
import { TrashIcon } from './icons/TrashIcon';
import { ToolIcon } from './ToolIcon';
import { GripVerticalIcon } from './icons/GripVerticalIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';


import { PlusIcon } from './icons/PlusIcon';
import { CheckIcon } from './icons/CheckIcon';
import { EditIcon } from './icons/EditIcon';

interface SettingsModalProps {
  webhooks: WebhookConfig[];
  activeWebhookId: string | null;
  currentTools: Tool[];
  onSave: (webhooks: WebhookConfig[], activeId: string | null, tools: Tool[]) => void;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ webhooks, activeWebhookId, currentTools, onSave, onClose }) => {
  const [localWebhooks, setLocalWebhooks] = useState<WebhookConfig[]>(webhooks);
  const [localActiveId, setLocalActiveId] = useState<string | null>(activeWebhookId);
  const [tools, setTools] = useState<Tool[]>(currentTools);
  const [activeTab, setActiveTab] = useState<'webhook' | 'toolbox'>('webhook');

  // Editing state for webhooks
  const [editingWebhookId, setEditingWebhookId] = useState<string | null>(null);
  // Temporary state for the webhook being edited/created
  const [tempWebhook, setTempWebhook] = useState<WebhookConfig | null>(null);


  // Drag-and-drop state
  const [draggedToolId, setDraggedToolId] = useState<string | null>(null);
  const dragItem = useRef<string | null>(null);
  const dragOverItem = useRef<string | null>(null);

  // Icon picker state
  const [openIconPickerId, setOpenIconPickerId] = useState<string | null>(null);
  const iconPickerRef = useRef<HTMLDivElement>(null);


  const handleAuthTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!tempWebhook) return;
    const newType = e.target.value as AuthType;
    setTempWebhook({ ...tempWebhook, auth: { type: newType } });
  };

  const handleAuthDetailChange = (field: string, value: string) => {
    if (!tempWebhook) return;
    setTempWebhook({ ...tempWebhook, auth: { ...tempWebhook.auth, [field]: value } });
  };

  const handleSave = () => {
    // If currently editing, save the edit first
    if (editingWebhookId && tempWebhook) {
      const updatedWebhooks = localWebhooks.map(w => w.id === editingWebhookId ? tempWebhook : w);
      onSave(updatedWebhooks, localActiveId, tools);
    } else {
      onSave(localWebhooks, localActiveId, tools);
    }
  };

  const handleAddNewWebhook = () => {
    const newId = crypto.randomUUID();
    const newWebhook: WebhookConfig = {
      id: newId,
      name: 'New Webhook',
      url: '',
      auth: { type: 'none' }
    };
    setLocalWebhooks([...localWebhooks, newWebhook]);
    setEditingWebhookId(newId);
    setTempWebhook(newWebhook);
    // Automatically set as active if it's the first one
    if (localWebhooks.length === 0) {
      setLocalActiveId(newId);
    }
  };

  const handleEditWebhook = (webhook: WebhookConfig) => {
    setEditingWebhookId(webhook.id);
    setTempWebhook({ ...webhook });
  };

  const handleCancelEdit = () => {
    // If we were adding a new webhook (it might be empty or partially filled), we should probably keep it but revert changes?
    // Or if it was a new one that wasn't saved to the list yet? 
    // Actually, we added it to the list immediately in handleAddNewWebhook.
    // If the user cancels, we should probably revert to the state before editing.
    // But since we don't keep a deep copy of the previous state of the specific webhook easily accessible without looking it up from props (which might be stale if we made other local changes),
    // let's just revert to what's in localWebhooks for that ID.

    // Wait, if we added a new webhook, it's in localWebhooks. If we cancel, maybe we should remove it if it has no URL?
    // For simplicity, let's just stop editing. The changes in tempWebhook are discarded.

    // If it was a brand new webhook with empty URL and we cancel, maybe we should remove it?
    const original = localWebhooks.find(w => w.id === editingWebhookId);
    if (original && original.url === '' && original.name === 'New Webhook') {
      // It was likely just added. Remove it.
      setLocalWebhooks(localWebhooks.filter(w => w.id !== editingWebhookId));
      if (localActiveId === editingWebhookId) setLocalActiveId(null);
    }

    setEditingWebhookId(null);
    setTempWebhook(null);
  };

  const handleSaveEdit = () => {
    if (!tempWebhook) return;
    setLocalWebhooks(localWebhooks.map(w => w.id === tempWebhook.id ? tempWebhook : w));
    setEditingWebhookId(null);
    setTempWebhook(null);
  };

  const handleDeleteWebhook = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newWebhooks = localWebhooks.filter(w => w.id !== id);
    setLocalWebhooks(newWebhooks);
    if (localActiveId === id) {
      setLocalActiveId(newWebhooks.length > 0 ? newWebhooks[0].id : null);
    }
    if (editingWebhookId === id) {
      setEditingWebhookId(null);
      setTempWebhook(null);
    }
  };

  const handleSelectActive = (id: string) => {
    setLocalActiveId(id);
  };

  const handleAddTool = () => {
    const newTool: Tool = {
      id: crypto.randomUUID(),
      name: 'New Tool',
      icon: 'default',
      prompt: '',
    };
    setTools(prev => [...prev, newTool]);
  };

  const handleToolChange = (id: string, field: keyof Omit<Tool, 'id'>, value: string) => {
    setTools(prev => prev.map(tool =>
      tool.id === id ? { ...tool, [field]: value } : tool
    ));
  };

  const handleRemoveTool = (id: string) => {
    setTools(prev => prev.filter(tool => tool.id !== id));
  };

  const toolIcons: ToolIconName[] = ['image', 'lightbulb', 'book-open', 'globe', 'search', 'deep-research', 'tune', 'code', 'database', 'mail', 'calendar', 'terminal', 'cpu', 'zap', 'activity', 'cloud', 'command', 'folder', 'key', 'layers', 'lock', 'message-square', 'monitor', 'package', 'pie-chart', 'refresh', 'save', 'shield', 'star', 'tag', 'target', 'upload', 'users', 'video', 'play-circle', 'pause-circle', 'camera', 'music', 'film', 'mic', 'headphones', 'speaker', 'default'];

  // --- Drag and Drop Handlers ---
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    dragItem.current = id;
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => setDraggedToolId(id), 0); // Use timeout to avoid flickering
  };

  const handleDragEnter = (id: string) => {
    dragOverItem.current = id;
  };

  const handleDragEnd = () => {
    if (dragItem.current && dragOverItem.current && dragItem.current !== dragOverItem.current) {
      const dragItemIndex = tools.findIndex(t => t.id === dragItem.current);
      const dragOverItemIndex = tools.findIndex(t => t.id === dragOverItem.current);

      const newTools = [...tools];
      const [reorderedItem] = newTools.splice(dragItemIndex, 1);
      newTools.splice(dragOverItemIndex, 0, reorderedItem);
      setTools(newTools);
    }
    dragItem.current = null;
    dragOverItem.current = null;
    setDraggedToolId(null);
  };

  // --- Click Outside for Icon Picker ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (iconPickerRef.current && !iconPickerRef.current.contains(event.target as Node)) {
        setOpenIconPickerId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  // FIX: Implemented the `renderAuthFields` function to return appropriate JSX based on the authentication type.
  // This resolves the TypeScript error where a function returning `void` was used as a ReactNode.
  const renderAuthFields = () => {
    if (!tempWebhook) return null;
    const auth = tempWebhook.auth;

    switch (auth.type) {
      case 'basic':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">Username</label>
              <input
                type="text"
                value={auth.username || ''}
                onChange={(e) => handleAuthDetailChange('username', e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-3 py-2 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">Password</label>
              <input
                type="password"
                value={auth.password || ''}
                onChange={(e) => handleAuthDetailChange('password', e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-3 py-2 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        );
      case 'header':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">Header Name</label>
              <input
                type="text"
                value={auth.headerName || ''}
                onChange={(e) => handleAuthDetailChange('headerName', e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-3 py-2 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">Header Value</label>
              <input
                type="text"
                value={auth.headerValue || ''}
                onChange={(e) => handleAuthDetailChange('headerValue', e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-3 py-2 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        );
      case 'jwt':
        return (
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">Bearer Token</label>
            <textarea
              value={auth.token || ''}
              onChange={(e) => handleAuthDetailChange('token', e.target.value)}
              rows={3}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-3 py-2 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>
        );
      default:
        return null;
    }
  };

  const renderWebhookTab = () => (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-indigo-300">Webhook Profiles</h3>
        <button
          onClick={handleAddNewWebhook}
          className="flex items-center gap-1 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-indigo-300 rounded-md text-sm transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Add New</span>
        </button>
      </div>

      {editingWebhookId && tempWebhook ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 space-y-4 shadow-lg">
          <h4 className="text-md font-medium text-white mb-2">
            {localWebhooks.find(w => w.id === editingWebhookId)?.name === 'New Webhook' ? 'Create Webhook' : 'Edit Webhook'}
          </h4>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">Profile Name</label>
            <input
              type="text"
              value={tempWebhook.name}
              onChange={(e) => setTempWebhook({ ...tempWebhook, name: e.target.value })}
              placeholder="e.g., Production Bot"
              className="w-full bg-neutral-950 border border-neutral-700 rounded-md px-3 py-2 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">n8n Webhook URL</label>
            <input
              type="text"
              value={tempWebhook.url}
              onChange={(e) => setTempWebhook({ ...tempWebhook, url: e.target.value })}
              placeholder="https://your-n8n-instance/webhook/..."
              className="w-full bg-neutral-950 border border-neutral-700 rounded-md px-3 py-2 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">Auth Method</label>
            <select
              value={tempWebhook.auth.type}
              onChange={handleAuthTypeChange}
              className="w-full bg-neutral-950 border border-neutral-700 rounded-md px-3 py-2 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="none">None</option>
              <option value="basic">Basic Auth</option>
              <option value="header">Header Auth</option>
              <option value="jwt">JWT Auth</option>
            </select>
          </div>

          {tempWebhook.auth.type !== 'none' && (
            <div className="border-t border-neutral-800 pt-4">
              {renderAuthFields()}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={handleCancelEdit}
              className="px-3 py-1.5 text-sm text-neutral-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-md transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {localWebhooks.length === 0 ? (
            <div className="text-center py-8 text-neutral-500 border border-dashed border-neutral-800 rounded-lg">
              <p>No webhooks configured.</p>
              <button onClick={handleAddNewWebhook} className="text-indigo-400 hover:text-indigo-300 text-sm mt-2">Create one now</button>
            </div>
          ) : (
            localWebhooks.map(webhook => (
              <div
                key={webhook.id}
                onClick={() => handleSelectActive(webhook.id)}
                className={`group relative p-3 rounded-lg border transition-all cursor-pointer ${localActiveId === webhook.id
                  ? 'bg-indigo-500/10 border-indigo-500/50 shadow-md'
                  : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
                  }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${localActiveId === webhook.id
                      ? 'border-indigo-500 bg-indigo-500 text-white'
                      : 'border-neutral-600'
                      }`}>
                      {localActiveId === webhook.id && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                    <div>
                      <h4 className={`font-medium ${localActiveId === webhook.id ? 'text-white' : 'text-neutral-300'}`}>
                        {webhook.name}
                      </h4>
                      <p className="text-xs text-neutral-500 truncate max-w-[200px] sm:max-w-[300px]">
                        {webhook.url || 'No URL set'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEditWebhook(webhook); }}
                      className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-md"
                      title="Edit"
                    >
                      <EditIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteWebhook(webhook.id, e)}
                      className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-neutral-800 rounded-md"
                      title="Delete"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <p className="text-xs text-neutral-500 text-center pt-4">
        Select a profile to make it active. All settings are saved locally.
      </p>
    </div>
  );

  const renderToolboxTab = () => (
    <div className="space-y-4 animate-fade-in-up">
      <div>
        <h3 className="text-lg font-semibold text-indigo-300">Toolbox Management</h3>
        <p className="text-sm text-neutral-400 mt-1">Create and arrange quick-access tools for your chat input.</p>
      </div>
      <div className="space-y-3">
        {tools.map((tool) => {
          const isDragging = draggedToolId === tool.id;
          return (
            <div
              key={tool.id}
              draggable
              onDragStart={(e) => handleDragStart(e, tool.id)}
              onDragEnter={() => handleDragEnter(tool.id)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()}
              className={`bg-neutral-900 p-3 rounded-lg border border-neutral-800 transition-all ${isDragging ? 'opacity-50 scale-105 shadow-2xl' : 'opacity-100 scale-100 shadow-md'}`}
            >
              <div className="flex items-start gap-2">
                <div className="text-neutral-600 hover:text-neutral-400 cursor-grab pt-2" title="Drag to reorder">
                  <GripVerticalIcon className="w-5 h-5" />
                </div>
                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-neutral-400 mb-1">Name</label>
                      <input
                        type="text"
                        value={tool.name}
                        onChange={(e) => handleToolChange(tool.id, 'name', e.target.value)}
                        placeholder="e.g., Create Image"
                        className="w-full bg-neutral-800/50 border border-neutral-700 rounded-md px-2 py-1.5 text-sm text-neutral-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="relative">
                      <label className="block text-xs text-neutral-400 mb-1">Icon</label>
                      <button
                        onClick={() => setOpenIconPickerId(openIconPickerId === tool.id ? null : tool.id)}
                        className="w-full flex items-center justify-between bg-neutral-800/50 border border-neutral-700 rounded-md px-2 py-1.5 text-sm text-neutral-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <div className="flex items-center gap-2">
                          <ToolIcon icon={tool.icon} className="w-4 h-4" />
                          <span className="capitalize">{tool.icon.replace('-', ' ')}</span>
                        </div>
                        <ChevronDownIcon className="w-4 h-4 text-neutral-500" />
                      </button>
                      {openIconPickerId === tool.id && (
                        <div ref={iconPickerRef} className="absolute top-full mt-1.5 w-full bg-neutral-800 border border-neutral-700 rounded-md shadow-lg p-2 z-20 grid grid-cols-4 gap-1">
                          {toolIcons.map(iconName => (
                            <button
                              key={iconName}
                              onClick={() => {
                                handleToolChange(tool.id, 'icon', iconName);
                                setOpenIconPickerId(null);
                              }}
                              className="flex flex-col items-center justify-center p-2 rounded-md hover:bg-indigo-500/20 text-neutral-400 hover:text-indigo-300 transition-colors"
                              title={iconName.replace('-', ' ')}
                            >
                              <ToolIcon icon={iconName} className="w-5 h-5" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-400 mb-1">Prompt Prefix</label>
                    <textarea
                      value={tool.prompt}
                      onChange={(e) => handleToolChange(tool.id, 'prompt', e.target.value)}
                      placeholder="Text to prepend to the user's message"
                      rows={2}
                      className="w-full bg-neutral-800/50 border border-neutral-700 rounded-md px-2 py-1.5 text-sm text-neutral-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-400 mb-1">Description (Optional)</label>
                    <input
                      type="text"
                      value={tool.description || ''}
                      onChange={(e) => handleToolChange(tool.id, 'description', e.target.value)}
                      placeholder="Briefly describe what this tool does"
                      className="w-full bg-neutral-800/50 border border-neutral-700 rounded-md px-2 py-1.5 text-sm text-neutral-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div className="pt-1">
                  <button onClick={() => handleRemoveTool(tool.id)} className="p-1 text-neutral-500 hover:text-red-400" title="Remove tool">
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        <button
          onClick={handleAddTool}
          className="w-full px-4 py-2 bg-neutral-800 text-indigo-300 rounded-md hover:bg-neutral-700 transition-colors text-sm font-medium"
        >
          + Add New Tool
        </button>
      </div>
    </div>
  );


  return (
    <div className="fixed inset-0 bg-neutral-950 sm:bg-black/70 sm:backdrop-blur-sm z-50 sm:flex sm:items-center sm:justify-center sm:p-4">
      <div className="bg-neutral-950 h-full w-full sm:h-auto sm:max-h-[90vh] sm:max-w-xl sm:rounded-lg sm:shadow-xl sm:border sm:border-neutral-800 animate-fade-in-up flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 flex justify-between items-center p-4 border-b border-neutral-800" style={{ paddingTop: `calc(1rem + env(safe-area-inset-top, 0rem))` }}>
          <h2 className="text-xl font-bold text-indigo-400">Settings</h2>
          <button onClick={onClose} className="p-2 rounded-full text-neutral-400 hover:bg-neutral-800">
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex-shrink-0 flex border-b border-neutral-800 px-4">
          <button
            onClick={() => setActiveTab('webhook')}
            className={`px-3 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'webhook' ? 'border-indigo-400 text-white' : 'border-transparent text-neutral-400 hover:text-white'}`}
          >
            Webhook
          </button>
          <button
            onClick={() => setActiveTab('toolbox')}
            className={`px-3 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'toolbox' ? 'border-indigo-400 text-white' : 'border-transparent text-neutral-400 hover:text-white'}`}
          >
            Toolbox
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'webhook' ? renderWebhookTab() : renderToolboxTab()}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex justify-end space-x-3 p-4 border-t border-neutral-800 bg-neutral-950 sm:rounded-b-lg" style={{ paddingBottom: `calc(1rem + env(safe-area-inset-bottom, 0rem))` }}>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-700 text-white rounded-md hover:bg-neutral-600 transition-colors flex-1 sm:flex-none"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-md hover:opacity-90 transition-opacity flex-1 sm:flex-none"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;