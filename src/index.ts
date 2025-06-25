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