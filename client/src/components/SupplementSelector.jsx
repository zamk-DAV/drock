import React from 'react';

const commonSupplements = [
  "홍삼/인삼",
  "비타민C",
  "오메가3",
  "유산균",
  "칼슘/마그네슘",
  "비타민D",
  "코엔자임Q10",
  "녹즙/양배추즙",
  "밀크씨슬",
  "루테인",
  "철분제",
  "종합비타민",
  "프로폴리스",
  "글루코사민",
  "은행잎추출물",
];

const SupplementSelector = ({ selectedSupplements, setSelectedSupplements }) => {
  const handleCheckboxChange = (supplement) => {
    setSelectedSupplements(prev =>
      prev.includes(supplement)
        ? prev.filter(s => s !== supplement)
        : [...prev, supplement]
    );
  };

  return (
    <div className="supplement-selector">
      <h3>자주 먹는 영양제/건강식품 선택</h3>
      <div className="supplement-grid">
        {commonSupplements.map(supplement => (
          <div key={supplement} className="checkbox-wrapper">
            <input
              type="checkbox"
              id={`supplement-${supplement}`}
              checked={selectedSupplements.includes(supplement)}
              onChange={() => handleCheckboxChange(supplement)}
            />
            <label htmlFor={`supplement-${supplement}`}>{supplement}</label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SupplementSelector;
