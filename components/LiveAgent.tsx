
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { connectLive } from '../services/geminiService';
import type { LiveServerMessage, LiveSession, Blob as GenAiBlob } from '@google/genai';
import { encode, decode, decodeAudioData } from '../utils/helpers';
import Button from './common/Button';
import Card, { CardContent, CardHeader } from './common/Card';

const MicIcon = ({ isListening }: { isListening: boolean }) => (
    <svg className={`h-8 w-8 transition-colors ${isListening ? 'text-red-500' : 'text-primary-400'}`} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"></path>
        <path d="M17 11h-1c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92z"></path>
    </svg>
);


const LiveAgent: React.FC = () => {
    const [isConnecting, setIsConnecting] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [conversation, setConversation] = useState<{ speaker: 'user' | 'model', text: string }[]>([]);

    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    
    const nextStartTimeRef = useRef(0);
    const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

    const transcriptions = useRef({
        input: '',
        output: '',
    });

    const stopConversation = useCallback(() => {
        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => session.close());
            sessionPromiseRef.current = null;
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }
        if (inputAudioContextRef.current) {
            inputAudioContextRef.current.close();
            inputAudioContextRef.current = null;
        }
        if (outputAudioContextRef.current) {
            outputAudioContextRef.current.close();
            outputAudioContextRef.current = null;
        }
        audioSourcesRef.current.forEach(source => source.stop());
        audioSourcesRef.current.clear();
        nextStartTimeRef.current = 0;
        setIsConnected(false);
    }, []);
    
    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopConversation();
        };
    }, [stopConversation]);

    const startConversation = async () => {
        setIsConnecting(true);
        setError(null);
        setConversation([]);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
            sessionPromiseRef.current = connectLive({
                onopen: () => {
                    const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
                    const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
                    processorRef.current = scriptProcessor;

                    scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                        const pcmBlob: GenAiBlob = {
                            data: encode(new Uint8Array(new Int16Array(inputData.map(x => x * 32768)).buffer)),
                            mimeType: 'audio/pcm;rate=16000',
                        };
                        sessionPromiseRef.current?.then((session) => {
                            session.sendRealtimeInput({ media: pcmBlob });
                        });
                    };
                    source.connect(scriptProcessor);
                    scriptProcessor.connect(inputAudioContextRef.current!.destination);
                    setIsConnecting(false);
                    setIsConnected(true);
                },
                onmessage: async (message: LiveServerMessage) => {
                    if (message.serverContent?.inputTranscription) {
                        transcriptions.current.input += message.serverContent.inputTranscription.text;
                    }
                     if (message.serverContent?.outputTranscription) {
                        transcriptions.current.output += message.serverContent.outputTranscription.text;
                    }
                    if(message.serverContent?.turnComplete) {
                        setConversation(prev => [
                            ...prev, 
                            { speaker: 'user', text: transcriptions.current.input },
                            { speaker: 'model', text: transcriptions.current.output }
                        ]);
                        transcriptions.current = { input: '', output: '' };
                    }

                    const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                    if (audioData) {
                        const ctx = outputAudioContextRef.current!;
                        nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                        const audioBuffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
                        const source = ctx.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(ctx.destination);
                        source.addEventListener('ended', () => { audioSourcesRef.current.delete(source); });
                        source.start(nextStartTimeRef.current);
                        nextStartTimeRef.current += audioBuffer.duration;
                        audioSourcesRef.current.add(source);
                    }
                },
                onerror: (e: ErrorEvent) => {
                    setError(`Connection Error: ${e.message}`);
                    stopConversation();
                },
                onclose: (e: CloseEvent) => {
                    stopConversation();
                },
            });

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to start microphone.');
            setIsConnecting(false);
        }
    };
    
    return (
        <Card>
            <CardHeader>
                <h2 className="text-2xl font-bold">Live AI Travel Agent</h2>
                <p className="text-gray-400 mt-1">
                    Have a real-time voice conversation with Gemini.
                </p>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center">
                    <MicIcon isListening={isConnected} />
                    <p className="mt-4 text-lg font-medium">
                        {isConnected ? "Listening..." : isConnecting ? "Connecting..." : "Press Start to talk"}
                    </p>
                    <div className="mt-6 space-x-4">
                        <Button onClick={startConversation} disabled={isConnected || isConnecting} isLoading={isConnecting}>
                            Start Conversation
                        </Button>
                        <Button onClick={stopConversation} disabled={!isConnected && !isConnecting} variant="secondary">
                            Stop Conversation
                        </Button>
                    </div>
                     {error && <div className="mt-4 p-4 bg-red-900/50 text-red-300 border border-red-700 rounded-md">{error}</div>}
                </div>
                <div className="mt-6 h-64 overflow-y-auto p-4 bg-gray-900 rounded-md border border-gray-700 space-y-4">
                    {conversation.map((turn, index) => (
                        <div key={index} className={`flex ${turn.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-lg ${turn.speaker === 'user' ? 'bg-primary-700 text-white' : 'bg-gray-700 text-gray-200'}`}>
                                <p className="font-bold capitalize">{turn.speaker}</p>
                                <p>{turn.text}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default LiveAgent;
