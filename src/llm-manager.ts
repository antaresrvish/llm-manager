import { 
  BaseProvider, 
  ProviderType, 
  LLMManagerConfig, 
  ChatOptions, 
  TTSOptions, 
  STTOptions, 
  ServiceType,
  HealthCheckResult,
  ProviderConfig
} from './types';
import { HealthChecker } from './health-checker';
import { ProviderFactory } from './providers';

export class LLMManager {
  private providers: Map<ProviderType, BaseProvider> = new Map();
  private healthChecker: HealthChecker;
  private config: LLMManagerConfig;

  constructor(config?: LLMManagerConfig) {
    this.config = config || this.getDefaultConfig();
    this.healthChecker = new HealthChecker();
    this.initializeProviders();
    this.startHealthChecking();
  }

  private getDefaultConfig(): LLMManagerConfig {
    return {
      extractor: {
        default_model: 'gpt-4',
        retry: 10,
        retry_delay: 1000,
        other_models: {
          'claude': 'claude-3-sonnet-20240229',
          'gemini': 'gemini-1.5-flash',
          'azure': 'gpt-4'
        }
      },
      translator: {
        default_model: 'gpt-4',
        retry: 10,
        retry_delay: 1000,
        other_models: {}
      }
    };
  }

  private initializeProviders(): void {
    // Initialize providers for each service type
    Object.keys(this.config).forEach(serviceKey => {
      const serviceConfig = this.config[serviceKey];
      
      // Determine which provider to use for default model
      let defaultProvider = this.detectProviderFromModel(serviceConfig.default_model);
      
      // Override detection if Azure endpoint is provided
      if (serviceConfig.endpoint && serviceConfig.endpoint.includes('openai.azure.com')) {
        defaultProvider = ProviderType.AZURE;
      }
      
      this.createProviderIfNotExists(defaultProvider, serviceConfig);
      
      // Create providers for other models ONLY if they are specified
      if (serviceConfig.other_models && Object.keys(serviceConfig.other_models).length > 0) {
        Object.keys(serviceConfig.other_models).forEach(providerKey => {
          const providerType = providerKey as ProviderType;
          this.createProviderIfNotExists(providerType, serviceConfig);
        });
      }
    });
  }

  private detectProviderFromModel(modelName: string): ProviderType {
    const modelName_lower = modelName.toLowerCase();
    
    if (modelName_lower.includes('gpt') || modelName_lower.includes('chatgpt')) {
      return ProviderType.OPENAI;
    }
    if (modelName_lower.includes('claude')) {
      return ProviderType.CLAUDE;
    }
    if (modelName_lower.includes('gemini') || modelName_lower.includes('bard')) {
      return ProviderType.GEMINI;
    }
    
    // Default to OpenAI if can't detect
    return ProviderType.OPENAI;
  }

  private createProviderIfNotExists(providerType: ProviderType, config: ProviderConfig): void {
    if (!this.providers.has(providerType)) {
      try {
        // Create a provider-specific config with the right API key
        const providerConfig = { ...config };
        
        // Set the appropriate API key based on provider type
        switch (providerType) {
          case ProviderType.OPENAI:
            providerConfig.api_key = config.api_key || process.env.OPENAI_API_KEY;
            break;
          case ProviderType.CLAUDE:
            providerConfig.api_key = process.env.ANTHROPIC_API_KEY || config.api_key;
            break;
          case ProviderType.GEMINI:
            providerConfig.api_key = process.env.GOOGLE_API_KEY || config.api_key;
            break;
          case ProviderType.AZURE:
            providerConfig.api_key = process.env.AZURE_OPENAI_API_KEY || config.api_key;
            providerConfig.endpoint = process.env.AZURE_OPENAI_ENDPOINT || config.endpoint;
            break;
        }
        
        const provider = ProviderFactory.createProvider(providerType, providerConfig);
        this.providers.set(providerType, provider);
        
        // Initialize provider in health checker
        this.healthChecker.initializeProvider(providerType);
      } catch (error) {
        console.warn(`Failed to initialize provider ${providerType}:`, error);
      }
    }
  }

  private startHealthChecking(): void {
    this.healthChecker.startPeriodicCheck(async (providerType: ProviderType) => {
      const provider = this.providers.get(providerType);
      if (provider) {
        return await provider.healthCheck();
      }
      throw new Error(`Provider ${providerType} not found`);
    });
  }

  private async executeWithRetry<T>(
    serviceKey: string,
    operation: (provider: BaseProvider) => Promise<T>,
    serviceType: ServiceType = ServiceType.TEXT
  ): Promise<T> {
    const serviceConfig = this.config[serviceKey];
    if (!serviceConfig) {
      throw new Error(`Service configuration not found for: ${serviceKey}`);
    }

    const orderedProviders = this.healthChecker.getOrderedProviders();
    const maxRetries = serviceConfig.retry || 3;
    const retryDelay = serviceConfig.retry_delay || 1000;

    // Build provider priority list
    const providerPriority: ProviderType[] = [];
    
    // Add default provider first (detect from model name)
    let defaultProvider = this.detectProviderFromModel(serviceConfig.default_model);
    
    // Override detection if Azure endpoint is provided
    if (serviceConfig.endpoint && serviceConfig.endpoint.includes('openai.azure.com')) {
      defaultProvider = ProviderType.AZURE;
    }
    
    providerPriority.push(defaultProvider);
    
    // Add other providers in order
    if (serviceConfig.other_models) {
      Object.keys(serviceConfig.other_models).forEach(key => {
        const providerType = key as ProviderType;
        if (!providerPriority.includes(providerType)) {
          providerPriority.push(providerType);
        }
      });
    }

    // Filter providers that actually exist (were initialized)
    const availableProviders = providerPriority.filter(providerType => 
      this.providers.has(providerType)
    );

    // Sort by health status, but keep the priority order for providers with same health status
    const sortedProviders = availableProviders.sort((a, b) => {
      const aIndex = orderedProviders.indexOf(a);
      const bIndex = orderedProviders.indexOf(b);
      
      // If both providers are in ordered list, use health-based order
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      
      // If only one is in ordered list, prefer that one
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      
      // If neither is in ordered list, keep original priority order
      return availableProviders.indexOf(a) - availableProviders.indexOf(b);
    });

    let lastError: Error | null = null;

    for (const providerType of sortedProviders) {
      const provider = this.providers.get(providerType);
      if (!provider) continue;

      // Check if provider supports the service type
      if (serviceType === ServiceType.TTS && !provider.tts) continue;
      if (serviceType === ServiceType.STT && !provider.stt) continue;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const result = await operation(provider);
          return result;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error('Unknown error');
          console.warn(
            `Attempt ${attempt}/${maxRetries} failed for ${providerType}:`, 
            lastError.message
          );

          if (attempt < maxRetries) {
            await this.delay(retryDelay);
          }
        }
      }

      // Mark provider as potentially unhealthy after max retries
      this.healthChecker.updateHealth({
        provider: providerType,
        status: 'down' as any,
        lastChecked: new Date(),
        error: lastError?.message
      });
    }

    throw lastError || new Error('All providers failed');
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public API methods
  async chat(serviceKey: string, options: ChatOptions): Promise<string> {
    console.log(this.config)
    return this.executeWithRetry(
      serviceKey,
      (provider) => provider.chat(options),
      ServiceType.TEXT
    );
  }

  async tts(serviceKey: string, options: TTSOptions): Promise<Buffer> {
    return this.executeWithRetry(
      serviceKey,
      (provider) => {
        if (!provider.tts) {
          throw new Error(`TTS not supported by provider ${provider.name}`);
        }
        return provider.tts(options);
      },
      ServiceType.TTS
    );
  }

  async stt(serviceKey: string, options: STTOptions): Promise<string> {
    return this.executeWithRetry(
      serviceKey,
      (provider) => {
        if (!provider.stt) {
          throw new Error(`STT not supported by provider ${provider.name}`);
        }
        return provider.stt(options);
      },
      ServiceType.STT
    );
  }

  // Configuration and health methods
  addProvider(providerType: ProviderType, config: ProviderConfig): void {
    const provider = ProviderFactory.createProvider(providerType, config);
    this.providers.set(providerType, provider);
  }

  removeProvider(providerType: ProviderType): void {
    this.providers.delete(providerType);
  }

  getProviderHealth(providerType?: ProviderType) {
    if (providerType) {
      return this.healthChecker.getProviderHealth(providerType);
    }
    return this.healthChecker.getAllHealth();
  }

  getOrderedProviders(): ProviderType[] {
    return this.healthChecker.getOrderedProviders();
  }

  async manualHealthCheck(): Promise<HealthCheckResult[]> {
    const results: HealthCheckResult[] = [];
    
    for (const [providerType, provider] of this.providers) {
      try {
        const result = await provider.healthCheck();
        this.healthChecker.updateHealth(result);
        results.push(result);
      } catch (error) {
        const errorResult: HealthCheckResult = {
          provider: providerType,
          status: 'down' as any,
          lastChecked: new Date(),
          error: error instanceof Error ? error.message : 'Unknown error'
        };
        this.healthChecker.updateHealth(errorResult);
        results.push(errorResult);
      }
    }
    
    return results;
  }

  destroy(): void {
    this.healthChecker.destroy();
    this.providers.clear();
  }
}

// Convenience function to create a chat instance
export function createChat(config: LLMManagerConfig, options?: any): LLMManager {
  return new LLMManager(config);
}
