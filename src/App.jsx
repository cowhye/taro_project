import React, { useState, useEffect, useCallback } from 'react'; 
import TarotCard from './components/TarotCard';
import tarotData from './data/tarot.json';
import { sendTopicToLLM, sendCardsToLLM } from './services/llmService';
import './App.css';

/**
 * App 컴포넌트 - LLM 기반 타로 시스템
 * 1. 주제 입력 -> LLM이 스프레드 결정
 * 2. 카드 선택
 * 3. 선택된 카드 전달 -> LLM이 최종 해석
 */
function App() {
  // --- 상태 관리 ---
  const [userTopic, setUserTopic] = useState(''); // 사용자 질문/주제
  const [shuffledCards, setShuffledCards] = useState([]); // 전체 셔플된 카드 목록
  
  // LLM 응답 상태
  const [llmSpread, setLlmSpread] = useState(null); // { cardCount, positions }
  const [interpretationResult, setInterpretationResult] = useState(null); // 최종 해석 결과
  
  // 진행 상태
  const [step, setStep] = useState('INPUT'); // INPUT, SELECTION, RESULT
  const [isLoading, setIsLoading] = useState(false); // 로딩 여부
  
  // 카드 선택 상태
  const [selectedIndices, setSelectedIndices] = useState([]); // 선택된 카드의 인덱스 리스트
  const [cardStates, setCardStates] = useState({}); // 각 카드의 뒤집힘 및 역방향 상태

  // --- 초기화 ---
  useEffect(() => {
    shuffleDeck();
  }, []);

  // 카드 셔플 함수
  const shuffleDeck = useCallback(() => {
    let fullDeck = [...tarotData];
    
    // 78장 분량으로 데이터 확장 (데이터가 부족할 경우 복제)
    while (fullDeck.length < 78) {
      fullDeck = [...fullDeck, ...tarotData.map(c => ({ ...c, id: fullDeck.length + c.id }))];
    }
    fullDeck = fullDeck.slice(0, 78);

    // 피셔-예이츠 셔플 알고리즘
    for (let i = fullDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [fullDeck[i], fullDeck[j]] = [fullDeck[j], fullDeck[i]];
    }
    
    setShuffledCards(fullDeck);
    setSelectedIndices([]);
    setCardStates({});
  }, []);

  // --- 핸들러 함수 ---

  // 1단계: 주제 제출 (LLM에 전달하여 스프레드 결정)
  const handleTopicSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!userTopic.trim()) {
      alert("주제를 입력해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await sendTopicToLLM(userTopic);
      setLlmSpread(response);
      setStep('SELECTION');
      shuffleDeck(); // 매번 새로운 상담을 위해 셔플
    } catch (error) {
      console.error("스프레드 결정 중 오류 발생:", error);
      alert("오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  // "오늘의 운세 보기" 고정 모드
  const handleDailyFortune = async () => {
    const dailyTopic = "오늘의 전반적인 운세";
    setUserTopic(dailyTopic);
    setIsLoading(true);
    try {
      const response = await sendTopicToLLM(dailyTopic);
      setLlmSpread(response);
      setStep('SELECTION');
      shuffleDeck();
    } catch (error) {
      console.error("스프레드 결정 중 오류 발생:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 2단계: 카드 클릭 핸들러
  const handleCardClick = (index) => {
    if (step !== 'SELECTION' || isLoading) return;
    if (selectedIndices.includes(index) || selectedIndices.length >= llmSpread.cardCount) {
      return;
    }

    const newSelectedIndices = [...selectedIndices, index];
    setSelectedIndices(newSelectedIndices);

    // 카드의 상태(뒤집힘, 역방향 여부) 결정
    const isReversed = Math.random() < 0.3; // 30% 확률로 역방향 (타로 관례상 정방향이 더 많음)
    setCardStates(prev => ({
      ...prev,
      [index]: { isFlipped: true, isReversed }
    }));
  };

  // 3단계: 결과 보기 버튼 클릭 (선택된 카드를 LLM에 전달하여 해석)
 const handleViewResult = async () => {
  setIsLoading(true);
  try {
    const selectedCardsInfo = selectedIndices.map(index => ({
      name: shuffledCards[index].name,
      direction: cardStates[index].isReversed ? 'reversed' : 'upright'
    }));

    const response = await sendCardsToLLM(
      userTopic,
      selectedCardsInfo,
      llmSpread.positions
    );

    // ✅ 문자열 JSON 방어
    const parsed =
      typeof response === "string" ? JSON.parse(response) : response;

    // ✅ 핵심: interpretation 배열만 저장
    setInterpretationResult(parsed.interpretation);

    setStep('RESULT');
  } catch (error) {
    alert("해석 오류");
  } finally {
    setIsLoading(false);
  }
};
  // 초기 화면으로 돌아가기
  const resetApp = () => {
    setStep('INPUT');
    setUserTopic('');
    setLlmSpread(null);
    setInterpretationResult(null);
    setSelectedIndices([]);
    setCardStates({});
    shuffleDeck();
  };

  // --- 렌더링 ---

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>AI 신비 타로</h1>
        <p>당신의 질문에 LLM이 맞춤 스프레드와 깊이 있는 해석을 제공합니다</p>
      </header>

      {isLoading && (
        <div className="loading-overlay">
          <div className="loader"></div>
          <p>{step === 'INPUT' ? 'LLM이 최적의 스프레드를 구성 중입니다...' : 'LLM이 카드를 분석하고 있습니다...'}</p>
        </div>
      )}

      {/* 1. 주제 입력 단계 */}
      {step === 'INPUT' && (
        <section className="input-section">
          <form onSubmit={handleTopicSubmit} className="topic-input-container">
            <label htmlFor="topic-input">무엇이 궁금하신가요?</label>
            <input 
              id="topic-input"
              type="text" 
              value={userTopic}
              onChange={(e) => setUserTopic(e.target.value)}
              placeholder="예: 이번 프로젝트의 결과가 어떻게 될까요? / 연애운이 궁금해요"
              className="topic-input"
              disabled={isLoading}
            />
            <div className="button-group">
              <button type="submit" className="main-btn" disabled={isLoading}>스프레드 확인하기</button>
              <button type="button" className="daily-btn" onClick={handleDailyFortune} disabled={isLoading}>오늘의 운세 보기</button>
            </div>
          </form>
        </section>
      )}

      {/* 2. 카드 선택 단계 */}
      {step === 'SELECTION' && llmSpread && (
        <section className="selection-section">
          <div className="selection-header">
            <h2>"{userTopic}"</h2>
            <p className="spread-info">
              LLM이 제안한 스프레드: <strong>총 {llmSpread.cardCount}장</strong>의 카드를 선택해주세요.
            </p>
            <div className="position-hints">
              {llmSpread.positions.map((pos, idx) => (
                <span key={idx} className={`pos-hint ${selectedIndices.length > idx ? 'checked' : ''}`}>
                  {idx + 1}. {pos}
                </span>
              ))}
            </div>
          </div>

          <div className="card-grid">
            {shuffledCards.map((card, index) => (
              <TarotCard
                key={`${card.id}-${index}`}
                card={card}
                isSelected={selectedIndices.includes(index)}
                isFlipped={cardStates[index]?.isFlipped}
                isReversed={cardStates[index]?.isReversed}
                onClick={() => handleCardClick(index)}
              />
            ))}
          </div>
          
          {selectedIndices.length === llmSpread.cardCount && (
            <div className="result-action">
              <button className="view-result-btn" onClick={handleViewResult}>해석 시작하기</button>
            </div>
          )}
        </section>
      )}

      {/* 3. 결과 해석 단계 */}
      {step === 'RESULT' && interpretationResult && (
        <div className="result-view">
          <div className="result-header">
            <h2>타로 해석 결과</h2>
            <div className="user-topic-display">
              <strong>질문:</strong> "{userTopic}"
            </div>
          </div>

          <div className="selected-cards-display">
            {selectedIndices.map((index, i) => {
              const card = shuffledCards[index];
              const isReversed = cardStates[index]?.isReversed;
              console.log("card:", card);
              console.log("interpretationResult:", interpretationResult);
              
              const interpretation = interpretationResult?.[i];
              if (!interpretation) return null;
              
              return (
                <div key={card.id + '-' + i} className="result-item">
                  <div className="position-label">{interpretation.position}</div>
                  <div className={`result-card-img ${isReversed ? 'reversed' : ''}`}>
                    <img src={card.image} alt={card.name} />
                  </div>
                  <div className="result-info">
                    <h3>{card.name} {isReversed ? '(역방향)' : '(정방향)'}</h3>
                    <p className="meaning">
                      {interpretation.meaning}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="result-footer">
            <button className="reset-btn" onClick={resetApp}>새로운 상담 시작하기</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;