// llmService.js
const callServer = async (url, systemPrompt, userMessage) => {
  const response = await fetch(`http://127.0.0.1:5000${url}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ systemPrompt, userMessage }),
  });
  return await response.json();
};

export const sendTopicToLLM = async (topic) => {
  const systemPrompt = "테스트 모드";
  return await callServer("/topic", systemPrompt, topic);
};

export const sendCardsToLLM = async (topic, selectedCards, positions) => {
  const systemPrompt = "테스트 모드";
  // 이 부분이 중요합니다! 서버가 주는 fakeInterpretation 형식에 맞춰 전달
  return await callServer("/cards", systemPrompt, JSON.stringify({ topic, selectedCards }));
};