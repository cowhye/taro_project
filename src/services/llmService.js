/**
 * LLM 서비스 (Mock)
 * 실제 LLM API와 통신하는 로직을 담당합니다.
 * 현재는 데모를 위해 가상의 JSON 응답을 반환합니다.
 */

/**
 * 사용자의 질문(주제)을 LLM에 전달하여 
 * 필요한 카드 수와 각 카드의 위치별 의미(스프레드)를 결정합니다.
 * 
 * @param {string} topic - 사용자가 입력한 주제 또는 질문
 * @returns {Promise<Object>} - { cardCount: number, positions: string[] }
 */
export const sendTopicToLLM = async (topic) => {
  console.log("LLM에 주제 전달 중:", topic);
  
  // 실제 API 호출을 시뮬레이션하기 위한 지연 시간
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 질문의 내용에 따라 동적으로 스프레드를 결정하는 로직 (Mock)
  if (topic.includes("오늘") || topic.includes("운세")) {
    return {
      cardCount: 1,
      positions: ["오늘의 전반적인 운세"]
    };
  } else if (topic.includes("연애") || topic.includes("사랑")) {
    return {
      cardCount: 3,
      positions: ["나의 입장", "상대방의 입장", "관계의 흐름"]
    };
  } else if (topic.includes("돈") || topic.includes("직장") || topic.includes("사업")) {
    return {
      cardCount: 4,
      positions: ["현재 재정 상태", "주의해야 할 점", "나아갈 방향", "최종 결과"]
    };
  }

  // 기본값: 3장 스프레드
  return {
    cardCount: 3,
    positions: ["현재 상황", "문제의 원인", "조언"]
  };
};

/**
 * 선택된 카드 정보와 원본 주제를 LLM에 전달하여 
 * 최종적인 타로 해석 결과를 받아옵니다.
 * 
 * @param {string} topic - 사용자가 입력한 주제
 * @param {Array} selectedCards - 선택된 카드 리스트 (name, direction 포함)
 * @param {Array} positions - 각 카드의 위치별 의미
 * @returns {Promise<Object>} - { interpretation: Array }
 */
export const sendCardsToLLM = async (topic, selectedCards, positions) => {
  console.log("LLM에 카드 정보 전달 중:", { topic, selectedCards });

  // 실제 API 호출을 시뮬레이션하기 위한 지연 시간
  await new Promise(resolve => setTimeout(resolve, 1500));

  // 해석 결과 생성 (Mock)
  const interpretation = selectedCards.map((card, index) => {
    return {
      position: positions[index],
      card: card.name,
      direction: card.direction === 'upright' ? '정방향' : '역방향',
      meaning: `[${topic}]에 대한 해석: 이 위치의 ${card.name} (${card.direction === 'upright' ? '정방향' : '역방향'}) 카드는 현재 당신에게 중요한 변화와 통찰력을 시사합니다. 마음의 소리에 귀를 기울이세요.`
    };
  });

  return { interpretation };
};
