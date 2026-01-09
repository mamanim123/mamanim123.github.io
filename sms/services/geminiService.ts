
import { GoogleGenAI } from "@google/genai";

export const getSmartSummary = async (logs: any[]) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `다음은 위치 알림 앱의 활동 로그입니다. 사용자에게 현재 상태를 친절하게 한 줄로 요약해주세요: ${JSON.stringify(logs.slice(0, 5))}`,
      config: {
        systemInstruction: "당신은 한국어로 답변하는 친절한 보안 도우미입니다.",
        temperature: 0.7,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini summary error:", error);
    return "활동 로그를 분석할 수 없습니다.";
  }
};
