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
      // Use a simple completion request instead of /models endpoint
      const response = await this.client.post('/chat/completions', {
        model: this.getCompatibleModel(),
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
    // Merge global config parameters with specific options
    const mergedOptions = this.mergeConfigWithOptions(options);
    const model = this.getCompatibleModel();
    
    const payload: any = {
      model: model,
      messages: mergedOptions.messages,
      temperature: mergedOptions.temperature || 0.7,
      max_tokens: mergedOptions.maxTokens || 1000,
      stream: mergedOptions.stream || false
    };

    // Add top_p if specified
    if (mergedOptions.top_p !== undefined) {
      payload.top_p = mergedOptions.top_p;
    }

    // OpenAI structured output support (only for compatible models)
    if (mergedOptions.response_schema || this.config.response_schema) {
      // Only models like gpt-4o, gpt-4o-mini support structured output
      if (model.includes('gpt-4o') || model.includes('gpt-3.5') || model === 'gpt-4-turbo') {
        payload.response_format = {
          type: "json_schema",
          json_schema: {
            name: "response",
            schema: mergedOptions.response_schema || this.config.response_schema
          }
        };
      } else {
        // For older models, just request JSON in the message
        const lastMessage = payload.messages[payload.messages.length - 1];
        lastMessage.content += '\n\nPlease respond in JSON format.';
      }
    }

    const response = await this.client.post('/chat/completions', payload);
    let result = response.data.choices[0]?.message?.content || '';
    
    // Clean JSON response if requested
    const shouldCleanJson = mergedOptions.clean_json_response ?? this.config.clean_json_response ?? false;
    if (shouldCleanJson) {
      result = this.cleanJsonResponse(result);
    }
    
    return result;
  }

  private getCompatibleModel(): string {
    // Check if there's a specific OpenAI model in other_models
    if (this.config.other_models && this.config.other_models[ProviderType.OPENAI]) {
      const openaiModel = this.config.other_models[ProviderType.OPENAI].toLowerCase();
      if (openaiModel.includes('gpt') || openaiModel.includes('chatgpt')) {
        return this.config.other_models[ProviderType.OPENAI];
      }
    }
    
    // If default model is OpenAI compatible, use it
    const defaultModel = this.config.default_model?.toLowerCase() || '';
    if (defaultModel.includes('gpt') || defaultModel.includes('chatgpt')) {
      return this.config.default_model;
    }
    
    // Default to a compatible OpenAI model that supports structured output
    return 'gpt-4o-mini';
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
