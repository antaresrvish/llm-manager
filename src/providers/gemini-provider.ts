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
      const response = await this.client.get(`/models?key=${this.config.gemini_key}`);
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
    
    // Convert messages to Gemini format
    const contents = mergedOptions.messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const payload: any = {
      contents,
      generationConfig: {
        temperature: mergedOptions.temperature || 0.7,
        maxOutputTokens: mergedOptions.maxTokens || 1000
      }
    };

    // Add top_p if specified (Gemini supports topP)
    if (mergedOptions.top_p !== undefined) {
      payload.generationConfig.topP = mergedOptions.top_p;
    }

    // Add structured output support for Gemini
    const responseMimeType = mergedOptions.response_mime_type || this.config.response_mime_type;
    const responseSchema = mergedOptions.response_schema || this.config.response_schema;
    
    if (responseMimeType) {
      payload.generationConfig.responseMimeType = responseMimeType;
    }
    
    if (responseSchema) {
      payload.generationConfig.responseSchema = responseSchema;
    }

    const response = await this.client.post(
      `/models/${model}:generateContent?key=${this.config.gemini_key}`,
      payload
    );

    let result = response.data.candidates[0]?.content?.parts[0]?.text || '';
    
    // Clean JSON response if requested
    const shouldCleanJson = mergedOptions.clean_json_response ?? this.config.clean_json_response ?? true;
    if (shouldCleanJson) {
      result = this.cleanJsonResponse(result);
    }
    
    return result;
  }

  private getCompatibleModel(): string {
    // Check if there's a specific Gemini model in other_models
    if (this.config.other_models && this.config.other_models[ProviderType.GEMINI]) {
      const geminiModel = this.config.other_models[ProviderType.GEMINI].toLowerCase();
      if (geminiModel.includes('gemini') || geminiModel.includes('bard')) {
        return this.config.other_models[ProviderType.GEMINI];
      }
    }
    
    // If default model is Gemini compatible, use it
    const defaultModel = this.config.default_model?.toLowerCase() || '';
    if (defaultModel.includes('gemini') || defaultModel.includes('bard')) {
      return this.config.default_model;
    }
    
    // Default to a compatible Gemini model
    return 'gemini-1.5-flash';
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
