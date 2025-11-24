import { GoogleGenAI } from "@google/genai";
import { DriverStats } from "../types";

// In a real app, this would be validated or fetched from a secure backend proxy.
// For this demo, we assume the key is available.
const apiKey = process.env.API_KEY || ''; 

const ai = new GoogleGenAI({ apiKey });

export const getDriverAdvice = async (stats: DriverStats): Promise<string> => {
  if (!apiKey) return "Configure sua API Key para receber conselhos personalizados.";

  const prompt = `
    Você é um coach especialista para entregadores de aplicativos (como iFood/Uber).
    Analise os seguintes dados de um entregador e dê um conselho curto, motivador e prático (máximo 3 frases) de como ele pode subir de nível ou manter sua conta saudável.
    Seja direto e use emojis. Fale português do Brasil.

    Dados:
    Nível: ${stats.level}
    Score: ${stats.score} (de 0 a 1000)
    Taxa de Aceitação: ${stats.acceptanceRate}%
    Taxa de Cancelamento: ${stats.cancellationRate}%
    Avaliação: ${stats.customerRating}
    Entregas Totais: ${stats.totalDeliveries}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Continue fazendo um bom trabalho! Mantenha suas taxas altas.";
  } catch (error) {
    console.error("Erro ao consultar Gemini:", error);
    return "Dica do dia: Mantenha o app atualizado e seja cordial com os clientes!";
  }
};

export interface GroundingChunk {
  web?: { uri: string; title: string };
  maps?: { uri: string; title: string; placeId?: string };
}

export interface MapsResponse {
  text: string;
  chunks: GroundingChunk[];
}

export const findNearbyPlaces = async (query: string, lat: number, lng: number): Promise<MapsResponse> => {
  if (!apiKey) return { text: "API Key não configurada. Verifique suas configurações.", chunks: [] };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Você é um assistente útil para entregadores. O usuário perguntou: "${query}".
                 Forneça sugestões de locais relevantes baseados na localização fornecida.
                 Seja sucinto e foque em informações úteis para quem está dirigindo (distância, se está aberto, avaliação).`,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: lat,
              longitude: lng
            }
          }
        }
      }
    });

    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    return {
      text: response.text || "Não encontrei resultados para essa busca.",
      chunks: chunks as GroundingChunk[]
    };
  } catch (error) {
    console.error("Erro no Google Maps Grounding:", error);
    return { text: "Desculpe, ocorreu um erro ao buscar locais no mapa. Tente novamente mais tarde.", chunks: [] };
  }
};

export const generateSpeech = async (text: string): Promise<AudioBuffer | null> => {
  if (!apiKey) {
    console.warn("API Key missing for TTS");
    return null;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: {
        parts: [{ text: text }]
      },
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) return null;

    // Decode Base64 to raw bytes
    const binaryString = atob(base64Audio);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Create AudioContext
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});

    // Manual PCM Decoding (Linear16 to AudioBuffer)
    // The API returns raw PCM 24kHz Mono 16-bit Little Endian.
    // decodeAudioData fails because there are no WAV headers.
    const int16Data = new Int16Array(bytes.buffer);
    const audioBuffer = audioContext.createBuffer(1, int16Data.length, 24000);
    const channelData = audioBuffer.getChannelData(0);

    for (let i = 0; i < int16Data.length; i++) {
      // Normalize 16-bit integer (-32768 to 32767) to float (-1.0 to 1.0)
      channelData[i] = int16Data[i] / 32768.0;
    }

    return audioBuffer;

  } catch (error) {
    console.error("Error generating speech:", error);
    return null;
  }
};