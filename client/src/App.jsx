import React, { useState, useEffect, useCallback } from 'react';
import TarotCard from './components/TarotCard';
import tarotData from './data/tarot.json';
import { sendTopicToLLM, sendCardsToLLM } from './services/llmService';
import { supabase } from './supabase';
import './App.css';

function App() {
  const [session, setSession] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [usageInfo, setUsageInfo] = useState({ count: 0, limit: 5 });

  const [userTopic, setUserTopic] = useState('');
  const [shuffledCards, setShuffledCards] = useState([]);
  const [llmSpread, setLlmSpread] = useState(null);
  const [interpretationResult, setInterpretationResult] = useState(null);
  const [step, setStep] = useState('INPUT'); 
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [cardStates, setCardStates] = useState({});

  const shuffleDeck = useCallback(() => {
    let fullDeck = [...tarotData];
    while (fullDeck.length < 78) {
      fullDeck = [...fullDeck, ...tarotData.map(c => ({ ...c, id: `extra-${fullDeck.length}-${c.id}` }))];
    }
    fullDeck = fullDeck.slice(0, 78);
    for (let i = fullDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [fullDeck[i], fullDeck[j]] = [fullDeck[j], fullDeck[i]];
    }
    setShuffledCards(fullDeck);
  }, []);

  const fetchUsage = useCallback(async (userId) => {
    if (!userId) return;
    try {
      const { data } = await supabase.from('user_usage').select('usage_count, usage_limit').eq('id', userId).single();
      if (data) setUsageInfo({ count: data.usage_count, limit: data.usage_limit });
    } catch (e) { console.error("사용량 조회 실패:", e); }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession) {
        setSession(currentSession);
        fetchUsage(currentSession.user.id);
      }
      shuffleDeck();
      setIsAuthLoading(false);
    };
    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      if (currentSession) fetchUsage(currentSession.user.id);
    });
    return () => subscription?.unsubscribe();
  }, [shuffleDeck, fetchUsage]);

  const handleTopicSubmit = async (customTopic) => {
    const topic = customTopic || userTopic;
    if (!topic.trim()) return alert("주제를 입력해주세요.");
    
    setIsLoading(true);
    try {
      const response = await sendTopicToLLM(topic);
      setLlmSpread(response);
      setUserTopic(topic); // 오늘의 운세 클릭 시 텍스트 업데이트용
      setStep('SELECTION');
    } catch (error) {
      console.error(error);
      alert("서버 연결 실패! 서버(node server.js)가 켜져 있는지 확인하세요.");
    } finally { setIsLoading(false); }
  };

  const handleCardClick = (index) => {
    if (step !== 'SELECTION' || isLoading) return;
    if (selectedIndices.includes(index) || selectedIndices.length >= (llmSpread?.cardCount || 0)) return;

    setSelectedIndices(prev => [...prev, index]);
    setCardStates(prev => ({
      ...prev,
      [index]: { isFlipped: true, isReversed: Math.random() < 0.3 }
    }));
  };

  const handleViewResult = async () => {
    setIsLoading(true);
    try {
      const selectedCardsInfo = selectedIndices.map(index => ({
        name: shuffledCards[index].name,
        direction: cardStates[index].isReversed ? 'reversed' : 'upright'
      }));
      
      const response = await sendCardsToLLM(userTopic, selectedCardsInfo);
      setInterpretationResult(response);
      
      if (session) {
        await supabase.rpc('increment_usage', { user_id: session.user.id });
        fetchUsage(session.user.id);
      }
      setStep('RESULT');
    } catch (error) {
      console.error(error);
      alert("해석 도중 오류 발생");
    } finally { setIsLoading(false); }
  };

  const resetApp = () => {
    setStep('INPUT');
    setUserTopic('');
    setLlmSpread(null);
    setInterpretationResult(null);
    setSelectedIndices([]);
    setCardStates({});
    shuffleDeck();
  };

  if (isAuthLoading) return <div className="loading-overlay">신비한 기운을 모으는 중...</div>;

  if (!session) {
    return (
      <div className="app-container login-page">
        <h1>🔮 AI 신비 타로</h1>
        <button className="main-btn" onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })}>Google 로그인</button>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="user-info">
        <span>남은 기회: {usageInfo.limit - usageInfo.count}회 | {session.user.email}님</span>
        <button onClick={() => supabase.auth.signOut()}>로그아웃</button>
      </div>

      <header className="app-header">
        <h1 onClick={resetApp} style={{cursor:'pointer'}}>AI 신비 타로</h1>
      </header>

      {isLoading && <div className="loading-overlay"><div className="loader"></div></div>}

      {step === 'INPUT' && (
        <section className="input-section">
          <form onSubmit={(e) => { e.preventDefault(); handleTopicSubmit(); }} className="topic-input-container">
            <input 
              type="text" 
              value={userTopic}
              onChange={(e) => setUserTopic(e.target.value)}
              placeholder="궁금한 것을 입력하세요 (예: 연애운, 금전운)"
              className="topic-input"
            />
            <button type="submit" className="main-btn">상담 시작하기</button>
          </form>
          <div className="quick-buttons">
            <button className="secondary-btn" onClick={() => handleTopicSubmit("오늘의 전반적인 운세가 궁금해!")}>
              ✨ 오늘의 운세 바로보기
            </button>
          </div>
        </section>
      )}

      {step === 'SELECTION' && llmSpread && (
        <section className="selection-section">
          <h2>"{userTopic}"</h2>
          <p>카드를 {llmSpread.cardCount}장 선택해 주세요 ({selectedIndices.length}/{llmSpread.cardCount})</p>
          <div className="card-grid">
            {shuffledCards.map((card, index) => (
              <TarotCard
                key={card.id}
                card={card}
                isSelected={selectedIndices.includes(index)}
                isFlipped={cardStates[index]?.isFlipped}
                isReversed={cardStates[index]?.isReversed}
                onClick={() => handleCardClick(index)}
              />
            ))}
          </div>
          {selectedIndices.length === llmSpread.cardCount && (
            <button className="view-result-btn" onClick={handleViewResult}>해석 보기</button>
          )}
        </section>
      )}

      {step === 'RESULT' && interpretationResult && (
        <section className="result-section">
          <div className="card-interpretation-list">
            {interpretationResult.interpretation.map((item, index) => {
              const cardData = shuffledCards[selectedIndices[index]];
              const isReversed = cardStates[selectedIndices[index]]?.isReversed;
              return (
                <div key={index} className="interpretation-item">
                  <h3>{item.pos || llmSpread.positions[index]}: {cardData.name} {isReversed ? '(역)' : ''}</h3>
                  <img src={cardData.image} alt={cardData.name} style={{ width: '120px', transform: isReversed ? 'rotate(180deg)' : 'none', borderRadius: '10px' }} />
                  <p>{item.meaning}</p>
                </div>
              );
            })}
          </div>
          <div className="total-summary">
            <h3>🔮 종합 해석</h3>
            <p>{interpretationResult.summary}</p>
            <button className="main-btn" onClick={resetApp}>다른 상담 하기</button>
          </div>
        </section>
      )}
    </div>
  );
}

export default App;