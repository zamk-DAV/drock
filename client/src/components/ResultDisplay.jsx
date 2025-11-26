import React from 'react';
import VoiceAssistant from './VoiceAssistant';

const ResultDisplay = ({ result, isLoading }) => {
  if (isLoading) {
    return (
      <div className="result-display">
        <h2>AI 분석 중...</h2>
        <div className="loading-spinner"></div>
        <p>잠시만 기다려주세요. AI가 열심히 분석하고 있습니다.</p>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  return (
    <div className="result-display">
      <div className="result-header">
        <h2>AI 분석 결과</h2>
        <VoiceAssistant result={result} />
      </div>
      <div className="result-content">
        <pre>{result}</pre>
      </div>
    </div>
  );
};

export default ResultDisplay;
