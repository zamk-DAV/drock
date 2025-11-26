import { useState } from 'react';
import './App.css';
import DiseaseSelector from './components/DiseaseSelector';
import ImageUploader from './components/ImageUploader';
import AdditionalInfo from './components/AdditionalInfo';
import ResultDisplay from './components/ResultDisplay';
import ChatMode from './components/ChatMode';

function App() {
  const [selectedDiseases, setSelectedDiseases] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [manualMedicines, setManualMedicines] = useState('');
  const [selectedSupplements, setSelectedSupplements] = useState([]);
  const [supplementInfo, setSupplementInfo] = useState('');
  const [otherInfo, setOtherInfo] = useState('');

  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [chatModeOpen, setChatModeOpen] = useState(false);

  const handleAnalyze = async () => {
    // 사진 또는 약 이름 직접 입력 중 하나는 필수
    if (imageFiles.length === 0 && !manualMedicines.trim()) {
      alert('약 봉투 사진을 업로드하거나 약 이름을 직접 입력해주세요.');
      return;
    }
    if (selectedDiseases.length === 0) {
      alert('질병을 하나 이상 선택해주세요.');
      return;
    }

    setIsLoading(true);
    setResult(null);

    // 체크리스트와 직접 입력을 합쳐서 전송
    const allSupplements = [...selectedSupplements];
    if (supplementInfo.trim()) {
      allSupplements.push(supplementInfo.trim());
    }

    const formData = new FormData();
    if (imageFiles.length > 0) {
      imageFiles.forEach(file => {
        formData.append('images', file);
      });
    }
    formData.append('manualMedicines', manualMedicines);
    formData.append('diseases', selectedDiseases.join(', '));
    formData.append('supplementInfo', allSupplements.join(', '));
    formData.append('otherInfo', otherInfo);

    try {
      // Vercel 배포 시 상대 경로 사용
      const API_URL = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${API_URL}/api/analyze`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('서버 에러 상세:', errorData);

        let errorMsg = errorData.error || `서버 오류: ${response.status}`;
        if (errorData.details) {
          errorMsg += `\n\n상세 정보: ${errorData.details}`;
        }
        if (errorData.stack) {
          console.error('스택 트레이스:', errorData.stack);
        }

        throw new Error(errorMsg);
      }

      const data = await response.json();
      setResult(data.analysis);

    } catch (error) {
      console.error('분석 중 오류 발생:', error);
      let errorMessage = '오류가 발생했습니다.\n\n';

      if (error.message.includes('Failed to fetch')) {
        errorMessage += '❌ 서버에 연결할 수 없습니다.\n';
        errorMessage += '• 인터넷 연결을 확인해주세요.\n';
        errorMessage += '• 백엔드 서버가 실행 중인지 확인해주세요.\n';
      } else if (error.message.includes('400')) {
        errorMessage += '❌ 입력 정보가 올바르지 않습니다.\n';
        errorMessage += '• 약 사진 또는 약 이름을 입력했는지 확인해주세요.\n';
      } else if (error.message.includes('500')) {
        errorMessage += '❌ AI 분석 중 오류가 발생했습니다.\n';
        errorMessage += '• 사진이 너무 크거나 형식이 맞지 않을 수 있습니다.\n';
        errorMessage += '• 잠시 후 다시 시도해주세요.\n';
      } else {
        errorMessage += `오류 내용: ${error.message}\n\n`;
        errorMessage += '잠시 후 다시 시도해주세요.';
      }

      setResult(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="App">
      <header>
        <h1>천생약분</h1>
        <p>AI 기반 약물-음식 상호작용 분석</p>
        <button
          type="button"
          className="chat-mode-button"
          onClick={() => setChatModeOpen(true)}
        >
          💬 음성 도우미
        </button>
      </header>
      <main>
        {!result && !isLoading && (
          <form onSubmit={(e) => { e.preventDefault(); handleAnalyze(); }}>
            <DiseaseSelector
              selectedDiseases={selectedDiseases}
              setSelectedDiseases={setSelectedDiseases}
            />
            <ImageUploader
              onFileSelect={setImageFiles}
              manualMedicines={manualMedicines}
              setManualMedicines={setManualMedicines}
            />
            <AdditionalInfo
              selectedSupplements={selectedSupplements}
              setSelectedSupplements={setSelectedSupplements}
              supplementInfo={supplementInfo}
              setSupplementInfo={setSupplementInfo}
              otherInfo={otherInfo}
              setOtherInfo={setOtherInfo}
            />
            <button type="submit" className="analyze-button" disabled={isLoading}>
              {isLoading ? '분석 중...' : 'AI 분석 요청하기'}
            </button>
          </form>
        )}
        <ResultDisplay result={result} isLoading={isLoading} />
        {(result || isLoading) && !isLoading && (
          <button type="button" className="reset-button" onClick={handleRetry}>
            새로 분석하기
          </button>
        )}
      </main>

      {chatModeOpen && <ChatMode onClose={() => setChatModeOpen(false)} />}
    </div>
  );
}

export default App;
