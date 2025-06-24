import { BaseProvider, ProviderType, ProviderConfig } from '../types';
import { OpenAIProvider } from './openai-provider';
import { ClaudeProvider } from './claude-provider';
import { GeminiProvider } from './gemini-provider';
import { AzureProvider } from './azure-provider';

export class ProviderFactory {
  static createProvider(type: ProviderType, config: ProviderConfig): BaseProvider {
    switch (type) {
      case ProviderType.OPENAI:
        return new OpenAIProvider(config);
      case ProviderType.CLAUDE:
        return new ClaudeProvider(config);
      case ProviderType.GEMINI:
        return new GeminiProvider(config);
      case ProviderType.AZURE:
        return new AzureProvider(config);
      default:
        throw new Error(`Unsupported provider type: ${type}`);
    }
  }

  static getSupportedProviders(): ProviderType[] {
    return Object.values(ProviderType);
  }
}

export * from './base-provider';
export * from './openai-provider';
export * from './claude-provider';
export * from './gemini-provider';
export * from './azure-provider';
