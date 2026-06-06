const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;

// ✅ Claude 호출 함수 (백틱 제거 및 JSON 추출 강화)
const callClaudeAPI = async (systemPrompt, userMessage) => {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY, // #claude,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 3000,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("❌ Claude API Error:", data);
    throw new Error(data.error?.message || "Claude API call failed");
  }

  const text = data.content?.[0]?.text;
  if (!text) {
    console.error("❌ No text content in Claude response:", data);
    throw new Error("No text from Claude");
  }

  // ✅ JSON 블록 추출 로직 강화
  let cleaned = text.trim();

  // ```json { ... } ``` 또는 ``` { ... } ``` 형태 처리
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    cleaned = jsonMatch[1];
  } else {
    // 백틱이 없는 경우, 첫 번째 { 와 마지막 } 사이를 추출 시도
    const startIdx = text.indexOf("{");
    const endIdx = text.lastIndexOf("}");
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      cleaned = text.substring(startIdx, endIdx + 1);
    }
  }

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("❌ JSON 파싱 실패. 원본 텍스트:", text);
    console.error("❌ 정제된 텍스트:", cleaned);
    throw new Error("JSON parse error");
  }
};

const TOPIC_SYSTEM_PROMPT = `당신은 타로 카드 배열 전문가입니다.
사용자의 고민 주제를 받아 적절한 타로 스프레드를 JSON으로 반환하세요.
반드시 아래 형식의 JSON만 반환하고, 다른 텍스트는 포함하지 마세요.
{
  "cardCount": 3,
  "positions": ["과거", "현재", "미래"]
}
cardCount는 주제에 맞게 1~5장 사이로 결정하고, positions는 각 카드의 의미 있는 위치명을 한국어로 작성하세요.`;

const CARDS_SYSTEM_PROMPT = `당신은 전문 타로 리더입니다.
사용자의 고민, 선택된 카드와 방향(정방향/역방향)을 받아 타로 해석을 JSON으로 반환하세요.
반드시 아래 형식의 JSON만 반환하고, 다른 텍스트는 포함하지 마세요.
{
  "interpretation": [
    { "pos": "위치명", "meaning": "카드 해석 (3~4문장)" }
  ],
  "summary": "전체 종합 해석 (3~5문장)"
}`;

// 스프레드
app.post("/topic", async (req, res) => {
  console.log("🔹 [POST /topic] Requested");
  try {
    const { topic } = req.body;
    const result = await callClaudeAPI(TOPIC_SYSTEM_PROMPT, topic);
    res.json(result);
  } catch (err) {
    console.error("❌ [POST /topic] SERVER ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 카드 해석
app.post("/cards", async (req, res) => {
  console.log("🔹 [POST /cards] Requested");
  try {
    const { topic, cards } = req.body;
    const userMessage = `고민: ${topic}\n선택된 카드: ${JSON.stringify(cards)}`;
    const result = await callClaudeAPI(CARDS_SYSTEM_PROMPT, userMessage);
    res.json(result);
  } catch (err) {
    console.error("❌ [POST /cards] SERVER ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});
app.get("/test-db", async (req, res) => {
  const { data, error } = await supabase.from("User").select("*");
  if (error) return res.json(error);
  res.json(data);
});
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
