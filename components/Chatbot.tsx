
import React, { useState, useRef, useEffect } from 'react';
import type { Chat } from '@google/genai';
import { createChat } from '../services/geminiService';
import type { ChatMessage } from '../types';
import Button from './common/Button';
import Input from './common/Input';

const Chatbot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatRef = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!chatRef.current) {
            chatRef.current = createChat();
            setMessages([{ role: 'model', text: 'Hello! How can I help you with your travel plans today?' }]);
        }
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || !chatRef.current) return;

        const userMessage: ChatMessage = { role: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await chatRef.current.sendMessage({ message: input });
            const modelMessage: ChatMessage = { role: 'model', text: response.text };
            setMessages(prev => [...prev, modelMessage]);
        } catch (error) {
            console.error("Chatbot error:", error);
            const errorMessage: ChatMessage = { role: 'model', text: "Sorry, I'm having trouble connecting right now." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 bg-primary-600 text-white rounded-full p-4 shadow-lg hover:bg-primary-700 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-primary-500 z-50"
                aria-label="Open chatbot"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor"><path d="M21 6H3a1 1 0 00-1 1v8a1 1 0 001 1h2v3.764a1 1 0 001.73.684L10.373 16H21a1 1 0 001-1V7a1 1 0 00-1-1zm-2 6h-6v-2h6v2zm-8-2h-2V8h2v2z" /></svg>
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 w-full max-w-sm h-[70vh] max-h-[600px] bg-gray-800 rounded-lg shadow-2xl flex flex-col z-50 border border-gray-700">
            <header className="flex items-center justify-between p-4 bg-gray-900 border-b border-gray-700">
                <h3 className="text-lg font-bold">Travel Assistant</h3>
                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">&times;</button>
            </header>
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-lg ${msg.role === 'user' ? 'bg-primary-700 text-white' : 'bg-gray-700 text-gray-200'}`}>
                           {msg.text}
                        </div>
                    </div>
                ))}
                {isLoading && (
                     <div className="flex justify-start">
                        <div className="max-w-[80%] p-3 rounded-lg bg-gray-700 text-gray-200">
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <footer className="p-4 border-t border-gray-700">
                <div className="flex space-x-2">
                    <Input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask me anything..."
                        className="flex-1"
                        disabled={isLoading}
                    />
                    <Button onClick={handleSend} isLoading={isLoading}>Send</Button>
                </div>
            </footer>
        </div>
    );
};

export default Chatbot;
