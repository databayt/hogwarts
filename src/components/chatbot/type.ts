export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

export interface ChatbotState {
  isOpen: boolean;
  messages: ChatMessage[];
  isLoading: boolean;
  error?: string;
}

export interface ChatbotTheme {
  primaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: string;
  fontFamily?: string;
  buttonSize?: 'sm' | 'md' | 'lg';
  windowWidth?: string;
  windowHeight?: string;
  shadowLevel?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

export interface ChatbotAPIConfig {
  endpoint?: string;
  model?: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  headers?: Record<string, string>;
}

export interface ChatbotDictionary {
  openChat: string;
  closeChat: string;
  placeholder: string;
  welcomeMessage: string;
  noMessages: string;
  errorMessage: string;
  typing: string;
  send: string;
  retry: string;
  [key: string]: string;
}

export interface ChatbotConfig {
  // Positioning and Layout
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

  // Content and Messaging
  welcomeMessage?: string;
  placeholder?: string;
  title?: string;
  subtitle?: string;

  // Localization
  locale?: 'en' | 'ar';
  dictionary?: Partial<ChatbotDictionary>;

  // Appearance
  theme?: ChatbotTheme;
  avatar?: string;

  // API Configuration
  api?: ChatbotAPIConfig;

  // Features
  enableTypingIndicator?: boolean;
  enableTimestamps?: boolean;
  enableSounds?: boolean;
  enablePersistence?: boolean;

  // Behavior
  autoOpen?: boolean;
  autoOpenDelay?: number;
  maxMessages?: number;
  storageKey?: string;
}

export type PromptType = 'saasMarketing' | 'schoolSite';

export interface ChatbotProps {
  config?: ChatbotConfig;
  className?: string;
  promptType?: PromptType;
  onMessageSend?: (message: string) => void;
  onChatOpen?: () => void;
  onChatClose?: () => void;
  onError?: (error: string) => void;
  children?: React.ReactNode;
}

export interface ChatButtonProps {
  onClick: () => void;
  isOpen: boolean;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  locale?: 'en' | 'ar';
  dictionary: ChatbotDictionary;
  theme?: ChatbotTheme;
  avatar?: string;
}

export interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  error?: string;
  placeholder?: string;
  locale?: 'en' | 'ar';
  dictionary: ChatbotDictionary;
  theme?: ChatbotTheme;
  title?: string;
  subtitle?: string;
  enableTypingIndicator?: boolean;
  enableTimestamps?: boolean;
}

export interface ChatbotHookConfig {
  apiEndpoint?: string;
  onError?: (error: string) => void;
  enablePersistence?: boolean;
  storageKey?: string;
  maxMessages?: number;
}
