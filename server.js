import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
app.use(cors());
app.use(express.json());

// #claude

app.post('/topic', async (req, res) => {
  try {
    const { systemPrompt, userMessage } = req.body;
    const response = await axios.post("https://api.anthropic.com/v1/messages", {
      model: "claude-sonnet-4-6", // 가장 안정적인 하이쿠 모델
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }, {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY // #claude,
        "anthropic-version": "2023-06-01"
      }
    });
    const contentText = response.data.content[0].text;
    const jsonMatch = contentText.match(/\{[\s\S]*\}/);
    res.json(jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(contentText));
  } catch (error) {
    console.error("LLM 에러:", error.response?.data || error.message);
    res.status(500).json({ error: "AI 응답 실패" });
  }
});

app.post('/cards', async (req, res) => {
  try {
    const { systemPrompt, userMessage } = req.body;
    // 해석을 더 길게 해달라는 프롬프트 보강
    const enhancedSystemPrompt = systemPrompt + " 각 카드에 대해 3~4문장 이상의 상세한 해석을 제공하고, 전체적인 운의 흐름을 깊이 있게 분석하세요.";
    
    const response = await axios.post("https://api.anthropic.com/v1/messages", {
      model: "claude-3-haiku-20240307",
      max_tokens: 1500,
      system: enhancedSystemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }, {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY // #claude,
        "anthropic-version": "2023-06-01"
      }
    });
    const contentText = response.data.content[0].text;
    const jsonMatch = contentText.match(/\{[\s\S]*\}/);
    res.json(jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(contentText));
  } catch (error) {
    res.status(500).json({ error: "AI 해석 실패" });
  }
});

app.listen(5000, () => console.log("🚀 진짜 AI 서버가 5000번 포트에서 대기 중!"));