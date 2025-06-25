# Global Settings Feature

## Overview

The LLM Manager now supports global settings that are automatically applied to all models within a specific service configuration. This feature allows you to set common parameters like `temperature`, `top_p`, and `max_tokens` at the configuration level, which will be used as defaults for all models (both `default_model` and `other_models`) within that configuration.

## Supported Global Settings

- **`temperature`**: Controls randomness in the model's responses (0.0 to 2.0)
- **`top_p`**: Controls nucleus sampling (0.0 to 1.0)  
- **`max_tokens`**: Maximum number of tokens to generate
- **`clean_json_response`**: Whether to clean JSON responses (remove markdown formatting)
- **`response_mime_type`**: MIME type for structured responses (Gemini)
- **`response_schema`**: JSON schema for structured responses

## Configuration Example

```typescript
const config = { 
  advert: {
    default_model: "gpt-4o",
    retry: 3,
    retry_delay: 1000,
    clean_json_response: true,
    openai_key: "your-openai-key",
    gemini_key: "your-gemini-key",
    
    // Global settings - applied to ALL models in this config
    temperature: 0.4,     // Applies to both gpt-4o and gemini-1.5-flash
    top_p: 0.2,          // Applies to both gpt-4o and gemini-1.5-flash
    max_tokens: 2000,    // Applies to both gpt-4o and gemini-1.5-flash
    
    other_models: {
      'gemini': 'gemini-1.5-flash'  // Will use global settings above
    }
  },
  customer_service: {
    default_model: "claude-3-sonnet-20240229",
    claude_key: "your-claude-key",
    
    // Different global settings for this service
    temperature: 0.7,    // Different from advert service
    top_p: 0.95,
    max_tokens: 1500,
    
    other_models: {
      'openai': 'gpt-4o-mini'  // Will use the customer_service global settings
    }
  }
}
```

## How It Works

### 1. Global Settings as Defaults
When you define global settings in a configuration, they become the default values for all models within that configuration:

```typescript
// This chat request will use:
// - temperature: 0.4 (from config)
// - top_p: 0.2 (from config)  
// - max_tokens: 2000 (from config)
await manager.chat('advert', {
  messages: [{ role: 'user', content: 'Hello' }]
  // No specific temperature/top_p/max_tokens provided
});
```

### 2. Overriding Global Settings
You can still override global settings by providing specific values in the chat options:

```typescript
// This will override the global temperature but keep other global settings
await manager.chat('advert', {
  messages: [{ role: 'user', content: 'Hello' }],
  temperature: 0.9,  // Overrides global temperature of 0.4
  maxTokens: 100     // Overrides global max_tokens of 2000
  // top_p: 0.2 (still uses global setting)
});
```

### 3. Applied to All Models
Global settings apply to both the `default_model` and all models in `other_models`:

```typescript
const config = {
  service: {
    default_model: "gpt-4o",          // Uses global settings
    temperature: 0.5,                 // Global setting
    other_models: {
      'claude': 'claude-3-sonnet',    // Also uses global temperature: 0.5
      'gemini': 'gemini-1.5-flash'    // Also uses global temperature: 0.5
    }
  }
}
```

## Provider-Specific Notes

### OpenAI & Azure OpenAI
- Supports: `temperature`, `top_p`, `max_tokens`
- Parameter mapping: Direct mapping to API parameters

### Claude (Anthropic)
- Supports: `temperature`, `top_p`, `max_tokens`
- Parameter mapping: Direct mapping to API parameters

### Gemini (Google)
- Supports: `temperature`, `top_p`, `max_tokens`
- Parameter mapping: 
  - `top_p` → `topP`
  - `max_tokens` → `maxOutputTokens`

## Benefits

1. **Consistency**: Ensure all models in a service use the same baseline parameters
2. **Simplified Configuration**: Set parameters once instead of for each model
3. **Easy Overrides**: Still maintain flexibility to override settings per request
4. **Service-Specific Tuning**: Different services can have different global settings
5. **Backward Compatibility**: Existing code continues to work without changes

## Migration from Previous Versions

If you're upgrading from a previous version, your existing configurations will continue to work. The new global settings are optional and don't break existing functionality. However, you can now simplify your code by moving common parameters to the configuration level.

### Before (old approach)
```typescript
// Had to specify parameters in every chat call
await manager.chat('service', {
  messages: [...],
  temperature: 0.4,
  maxTokens: 2000
});
```

### After (new approach with global settings)
```typescript
// Configuration
const config = {
  service: {
    // ... other config
    temperature: 0.4,    // Global setting
    max_tokens: 2000     // Global setting
  }
}

// Usage - parameters applied automatically
await manager.chat('service', {
  messages: [...]  // temperature and maxTokens applied from config
});
```
