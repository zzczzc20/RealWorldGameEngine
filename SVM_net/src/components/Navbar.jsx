// src/components/Navbar.jsx
import React from 'react';

function Navbar({ currentView, setCurrentView }) { // Removed togglePuzzleView prop
  return (
    <nav className="bg-black text-gray-300 p-4 shadow-lg shadow-cyan-500/10">
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-2xl font-bold text-cyan-400 tracking-wider">HK</div>
        <div className="flex space-x-4">
          <button 
            className={`px-3 py-2 transition-colors duration-200 ${
              currentView === 'map'
                ? 'text-cyan-400 font-semibold border-b-2 border-cyan-500 shadow-[0_2px_10px_rgba(0,255,255,0.3)]'
                : 'hover:text-cyan-400'
            }`}
            onClick={() => setCurrentView('map')}
          >
            Map
          </button>
          <button 
            className={`px-3 py-2 transition-colors duration-200 ${
              currentView === 'tasks'
                ? 'text-cyan-400 font-semibold border-b-2 border-cyan-500 shadow-[0_2px_10px_rgba(0,255,255,0.3)]'
                : 'hover:text-cyan-400'
            }`}
            onClick={() => setCurrentView('tasks')}
          >
            Tasks
          </button>
          <button
            className={`px-3 py-2 transition-colors duration-200 ${
              currentView === 'profile'
                ? 'text-cyan-400 font-semibold border-b-2 border-cyan-500 shadow-[0_2px_10px_rgba(0,255,255,0.3)]'
                : 'hover:text-cyan-400'
            }`}
            onClick={() => setCurrentView('profile')}
          >
            Profile
          </button>
          <button
            className={`px-3 py-2 transition-colors duration-200 ${
              currentView === 'tools'
                ? 'text-cyan-400 font-semibold border-b-2 border-cyan-500 shadow-[0_2px_10px_rgba(0,255,255,0.3)]'
                : 'hover:text-cyan-400'
            }`}
            onClick={() => setCurrentView('tools')}
          >
            Tools
          </button>
          {/* Removed Puzzles button from here */}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;