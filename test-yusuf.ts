import dotenv from 'dotenv';
import { createChat } from './src/index';

dotenv.config();

const basicConfig = {
    chat: {
      default_model: 'gpt-4o-mini', // Use a model that definitely supports structured output
      retry: 3,
      retry_delay: 1000,
      other_models: {
        "gemini": "gemini-1.5-flash",
      }
    }
  };

async function testBasicChat() {
  console.log('🧪 Testing Basic Chat...')
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

testBasicChat();