
import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION } from '../constants';
import { type Message, Role } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateResponse = async (history: Message[], newUserMessage: Message): Promise<Message> => {
    const contents = [...history, newUserMessage].map(msg => ({
        role: msg.role,
        parts: msg.parts,
    }));

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: contents,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                tools: [{ googleSearch: {} }],
            }
        });

        const botResponse: Message = {
            role: Role.MODEL,
            parts: [{ text: response.text || "Xin lỗi em, thầy gặp chút trục trặc trong lúc suy nghĩ. Em có thể hỏi lại được không?" }],
        };
        
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (groundingChunks && groundingChunks.length > 0) {
            const sources = groundingChunks
                .map((chunk: any) => chunk.web)
                .filter((web: any) => web && web.uri)
                .map((web: any) => `[${web.title}](${web.uri})`);
            
            if(sources.length > 0) {
                const sourcesText = `\n\n---\n**Nguồn tham khảo:**\n${sources.join('\n')}`;
                const firstPart = botResponse.parts[0];
                if (firstPart && 'text' in firstPart) {
                    firstPart.text += sourcesText;
                }
            }
        }

        return botResponse;
    } catch (error) {
        console.error("Gemini API Error:", error);
        throw error;
    }
};
