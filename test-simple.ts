import dotenv from 'dotenv';
import { createChat } from './src/index';

dotenv.config();

async function testBasicChat() {
  console.log('🧪 Testing Basic Chat...');
  
  // Simple OpenAI config without structured output
  const basicConfig = {
    chat: {
      default_model: 'gpt-4o-mini', // Use a model that definitely supports structured output
      retry: 3,
      retry_delay: 1000,
      other_models: {},
      api_key: process.env.OPENAI_API_KEY
    }
  };

  try {
    const manager = createChat(basicConfig);
    const result = await manager.chat('chat', {
      messages: [
        { role: 'user', content: 'Just say hello!' }
      ]
    });
    console.log('✅ Basic chat result:', result);
  } catch (error) {
    console.error('❌ Basic chat error:', error);
  }
}

async function testStructuredOutput() {
  console.log('🧪 Testing Structured Output...');
  
  // OpenAI config with structured output using a supported model
  const structuredConfig = {
    chat: {
      default_model: 'gpt-4o-mini', // This model supports structured output
      retry: 3,
      retry_delay: 1000,
      other_models: {},
      api_key: process.env.OPENAI_API_KEY,
      response_schema: {
        type: 'object',
        properties: {
          greeting: { 
            type: 'string',
            description: 'A friendly greeting message'
          },
          language: {
            type: 'string',
            description: 'The language of the greeting'
          }
        },
        required: ['greeting', 'language']
      }
    }
  };

  try {
    const manager = createChat(structuredConfig);
    const result = await manager.chat('chat', {
      messages: [
        { role: 'user', content: 'Say hello in JSON format' }
      ]
    });
    console.log('✅ Structured output result:', result);
  } catch (error) {
    console.error('❌ Structured output error:', error);
  }
}

async function testGemini() {
  console.log('🧪 Testing Gemini...');
  
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
    const result = await manager.chat('chat', {
      messages: [
        { role: 'user', content: 'Just say hello!' }
      ]
    });
    console.log('✅ Gemini result:', result);
  } catch (error) {
    console.error('❌ Gemini error:', error);
  }
}

async function runTests() {
  await testBasicChat();
  await testStructuredOutput();
  await testGemini();
}

runTests().catch(console.error);
