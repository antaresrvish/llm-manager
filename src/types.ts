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
  openai_key?: string; // OpenAI API key
  gemini_key?: string; // Gemini API key
  claude_key?: string; // Claude API key
  azure_key?: string; // Azure API key
  // Claude specific options
  endpoint?: string;
  // Gemini specific options
  response_mime_type?: string; // For structured output
  response_schema?: object; // JSON schema for structured output
  // General options
  clean_json_response?: boolean; // Remove markdown formatting from JSON
  // Global model parameters - applied to all models in this config
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
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
  top_p?: number;
  maxTokens?: number;
  stream?: boolean;
  // Structured output options
  response_mime_type?: string;
  response_schema?: object;
  clean_json_response?: boolean;
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
