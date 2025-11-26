import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// --- 초기 설정 ---
dotenv.config();
const app = express();
const port = process.env.PORT || 3000;
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- 미들웨어 설정 ---
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? ['https://cheonsaengyakbun.vercel.app', 'https://*.vercel.app']
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Multer 설정: 이미지를 메모리에 버퍼로 저장
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// --- AI 프롬프트 생성 함수 ---
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

// --- API 엔드포인트 ---
app.get('/', (req, res) => {
  res.send('천생약분 백엔드 서버');
});

app.post('/api/analyze', upload.single('image'), async (req, res) => {
  try {
    const { diseases, manualMedicines, supplementInfo, otherInfo } = req.body;

    // 이미지 또는 약 이름 직접 입력 중 하나는 필수
    if (!req.file && !manualMedicines) {
      return res.status(400).json({ error: '이미지 파일 또는 약 이름을 입력해주세요.' });
    }

    const imageBuffer = req.file ? req.file.buffer : null;

    // Gemini 모델 설정 (gemini-2.5-flash 사용)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = createPrompt(diseases, supplementInfo, otherInfo, manualMedicines);

    // 민감한 정보 차단 설정 완화
    const safetySettings = [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ];

    let result;
    if (imageBuffer) {
      // 이미지가 있으면 이미지와 함께 분석
      const imagePart = {
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType: req.file.mimetype,
        },
      };
      result = await model.generateContent([prompt, imagePart], { safetySettings });
    } else {
      // 이미지 없이 텍스트만 분석
      result = await model.generateContent(prompt, { safetySettings });
    }

    const analysis = result.response.text();

    res.json({ analysis });

  } catch (error) {
    console.error('AI 분석 중 오류 발생:', error);
    res.status(500).json({ error: 'AI 분석 중 서버에서 오류가 발생했습니다.' });
  }
});

// --- 챗봇 API 엔드포인트 ---
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: '메시지가 필요합니다.' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

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

    const result = await model.generateContent(chatPrompt);
    const response = result.response.text();

    res.json({ response });

  } catch (error) {
    console.error('챗봇 처리 중 오류:', error);
    res.status(500).json({ error: '답변 생성 중 오류가 발생했습니다.' });
  }
});

// --- 서버 시작 ---
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});