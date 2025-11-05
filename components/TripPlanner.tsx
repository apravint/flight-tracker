
import React, { useState } from 'react';
import { planComplexTrip } from '../services/geminiService';
import Button from './common/Button';
import Card, { CardContent, CardHeader } from './common/Card';
import Loader from './common/Loader';

const TripPlanner: React.FC = () => {
  const [prompt, setPrompt] = useState('Plan a 10-day backpacking trip through Southeast Asia, starting in Bangkok and ending in Ho Chi Minh City. My budget is $1000, and I am interested in culture, food, and nature. Provide a day-by-day itinerary.');
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePlanTrip = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await planComplexTrip(prompt);
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-2xl font-bold">Complex Trip Planner</h2>
        <p className="text-gray-400 mt-1">
          Use Gemini Pro's "Thinking Mode" to generate a detailed itinerary for your most complex travel needs.
        </p>
      </CardHeader>
      <CardContent>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your trip..."
          className="w-full h-48 p-3 bg-gray-900 border border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 text-white placeholder-gray-400"
        />
        <div className="mt-4">
          <Button onClick={handlePlanTrip} isLoading={isLoading}>
            Generate Itinerary
          </Button>
        </div>
        
        {error && <div className="mt-4 p-4 bg-red-900/50 text-red-300 border border-red-700 rounded-md">{error}</div>}
        
        <div className="mt-6">
          {isLoading && <Loader message="Generating your complex itinerary... This may take a moment." />}
          {result && (
            <div>
              <h3 className="text-xl font-bold mb-2">Your Custom Itinerary</h3>
              <div className="p-4 bg-gray-900 rounded-md border border-gray-700 whitespace-pre-wrap font-mono text-gray-300">
                {result}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TripPlanner;
