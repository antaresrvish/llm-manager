# LLM Manager

A dynamic AI model manager with automatic failover, retry logic, and health checks for multiple providers (OpenAI, Claude, Gemini, Azure).

## Features

- **Multi-Provider Support**: OpenAI, Claude, Gemini, Azure OpenAI
- **Automatic Failover**: Switches between providers based on health status
- **Retry Logic**: Configurable retry attempts with delays
- **Health Monitoring**: Automatic health checks with priority reordering
- **Service Types**: Support for text, TTS (Text-to-Speech), and STT (Speech-to-Text)
- **Global Settings**: Config-level parameters applied to all models automatically
- **Extensible**: Easy to add new providers
- **TypeScript**: Full TypeScript support with comprehensive type definitions

## Installation

```bash
npm install llm-manager dotenv
```

## Setup

1. Create a `.env` file in your project root:
```bash
cp .env.example .env
```

2. Add your API keys to the `.env` file:
```bash
OPENAI_API_KEY=your-openai-api-key-here
ANTHROPIC_API_KEY=your-claude-api-key-here
GOOGLE_API_KEY=your-gemini-api-key-here
AZURE_OPENAI_API_KEY=your-azure-openai-api-key-here
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
```

## Basic Usage

```typescript
import dotenv from 'dotenv';
import { createChat, LLMManager } from 'llm-manager';

// Load environment variables
dotenv.config();

// Create configuration (should be done outside the package)
const testConfig = {
  test: {
    default_model: 'gpt-4',
    retry: 10,
    retry_delay: 1000,
    openai_key: process.env.OPENAI_API_KEY,
    other_models: {
      claude: 'claude-3-haiku-20240307',
      gemini: 'gemini-1.5-flash',
      azure: 'gpt-4' // deployment name
    }
  }
};

// Create the LLM manager
const manager = new LLMManager(testConfig);

// Send a message
const response = await manager.chat('test', {
  messages: [
    { role: 'user', content: 'Hello! How are you?' }
  ],
  temperature: 0.7,
  maxTokens: 1000
});

console.log(response);

// Clean up when done
manager.destroy();
```

## Global Settings

You can set global parameters at the configuration level that will automatically apply to all models within that service configuration:

```typescript
const config = {
  advert: {
    default_model: "gpt-4o",
    retry: 3,
    retry_delay: 1000,
    openai_key: process.env.OPENAI_API_KEY,
    gemini_key: process.env.GOOGLE_API_KEY,
    
    // Global settings - applied to ALL models in this config
    temperature: 0.4,     // Applies to both default_model and other_models
    top_p: 0.2,          // Applies to both default_model and other_models  
    max_tokens: 2000,    // Applies to both default_model and other_models
    clean_json_response: true,
    
    other_models: {
      'gemini': 'gemini-1.5-flash'  // Will use the global settings above
    }
  },
  customer_service: {
    default_model: "claude-3-sonnet-20240229",
    claude_key: process.env.ANTHROPIC_API_KEY,
    
    // Different global settings for this service
    temperature: 0.7,    // Different from advert service
    top_p: 0.95,
    max_tokens: 1500,
    
    other_models: {
      'openai': 'gpt-4o-mini'  // Will use the customer_service global settings
    }
  }
};

// Usage - global settings are automatically applied
await manager.chat('advert', {
  messages: [{ role: 'user', content: 'Write an ad copy' }]
  // Will use: temperature=0.4, top_p=0.2, max_tokens=2000
});

// You can still override global settings per request
await manager.chat('advert', {
  messages: [{ role: 'user', content: 'Write creative ad copy' }],
  temperature: 0.9  // Overrides global temperature of 0.4
  // Will use: temperature=0.9, top_p=0.2, max_tokens=2000
});
```

**Supported Global Settings:**
- `temperature`: Controls randomness (0.0 to 2.0)
- `top_p`: Controls nucleus sampling (0.0 to 1.0)
- `max_tokens`: Maximum tokens to generate
- `clean_json_response`: Remove markdown from JSON responses
- `response_mime_type`: MIME type for structured responses (Gemini)
- `response_schema`: JSON schema for structured responses

See [Global Settings Documentation](./GLOBAL_SETTINGS.md) for detailed information.

## Configuration

### Provider Configuration

```typescript
interface ProviderConfig {
  default_model: string;        // Primary model to use
  retry: number;               // Number of retry attempts
  retry_delay: number;         // Delay between retries (ms)
  other_models?: Record<string, string>; // Fallback models
  endpoint?: string;          // Custom endpoint (for Azure)
}
```

## API Reference

### LLMManager

#### Text Generation

```typescript
await manager.chat(serviceKey: string, options: ChatOptions): Promise<string>
```

#### Text-to-Speech

```typescript
await manager.tts(serviceKey: string, options: TTSOptions): Promise<Buffer>
```

#### Speech-to-Text

```typescript
await manager.stt(serviceKey: string, options: STTOptions): Promise<string>
```

#### Health Monitoring

```typescript
// Manual health check
const results = await manager.manualHealthCheck();

// Get provider health status
const health = manager.getProviderHealth(ProviderType.OPENAI);

// Get ordered providers (by health)
const orderedProviders = manager.getOrderedProviders();
```

### Provider Management

```typescript
// Add new provider
manager.addProvider(ProviderType.OPENAI, config);

// Remove provider
manager.removeProvider(ProviderType.OPENAI);

// Clean up resources
manager.destroy();
```

## Supported Providers

### OpenAI
- Text generation (GPT models)
- Text-to-Speech (TTS)
- Speech-to-Text (Whisper)

### Claude (Anthropic)
- Text generation (Claude models)

### Gemini (Google)
- Text generation (Gemini models)

### Azure OpenAI
- Text generation (GPT models)
- Text-to-Speech (TTS)
- Speech-to-Text (Whisper)

## Retry and Failover Logic

1. **Primary Provider**: Starts with the default model/provider
2. **Retry Logic**: Retries failed requests up to the configured limit with delays
3. **Provider Failover**: After max retries, switches to the next available provider
4. **Health-Based Ordering**: Providers are prioritized by their health status and response time
5. **Automatic Recovery**: Unhealthy providers are periodically rechecked

## Health Monitoring

The package automatically monitors provider health:

- **Periodic Checks**: Health checks run every minute by default
- **Response Time Tracking**: Faster providers get higher priority
- **Automatic Reordering**: Provider order updates based on health status
- **Error Tracking**: Failed providers are marked as down with error details

## Environment Variables

Set your API keys as environment variables:

```bash
export OPENAI_API_KEY="your-openai-key"
export ANTHROPIC_API_KEY="your-claude-key"
export GOOGLE_API_KEY="your-gemini-key"
export AZURE_OPENAI_API_KEY="your-azure-key"
export AZURE_OPENAI_ENDPOINT="your-azure-endpoint"
```

## Error Handling

The package provides comprehensive error handling:

- Individual provider failures
- Network timeouts
- Rate limiting
- Authentication errors
- Service-specific errors (TTS/STT not supported)

## Advanced Usage

### Custom Provider Order

```typescript
// Providers will be tried in this order: Claude -> Gemini -> OpenAI
const config = {
  service: {
    default_model: 'claude-3-sonnet-20240229',
    other_models: {
      'gemini': 'gemini-1.5-flash',
      'openai': 'gpt-4'
    },
    // ... other config
  }
};
```

### Service-Specific Configurations

```typescript
const manager = new LLMManager({
  extractor: {
    default_model: 'gpt-4',
    retry: 10,
    other_models: { 'claude': 'claude-3-sonnet-20240229' }
  },
  translator: {
    default_model: 'claude-3-haiku-20240307',
    retry: 5,
    other_models: { 'openai': 'gpt-3.5-turbo' }
  },
  tts_service: {
    default_model: 'tts-1',
    retry: 3,
    // Only providers that support TTS will be used
  }
});
```

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.