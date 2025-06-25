import dotenv from 'dotenv';
import { createChat } from './src/index';

dotenv.config();

// Example with Gemini structured output
const advertConfigStructured = {
  advert: {
    default_model: 'gemini-1.5-flash',
    retry: 10,
    retry_delay: 1000,
    other_models: {},
    api_key: process.env.GOOGLE_API_KEY,
    // Gemini structured output configuration
    response_mime_type: 'application/json',
    response_schema: {
      type: 'object',
      properties: {
        technicalCompetencies: {
          type: 'string',
          description: 'Technical skills and competencies'
        },
        generalCompetencies: {
          type: 'string', 
          description: 'General skills and competencies'
        },
        jobDescription: {
          type: 'string',
          description: 'Job description and responsibilities'
        }
      },
      required: ['technicalCompetencies', 'generalCompetencies', 'jobDescription']
    },
    clean_json_response: true // This will clean ```json blocks automatically
  }
};

// Example with OpenAI structured output
const openaiStructuredConfig = {
  chat: {
    default_model: 'gpt-4o-mini', // Use a model that supports structured output
    retry: 10,
    retry_delay: 1000,
    other_models: {},
    api_key: process.env.OPENAI_API_KEY,
    response_schema: {
      type: 'object',
      properties: {
        technicalCompetencies: { type: 'string' },
        generalCompetencies: { type: 'string' },
        jobDescription: { type: 'string' }
      },
      required: ['technicalCompetencies', 'generalCompetencies', 'jobDescription']
    },
    clean_json_response: true
  }
};

async function testStructuredOutput() {
  try {
    console.log('🧪 Testing Gemini Structured Output...\n');
    
    const geminiChat = createChat(advertConfigStructured);
    
    const response = await geminiChat.chat('advert', {
      messages: [
        { 
          role: "user", 
          content: `Create a job description for a Software Engineer position. Return as JSON with technicalCompetencies, generalCompetencies, and jobDescription fields.`
        }
      ]
    });
    
    console.log('📄 Raw Response:');
    console.log(response);
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Try to parse as JSON
    try {
      const parsed = JSON.parse(response);
      console.log('✅ Successfully parsed JSON:');
      console.log(JSON.stringify(parsed, null, 2));
    } catch (parseError) {
      console.log('❌ JSON parse failed:', parseError);
    }
    
    geminiChat.destroy();
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function testOpenAIStructuredOutput() {
  try {
    console.log('\n🧪 Testing OpenAI Structured Output...\n');
    
    const openaiChat = createChat(openaiStructuredConfig);
    
    const response = await openaiChat.chat('chat', {
      messages: [
        { 
          role: "user", 
          content: `Create a job description for a Software Engineer position.`
        }
      ]
    });
    
    console.log('📄 OpenAI Response:');
    console.log(response);
    
    // Try to parse as JSON
    try {
      const parsed = JSON.parse(response);
      console.log('✅ Successfully parsed OpenAI JSON:');
      console.log(JSON.stringify(parsed, null, 2));
    } catch (parseError) {
      console.log('❌ OpenAI JSON parse failed:', parseError);
    }
    
    openaiChat.destroy();
    
  } catch (error) {
    console.error('❌ OpenAI Error:', error);
  }
}

// Test with runtime options (overriding config)
async function testRuntimeOptions() {
  try {
    console.log('\n🧪 Testing Runtime Options Override...\n');
    
    const chat = createChat(advertConfigStructured);
    
    const response = await chat.chat('advert', {
      messages: [
        { 
          role: "user", 
          content: `Create a simple greeting message.`
        }
      ],
      // Override structured output at runtime
      response_mime_type: undefined, // Disable structured output
      clean_json_response: false     // Don't clean JSON
    });
    
    console.log('📄 Runtime Override Response:');
    console.log(response);
    
    chat.destroy();
    
  } catch (error) {
    console.error('❌ Runtime Override Error:', error);
  }
}

// Run tests
async function runAllTests() {
  await testStructuredOutput();
  await testOpenAIStructuredOutput();
  await testRuntimeOptions();
}

runAllTests().catch(console.error);

export { advertConfigStructured, openaiStructuredConfig };
