const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5000;

// ✅ Claude 호출 함수 (백틱 제거 및 JSON 추출 강화)
const callClaudeAPI = async (systemPrompt, userMessage) => {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY,
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

// 스프레드
app.post("/topic", async (req, res) => {
  console.log("🔹 [POST /topic] Requested with body keys:", Object.keys(req.body));
  try {
    const { systemPrompt, userMessage } = req.body;
    const result = await callClaudeAPI(systemPrompt, userMessage);
    res.json(result);
  } catch (err) {
    console.error("❌ [POST /topic] SERVER ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 카드 해석
app.post("/cards", async (req, res) => {
  console.log("🔹 [POST /cards] Requested with body keys:", Object.keys(req.body));
  try {
    const { systemPrompt, userMessage } = req.body;
    const result = await callClaudeAPI(systemPrompt, userMessage);
    res.json(result);
  } catch (err) {
    console.error("❌ [POST /cards] SERVER ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});