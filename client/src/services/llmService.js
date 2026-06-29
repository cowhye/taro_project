// llmService.js
const SERVER_URL = import.meta.env.VITE_SERVER_URL;

const callServer = async (url, body) => {
  const response = await fetch(`${SERVER_URL}${url}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`서버 오류: ${response.status}`);
  return await response.json();
};

export const sendTopicToLLM = async (topic) => {
  return await callServer("/topic", { topic });
};

export const sendCardsToLLM = async (topic, selectedCards) => {
  return await callServer("/cards", { topic, cards: selectedCards });
};
