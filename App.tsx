
import React, { useState } from 'react';
import Header from './components/Header';
import FlightSearch from './components/FlightSearch';
import TripPlanner from './components/TripPlanner';
import Inspiration from './components/Inspiration';
import LiveAgent from './components/LiveAgent';
import Chatbot from './components/Chatbot';
import type { ActiveTab } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('Search');

  const renderContent = () => {
    switch (activeTab) {
      case 'Search':
        return <FlightSearch />;
      case 'Planner':
        return <TripPlanner />;
      case 'Inspiration':
        return <Inspiration />;
      case 'Live Agent':
        return <LiveAgent />;
      default:
        return <FlightSearch />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {renderContent()}
      </main>
      <Chatbot />
    </div>
  );
};

export default App;
