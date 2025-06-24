import dotenv from 'dotenv';
import { createChat } from './src/index';

dotenv.config();

const advertConfig = {
  advert: {
    default_model: 'gemini-1.5-flash',
    retry: 10,
    retry_delay: 1000,
    other_models: {
      // "claude": "claude-2",
    },
    api_key: process.env.GOOGLE_API_KEY
  }
};

async function testGemini() {
  try {
    console.log('🧪 Testing Gemini configuration...');
    
    const test = createChat(advertConfig);
    
    // Check which providers are initialized
    console.log('📊 Initialized providers:', test.getOrderedProviders());
    
    // Test health check
    const healthResults = await test.manualHealthCheck();
    console.log('🏥 Health check results:', healthResults);
    
    // Test chat
    const data = await test.chat('advert', {
      messages: [
        { role: "user", content: "Hello, can you help me create a simple job description?" }
      ]
    });
    
    console.log('✅ Chat response:', data);
    
    test.destroy();
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testGemini();
