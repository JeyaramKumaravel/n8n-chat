import React, { useState, useRef, useCallback, useEffect } from 'react';
import { MessageContent, Tool } from '../types';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { SendIcon } from './icons/SendIcon';
import { StopIcon } from './icons/StopIcon';
import { XIcon } from './icons/XIcon';
import { TrashIcon } from './icons/TrashIcon';
import { ToolIcon } from './ToolIcon';
import { PlusIcon } from './icons/PlusIcon';
import { TuneIcon } from './icons/TuneIcon';
import { FileTextIcon } from './icons/FileTextIcon';

// FIX: Refactored FilePreview to use a standard functional component definition with an interface for props.
// This resolves a TypeScript error where the `key` prop in a list was being incorrectly type-checked against the component's props.
interface FilePreviewProps {
  file: File;
  onRemove: () => void;
}

const FilePreview: React.FC<FilePreviewProps> = ({ file, onRemove }) => {
  const getFileTypeLabel = (type: string) => {
    if (type === 'text/plain') return 'TXT';
    if (type.startsWith('image/')) return 'IMG';
    if (type.startsWith('video/')) return 'VID';
    if (type.startsWith('audio/')) return 'AUD';
    if (type === 'application/pdf') return 'PDF';
    return type.split('/')[1]?.substring(0, 3).toUpperCase() || 'FILE';
  };

  return (
    <div className="bg-neutral-800/60 rounded-lg p-2 flex items-center gap-3 text-sm animate-fade-in-up w-56 flex-shrink-0">
      <div className="flex items-center gap-1.5 text-blue-400 flex-shrink-0">
        <FileTextIcon className="w-4 h-4" />
        <span className="font-bold text-xs">{getFileTypeLabel(file.type)}</span>
      </div>
      <span className="truncate flex-1 text-neutral-300">{file.name}</span>
      <button onClick={onRemove} className="text-neutral-500 hover:text-white flex-shrink-0">
        <XIcon className="w-4 h-4" />
      </button>
    </div>
  )
}


interface ChatInputProps {
  onSendMessage: (content: MessageContent) => void;
  disabled: boolean;
  tools: Tool[];
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled, tools }) => {
  const [text, setText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isToolboxOpen, setIsToolboxOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [showSlashCommands, setShowSlashCommands] = useState(false);
  const [filteredTools, setFilteredTools] = useState<Tool[]>([]);
  const [highlightedToolIndex, setHighlightedToolIndex] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const isCancelledRef = useRef<boolean>(false);
  const toolboxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea && !isRecording) {
      textarea.style.height = 'auto';
      const maxHeight = 160; // Corresponds to max-h-40
      textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
    }
  }, [text, isRecording]);

  // Close toolbox on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolboxRef.current && !toolboxRef.current.contains(event.target as Node)) {
        setIsToolboxOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSend = () => {
    if (disabled || (!text.trim() && files.length === 0)) return;
    const webhookText = selectedTool ? `${selectedTool.prompt}${text}` : text;
    onSendMessage({ text: webhookText, files, displayText: text });
    setText('');
    setFiles([]);
    setSelectedTool(null);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFiles(prev => [...prev, ...Array.from(event.target.files!)]);
    }
  };

  const handleToolClick = (tool: Tool) => {
    setSelectedTool(tool);
    setIsToolboxOpen(false);
    textareaRef.current?.focus();
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const stopRecordingCleanup = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setIsRecording(false);
    setRecordingTime(0);
  }, []);

  const startRecording = useCallback(async () => {
    if (isRecording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      isCancelledRef.current = false;

      mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        if (!isCancelledRef.current) {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const audioFile = new File([audioBlob], `recording-${Date.now()}.webm`, { type: 'audio/webm' });
          setFiles(prev => [...prev, audioFile]);
        }
        stream.getTracks().forEach(track => track.stop());
        stopRecordingCleanup();
      };

      mediaRecorder.start();
      setIsRecording(true);
      timerIntervalRef.current = window.setInterval(() => {
        setRecordingTime(prevTime => prevTime + 1);
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access was denied. Please allow microphone access in your browser settings.");
    }
  }, [isRecording, stopRecordingCleanup]);

  const stopRecording = useCallback(() => {
    if (!isRecording || !mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return;
    isCancelledRef.current = false;
    mediaRecorderRef.current.stop();
  }, [isRecording]);

  const cancelRecording = useCallback(() => {
    if (!isRecording || !mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return;
    isCancelledRef.current = true;
    mediaRecorderRef.current.stop();
  }, [isRecording]);

  const handleSelectToolViaSlash = (tool: Tool) => {
    setSelectedTool(tool);
    setText('');
    setShowSlashCommands(false);
    textareaRef.current?.focus();
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);

    const match = newText.match(/^\/([^\s]*)$/);

    if (match) {
      const query = match[1].toLowerCase();
      const matchingTools = tools.filter(tool =>
        tool.name.toLowerCase().replace(/\s/g, '').startsWith(query)
      );
      if (matchingTools.length > 0) {
        setFilteredTools(matchingTools);
        setShowSlashCommands(true);
        setHighlightedToolIndex(0);
      } else {
        setShowSlashCommands(false);
      }
    } else {
      setShowSlashCommands(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSlashCommands && filteredTools.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedToolIndex(prev => (prev + 1) % filteredTools.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedToolIndex(prev => (prev - 1 + filteredTools.length) % filteredTools.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        handleSelectToolViaSlash(filteredTools[highlightedToolIndex]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowSlashCommands(false);
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const hasContent = text.trim().length > 0 || files.length > 0;

  return (
    <div className="relative">
      {showSlashCommands && (
        <div className="absolute bottom-full left-0 mb-2 w-full sm:w-80 bg-neutral-900 border border-neutral-800 rounded-lg shadow-2xl p-2 z-10 animate-fade-in-up max-h-60 overflow-y-auto">
          <p className="px-2 pb-1.5 text-xs text-neutral-500 font-semibold">SELECT TOOL</p>
          <ul className="space-y-1">
            {filteredTools.map((tool, index) => (
              <li key={tool.id}>
                <button
                  onClick={() => handleSelectToolViaSlash(tool)}
                  className={`w-full flex items-center gap-3 p-2 text-left rounded-md text-neutral-300 transition-colors ${index === highlightedToolIndex ? 'bg-neutral-800' : 'hover:bg-neutral-800'
                    }`}
                >
                  <ToolIcon icon={tool.icon} />
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-baseline">
                      <p className="truncate font-medium">{tool.name}</p>
                      <p className="truncate text-xs text-neutral-500 ml-2">/{tool.name.toLowerCase().replace(/\s/g, '')}</p>
                    </div>
                    {tool.description && <p className="truncate text-xs text-neutral-400">{tool.description}</p>}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="bg-neutral-950/80 backdrop-blur-md border border-neutral-800 rounded-2xl p-3 flex flex-col shadow-lg">
        {files.length > 0 && (
          <div className="px-1 pt-1 mb-3 border-b border-neutral-800">
            <div className="flex flex-row gap-2 mb-3 overflow-x-auto pb-2">
              {files.map((file, index) => (
                <FilePreview key={file.name + index} file={file} onRemove={() => removeFile(index)} />
              ))}
            </div>
          </div>
        )}

        {isRecording ? (
          <div className="flex-1 flex items-center justify-between gap-3 px-2 h-[44px]">
            <button
              onClick={cancelRecording}
              className="p-2 text-neutral-400 hover:text-red-500 transition-colors"
              aria-label="Cancel recording"
            >
              <TrashIcon className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="font-mono text-neutral-300 w-12">{formatTime(recordingTime)}</span>
            </div>
            <div className="recording-visualizer flex items-center justify-center gap-1 w-24 h-6">
              <div className="w-1 h-2 bg-purple-400 rounded-full" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-1 h-3 bg-purple-400 rounded-full" style={{ animationDelay: '0.3s' }}></div>
              <div className="w-1 h-5 bg-purple-400 rounded-full" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-1 h-4 bg-purple-400 rounded-full" style={{ animationDelay: '0s' }}></div>
              <div className="w-1 h-2 bg-purple-400 rounded-full" style={{ animationDelay: '0.4s' }}></div>
            </div>
            <button
              onClick={stopRecording}
              className="p-2 transition-colors disabled:opacity-50 text-green-500 hover:text-green-400"
              disabled={disabled}
              aria-label="Stop recording"
            >
              <StopIcon className="w-6 h-6" />
            </button>
          </div>
        ) : (
          <>
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder={selectedTool ? `Message with ${selectedTool.name}` : `Type '/' for tools, or send a message...`}
              className="w-full bg-transparent resize-none outline-none placeholder-neutral-500 px-1 text-base max-h-40 overflow-y-auto"
              rows={1}
              disabled={disabled}
            />

            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-neutral-400 hover:text-indigo-400 disabled:opacity-50 transition-all rounded-full hover:bg-neutral-800"
                disabled={disabled}
                aria-label="Attach file"
              >
                <PlusIcon className="w-6 h-6" />
              </button>
              <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} className="hidden" />

              <div className="relative" ref={toolboxRef}>
                <button
                  onClick={() => setIsToolboxOpen(prev => !prev)}
                  className="p-2 text-neutral-400 hover:text-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all rounded-full hover:bg-neutral-800"
                  disabled={disabled || tools.length === 0}
                  aria-label="Open tools"
                >
                  <TuneIcon className="w-6 h-6" />
                </button>
                {isToolboxOpen && (
                  <div className="absolute bottom-full left-0 mb-2 w-64 bg-neutral-900 border border-neutral-800 rounded-lg shadow-2xl p-2 z-10 animate-fade-in-up">
                    <ul className="space-y-1">
                      {tools.map(tool => (
                        <li key={tool.id}>
                          <button
                            onClick={() => handleToolClick(tool)}
                            className="w-full flex items-center gap-3 p-2 text-left rounded-md text-neutral-300 hover:bg-neutral-800 transition-colors">
                            <ToolIcon icon={tool.icon} />
                            <div className="flex-1 overflow-hidden text-left">
                              <p className="truncate text-sm font-medium text-neutral-300">{tool.name}</p>
                              {tool.description && <p className="truncate text-xs text-neutral-500">{tool.description}</p>}
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {selectedTool && (
                <div className="bg-blue-900/50 text-blue-300 border border-blue-800/70 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 text-sm font-medium animate-fade-in-up">
                  <ToolIcon icon={selectedTool.icon} className="w-4 h-4" />
                  <span>{selectedTool.name}</span>
                  <button onClick={() => setSelectedTool(null)} className="text-blue-400/70 hover:text-blue-300 -mr-1">
                    <XIcon className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="flex-1" />

              {hasContent ? (
                <button
                  onClick={handleSend}
                  className="p-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full text-white hover:opacity-90 transition-all disabled:from-neutral-700 disabled:to-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={disabled}
                  aria-label="Send message"
                >
                  <SendIcon className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={startRecording}
                  className="p-2 text-neutral-400 hover:text-indigo-400 transition-colors disabled:opacity-50"
                  disabled={disabled}
                  aria-label="Start recording"
                >
                  <MicrophoneIcon className="w-6 h-6" />
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatInput;