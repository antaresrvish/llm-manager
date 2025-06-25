# LLM Manager

A dynamic AI model manager with automatic failover, retry logic, and health checks for multiple providers (OpenAI, Claude, Gemini, Azure).

## Features

- **Multi-Provider Support**: OpenAI, Claude, Gemini, Azure OpenAI
- **Automatic Failover**: Switches between providers based on health status
- **Retry Logic**: Configurable retry attempts with delays
- **Health Monitoring**: Automatic health checks with priority reordering
- **Service Types**: Support for text, TTS (Text-to-Speech), and STT (Speech-to-Text)
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
    gemini_key: process.env.GOOGLE_API_KEY,
    claude_key: process.env.ANTHROPIC_API_KEY,
    other_models: {
      'claude': 'claude-3-sonnet-20240229',
      'gemini': 'gemini-1.5-flash',
    }
  }
};

// Create chat instance
const extractorChat = createChat(testConfig);

// Use for text generation
const response = await extractorChat.chat('test', {
  messages: [
    { role: 'user', content: 'Extract the main topics from this text: AI is transforming healthcare.' }
  ]
});

console.log(response);
```

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