import dotenv from 'dotenv';
import { createChat } from './src/index';

dotenv.config();

// Test each provider individually
const openaiConfig = {
  test: {
    default_model: 'gpt-4',
    retry: 3,
    retry_delay: 1000,
    other_models: {},
    api_key: process.env.OPENAI_API_KEY
  }
};

const claudeConfig = {
  test: {
    default_model: 'claude-3-sonnet-20240229',
    retry: 3,
    retry_delay: 1000,
    other_models: {},
    api_key: process.env.ANTHROPIC_API_KEY
  }
};

const geminiConfig = {
  test: {
    default_model: 'gemini-1.5-flash',
    retry: 3,
    retry_delay: 1000,
    other_models: {},
    api_key: process.env.GOOGLE_API_KEY
  }
};

const azureConfig = {
  test: {
    default_model: 'gpt-4',
    retry: 3,
    retry_delay: 1000,
    other_models: {},
    api_key: process.env.AZURE_OPENAI_API_KEY,
    endpoint: process.env.AZURE_OPENAI_ENDPOINT
  }
};

// Mixed config where Gemini should be primary
const mixedConfigGeminiFirst = {
  test: {
    default_model: 'gemini-1.5-flash', // Should be PRIMARY
    retry: 3,
    retry_delay: 1000,
    other_models: {
      'openai': 'gpt-4',
      'claude': 'claude-3-sonnet-20240229'
    },
    api_key: process.env.GOOGLE_API_KEY
  }
};

async function testSingleProvider(name: string, config: any) {
  console.log(`\n🧪 Testing ${name}...`);
  console.log('─'.repeat(40));
  
  try {
    const chat = createChat(config);
    
    console.log('📊 Initialized providers:', chat.getOrderedProviders());
    
    const healthResults = await chat.manualHealthCheck();
    console.log('🏥 Health check:', healthResults.map(r => `${r.provider}: ${r.status}`));
    
    const data = await chat.chat('test', {
      messages: [{ role: "user", content: `Hello from ${name}! Just say "Hello from [your name]"` }]
    });
    
    console.log(`✅ ${name} response:`, data);
    
    chat.destroy();
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ ${name} error:`, errorMessage);
  }
}

async function testMixedConfig() {
  console.log(`\n🧪 Testing Mixed Config (Gemini Primary)...`);
  console.log('─'.repeat(50));
  
  try {
    const chat = createChat(mixedConfigGeminiFirst);
    
    console.log('📊 Initialized providers:', chat.getOrderedProviders());
    console.log('🎯 Expected primary provider: GEMINI (from default_model)');
    
    const healthResults = await chat.manualHealthCheck();
    console.log('🏥 Health check:', healthResults.map(r => `${r.provider}: ${r.status} (${r.responseTime}ms)`));
    
    console.log('🔄 Provider order after health check:', chat.getOrderedProviders());
    
    const data = await chat.chat('test', {
      messages: [{ role: "user", content: "Just say which AI model you are" }]
    });
    
    console.log('✅ Mixed config response:', data);
    
    chat.destroy();
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Mixed config error:', errorMessage);
  }
}

async function runAllTests() {
  console.log('🚀 Starting Provider Tests...\n');
  
  await testSingleProvider('OpenAI', openaiConfig);
  await testSingleProvider('Claude', claudeConfig);
  await testSingleProvider('Gemini', geminiConfig);
  await testSingleProvider('Azure', azureConfig);
  
  await testMixedConfig();
  
  console.log('\n✨ All tests completed!');
}

runAllTests().catch(console.error);
