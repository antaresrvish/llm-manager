import { AbstractProvider } from './base-provider';
import { 
  ProviderType, 
  HealthCheckResult, 
  HealthStatus, 
  ChatOptions, 
  ProviderConfig 
} from '../types';

export class GeminiProvider extends AbstractProvider {
  constructor(config: ProviderConfig) {
    super(ProviderType.GEMINI, config, 'https://generativelanguage.googleapis.com/v1beta');
    
    // Override auth for Gemini (uses API key as query param)
    delete this.client.defaults.headers['Authorization'];
  }

  async healthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    try {
      const response = await this.client.get(`/models?key=${this.config.api_key}`);
      const responseTime = Date.now() - startTime;
      
      return {
        provider: this.name,
        status: response.status === 200 ? HealthStatus.UP : HealthStatus.DOWN,
        lastChecked: new Date(),
        responseTime
      };
    } catch (error) {
      return {
        provider: this.name,
        status: HealthStatus.DOWN,
        lastChecked: new Date(),
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async chat(options: ChatOptions): Promise<string> {
    const model = this.config.default_model || 'gemini-1.5-flash';
    
    // Convert messages to Gemini format
    const contents = options.messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const payload = {
      contents,
      generationConfig: {
        temperature: options.temperature || 0.7,
        maxOutputTokens: options.maxTokens || 1000
      }
    };

    const response = await this.client.post(
      `/models/${model}:generateContent?key=${this.config.api_key}`,
      payload
    );

    return response.data.candidates[0]?.content?.parts[0]?.text || '';
  }
}
