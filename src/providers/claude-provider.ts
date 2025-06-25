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
        model: this.getCompatibleModel(),
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
      model: this.getCompatibleModel(),
      max_tokens: options.maxTokens || 1000,
      messages: options.messages,
      temperature: options.temperature || 0.7
    };

    const response = await this.client.post('/messages', payload);
    let result = response.data.content[0]?.text || '';
    
    // Clean JSON response if requested
    const shouldCleanJson = options.clean_json_response ?? this.config.clean_json_response ?? false;
    if (shouldCleanJson) {
      result = this.cleanJsonResponse(result);
    }
    
    return result;
  }

  private getCompatibleModel(): string {
    const configModel = this.config.default_model?.toLowerCase() || '';
    
    // If it's already a Claude model, use it as is
    if (configModel.includes('claude')) {
      return this.config.default_model;
    }
    
    // Check if there's a Claude model specified in other_models
    if (this.config.other_models && this.config.other_models.claude) {
      return this.config.other_models.claude;
    }
    
    // Default to a compatible Claude model
    return 'claude-3-sonnet-20240229';
  }

  private cleanJsonResponse(text: string): string {
    // Remove markdown code blocks for JSON
    text = text.replace(/```json\s*/gi, '');
    text = text.replace(/```\s*$/gi, '');
    
    // Remove any leading/trailing whitespace
    text = text.trim();
    
    // Try to find JSON object/array and extract it
    const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (jsonMatch) {
      return jsonMatch[0];
    }
    
    return text;
  }
}
