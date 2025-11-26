import React, { useState, useRef } from 'react';

const ImageUploader = ({ onFileSelect, manualMedicines, setManualMedicines }) => {
  const [preview, setPreview] = useState(null);
  const [inputMode, setInputMode] = useState('image'); // 'image' or 'manual'
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      onFileSelect(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="image-uploader">
      <h2>2. 복용 중인 약 정보를 입력해주세요.</h2>

      <div className="input-mode-selector">
        <button
          type="button"
          className={`mode-button ${inputMode === 'image' ? 'active' : ''}`}
          onClick={() => setInputMode('image')}
        >
          📷 사진으로 입력
        </button>
        <button
          type="button"
          className={`mode-button ${inputMode === 'manual' ? 'active' : ''}`}
          onClick={() => setInputMode('manual')}
        >
          ✏️ 직접 입력
        </button>
      </div>

      {inputMode === 'image' ? (
        <>
          <button type="button" onClick={handleButtonClick} className="upload-button">
            사진 선택하기 (촬영 또는 갤러리)
          </button>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            ref={fileInputRef}
            style={{ display: 'none' }}
          />
          {preview && (
            <div className="image-preview">
              <p>선택된 사진:</p>
              <img src={preview} alt="선택한 약 봉투 사진" style={{ maxWidth: '300px', maxHeight: '300px' }} />
            </div>
          )}
        </>
      ) : (
        <div className="manual-input">
          <p style={{ color: '#666', marginBottom: '0.5rem' }}>
            복용 중인 약 이름을 쉼표(,)로 구분하여 입력해주세요.
          </p>
          <textarea
            value={manualMedicines}
            onChange={(e) => setManualMedicines(e.target.value)}
            placeholder="예: 아스피린, 메트포르민, 리피토 등"
            rows="4"
            className="info-textarea"
          />
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
