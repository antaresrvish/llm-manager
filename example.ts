import dotenv from 'dotenv';
import { createChat, LLMManager, ProviderType } from './src/index';

// Load environment variables from .env file
dotenv.config();

// Example configurations (user should create these outside of the package)
const extractorConfig = {
  extractor: {
    default_model: 'gpt-4',
    retry: 10,
    retry_delay: 1000,
    other_models: {

    },
    api_key: process.env.OPENAI_API_KEY
  }
};

const translatorConfig = {
  translator: {
    default_model: 'gemini-1.5-flash',
    retry: 10,
    retry_delay: 1000,
    other_models: {
      "gemini": "gemini-1.5-flash",
    },
    api_key: process.env.GOOGLE_API_KEY
  }
};

// Example usage
async function main() {
  // Create chat instances
  const extractorChat = createChat(extractorConfig);
  const translatorChat = createChat(translatorConfig);

  try {
    // Text chat example
    const response = await extractorChat.chat('extractor', {
      messages: [
        { role: 'user', content: 'Extract the main topics from this text: AI is transforming healthcare.' }
      ]
    });
    console.log('Extractor response:', response);

    // Translation example
    const translation = await translatorChat.chat('translator', {
      messages: [
        { role: 'user', content: 'Translate to Spanish: Hello, how are you?' }
      ]
    });
    console.log('Translation response:', translation);

    // Health check example
    const healthResults = await extractorChat.manualHealthCheck();
    console.log('Health check results:', healthResults);

    // TTS example (if provider supports it)
    try {
      const audioBuffer = await extractorChat.tts('extractor', {
        text: 'Hello, this is a test of text-to-speech functionality.'
      });
      console.log('TTS successful, audio buffer size:', audioBuffer.length);
    } catch (error) {
      console.log('TTS not supported by current provider');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Clean up
    extractorChat.destroy();
    translatorChat.destroy();
  }
}

// Run example if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { extractorConfig, translatorConfig };
