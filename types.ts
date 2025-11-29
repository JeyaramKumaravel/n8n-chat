export type MessageType = 'text' | 'audio' | 'video' | 'image' | 'file';

export type MessageStatus = 'sending' | 'sent' | 'error';

export interface BaseMessage {
  id: string;
  sender: 'user' | 'bot';
  timestamp: string;
  status?: MessageStatus;
}

export interface TextMessage extends BaseMessage {
  type: 'text';
  content: string;
}

export interface MediaMessage extends BaseMessage {
  type: 'audio' | 'video' | 'image' | 'file';
  content: string; // URL or Data URI to the media
  fileName?: string;
  mimeType?: string;
}

export type Message = TextMessage | MediaMessage;

export interface MessageContent {
  text: string;
  files: File[];
  displayText?: string;
  // This will be transformed into a message type on send
}

export interface BotResponse {
  type: MessageType;
  content: string;
  fileName?: string;
  mimeType?: string;
}

// --- Toolbox Types ---
export type ToolIconName = 'image' | 'lightbulb' | 'book-open' | 'globe' | 'search' | 'default' | 'tune' | 'deep-research' | 'code' | 'database' | 'mail' | 'calendar' | 'terminal' | 'cpu' | 'zap' | 'activity' | 'cloud' | 'command' | 'folder' | 'key' | 'layers' | 'lock' | 'message-square' | 'monitor' | 'package' | 'pie-chart' | 'refresh' | 'save' | 'shield' | 'star' | 'tag' | 'target' | 'upload' | 'users' | 'video' | 'play-circle' | 'pause-circle' | 'camera' | 'music' | 'film' | 'mic' | 'headphones' | 'speaker';

export interface Tool {
  id: string;
  name: string;
  icon: ToolIconName;
  prompt: string;
  description?: string;
}


// --- Authentication Types ---

export type AuthType = 'none' | 'basic' | 'header' | 'jwt';

export interface NoAuth {
  type: 'none';
}

export interface BasicAuth {
  type: 'basic';
  username?: string;
  password?: string;
}

export interface HeaderAuth {
  type: 'header';
  headerName?: string;
  headerValue?: string;
}

export interface JwtAuth {
  type: 'jwt';
  token?: string;
}

export type AuthConfig = NoAuth | BasicAuth | HeaderAuth | JwtAuth;

export interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  auth: AuthConfig;
}