import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import multiparty from 'multiparty';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// AI 프롬프트 생성 함수
const createPrompt = (diseases, supplementInfo, otherInfo, manualMedicines) => {
  const medicineInput = manualMedicines
    ? `복용 중인 약물: ${manualMedicines}`
    : '복용 중인 약물: 첨부된 사진에서 추출';

  return `
당신은 노인분들을 위한 친절한 AI 약사입니다.
복잡한 설명 대신 핵심만 간단명료하게 알려주세요.

환자 정보:
- 보유 질병: ${diseases}
- ${medicineInput}
- 섭취 중인 영양제/건강식품: ${supplementInfo || '없음'}
- 기타: ${otherInfo || '없음'}

분석 요청:
${manualMedicines ?
  `1. 입력된 약물들을 분석해주세요.` :
  `1. 사진에서 약 이름을 찾아주세요. 글씨가 불분명하면 "사진이 흐려서 약 이름을 확인하기 어렵습니다. 더 선명한 사진이나 약 이름을 직접 입력해주세요"라고 안내하세요.`}

2. 각 약물마다 아래 형식으로 간단히 정리하세요:

━━━━━━━━━━━━━━━━━━

[약 이름]
이 약은: (한 문장으로)

절대 같이 먹으면 안되는 것:
- 음식: (핵심만 1-2개)
- 영양제: (핵심만 1-2개)
- 한약: (핵심만 1-2개, 없으면 "없음")

주의할 것:
- (정말 중요한 것만 1-2개)

복용 방법:
- (식전/식후, 술 금지 등 핵심만)

━━━━━━━━━━━━━━━━━━

3. 작성 규칙:
- 마크다운 기호(**, ##, ### 등) 절대 사용 금지
- 번호 목록은 "1. 2. 3." 형식 사용
- 하이픈 목록은 "- " 형식 사용
- 한 문장은 30자 이내로 짧게
- 어려운 의학 용어 사용 금지
- 핵심만 간단히 (각 항목당 1-2개만)
- 이모지는 약 이름 앞 📌, 경고 🚫, 주의 ⚠️만 사용

4. 마지막에 반드시 포함:
━━━━━━━━━━━━━━━━━━
⚠️ 이 정보는 참고용입니다.
정확한 상담은 약사나 의사에게 받으세요.
━━━━━━━━━━━━━━━━━━
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

  // 환경변수 확인
  if (!process.env.GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY 환경변수가 설정되지 않았습니다.');
    return res.status(500).json({ error: 'API 키가 설정되지 않았습니다. 관리자에게 문의하세요.' });
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

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        maxOutputTokens: 8192, // 출력 토큰 제한
      }
    });
    const prompt = createPrompt(diseases, supplementInfo, otherInfo, manualMedicines);

    const safetySettings = [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ];

    // 재시도 로직 (최대 3번)
    const MAX_RETRIES = 3;
    let lastError;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`AI 분석 시도 ${attempt}/${MAX_RETRIES}...`);

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
        console.log(`AI 분석 성공 (시도 ${attempt}/${MAX_RETRIES})`);
        return res.status(200).json({ analysis });

      } catch (error) {
        lastError = error;
        console.error(`AI 분석 실패 (시도 ${attempt}/${MAX_RETRIES}):`, error.message);

        // 429 (할당량 초과) 또는 503 (서비스 일시 중단) 에러인 경우 재시도
        if (attempt < MAX_RETRIES && (error.status === 429 || error.status === 503 || error.message.includes('quota'))) {
          const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // 지수 백오프 (최대 5초)
          console.log(`${waitTime}ms 대기 후 재시도...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }

        // 재시도할 수 없는 에러이거나 마지막 시도인 경우 중단
        break;
      }
    }

    // 모든 재시도 실패
    throw lastError;

  } catch (error) {
    console.error('AI 분석 중 오류 발생:', error);
    console.error('오류 상세:', error.message, error.stack);
    res.status(500).json({
      error: 'AI 분석 중 서버에서 오류가 발생했습니다.',
      details: error.message,
      stack: error.stack
    });
  }
}
