import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Export main classes and functions
export { LLMManager, createChat } from './llm-manager';
export { HealthChecker } from './health-checker';
export { ProviderFactory } from './providers';

// Export types
export * from './types';

// Export providers
export * from './providers';

// Example configurations (these should be created outside of the package)
export const defaultExtractorConfig = {
  extractor: {
    default_model: 'gpt-4',
    retry: 10,
    retry_delay: 1000,
    other_models: {
      'claude': 'claude-3-sonnet-20240229',
      'gemini': 'gemini-1.5-flash',
    },
    api_key: process.env.OPENAI_API_KEY
  }
};

export const defaultTranslatorConfig = {
  translator: {
    default_model: 'gpt-4',
    retry: 10,
    retry_delay: 1000,
    other_models: {
      // Can use just one model too
    },
    api_key: process.env.OPENAI_API_KEY
  }
};

// Example usage:
// const extractorChat = createChat(extractorConfig, other_options);
// const translatorChat = createChat(translatorConfig, other_options);