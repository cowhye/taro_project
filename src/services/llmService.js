/**
 * LLM 서비스 (Claude API 연동)
 * 실제 Anthropic Claude API와 통신하여 타로 해석을 제공합니다.
 */

const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

/**
 * Anthropic API 호출을 위한 공통 함수
 */
const callClaudeAPI = async (systemPrompt, userMessage) => {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'dangerously-allow-browser': 'true'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('API Response Error:', errorData);
      throw new Error(`API 호출 실패: ${errorData.error?.message || response.status}`);
    }

    const data = await response.json();
    const content = data.content[0].text;
    
    // JSON 부분만 추출
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('올바른 JSON 형식을 받지 못했습니다.');
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Claude API Error:', error);
    throw error;
  }
};

/**
 * 사용자의 질문(주제)을 LLM에 전달하여 
 * 필요한 카드 수와 각 카드의 위치별 의미(스프레드)를 결정합니다.
 */
export const sendTopicToLLM = async (topic) => {
  const systemPrompt = `당신은 전문 타로 마스터입니다. 사용자의 질문에 가장 적합한 타로 스프레드를 결정해야 합니다. 
질문의 성격(운세, 연애, 금전, 조언 등)에 맞춰 1장~5장 사이의 카드를 선택하도록 구성하세요.
응답은 반드시 아래와 같은 순수 JSON 형식이어야 합니다:
{
  "cardCount": 3,
  "positions": ["과거", "현재", "미래"]
}`;

  const userMessage = `사용자 질문: "${topic}"\n이 질문을 분석하여 가장 적절한 타로 스프레드(카드 개수와 각 위치의 의미)를 JSON으로 제안해줘.`;
  
  return await callClaudeAPI(systemPrompt, userMessage);
};

/**
 * 선택된 카드 정보와 원본 주제를 LLM에 전달하여 
 * 최종적인 타로 해석 결과를 받아옵니다.
 */
export const sendCardsToLLM = async (topic, selectedCards, positions) => {
  const systemPrompt = `당신은 신비롭고 통찰력 있는 전문 타로 마스터입니다. 
사용자의 질문과 선택된 카드들, 그리고 각 카드가 놓인 위치의 의미를 바탕으로 깊이 있는 해석을 제공하세요.
각 카드의 상징과 정방향/역방향의 의미를 위치적 맥락에 녹여내어 설명해주세요.
말투는 정중하고 따뜻하며 신비로운 분위기를 유지하세요.

응답은 반드시 아래와 같은 순수 JSON 형식이어야 합니다:
{
  "interpretation": [
    {
      "position": "위치 의미",
      "card": "카드 이름",
      "direction": "정방향", 
      "meaning": "해당 위치에서의 카드에 대한 상세한 해석과 조언"
    }
  ]
}`;

  const userMessage = `
질문: "${topic}"
스프레드 구성: ${JSON.stringify(positions)}
선택된 카드들: ${selectedCards.map(c => `${c.name} (${c.direction === 'upright' ? '정방향' : '역방향'})`).join(', ')}

위 정보를 바탕으로 각 위치별 해석을 포함한 전체 타로 리딩을 JSON으로 작성해줘.`;

  return await callClaudeAPI(systemPrompt, userMessage);
};
