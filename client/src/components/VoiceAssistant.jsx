import React, { useState, useEffect } from 'react';

const VoiceAssistant = ({ result }) => {
  const [isReading, setIsReading] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  useEffect(() => {
    // TTS 지원 확인
    if ('speechSynthesis' in window) {
      setSpeechSupported(true);
    }
  }, []);

  const speakResult = () => {
    if (!speechSupported || !result) return;

    const utterance = new SpeechSynthesisUtterance(result);
    utterance.lang = 'ko-KR';
    utterance.rate = 0.9; // 속도 조금 느리게 (노인 배려)
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsReading(true);
    utterance.onend = () => setIsReading(false);
    utterance.onerror = () => setIsReading(false);

    window.speechSynthesis.cancel(); // 이전 음성 중단
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsReading(false);
  };

  if (!speechSupported || !result) return null;

  return (
    <div className="voice-assistant">
      {!isReading ? (
        <button
          type="button"
          className="voice-button"
          onClick={speakResult}
          title="결과를 소리내어 읽어줍니다"
        >
          🔊 결과 듣기
        </button>
      ) : (
        <button
          type="button"
          className="voice-button stop"
          onClick={stopSpeaking}
          title="읽기 중단"
        >
          ⏸️ 중단
        </button>
      )}
    </div>
  );
};

export default VoiceAssistant;
