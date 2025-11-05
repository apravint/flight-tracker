
import React, { useState, useRef } from 'react';
import { analyzeMedia, generateImage, editImage, generateVideo } from '../services/geminiService';
import type { AspectRatio } from '../types';
import { fileToBase64 } from '../utils/helpers';
import Button from './common/Button';
import Card, { CardContent, CardHeader, CardFooter } from './common/Card';
import Input from './common/Input';
import Loader from './common/Loader';
import Select from './common/Select';

const Inspiration: React.FC = () => {
    // Media Analysis State
    const [analysisPrompt, setAnalysisPrompt] = useState('What city is this and what are some travel tips?');
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [mediaPreview, setMediaPreview] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Image Generation State
    const [genPrompt, setGenPrompt] = useState('A photorealistic image of a futuristic airport terminal at sunset.');
    const [genAspectRatio, setGenAspectRatio] = useState<AspectRatio>('16:9');
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);

    // Image Editing State
    const [editPrompt, setEditPrompt] = useState('Add a vintage postcard filter and text that says "Greetings from here!"');
    const [editFile, setEditFile] = useState<File | null>(null);
    const [editPreview, setEditPreview] = useState<string | null>(null);
    const [editedImage, setEditedImage] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    // Video Generation State
    const [videoPrompt, setVideoPrompt] = useState('A cinematic aerial shot flying over a tropical island with crystal clear water.');
    const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16'>('16:9');
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoPreview, setVideoPreview] = useState<string | null>(null);
    const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
    const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
    const [videoGenStatus, setVideoGenStatus] = useState('');
    const [apiKeyNeeded, setApiKeyNeeded] = useState(false);


    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setFile: React.Dispatch<React.SetStateAction<File | null>>, setPreview: React.Dispatch<React.SetStateAction<string | null>>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFile(file);
            setPreview(URL.createObjectURL(file));
        }
    };
    
    const handleAnalyze = async () => {
        if (!mediaFile || !analysisPrompt) return;
        setIsAnalyzing(true);
        setAnalysisResult('');
        try {
            const base64 = await fileToBase64(mediaFile);
            const result = await analyzeMedia(analysisPrompt, base64, mediaFile.type);
            setAnalysisResult(result);
        } catch (e) {
            console.error(e);
            setAnalysisResult("Failed to analyze media.");
        } finally {
            setIsAnalyzing(false);
        }
    };
    
    const handleGenerateImage = async () => {
        if (!genPrompt) return;
        setIsGeneratingImage(true);
        setGeneratedImage(null);
        try {
            const result = await generateImage(genPrompt, genAspectRatio);
            setGeneratedImage(result);
        } catch(e) { console.error(e); }
        finally { setIsGeneratingImage(false); }
    };
    
    const handleEditImage = async () => {
        if (!editFile || !editPrompt) return;
        setIsEditing(true);
        setEditedImage(null);
        try {
            const base64 = await fileToBase64(editFile);
            const result = await editImage(editPrompt, base64, editFile.type);
            setEditedImage(result);
        } catch(e) { console.error(e); }
        finally { setIsEditing(false); }
    };

    const handleGenerateVideo = async () => {
        if (!videoPrompt) return;

        try {
            const hasKey = await (window as any).aistudio?.hasSelectedApiKey();
            if (!hasKey) {
                setApiKeyNeeded(true);
                return;
            }
        } catch (e) {
            // If aistudio is not available, proceed, assuming key is in env.
        }

        setIsGeneratingVideo(true);
        setGeneratedVideo(null);
        setApiKeyNeeded(false);

        const statusUpdates = ["Warming up the engines...", "Storyboarding your scene...", "Rendering the visuals...", "Adding special effects...", "Finalizing your masterpiece..."];
        let statusIndex = 0;
        const interval = setInterval(() => {
            setVideoGenStatus(statusUpdates[statusIndex % statusUpdates.length]);
            statusIndex++;
        }, 5000);

        try {
            let base64: string | undefined = undefined;
            if (videoFile) {
                base64 = await fileToBase64(videoFile);
            }
            const result = await generateVideo(videoPrompt, videoAspectRatio, base64, videoFile?.type);
            setGeneratedVideo(result);
        } catch (e: any) {
            console.error(e);
            if (e.message?.includes('Requested entity was not found.')) {
                setApiKeyNeeded(true);
            }
        } finally {
            clearInterval(interval);
            setVideoGenStatus('');
            setIsGeneratingVideo(false);
        }
    };
    
    const openKeySelector = async () => {
        await (window as any).aistudio?.openSelectKey();
        setApiKeyNeeded(false);
        // User might want to click generate again
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Column 1 */}
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <h2 className="text-xl font-bold">Analyze Image or Video</h2>
                        <p className="text-gray-400">Upload media to get travel insights.</p>
                    </CardHeader>
                    <CardContent>
                        <Input type="file" accept="image/*,video/*" onChange={(e) => handleFileChange(e, setMediaFile, setMediaPreview)} />
                        {mediaPreview && (
                            mediaFile?.type.startsWith('video/') ?
                            <video src={mediaPreview} controls className="mt-4 rounded-md max-h-64 w-full object-contain" /> :
                            <img src={mediaPreview} alt="Preview" className="mt-4 rounded-md max-h-64 w-full object-contain" />
                        )}
                        <Input type="text" value={analysisPrompt} onChange={(e) => setAnalysisPrompt(e.target.value)} placeholder="e.g., What city is this?" className="mt-4" />
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleAnalyze} isLoading={isAnalyzing} disabled={!mediaFile}>Analyze</Button>
                    </CardFooter>
                    {isAnalyzing && <Loader message="Analyzing..."/>}
                    {analysisResult && <CardContent><p className="whitespace-pre-wrap">{analysisResult}</p></CardContent>}
                </Card>

                 <Card>
                    <CardHeader>
                        <h2 className="text-xl font-bold">Edit Image</h2>
                        <p className="text-gray-400">Use text prompts to modify an image.</p>
                    </CardHeader>
                    <CardContent>
                        <Input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setEditFile, setEditPreview)} />
                        <Input type="text" value={editPrompt} onChange={(e) => setEditPrompt(e.target.value)} placeholder="e.g., Add a retro filter" className="mt-4" />
                        <div className="grid grid-cols-2 gap-4 mt-4">
                            {editPreview && <img src={editPreview} alt="Original" className="rounded-md w-full object-contain" />}
                            {isEditing ? <Loader message="Editing..."/> : editedImage && <img src={editedImage} alt="Edited" className="rounded-md w-full object-contain" />}
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleEditImage} isLoading={isEditing} disabled={!editFile}>Edit Image</Button>
                    </CardFooter>
                </Card>
            </div>
            
            {/* Column 2 */}
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <h2 className="text-xl font-bold">Generate Image</h2>
                        <p className="text-gray-400">Visualize your next destination.</p>
                    </CardHeader>
                    <CardContent>
                        <Input type="text" value={genPrompt} onChange={(e) => setGenPrompt(e.target.value)} placeholder="Enter a prompt..." />
                        <Select value={genAspectRatio} onChange={(e) => setGenAspectRatio(e.target.value as AspectRatio)} className="mt-4">
                            <option value="16:9">16:9 (Landscape)</option>
                            <option value="9:16">9:16 (Portrait)</option>
                            <option value="1:1">1:1 (Square)</option>
                            <option value="4:3">4:3</option>
                            <option value="3:4">3:4</option>
                        </Select>
                        {isGeneratingImage ? <Loader message="Generating..."/> : generatedImage && <img src={generatedImage} alt="Generated" className="mt-4 rounded-md w-full object-contain" />}
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleGenerateImage} isLoading={isGeneratingImage}>Generate Image</Button>
                    </CardFooter>
                </Card>

                 <Card>
                    <CardHeader>
                        <h2 className="text-xl font-bold">Generate Video with Veo</h2>
                        <p className="text-gray-400">Create a short video from a prompt or image.</p>
                    </CardHeader>
                    <CardContent>
                        <Input type="text" value={videoPrompt} onChange={(e) => setVideoPrompt(e.target.value)} placeholder="Enter a video prompt..." />
                        <div className="mt-4">
                            <label className="text-sm text-gray-400">Optional: Start video with an image</label>
                            <Input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setVideoFile, setVideoPreview)} />
                        </div>
                         <Select value={videoAspectRatio} onChange={(e) => setVideoAspectRatio(e.target.value as '16:9' | '9:16')} className="mt-4">
                            <option value="16:9">16:9 (Landscape)</option>
                            <option value="9:16">9:16 (Portrait)</option>
                        </Select>
                        {isGeneratingVideo && <Loader message={videoGenStatus || 'Generating video...'} />}
                        {generatedVideo && <video src={generatedVideo} controls className="mt-4 rounded-md w-full" />}
                         {apiKeyNeeded && (
                            <div className="mt-4 p-4 bg-yellow-900/50 text-yellow-300 border border-yellow-700 rounded-md">
                                <p className="mb-2">Please select an API key to use Veo video generation.</p>
                                <p className="mb-4 text-sm">Billing information can be found at <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline">ai.google.dev/gemini-api/docs/billing</a>.</p>
                                <Button onClick={openKeySelector} variant="secondary">Select API Key</Button>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleGenerateVideo} isLoading={isGeneratingVideo}>Generate Video</Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
};

export default Inspiration;
