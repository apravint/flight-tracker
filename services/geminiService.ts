
import { GoogleGenAI, Type, GenerateContentResponse, Chat, Modality, LiveSession, LiveServerMessage, VideosGenerateOperation, AspectRatio as VeoAspectRatio, FunctionDeclaration } from "@google/genai";
import type { AspectRatio, Flight } from "../types";

// Note: Do NOT add your API key here. Use environment variables.
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Text & Grounding ---

export const findFlights = async (from: string, to: string): Promise<{ flights: Flight[], groundingSources: any[] }> => {
    const ai = getAI();
    const prompt = `Find plausible flights from ${from} to ${to}. Provide 3-5 options.
    
IMPORTANT: Format the flight data as a JSON object inside a markdown code block like this:
\`\`\`json
{
  "flights": [
    {
      "flightNumber": "UA123",
      "airline": "United Airlines",
      "departure": {"airport": "JFK", "city": "New York", "time": "2024-10-27T18:00:00Z"},
      "arrival": {"airport": "LHR", "city": "London", "time": "2024-10-28T06:30:00Z"},
      "duration": "7h 30m",
      "price": 650
    }
  ]
}
\`\`\`

After the JSON block, provide any recent travel advisories or news for this route as regular text. The JSON block is the most important part.`;


    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
        },
    });

    const responseText = response.text;
    const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
    const match = responseText.match(jsonRegex);

    if (!match || !match[1]) {
        console.error("Could not find JSON in response:", responseText);
        throw new Error("Failed to parse flight data from the AI. The response format was unexpected.");
    }
    
    const jsonText = match[1];
    const data = JSON.parse(jsonText);
    const groundingSources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    return { flights: data.flights, groundingSources };
};

export const getPlaceInfo = async (place: string, latitude?: number, longitude?: number): Promise<{ info: string, sources: any[] }> => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Tell me about ${place}. What are some good restaurants and transportation options there?`,
        config: {
            tools: [{ googleMaps: {} }],
            toolConfig: (latitude && longitude) ? {
                retrievalConfig: { latLng: { latitude, longitude } }
            } : undefined
        },
    });

    return {
        info: response.text,
        sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [],
    };
};

export const planComplexTrip = async (prompt: string): Promise<string> => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            thinkingConfig: { thinkingBudget: 32768 }
        }
    });
    return response.text;
};

// --- Chat ---

export const createChat = (): Chat => {
    const ai = getAI();
    return ai.chats.create({
        // FIX: Use the recommended model name for 'gemini flash lite'
        model: 'gemini-flash-lite-latest',
        config: {
            systemInstruction: 'You are a helpful travel assistant chatbot. Be friendly and concise.'
        }
    });
}

// --- Vision & Image ---

export const analyzeMedia = async (prompt: string, mediaBase64: string, mimeType: string): Promise<string> => {
    const ai = getAI();
    const model = mimeType.startsWith('video/') ? 'gemini-2.5-pro' : 'gemini-2.5-flash';

    const response = await ai.models.generateContent({
        model,
        contents: {
            parts: [
                { inlineData: { data: mediaBase64, mimeType } },
                { text: prompt },
            ],
        },
    });
    return response.text;
};

export const generateImage = async (prompt: string, aspectRatio: AspectRatio): Promise<string> => {
    const ai = getAI();
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio,
        },
    });
    const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
    return `data:image/jpeg;base64,${base64ImageBytes}`;
};

export const editImage = async (prompt: string, imageBase64: string, mimeType: string): Promise<string> => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { inlineData: { data: imageBase64, mimeType } },
                { text: prompt },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });
    const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (part?.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
    throw new Error('No edited image was returned.');
};


// --- Video Generation (Veo) ---
export const generateVideo = async (
    prompt: string,
    aspectRatio: '16:9' | '9:16',
    imageBase64?: string,
    mimeType?: string
): Promise<string> => {
    const ai = getAI(); // Important: New instance for fresh key
    
    let operation: VideosGenerateOperation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        image: imageBase64 && mimeType ? { imageBytes: imageBase64, mimeType } : undefined,
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: aspectRatio as VeoAspectRatio,
        },
    });

    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10 seconds
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error('Video generation failed or returned no link.');
    }
    
    const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    if (!videoResponse.ok) {
        throw new Error('Failed to download the generated video.');
    }
    const videoBlob = await videoResponse.blob();
    return URL.createObjectURL(videoBlob);
};

// --- Audio ---

export const textToSpeech = async (text: string): Promise<AudioBuffer> => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
            },
        },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
        throw new Error("No audio data returned from API.");
    }
    
    // This is a simplified decoding process. A more robust solution would be in utils.
    const binaryString = atob(base64Audio);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    return await audioContext.decodeAudioData(bytes.buffer);
};

// --- Live API ---

export const connectLive = (callbacks: {
    onopen: () => void;
    onmessage: (message: LiveServerMessage) => Promise<void>;
    onerror: (e: ErrorEvent) => void;
    onclose: (e: CloseEvent) => void;
}): Promise<LiveSession> => {
    const ai = getAI();
    return ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks,
        config: {
            responseModalities: [Modality.AUDIO],
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
            },
            systemInstruction: 'You are a live AI travel agent. Help the user find flights and plan their trip. Be friendly and conversational.',
        },
    });
};
