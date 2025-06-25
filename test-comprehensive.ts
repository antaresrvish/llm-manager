import dotenv from 'dotenv';
import { createChat } from './src/index';

dotenv.config();

async function testFailoverScenario() {
  console.log('🧪 Testing Failover from Gemini to OpenAI...');
  
  // Configuration with Gemini as primary and OpenAI as fallback
  const failoverConfig = {
    chat: {
      default_model: 'gemini-1.5-flash',
      retry: 2, // Reduced retries for faster testing
      retry_delay: 500,
      other_models: {
        openai: 'gpt-4o-mini'
      },
      api_key: process.env.GOOGLE_API_KEY,
      // Intentionally using wrong API key to trigger failover
      api_key_wrong: 'invalid-key-to-trigger-failover'
    }
  };

  try {
    const manager = createChat(failoverConfig);
    const result = await manager.chat('chat', {
      messages: [
        { role: 'user', content: 'Tell me a short joke about programming.' }
      ]
    });
    console.log('✅ Failover result:', result);
    console.log('   (This should come from OpenAI after Gemini fails)');
  } catch (error) {
    console.error('❌ Failover test failed:', error);
  }
}

async function testCorrectProviderSelection() {
  console.log('\n🧪 Testing Correct Provider Selection...');
  
  // Test with OpenAI model - should use OpenAI directly
  const openaiConfig = {
    chat: {
      default_model: 'gpt-4o-mini',
      retry: 3,
      retry_delay: 1000,
      other_models: {},
      api_key: process.env.OPENAI_API_KEY
    }
  };

  try {
    const manager = createChat(openaiConfig);
    console.log('🔧 Configured with gpt-4o-mini (should detect OpenAI)');
    const result = await manager.chat('chat', {
      messages: [
        { role: 'user', content: 'Say "I am OpenAI GPT"' }
      ]
    });
    console.log('✅ OpenAI direct result:', result);
  } catch (error) {
    console.error('❌ OpenAI direct test failed:', error);
  }

  // Test with Gemini model - should use Gemini directly
  const geminiConfig = {
    chat: {
      default_model: 'gemini-1.5-flash',
      retry: 3,
      retry_delay: 1000,
      other_models: {},
      api_key: process.env.GOOGLE_API_KEY
    }
  };

  try {
    const manager = createChat(geminiConfig);
    console.log('🔧 Configured with gemini-1.5-flash (should detect Gemini)');
    const result = await manager.chat('chat', {
      messages: [
        { role: 'user', content: 'Say "I am Google Gemini"' }
      ]
    });
    console.log('✅ Gemini direct result:', result);
  } catch (error) {
    console.error('❌ Gemini direct test failed:', error);
  }
}

async function testStructuredOutputConsistency() {
  console.log('\n🧪 Testing Structured Output Consistency Across Providers...');
  
  const schema = {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Programming language name' },
      year: { type: 'number', description: 'Year it was created' },
      category: { type: 'string', description: 'Language category (e.g., OOP, functional)' }
    },
    required: ['name', 'year', 'category']
  };

  // Test with OpenAI
  const openaiConfig = {
    chat: {
      default_model: 'gpt-4o-mini',
      retry: 3,
      retry_delay: 1000,
      api_key: process.env.OPENAI_API_KEY,
      response_schema: schema,
      clean_json_response: true
    }
  };

  try {
    const manager = createChat(openaiConfig);
    const result = await manager.chat('chat', {
      messages: [
        { role: 'user', content: 'Tell me about the Python programming language' }
      ]
    });
    console.log('✅ OpenAI structured result:', result);
    const parsed = JSON.parse(result);
    console.log('   Parsed fields:', Object.keys(parsed));
  } catch (error) {
    console.error('❌ OpenAI structured test failed:', error);
  }

  // Test with Gemini
  const geminiConfig = {
    chat: {
      default_model: 'gemini-1.5-flash',
      retry: 3,
      retry_delay: 1000,
      api_key: process.env.GOOGLE_API_KEY,
      response_mime_type: 'application/json',
      response_schema: schema,
      clean_json_response: true
    }
  };

  try {
    const manager = createChat(geminiConfig);
    const result = await manager.chat('chat', {
      messages: [
        { role: 'user', content: 'Tell me about the JavaScript programming language' }
      ]
    });
    console.log('✅ Gemini structured result:', result);
    const parsed = JSON.parse(result);
    console.log('   Parsed fields:', Object.keys(parsed));
  } catch (error) {
    console.error('❌ Gemini structured test failed:', error);
  }
}

async function runAllTests() {
  await testCorrectProviderSelection();
  await testStructuredOutputConsistency();
  // await testFailoverScenario(); // Uncomment to test failover
}

runAllTests().catch(console.error);
