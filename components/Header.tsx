
import React from 'react';
import type { ActiveTab } from '../types';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

const PlaneIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M20.343 3.657a2.25 2.25 0 00-3.182 0l-8.663 8.662-3.46-1.4a.75.75 0 00-.933.216L2.343 13.5a.75.75 0 00.216.933l3.737 2.242-5.02 5.02a.75.75 0 001.06 1.06l5.02-5.02 2.242 3.737a.75.75 0 00.933.216l2.37-1.76a.75.75 0 00.216-.933l-1.4-3.46 8.662-8.663a2.25 2.25 0 000-3.182z" />
    </svg>
);


const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const tabs: ActiveTab[] = ['Search', 'Planner', 'Inspiration', 'Live Agent'];

  return (
    <header className="bg-gray-900/80 backdrop-blur-sm sticky top-0 z-40 shadow-md shadow-primary-900/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center">
            <PlaneIcon className="h-8 w-8 text-primary-400" />
            <h1 className="ml-3 text-2xl font-bold text-white tracking-tight">
              Gemini Flight Tracker
            </h1>
          </div>
          <nav className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    activeTab === tab
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </nav>
        </div>
      </div>
       <nav className="md:hidden bg-gray-800">
        <div className="flex items-center justify-center space-x-2 p-2">
            {tabs.map((tab) => (
            <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-2 py-2 text-center rounded-md text-xs font-medium transition-colors duration-200 ${
                activeTab === tab
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
            >
                {tab}
            </button>
            ))}
        </div>
       </nav>
    </header>
  );
};

export default Header;
