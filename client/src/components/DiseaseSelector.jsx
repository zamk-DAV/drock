import React, { useState, useEffect } from 'react';

const diseaseCategories = {
  "혈관/심장": [
    "고혈압", "고지혈증 (이상지질혈증)", "협심증 / 심근경색", "심부전", "부정맥", "뇌졸중 (중풍/뇌경색)"
  ],
  "대사/내분비": ["당뇨병", "갑상선 질환 (항진증/저하증)", "통풍", "비만"],
  "뼈/관절/근육": ["퇴행성 관절염 (무릎/허리)", "류마티스 관절염", "골다공증", "디스크 (허리/목)", "오십견"],
  "소화/호흡기": ["위염 / 위궤양", "역류성 식도염", "만성 폐쇄성 폐질환 (COPD)", "천식", "변비 / 과민성 대장"],
  "신경/정신": ["치매 (알츠하이머/혈관성)", "파킨슨병", "우울증", "불면증", "안구건조증 / 백내장 / 녹내장"],
  "신장/비뇨기": ["만성 신부전 (콩팥병)", "전립선 비대증", "요실금"]
};

const DiseaseSelector = ({ selectedDiseases, setSelectedDiseases }) => {
  const [expandedCategories, setExpandedCategories] = useState({});
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 데스크톱에서는 모두 펼침
  useEffect(() => {
    if (!isMobile) {
      const allExpanded = {};
      Object.keys(diseaseCategories).forEach(category => {
        allExpanded[category] = true;
      });
      setExpandedCategories(allExpanded);
    } else {
      setExpandedCategories({});
    }
  }, [isMobile]);

  const toggleCategory = (category) => {
    if (isMobile) {
      setExpandedCategories(prev => ({
        ...prev,
        [category]: !prev[category]
      }));
    }
  };

  const handleCheckboxChange = (disease) => {
    setSelectedDiseases(prev =>
      prev.includes(disease)
        ? prev.filter(d => d !== disease)
        : [...prev, disease]
    );
  };

  return (
    <div className="disease-selector">
      <h2>1. 현재 가지고 있는 질병을 선택해주세요</h2>
      {Object.entries(diseaseCategories).map(([category, diseases]) => (
        <fieldset
          key={category}
          className={`category-fieldset ${expandedCategories[category] ? 'expanded' : ''}`}
        >
          <legend onClick={() => toggleCategory(category)}>
            {category}
            {isMobile && (
              <span style={{ fontSize: '0.8rem', color: '#718096' }}>
                {expandedCategories[category] ? ' ▲' : ' ▼'}
              </span>
            )}
          </legend>
          <div className="disease-list">
            {diseases.map(disease => (
              <div key={disease} className="checkbox-wrapper">
                <input
                  type="checkbox"
                  id={disease}
                  name={disease}
                  checked={selectedDiseases.includes(disease)}
                  onChange={() => handleCheckboxChange(disease)}
                />
                <label htmlFor={disease}>{disease}</label>
              </div>
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  );
};

export default DiseaseSelector;
