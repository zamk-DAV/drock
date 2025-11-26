import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import multiparty from 'multiparty';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// AI 프롬프트 생성 함수
const createPrompt = (diseases, supplementInfo, otherInfo, manualMedicines) => {
  const medicineInput = manualMedicines
    ? `**복용 중인 약물:** ${manualMedicines}`
    : '**복용 중인 약물:** 첨부된 사진에서 추출';

  return `
당신은 약물, 음식, 영양제 간의 상호작용에 대해 깊은 지식을 가진 'AI 약사'입니다.
특히 **노인분들이 "건강에 좋다"고 무분별하게 섭취하는 건강식품, 영양제, 한약과 약물의 위험한 상호작용**을 경고하는 것이 주된 목적입니다.

### 환자 정보
1.  **보유 질병:** ${diseases}
2.  ${medicineInput}
3.  **현재 섭취 중인 영양제/건강보조식품/한약:** ${supplementInfo || '입력 없음'}
4.  **기타 특이사항:** ${otherInfo || '입력 없음'}

### 요청사항
${manualMedicines ?
  `1. 위에 입력된 약물들을 기준으로 분석을 진행해주세요.` :
  `1. 첨부된 약 봉투 사진에서 약물 이름들을 모두 추출해주세요. 만약 사진이 흐릿하거나 약물명을 파악할 수 없다면, "사진의 글씨가 명확하지 않아 약물 정보를 파악하기 어렵습니다. 더 선명한 사진으로 다시 시도하거나 약 이름을 직접 입력해주세요."라고 안내해주세요.`}

2. 각 약물에 대해 다음을 **중점적으로** 경고해주세요:

   ⚠️ **피해야 할 음식 (최우선)**
   - 자몽, 바나나, 녹즙, 홍삼차 등 노인들이 자주 먹는 음식 중 약과 충돌하는 것
   - 나트륨, 칼륨 함량이 높은 음식 (김치, 젓갈 등)

   ⚠️ **피해야 할 영양제/건강보조식품 (최우선)**
   - 홍삼/인삼, 오메가3, 비타민K, 칼슘, 마그네슘 등
   - 현재 복용 중인 영양제와의 충돌 여부

   ⚠️ **피해야 할 한약/건강즙**
   - 녹용, 경옥고, 양배추즙, 브로콜리즙 등

   ⚠️ **주의사항**
   - 복용 시간대 (공복/식후)
   - 알코올과의 상호작용

3. 결과는 **약물별로** 구분하여 정리하되, 다음 형식을 사용해주세요:

   📌 [약물 이름]
   → 이 약은 무엇에 쓰는 약인가요: (간단한 설명)

   🚫 절대 함께 먹으면 안 되는 것:
   - 음식:
   - 영양제:
   - 한약:

   ⚠️ 주의해서 먹어야 하는 것:
   - 음식:
   - 영양제:

   ℹ️ 복용 시 주의사항:

4. 어르신들이 이해하기 쉽도록 **쉬운 한글**과 **큰 글씨로 읽기 편한 형식**으로 작성해주세요.

5. 가장 마지막에는 반드시 다음 경고 문구를 포함해주세요:
   "⚠️ 이 분석은 AI에 의한 참고 정보입니다. 최종적인 의학적 결정은 반드시 의사 또는 약사와 상담하시기 바랍니다."
`;
};

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // multiparty로 form data 파싱
    const form = new multiparty.Form();

    const parseForm = () => {
      return new Promise((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) reject(err);
          else resolve({ fields, files });
        });
      });
    };

    const { fields, files } = await parseForm();

    const diseases = fields.diseases?.[0] || '';
    const manualMedicines = fields.manualMedicines?.[0] || '';
    const supplementInfo = fields.supplementInfo?.[0] || '';
    const otherInfo = fields.otherInfo?.[0] || '';
    const imageFiles = files.images || [];

    // 이미지 또는 약 이름 직접 입력 중 하나는 필수
    if (imageFiles.length === 0 && !manualMedicines) {
      return res.status(400).json({ error: '이미지 파일 또는 약 이름을 입력해주세요.' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    const prompt = createPrompt(diseases, supplementInfo, otherInfo, manualMedicines);

    const safetySettings = [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ];

    let result;
    if (imageFiles.length > 0) {
      // 이미지가 있으면 이미지와 함께 분석
      const fs = await import('fs');
      const contentParts = [prompt];

      // 다중 이미지 처리
      for (const imageFile of imageFiles) {
        const imageBuffer = fs.readFileSync(imageFile.path);
        const imagePart = {
          inlineData: {
            data: imageBuffer.toString('base64'),
            mimeType: imageFile.headers['content-type'] || 'image/jpeg',
          },
        };
        contentParts.push(imagePart);
      }

      result = await model.generateContent(contentParts, { safetySettings });
    } else {
      // 이미지 없이 텍스트만 분석
      result = await model.generateContent(prompt, { safetySettings });
    }

    const analysis = result.response.text();
    res.status(200).json({ analysis });

  } catch (error) {
    console.error('AI 분석 중 오류 발생:', error);
    console.error('오류 상세:', error.message, error.stack);
    res.status(500).json({
      error: 'AI 분석 중 서버에서 오류가 발생했습니다.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
