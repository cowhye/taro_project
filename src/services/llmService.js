const callServer = async (url, systemPrompt, userMessage) => {
  const response = await fetch(`http://localhost:5000${url}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ systemPrompt, userMessage }),
  });

  if (!response.ok) {
    throw new Error("Server error");
  }

  return await response.json();
};

// ✅ 1단계: 스프레드
export const sendTopicToLLM = async (topic) => {
  const systemPrompt = `당신은 전문 타로 마스터입니다.
반드시 JSON으로만 응답하세요.
{
  "cardCount": number,
  "positions": string[]
}`;

  const userMessage = `질문: "${topic}"에 맞는 타로 스프레드를 만들어줘.`;

  return await callServer("/topic", systemPrompt, userMessage);
};

// ✅ 2단계: 카드 해석 (여기가 핵심)
export const sendCardsToLLM = async (topic, selectedCards, positions) => {
  const systemPrompt = `당신은 전문 타로 리더입니다.
질문에 대해 각 카드의 위치와 의미를 포함하여 깊이 있게 해석해주세요.
반드시 아래 JSON 형식으로만 응답하세요.
{
  "interpretation": [
    {
      "position": "위치 명칭 (예: 과거)",
      "meaning": "해당 위치와 카드의 조합에 대한 상세 해석"
    }
  ]
}`;

  const userMessage = `
질문: "${topic}"
스프레드 위치 정보: ${JSON.stringify(positions)}
선택된 카드 목록:
${selectedCards
  .map((c, i) => `${i + 1}번 위치 (${positions[i]}): ${c.name} (${c.direction === "upright" ? "정방향" : "역방향"})`)
  .join("\n")}
`;

  // ❗❗ 여기 /cards 로 보내야 함
  return await callServer("/cards", systemPrompt, userMessage);
};