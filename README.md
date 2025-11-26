# 천생약분 (天生藥分)

> AI 기반 약물-음식 상호작용 분석 서비스

노인분들이 복용 중인 약물과 질병 정보를 바탕으로, 피해야 할 음식, 영양제, 건강보조식품, 한약 등을 AI가 분석하여 알려주는 웹 서비스입니다.

## 📋 주요 기능

- **질병 선택**: 30가지 노인 다빈도 질환을 카테고리별로 선택
- **약물 정보 인식**: 약 봉투/복약지도서 사진을 AI가 자동 분석
- **약물 직접 입력**: 사진 인식이 어려운 경우 약 이름 직접 입력
- **건강식품 체크**: 자주 섭취하는 영양제/건강보조식품 체크리스트
- **음성 지원**: 음성으로 정보 입력 및 결과 듣기 (STT/TTS)
- **대화형 인터페이스**: 챗봇으로 편리하게 정보 입력
- **상호작용 분석**: 약물과 음식/영양제/한약의 충돌 가능성 분석

## 🚀 시작하기

### 필요 사항

- Node.js 18 이상
- Gemini API 키 ([Google AI Studio](https://makersuite.google.com/app/apikey)에서 발급)

### 설치 방법

1. 저장소 클론
```bash
git clone https://github.com/yourusername/천생약분.git
cd 천생약분
```

2. 의존성 설치
```bash
# 클라이언트 의존성 설치
cd client
npm install

# 서버 의존성 설치
cd ../server
npm install
```

3. 환경 변수 설정
```bash
cd server
cp .env.example .env
# .env 파일을 열어서 GEMINI_API_KEY에 실제 API 키 입력
```

4. 개발 서버 실행
```bash
# 터미널 1: 백엔드 서버 (포트 3000)
cd server
npm run dev

# 터미널 2: 프론트엔드 (포트 5173)
cd client
npm run dev
```

5. 브라우저에서 `http://localhost:5173` 접속

## 🏗️ 프로젝트 구조

```
천생약분/
├── client/                 # React 프론트엔드
│   ├── src/
│   │   ├── components/    # React 컴포넌트
│   │   ├── App.jsx        # 메인 앱
│   │   └── main.jsx       # 진입점
│   └── package.json
├── server/                 # Express 백엔드
│   ├── server.js          # 메인 서버
│   ├── .env               # 환경 변수 (Git 제외)
│   └── package.json
├── .gitignore
└── README.md
```

## 🛠️ 기술 스택

### 프론트엔드
- React 18
- Vite
- CSS3 (반응형 디자인)
- Web Speech API (음성 인식/합성)

### 백엔드
- Node.js
- Express
- Multer (이미지 업로드)
- Google Generative AI (Gemini 2.0 Flash)

## 📱 사용 방법

1. **질병 선택**: 현재 가지고 있는 질병을 카테고리별로 선택
2. **약물 정보 입력**:
   - 약 봉투 사진 촬영/업로드 또는
   - 약 이름 직접 입력
3. **건강식품 입력**: 현재 섭취 중인 영양제/건강보조식품 체크 또는 직접 입력
4. **AI 분석 요청**: 버튼 클릭하여 분석 시작
5. **결과 확인**: 피해야 할 음식/영양제/한약 정보 확인

## ⚠️ 주의사항

이 서비스는 참고용 정보 제공을 목적으로 하며, 의학적 조언이나 진단을 대체하지 않습니다.
최종적인 의학적 결정은 반드시 의사 또는 약사와 상담하시기 바랍니다.

## 📄 라이선스

This project is private and not licensed for public use.

## 🤝 기여

현재 개인 프로젝트로 진행 중입니다.

## 📧 문의

프로젝트 관련 문의사항은 이슈를 등록해주세요.
