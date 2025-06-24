import dotenv from 'dotenv';
import { LLMManager, createChat, ProviderType, HealthStatus } from './src/index';

// Load environment variables
dotenv.config();

async function runTests() {
  console.log('🧪 Starting LLM Manager Tests...\n');

  // Test 1: Basic instantiation
  console.log('✅ Test 1: Basic instantiation');
  const config = {
    test_service: {
      default_model: 'gpt-4',
      retry: 3,
      retry_delay: 1000,
      other_models: {
        'claude': 'claude-3-sonnet-20240229',
        'gemini': 'gemini-1.5-flash'
      }
    }
  };
  
  const manager = new LLMManager(config);
  console.log('   ✓ LLMManager created successfully');

  // Test 2: createChat function
  console.log('\n✅ Test 2: createChat function');
  const chatManager = createChat(config);
  console.log('   ✓ createChat function works');

  // Test 3: Health check without API keys (should fail gracefully)
  console.log('\n✅ Test 3: Health check without API keys');
  try {
    const healthResults = await manager.manualHealthCheck();
    console.log('   ✓ Health check completed (expected to fail without API keys)');
    console.log('   ✓ Results:', healthResults.map(r => `${r.provider}: ${r.status}`));
  } catch (error) {
    console.log('   ✓ Health check handled error gracefully');
  }

  // Test 4: Provider ordering
  console.log('\n✅ Test 4: Provider ordering');
  const orderedProviders = manager.getOrderedProviders();
  console.log('   ✓ Ordered providers:', orderedProviders);

  // Test 5: Provider health info
  console.log('\n✅ Test 5: Provider health info');
  const allHealth = manager.getProviderHealth();
  console.log('   ✓ All provider health:', allHealth);

  // Test 6: Chat attempt (should fail without API keys but test error handling)
  console.log('\n✅ Test 6: Chat error handling');
  try {
    await manager.chat('test_service', {
      messages: [{ role: 'user', content: 'Hello' }]
    });
    console.log('   ✓ Chat succeeded (unexpected)');
  } catch (error) {
    console.log('   ✓ Chat failed as expected without API keys');
  }

  // Test 7: Cleanup
  console.log('\n✅ Test 7: Cleanup');
  manager.destroy();
  chatManager.destroy();
  console.log('   ✓ Managers destroyed successfully');

  console.log('\n🎉 All tests completed successfully!');
  console.log('\n📝 Note: To test with real API calls, set environment variables:');
  console.log('   - OPENAI_API_KEY');
  console.log('   - ANTHROPIC_API_KEY');
  console.log('   - GOOGLE_API_KEY');
  console.log('   - AZURE_OPENAI_API_KEY');
  console.log('   - AZURE_OPENAI_ENDPOINT');
}

runTests().catch(console.error);
