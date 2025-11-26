import React from 'react';
import SupplementSelector from './SupplementSelector';

const AdditionalInfo = ({
  selectedSupplements,
  setSelectedSupplements,
  supplementInfo,
  setSupplementInfo,
  otherInfo,
  setOtherInfo
}) => {
  return (
    <div className="additional-info">
      <h2>3. 현재 드시고 있는 영양제, 건강보조식품, 한약 등을 선택하거나 입력해주세요.</h2>

      <SupplementSelector
        selectedSupplements={selectedSupplements}
        setSelectedSupplements={setSelectedSupplements}
      />

      <h3 style={{ marginTop: '1.5rem' }}>위에 없는 다른 것을 드시고 있다면 직접 입력해주세요</h3>
      <textarea
        value={supplementInfo}
        onChange={(e) => setSupplementInfo(e.target.value)}
        placeholder="예: 경옥고, 녹용, 기타 한약재 등"
        rows="3"
        className="info-textarea"
      />

      <h2>4. 기타 특이사항이 있다면 알려주세요.</h2>
      <textarea
        value={otherInfo}
        onChange={(e) => setOtherInfo(e.target.value)}
        placeholder="예: 특정 음식에 알러지가 있어요, 신장 기능이 좋지 않아요 등"
        rows="3"
        className="info-textarea"
      />
    </div>
  );
};

export default AdditionalInfo;
