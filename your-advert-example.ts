import dotenv from 'dotenv';
import { createChat } from './src/index';

dotenv.config();

// Your specific advert configuration with structured output
const advertConfig = {
  advert: {
    default_model: 'gemini-1.5-flash',
    retry: 10,
    retry_delay: 1000,
    other_models: {
      // "claude": "claude-2",
    },
    api_key: process.env.GOOGLE_API_KEY,
    // Structured output configuration for job advert
    response_mime_type: 'application/json',
    response_schema: {
      type: 'object',
      properties: {
        technicalCompetencies: {
          type: 'string',
          description: 'Technical skills and competencies required for the position'
        },
        generalCompetencies: {
          type: 'string', 
          description: 'General skills and competencies required for the position'
        },
        jobDescription: {
          type: 'string',
          description: 'Detailed job description and responsibilities'
        }
      },
      required: ['technicalCompetencies', 'generalCompetencies', 'jobDescription']
    },
    clean_json_response: true // Automatically removes ```json blocks
  }
};

// Example usage function that matches your current code
async function createJobAdvert(projectDetail: any, rowId: any) {
  try {
    // Your existing logic...
    // const { companyDetail, projectDetail } = await this.getProjectAndCompanyInformation(rowId, companyId);
    
    // Create chat instance
    const test = createChat(advertConfig);
    
    // The prompt would come from your createPrompt method
    const mockPrompt = `
        Sen, iş ilanları oluşturan bir yapay zeka modelisin. Kullanıcıdan alınan bilgilere göre, LinkedIn formatında ve alt alta maddeler halinde iş ilanları oluşturacaksın. İlanlar, aşağıdaki üç ana bölümden oluşmalıdır: Teknik Yetkinlikler, Genel Yetkinlikler ve İş Tanımı.

        "Detail":
        - İlgili Pozisyon : ADB-2/AMBAR MEMURU/5,
        - Technical Competencies: (
        "Teknik Yetkinlikler bölümü"
        "yonlendirmeli ilan testi20" ile "ADB-2/AMBAR MEMURU/5" arasından hangisi anlamsal olarak daha uygun ve iş ilanı ile aynı dilde ise:
        -Sana verilen anahtar kelimeleri "1, 2, 3" onun ile ilişkilendirip detaylandır.
        ),
        - GeneralCompetencies: ( 
            "Genel yetkinlikler Bölümü"
            -Sana verilen a, s, d kelimeleri ADB-2/AMBAR MEMURU/5 ile ilişkilendirip detaylandır.
        ),
        - Job Description: ( 
          "İş Tanımı Bölümü"
          İş tanımını sana verilen 
      - Pozisyon Bilgisi: yonlendirmeli ilan testi20
      -Yabancı Dil Bilgisi:
      -Pozisyon için verilen anahtar Kelimeler :1, 2, 3
      -Pozisyon için verilen  yetkinlik kelimeleri :a, s, d
       referans alarak özgün pozisyonun sorumluluklarını, gereklilikleri ve beklentilerini açıklayan güzel cümleler kur
        )

        Gereksinimler:
        ** Her alana sadece o alan için verilen bilgilere göre doldur...
        - Maddeler halinde ver.
        - textarea formatında her madde alt alta gelecek şekilde
        - yanlarına (-) eklenecek          

        JSON formatında oluşturmalısın. İşte format:
        {
        "technicalCompetencies": "text",
        "generalCompetencies": "text",
        "jobDescription": "text"
        }
    `;
    
    // Make the API call - this will automatically return clean JSON
    const data = await test.chat('advert', {
      messages: [
        { role: "user", content: mockPrompt }
      ]
    });
    
    console.log('📄 Raw response from Gemini:');
    console.log(data);
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Parse the JSON response
    const parsedData = JSON.parse(data);
    console.log('✅ Parsed job advert data:');
    console.log(JSON.stringify(parsedData, null, 2));
    
    // Your existing logic continues...
    // const detail = this.listFormatController(parsedData);
    // const result = await this.createJobAdvert(projectDetail, companyDetail, detail.technicalCompetencies, detail.generalCompetencies, detail.jobDescription);
    
    test.destroy();
    
    return parsedData;
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// Test the function
createJobAdvert({}, 123).catch(console.error);

export { advertConfig };
