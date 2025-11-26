import React, { useState, useRef } from 'react';

const ImageUploader = ({ onFileSelect, manualMedicines, setManualMedicines }) => {
  const [previews, setPreviews] = useState([]);
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    if (files.length > 0) {
      onFileSelect(files); // 다중 파일 전달

      // 미리보기 생성
      const newPreviews = [];
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push(reader.result);
          if (newPreviews.length === files.length) {
            setPreviews(newPreviews);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="image-uploader">
      <h2>2. 복용 중인 약 정보를 입력해주세요.</h2>

      <button type="button" onClick={handleButtonClick} className="upload-button">
        📷 사진 선택하기 (여러 장 가능)
      </button>
      <input
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        onChange={handleFileChange}
        ref={fileInputRef}
        style={{ display: 'none' }}
      />

      {previews.length > 0 && (
        <div className="image-preview">
          <p>선택된 사진 ({previews.length}장):</p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {previews.map((preview, idx) => (
              <img key={idx} src={preview} alt={`선택한 약 봉투 사진 ${idx + 1}`} style={{ maxWidth: '150px', maxHeight: '150px', borderRadius: '8px', border: '2px solid #ddd' }} />
            ))}
          </div>
        </div>
      )}

      <div className="manual-input" style={{ marginTop: '1.5rem' }}>
        <p style={{ color: '#666', marginBottom: '0.5rem' }}>
          ✏️ 또는 약 이름을 직접 입력해주세요 (쉼표로 구분)
        </p>
        <textarea
          value={manualMedicines}
          onChange={(e) => setManualMedicines(e.target.value)}
          placeholder="예: 아스피린, 메트포르민, 리피토 등"
          rows="4"
          className="info-textarea"
        />
      </div>
    </div>
  );
};

export default ImageUploader;
