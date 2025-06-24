import axios, { AxiosInstance } from 'axios';
import { 
  BaseProvider, 
  ProviderType, 
  HealthCheckResult, 
  HealthStatus, 
  ChatOptions, 
  TTSOptions, 
  STTOptions,
  ProviderConfig 
} from '../types';

export abstract class AbstractProvider implements BaseProvider {
  protected client: AxiosInstance;
  protected config: ProviderConfig;

  constructor(
    public name: ProviderType,
    config: ProviderConfig,
    baseURL?: string
  ) {
    this.config = config;
    this.client = axios.create({
      baseURL: baseURL || config.endpoint,
      headers: {
        'Authorization': `Bearer ${config.api_key}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
  }

  abstract healthCheck(): Promise<HealthCheckResult>;
  abstract chat(options: ChatOptions): Promise<string>;
  
  // Optional methods with default implementations
  async tts(options: TTSOptions): Promise<Buffer> {
    throw new Error(`TTS not implemented for ${this.name}`);
  }

  async stt(options: STTOptions): Promise<string> {
    throw new Error(`STT not implemented for ${this.name}`);
  }

  protected async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
