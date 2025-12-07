import type { ChatbotConfig } from './type';
import { DEFAULT_CONFIG, DEFAULT_THEME, DEFAULT_DICTIONARY } from './constant';

/**
 * Merge user configuration with defaults
 */
export function mergeConfig(userConfig: ChatbotConfig = {}): Required<ChatbotConfig> {
  return {
    position: userConfig.position ?? DEFAULT_CONFIG.position,
    welcomeMessage: userConfig.welcomeMessage ?? DEFAULT_CONFIG.welcomeMessage,
    placeholder: userConfig.placeholder ?? DEFAULT_CONFIG.placeholder,
    title: userConfig.title ?? DEFAULT_CONFIG.title,
    subtitle: userConfig.subtitle ?? DEFAULT_CONFIG.subtitle,
    locale: userConfig.locale ?? DEFAULT_CONFIG.locale,
    dictionary: { ...DEFAULT_DICTIONARY, ...userConfig.dictionary },
    theme: { ...DEFAULT_THEME, ...userConfig.theme },
    avatar: userConfig.avatar ?? DEFAULT_CONFIG.avatar,
    api: { ...DEFAULT_CONFIG.api, ...userConfig.api },
    enableTypingIndicator: userConfig.enableTypingIndicator ?? DEFAULT_CONFIG.enableTypingIndicator,
    enableTimestamps: userConfig.enableTimestamps ?? DEFAULT_CONFIG.enableTimestamps,
    enableSounds: userConfig.enableSounds ?? DEFAULT_CONFIG.enableSounds,
    enablePersistence: userConfig.enablePersistence ?? DEFAULT_CONFIG.enablePersistence,
    autoOpen: userConfig.autoOpen ?? DEFAULT_CONFIG.autoOpen,
    autoOpenDelay: userConfig.autoOpenDelay ?? DEFAULT_CONFIG.autoOpenDelay,
    maxMessages: userConfig.maxMessages ?? DEFAULT_CONFIG.maxMessages,
    storageKey: userConfig.storageKey ?? DEFAULT_CONFIG.storageKey,
  };
}
