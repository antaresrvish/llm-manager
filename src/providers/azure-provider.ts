import { AbstractProvider } from './base-provider';
import { 
  ProviderType, 
  HealthCheckResult, 
  HealthStatus, 
  ChatOptions, 
  TTSOptions, 
  STTOptions,
  ProviderConfig 
} from '../types';

export class AzureProvider extends AbstractProvider {
  constructor(config: ProviderConfig) {
    const baseURL = config.endpoint || 'https://your-resource.openai.azure.com/openai/deployments';
    super(ProviderType.AZURE, config, baseURL);
    
    // Override headers for Azure
    if (config.api_key) {
      this.client.defaults.headers['api-key'] = config.api_key;
    }
    this.client.defaults.params = { 'api-version': '2024-02-15-preview' };
    delete this.client.defaults.headers['Authorization'];
  }

  async healthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    try {
      // Azure uses deployment-specific endpoints
      const deploymentName = this.config.default_model || 'gpt-4';
      const response = await this.client.post(`/${deploymentName}/chat/completions`, {
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 1,
        temperature: 0
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
    const deploymentName = this.config.default_model || 'gpt-4';
    
    const payload: any = {
      messages: options.messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 1000,
      stream: options.stream || false
    };

    // Azure structured output support (for compatible models)
    if (options.response_schema || this.config.response_schema) {
      payload.response_format = {
        type: "json_schema",
        json_schema: {
          name: "response",
          schema: options.response_schema || this.config.response_schema
        }
      };
    }

    const response = await this.client.post(
      `/${deploymentName}/chat/completions`,
      payload
    );

    let result = response.data.choices[0]?.message?.content || '';
    
    // Clean JSON response if requested
    const shouldCleanJson = options.clean_json_response ?? this.config.clean_json_response ?? false;
    if (shouldCleanJson) {
      result = this.cleanJsonResponse(result);
    }
    
    return result;
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

  async tts(options: TTSOptions): Promise<Buffer> {
    const deploymentName = 'tts-1'; // Azure TTS deployment name
    
    const payload = {
      input: options.text,
      voice: options.voice || 'alloy',
      response_format: options.format || 'mp3',
      speed: options.speed || 1.0
    };

    const response = await this.client.post(
      `/${deploymentName}/audio/speech`,
      payload,
      { responseType: 'arraybuffer' }
    );

    return Buffer.from(response.data);
  }

  async stt(options: STTOptions): Promise<string> {
    const deploymentName = 'whisper-1'; // Azure STT deployment name
    
    const formData = new FormData();
    
    if (typeof options.audio === 'string') {
      formData.append('file', options.audio);
    } else {
      formData.append('file', new Blob([options.audio]));
    }
    
    formData.append('language', options.language || 'en');

    const response = await this.client.post(
      `/${deploymentName}/audio/transcriptions`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    return response.data.text || '';
  }
}
