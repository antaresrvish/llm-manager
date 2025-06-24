export enum ProviderType {
  OPENAI = 'openai',
  CLAUDE = 'claude',
  GEMINI = 'gemini',
  AZURE = 'azure'
}

export enum ServiceType {
  TEXT = 'text',
  TTS = 'tts',
  STT = 'stt'
}

export enum HealthStatus {
  UP = 'up',
  DOWN = 'down',
  UNKNOWN = 'unknown'
}

export interface ModelConfig {
  name: string;
  provider: ProviderType;
  apiKey?: string;
  endpoint?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface ProviderConfig {
  default_model: string;
  retry: number;
  retry_delay: number;
  other_models?: Record<string, string>;
  api_key?: string;
  endpoint?: string;
}

export interface LLMManagerConfig {
  [key: string]: ProviderConfig;
}

export interface HealthCheckResult {
  provider: ProviderType;
  status: HealthStatus;
  lastChecked: Date;
  responseTime?: number;
  error?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatOptions {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface TTSOptions {
  text: string;
  voice?: string;
  format?: string;
  speed?: number;
}

export interface STTOptions {
  audio: Buffer | string;
  format?: string;
  language?: string;
}

export interface BaseProvider {
  name: ProviderType;
  healthCheck(): Promise<HealthCheckResult>;
  chat(options: ChatOptions): Promise<string>;
  tts?(options: TTSOptions): Promise<Buffer>;
  stt?(options: STTOptions): Promise<string>;
}

export interface ProviderHealth {
  provider: ProviderType;
  status: HealthStatus;
  lastChecked: Date;
  responseTime?: number;
  priority: number;
}
