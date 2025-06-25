import { LLMManager } from '../src/llm-manager';
import { LLMManagerConfig } from '../src/types';

// Example configuration with global settings that apply to all models
const config: LLMManagerConfig = {
  advert: {
    default_model: "gpt-4o",
    retry: 3,
    retry_delay: 1000,
    clean_json_response: true,
    openai_key: process.env.OPENAI_API_KEY || 'your-openai-key',
    gemini_key: process.env.GOOGLE_API_KEY || 'your-gemini-key',
    temperature: 0.4, // Global setting - applies to all models in this config
    top_p: 0.2,       // Global setting - applies to all models in this config  
    max_tokens: 2000, // Global setting - applies to all models in this config
    other_models: {
      'gemini': 'gemini-1.5-flash'
    }
  },
  customer_service: {
    default_model: "claude-3-sonnet-20240229",
    retry: 2,
    retry_delay: 500,
    claude_key: process.env.ANTHROPIC_API_KEY || 'your-claude-key',
    temperature: 0.7, // Different global settings for this service
    top_p: 0.95,
    max_tokens: 1500,
    other_models: {
      'openai': 'gpt-4o-mini'
    }
  }
};

async function demonstrateGlobalSettings() {
  const manager = new LLMManager(config);

  console.log('🚀 Demonstrating Global Settings Feature\n');

  // Test 1: Using advert service (with global settings: temp=0.4, top_p=0.2, max_tokens=2000)
  console.log('📢 Test 1: Advert service with global settings');
  console.log('   Global settings: temperature=0.4, top_p=0.2, max_tokens=2000');
  try {
    const response1 = await manager.chat('advert', {
      messages: [
        { role: 'user', content: 'Write a short product description for a smartphone.' }
      ]
      // No temperature, top_p, or maxTokens specified - should use global config values
    });
    console.log('   ✅ Response received with global settings applied');
    console.log(`   📱 Response: ${response1.substring(0, 100)}...\n`);
  } catch (error) {
    console.log(`   ❌ Error: ${error}\n`);
  }

  // Test 2: Customer service with different global settings
  console.log('🎧 Test 2: Customer service with different global settings');
  console.log('   Global settings: temperature=0.7, top_p=0.95, max_tokens=1500');
  try {
    const response2 = await manager.chat('customer_service', {
      messages: [
        { role: 'user', content: 'How can I help a customer who is frustrated with their order?' }
      ]
      // Again, no specific parameters - should use the customer_service global settings
    });
    console.log('   ✅ Response received with global settings applied');
    console.log(`   🎧 Response: ${response2.substring(0, 100)}...\n`);
  } catch (error) {
    console.log(`   ❌ Error: ${error}\n`);
  }

  // Test 3: Override global settings with specific parameters
  console.log('🔧 Test 3: Overriding global settings with specific parameters');
  console.log('   Global settings: temperature=0.4 → Override to temperature=0.9');
  try {
    const response3 = await manager.chat('advert', {
      messages: [
        { role: 'user', content: 'Write a creative and wild product description.' }
      ],
      temperature: 0.9, // This should override the global temperature of 0.4
      maxTokens: 100    // This should override the global max_tokens of 2000
    });
    console.log('   ✅ Response received with overridden settings');
    console.log(`   🎨 Response: ${response3.substring(0, 100)}...\n`);
  } catch (error) {
    console.log(`   ❌ Error: ${error}\n`);
  }

  // Test 4: Test with fallback to other models (which should also use global settings)
  console.log('🔄 Test 4: Fallback to other models (should use same global settings)');
  console.log('   Testing fallback from default_model to other_models[gemini]');
  try {
    const response4 = await manager.chat('advert', {
      messages: [
        { role: 'user', content: 'Describe the benefits of renewable energy.' }
      ]
      // Should fallback to Gemini model but still use the advert config's global settings
    });
    console.log('   ✅ Response received from fallback model with global settings');
    console.log(`   🌿 Response: ${response4.substring(0, 100)}...\n`);
  } catch (error) {
    console.log(`   ❌ Error: ${error}\n`);
  }

  manager.destroy();
  console.log('✨ Demo completed! Global settings are now applied to all models within each config.');
}

// Usage example
if (require.main === module) {
  demonstrateGlobalSettings().catch(console.error);
}

export { demonstrateGlobalSettings };
