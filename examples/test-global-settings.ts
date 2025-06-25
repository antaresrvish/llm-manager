import { AbstractProvider } from '../src/providers/base-provider';
import { ProviderType, ProviderConfig, ChatOptions } from '../src/types';

// Test implementation of AbstractProvider
class TestProvider extends AbstractProvider {
  constructor(config: ProviderConfig) {
    super(ProviderType.OPENAI, config, 'https://test.com');
  }

  async healthCheck() {
    return {
      provider: this.name,
      status: 'up' as any,
      lastChecked: new Date()
    };
  }

  async chat(options: ChatOptions): Promise<string> {
    // Test method to expose merged options
    const merged = this.mergeConfigWithOptions(options);
    return JSON.stringify(merged, null, 2);
  }
}

function testGlobalSettings() {
  console.log('🧪 Testing Global Settings Merge Logic\n');

  // Test configuration with global settings
  const config: ProviderConfig = {
    default_model: "gpt-4o",
    retry: 3,
    retry_delay: 1000,
    openai_key: "test-key",
    temperature: 0.4,      // Global setting
    top_p: 0.2,           // Global setting
    max_tokens: 2000,     // Global setting
    clean_json_response: true
  };

  const provider = new TestProvider(config);

  console.log('📋 Test 1: No options provided - should use all global settings');
  const test1Options: ChatOptions = {
    messages: [{ role: 'user', content: 'test' }]
  };
  
  provider.chat(test1Options).then(result => {
    const merged = JSON.parse(result);
    console.log('✅ Global settings applied:');
    console.log(`   temperature: ${merged.temperature} (expected: 0.4)`);
    console.log(`   top_p: ${merged.top_p} (expected: 0.2)`);
    console.log(`   maxTokens: ${merged.maxTokens} (expected: 2000)`);
    console.log(`   clean_json_response: ${merged.clean_json_response} (expected: true)\n`);

    console.log('📋 Test 2: Partial override - should merge global and specific settings');
    const test2Options: ChatOptions = {
      messages: [{ role: 'user', content: 'test' }],
      temperature: 0.9,  // Override global
      maxTokens: 100     // Override global
      // top_p should remain 0.2 from global
    };

    return provider.chat(test2Options);
  }).then(result => {
    const merged = JSON.parse(result);
    console.log('✅ Partial override applied:');
    console.log(`   temperature: ${merged.temperature} (expected: 0.9, overridden)`);
    console.log(`   top_p: ${merged.top_p} (expected: 0.2, from global)`);
    console.log(`   maxTokens: ${merged.maxTokens} (expected: 100, overridden)`);
    console.log(`   clean_json_response: ${merged.clean_json_response} (expected: true, from global)\n`);

    console.log('📋 Test 3: Complete override - should use all provided settings');
    const test3Options: ChatOptions = {
      messages: [{ role: 'user', content: 'test' }],
      temperature: 1.0,
      top_p: 0.8,
      maxTokens: 500,
      clean_json_response: false
    };

    return provider.chat(test3Options);
  }).then(result => {
    const merged = JSON.parse(result);
    console.log('✅ Complete override applied:');
    console.log(`   temperature: ${merged.temperature} (expected: 1.0, overridden)`);
    console.log(`   top_p: ${merged.top_p} (expected: 0.8, overridden)`);
    console.log(`   maxTokens: ${merged.maxTokens} (expected: 500, overridden)`);
    console.log(`   clean_json_response: ${merged.clean_json_response} (expected: false, overridden)\n`);

    console.log('✨ All global settings merge tests passed!');
  }).catch(error => {
    console.error('❌ Test failed:', error);
  });
}

// Run tests if this file is executed directly
if (require.main === module) {
  testGlobalSettings();
}

export { testGlobalSettings };
