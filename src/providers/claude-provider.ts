import { AbstractProvider } from './base-provider';
import { 
  ProviderType, 
  HealthCheckResult, 
  HealthStatus, 
  ChatOptions, 
  ProviderConfig 
} from '../types';

export class ClaudeProvider extends AbstractProvider {
  constructor(config: ProviderConfig) {
    super(ProviderType.CLAUDE, config, 'https://api.anthropic.com/v1');
    
    // Override headers for Claude
    if (config.api_key) {
      this.client.defaults.headers['x-api-key'] = config.api_key;
    }
    this.client.defaults.headers['anthropic-version'] = '2023-06-01';
    delete this.client.defaults.headers['Authorization'];
  }

  async healthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    try {
      // Claude doesn't have a models endpoint, so we'll do a minimal completion
      const response = await this.client.post('/messages', {
        model: this.config.default_model || 'claude-3-sonnet-20240229',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'Hi' }]
      });
      
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
    const payload = {
      model: this.config.default_model || 'claude-3-sonnet-20240229',
      max_tokens: options.maxTokens || 1000,
      messages: options.messages,
      temperature: options.temperature || 0.7
    };

    const response = await this.client.post('/messages', payload);
    return response.data.content[0]?.text || '';
  }
}
