
import React, { useState } from 'react';
import { findFlights } from '../services/geminiService';
import type { Flight, GroundingSource } from '../types';
import Button from './common/Button';
import Input from './common/Input';
import Card, { CardContent, CardHeader, CardFooter } from './common/Card';
import Loader from './common/Loader';

const FlightSearch: React.FC = () => {
    const [from, setFrom] = useState('New York');
    const [to, setTo] = useState('London');
    const [flights, setFlights] = useState<Flight[]>([]);
    const [comparisonList, setComparisonList] = useState<Flight[]>([]);
    const [groundingSources, setGroundingSources] = useState<GroundingSource[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async () => {
        setIsLoading(true);
        setError(null);
        setFlights([]);
        setComparisonList([]);
        setGroundingSources([]);
        try {
            const { flights: foundFlights, groundingSources: sources } = await findFlights(from, to);
            setFlights(foundFlights);
            setGroundingSources(sources);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCompareToggle = (flight: Flight) => {
        setComparisonList(prev => {
            const isInList = prev.some(f => f.flightNumber === flight.flightNumber);
            if (isInList) {
                return prev.filter(f => f.flightNumber !== flight.flightNumber);
            } else {
                return [...prev, flight];
            }
        });
    };

    const renderFlight = (flight: Flight) => {
        const isCompared = comparisonList.some(f => f.flightNumber === flight.flightNumber);
        return (
            <Card key={flight.flightNumber} className="mb-4 transition-shadow hover:shadow-xl border-transparent hover:border-primary-600">
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <div className="md:col-span-1">
                        <p className="font-bold text-lg text-white">{flight.airline}</p>
                        <p className="text-sm text-gray-400">Flight {flight.flightNumber}</p>
                    </div>
                    <div className="text-left md:text-center md:col-span-1">
                        <p className="font-semibold text-white">{flight.departure.city} ({flight.departure.airport}) &rarr; {flight.arrival.city} ({flight.arrival.airport})</p>
                        <p className="text-sm text-gray-400">Duration: {flight.duration}</p>
                        <p className="text-xs text-gray-500">{new Date(flight.departure.time).toLocaleString()} - {new Date(flight.arrival.time).toLocaleString()}</p>
                    </div>
                    <div className="text-left md:text-right md:col-span-1">
                        <p className="text-xl font-bold text-primary-400">${flight.price}</p>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end items-center bg-gray-800/50">
                    <label className="flex items-center space-x-2 cursor-pointer text-gray-300 hover:text-white">
                        <input
                            type="checkbox"
                            checked={isCompared}
                            onChange={() => handleCompareToggle(flight)}
                            className="form-checkbox h-5 w-5 bg-gray-700 border-gray-600 text-primary-600 focus:ring-primary-500 rounded"
                            aria-label={`Compare flight ${flight.flightNumber}`}
                        />
                        <span>Compare</span>
                    </label>
                </CardFooter>
            </Card>
        );
    };
    
    const renderSources = () => {
        const validSources = groundingSources.filter(s => s.web?.uri);
        if (validSources.length === 0) return null;

        return (
            <div className="mt-6 p-4 bg-gray-900 rounded-md border border-gray-700">
                <h4 className="font-semibold text-white">Information Sources:</h4>
                <ul className="list-disc list-inside text-sm text-gray-400 mt-2 space-y-1">
                    {validSources.map((source, index) => (
                        <li key={index}>
                            <a href={source.web?.uri} target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:underline">
                                {source.web?.title || source.web?.uri}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        )
    };

    const renderComparisonTable = () => {
        if (comparisonList.length < 2) return null;

        const minPrice = Math.min(...comparisonList.map(f => f.price));

        const metrics = ['Price', 'Duration', 'Airline', 'Departure', 'Arrival'];

        return (
            <div className="mt-8">
                <h3 className="text-xl font-bold mb-4">Flight Comparison</h3>
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-300">
                                <thead className="text-xs text-gray-400 uppercase bg-gray-700/50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3">Metric</th>
                                        {comparisonList.map(flight => (
                                            <th key={flight.flightNumber} scope="col" className="px-6 py-3">
                                                {flight.flightNumber}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {metrics.map(metric => (
                                         <tr key={metric} className="border-b border-gray-700 last:border-b-0">
                                            <th scope="row" className="px-6 py-4 font-medium text-white whitespace-nowrap">{metric}</th>
                                            {comparisonList.map(flight => {
                                                let content;
                                                switch(metric) {
                                                    case 'Price':
                                                        content = <span className={flight.price === minPrice ? 'text-green-400 font-bold' : ''}>${flight.price}</span>;
                                                        break;
                                                    case 'Duration':
                                                        content = flight.duration;
                                                        break;
                                                    case 'Airline':
                                                        content = flight.airline;
                                                        break;
                                                    case 'Departure':
                                                        content = `${flight.departure.city} at ${new Date(flight.departure.time).toLocaleTimeString()}`;
                                                        break;
                                                     case 'Arrival':
                                                        content = `${flight.arrival.city} at ${new Date(flight.arrival.time).toLocaleTimeString()}`;
                                                        break;
                                                    default:
                                                        content = '-';
                                                }
                                                return <td key={`${flight.flightNumber}-${metric}`} className="px-6 py-4">{content}</td>;
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <Card>
            <CardHeader>
                <h2 className="text-2xl font-bold">Find Your Flight</h2>
                <p className="text-gray-400 mt-1">
                    Search for flights with real-time information powered by Gemini and Google Search.
                </p>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    <Input
                        type="text"
                        placeholder="From"
                        value={from}
                        onChange={(e) => setFrom(e.target.value)}
                        aria-label="Departure location"
                    />
                    <Input
                        type="text"
                        placeholder="To"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                        aria-label="Arrival location"
                    />
                </div>
            </CardContent>
            <CardFooter className="text-right">
                <Button onClick={handleSearch} isLoading={isLoading} disabled={!from || !to}>
                    Search Flights
                </Button>
            </CardFooter>
            
            {(isLoading || error || flights.length > 0) &&
                <CardContent>
                    {isLoading && <Loader message="Finding flights..." />}
                    {error && 
                        <div className="p-4 bg-red-900/50 text-red-300 border border-red-700 rounded-md flex items-start space-x-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <div>
                                <h4 className="font-bold">Search Failed:</h4>
                                <p>{error}</p>
                            </div>
                        </div>
                    }
                    
                    {flights.length > 0 && (
                        <div>
                            <h3 className="text-xl font-bold mb-4">Available Flights</h3>
                            {flights.map(renderFlight)}
                            {renderComparisonTable()}
                            {renderSources()}
                        </div>
                    )}
                </CardContent>
            }
        </Card>
    );
};

export default FlightSearch;
