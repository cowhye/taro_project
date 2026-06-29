import React from 'react';
import './TarotCard.css';

/**
 * TarotCard 컴포넌트
 * @param {Object} card - 카드 데이터
 * @param {boolean} isSelected - 선택 여부
 * @param {boolean} isFlipped - 뒤집힘 여부
 * @param {boolean} isReversed - 역방향 여부
 * @param {Function} onClick - 클릭 핸들러
 */
const TarotCard = ({ card, isSelected, isFlipped, isReversed, onClick }) => {
  return (
    <div 
      className={`card-container ${isSelected ? 'selected' : ''} ${isFlipped ? 'flipped' : ''}`} 
      onClick={onClick}
    >
      <div className="card-inner">
        {/* 카드 뒷면 (선택 전) */}
        <div className="card-back">
          <div className="card-pattern"></div>
        </div>
        
        {/* 카드 앞면 (선택 후) */}
        <div className={`card-front ${isReversed ? 'reversed' : ''}`}>
          <img src={card.image} alt={card.name} />
          <div className="card-info">
            <p className="card-name">{card.name}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TarotCard;
