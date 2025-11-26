import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: '메시지가 필요합니다.' });
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        maxOutputTokens: 2048, // 챗봇은 짧은 응답
      }
    });

    const chatPrompt = `
당신은 약물, 음식, 영양제 간의 상호작용에 대해 깊은 지식을 가진 'AI 약사'입니다.
노인분들이 쉽게 이해할 수 있도록 친절하고 간단하게 답변해주세요.

사용자 질문: ${message}

답변 시 주의사항:
1. 짧고 명확하게 답변 (3-5문장)
2. 어려운 의학 용어 피하기
3. 위험한 상호작용은 ⚠️ 표시
4. 궁금한 점이 더 있으면 물어보라고 안내
5. 마지막에 "정확한 답변은 의사/약사와 상담하세요" 꼭 포함
`;

    // 재시도 로직 (최대 3번)
    const MAX_RETRIES = 3;
    let lastError;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`챗봇 응답 생성 시도 ${attempt}/${MAX_RETRIES}...`);

        const result = await model.generateContent(chatPrompt);
        const response = result.response.text();

        console.log(`챗봇 응답 생성 성공 (시도 ${attempt}/${MAX_RETRIES})`);
        return res.status(200).json({ response });

      } catch (error) {
        lastError = error;
        console.error(`챗봇 응답 생성 실패 (시도 ${attempt}/${MAX_RETRIES}):`, error.message);

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
    console.error('챗봇 처리 중 오류:', error);
    res.status(500).json({ error: '답변 생성 중 오류가 발생했습니다.' });
  }
}
