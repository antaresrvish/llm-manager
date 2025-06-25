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
    
    // Get the appropriate API key for this provider
    const apiKey = this.getProviderApiKey(config);
    
    this.client = axios.create({
      baseURL: baseURL || config.endpoint,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
  }

  protected getProviderApiKey(config: ProviderConfig): string {
    switch (this.name) {
      case ProviderType.OPENAI:
        return config.openai_key || '';
      case ProviderType.CLAUDE:
        return config.claude_key || '';
      case ProviderType.GEMINI:
        return config.gemini_key || '';
      case ProviderType.AZURE:
        return config.azure_key || '';
      default:
        return config.openai_key || '';
    }
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
