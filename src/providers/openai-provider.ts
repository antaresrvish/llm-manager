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

export class OpenAIProvider extends AbstractProvider {
  constructor(config: ProviderConfig) {
    super(ProviderType.OPENAI, config, 'https://api.openai.com/v1');
  }

  async healthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    try {
      const response = await this.client.get('/models');
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
      model: this.config.default_model,
      messages: options.messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 1000,
      stream: options.stream || false
    };

    const response = await this.client.post('/chat/completions', payload);
    return response.data.choices[0]?.message?.content || '';
  }

  async tts(options: TTSOptions): Promise<Buffer> {
    const payload = {
      model: 'tts-1',
      input: options.text,
      voice: options.voice || 'alloy',
      response_format: options.format || 'mp3',
      speed: options.speed || 1.0
    };

    const response = await this.client.post('/audio/speech', payload, {
      responseType: 'arraybuffer'
    });

    return Buffer.from(response.data);
  }

  async stt(options: STTOptions): Promise<string> {
    const formData = new FormData();
    
    if (typeof options.audio === 'string') {
      // Assume it's a file path or base64
      formData.append('file', options.audio);
    } else {
      // Buffer
      formData.append('file', new Blob([options.audio]));
    }
    
    formData.append('model', 'whisper-1');
    formData.append('language', options.language || 'en');

    const response = await this.client.post('/audio/transcriptions', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return response.data.text || '';
  }
}
