// src/components/LogicPuzzleView.jsx
import React, { useState, useEffect, useCallback } from 'react';
import CyberButton from './ui/CyberButton';

const HeartIcon = ({ filled = true }) => (
  <svg className={`w-6 h-6 ${filled ? 'text-red-500' : 'text-gray-600'}`} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
  </svg>
);

const ClickableClue = ({ clue, isClickable, onClick }) => {
  return (
    <div
      onClick={() => isClickable && onClick(clue.id)}
      className={`p-3 border rounded-md transition-colors duration-200 ${isClickable ? 'border-cyan-700/50 bg-gray-800/60 cursor-pointer hover:bg-cyan-900/50' : 'border-gray-700/30 bg-gray-900/50 text-gray-500 cursor-not-allowed'}`}
    >
      <p className="text-sm text-gray-300">{clue.content}</p>
    </div>
  );
};

const Clueboard = ({ revealedClues }) => {
  return (
    <div
      className={`p-4 border-2 border-dashed rounded-lg min-h-[250px] md:min-h-[300px] border-gray-600 bg-gray-800/30 flex flex-col`}
    >
      <h3 className="text-lg font-semibold text-cyan-300 mb-3 border-b border-cyan-500/30 pb-2 flex-shrink-0">线索板</h3>
      <div className="flex-grow overflow-y-auto">
        {revealedClues.length === 0 ? (
          <p className="text-gray-500 italic text-center pt-12">点击左侧的文档碎片以分析线索...</p>
        ) : (
          <ul className="space-y-3">
            {revealedClues.map((clue, index) => (
              <li key={`${clue.id}-${index}`} className="bg-yellow-900/30 border border-yellow-500/50 p-3 rounded text-yellow-300 font-semibold animate-pulse">
                {clue.content}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

const LogicPuzzleView = ({ task, onSolve, onFail }) => {
  const { puzzleData } = task;

  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [availableClueIds, setAvailableClueIds] = useState(new Set());
  const [revealedClueObjects, setRevealedClueObjects] = useState([]);
  const [solution, setSolution] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [lives, setLives] = useState(5);
  const [cooldown, setCooldown] = useState(0);
  const [incorrectlyDroppedIds, setIncorrectlyDroppedIds] = useState(new Set());


  // Initialize clues for the first stage
  useEffect(() => {
    setAvailableClueIds(new Set(puzzleData.stages[0].initialClues));
    setIncorrectlyDroppedIds(new Set()); // Reset incorrect drops on new puzzle
  }, [puzzleData]);
  
  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (lives === 0) {
      setLives(5); // Restore lives after cooldown
      setIncorrectlyDroppedIds(new Set()); // Also clear incorrect drops
   }
 }, [cooldown, lives]);

  // Stage progression logic
  useEffect(() => {
    const currentStage = puzzleData.stages[currentStageIndex];
    if (!currentStage) return;

    const requiredKeys = new Set(currentStage.keyClueIds);
    const discoveredKeys = new Set(revealedClueObjects.map(c => c.keyOrigin));
    const completedKeysInStage = new Set([...discoveredKeys].filter(id => requiredKeys.has(id)));
    
    console.log(`[StageProgression] Stage ${currentStageIndex} check.`);
    console.log(`[StageProgression] Required Keys:`, requiredKeys);
    console.log(`[StageProgression] Discovered Keys from board:`, discoveredKeys);
    console.log(`[StageProgression] Completed Keys for this stage:`, completedKeysInStage);


    if (requiredKeys.size > 0 && completedKeysInStage.size === requiredKeys.size) {
      console.log(`[StageProgression] Stage ${currentStageIndex} complete! Advancing.`);
      const nextStageIndex = currentStageIndex + 1;
      if (nextStageIndex < puzzleData.stages.length) {
        const nextStage = puzzleData.stages[nextStageIndex];
        setAvailableClueIds(prev => new Set([...prev, ...nextStage.initialClues]));
        setCurrentStageIndex(nextStageIndex);
        setRevealedClueObjects([]);
        setIncorrectlyDroppedIds(new Set());
      } else {
        console.log('[StageProgression] All stages complete! Setting isCompleted.');
        setIsCompleted(true);
      }
    }
  }, [revealedClueObjects, currentStageIndex, puzzleData]);


  const handleClueClick = useCallback((clueId) => {
    if (cooldown > 0) return;

    const currentStage = puzzleData.stages[currentStageIndex];
    if (!currentStage) return;

    const trimmedClueId = clueId.trim();

    console.log(`[Drop] --- Drop Event ---`);
    console.log(`[Drop] Stage Index: ${currentStageIndex}`);
    console.log(`[Drop] Dropped Clue ID: '${trimmedClueId}'`);
    
    // Trim keys from the stage definition for a robust comparison
    const keyClues = currentStage.keyClueIds.map(k => k.trim());

    if (keyClues.includes(trimmedClueId)) {
      console.log(`[Drop] Correct key dropped: '${trimmedClueId}'`);
      setAvailableClueIds(prev => {
        const newSet = new Set(prev);
        // The original clueId (potentially with whitespace) is what we must delete from the available set.
        newSet.delete(clueId);
        return newSet;
      });

      // Still use original clueId to look up revelations, as object keys in data might have whitespace.
      const newRevelations = currentStage.revelations[clueId] || [];
      const newClueObjects = newRevelations.map(id => ({
        ...puzzleData.clues[id],
        keyOrigin: clueId, // Keep original keyOrigin for consistency
      }));
      setRevealedClueObjects(prev => [...prev, ...newClueObjects]);

    } else if (!incorrectlyDroppedIds.has(trimmedClueId)) {
      console.log(`[Drop] Incorrect key dropped: '${trimmedClueId}'`);
      setIncorrectlyDroppedIds(prev => new Set(prev).add(trimmedClueId));
      
      setLives(prevLives => {
        const newLives = prevLives - 1;
        if (newLives === 0) {
          setCooldown(60);
        }
        return newLives;
      });
    } else {
      console.log(`[Drop] Already-penalized incorrect clue dropped: '${trimmedClueId}'`);
    }
  }, [currentStageIndex, cooldown, incorrectlyDroppedIds, puzzleData]);
  
  const handleSubmit = () => {
    if (solution.toUpperCase().trim() === puzzleData.finalSolution) {
      onSolve();
    } else {
      onFail();
    }
  };
  
  const displayedClues = [...availableClueIds].map(id => puzzleData.clues[id]).filter(Boolean);
  const isUIDisabled = cooldown > 0;

  return (
    <div className={`p-4 bg-gray-900 text-white rounded-lg font-mono transition-opacity ${isUIDisabled ? 'opacity-50' : 'opacity-100'}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2">
          <h2 className="text-xl text-cyan-400 font-bold">{task.title}</h2>
          <div className="flex items-center space-x-2">
              <div className="text-lg font-semibold text-yellow-400">
                  Stage {currentStageIndex + 1} / {puzzleData.stages.length}
              </div>
              <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => <HeartIcon key={i} filled={i < lives} />)}
              </div>
          </div>
      </div>

      <p className="text-gray-400 mb-6">{task.description}</p>
      
      {isUIDisabled && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-10 rounded-lg">
              <div className="text-4xl font-bold text-red-500 animate-pulse">SYSTEM LOCKDOWN</div>
              <div className="text-xl text-gray-300 mt-2">
                  Remaining Cooldown: {Math.floor(cooldown / 60)}:{(cooldown % 60).toString().padStart(2, '0')}
              </div>
          </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
        {/* Left Panel: Available Clues */}
        <div>
          <h3 className="text-lg font-semibold text-cyan-300 mb-3">数据库碎片</h3>
          <div className="space-y-3 min-h-[250px] max-h-[300px] md:max-h-[400px] overflow-y-auto p-2 bg-black/30 rounded-lg">
            {displayedClues.map(clue => (
              <ClickableClue key={clue.id} clue={clue} isClickable={!isUIDisabled} onClick={handleClueClick} />
            ))}
          </div>
        </div>
        
        {/* Right Panel: Clueboard & Solver */}
        <div className="flex flex-col space-y-4">
          <Clueboard revealedClues={revealedClueObjects} />
          
          {isCompleted && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
              <input
                type="text"
                value={solution}
                onChange={(e) => setSolution(e.target.value)}
                placeholder="输入最终答案..."
                className="flex-grow bg-gray-800 border-2 border-cyan-700 focus:border-yellow-400 rounded-md px-4 py-2 text-white outline-none"
                disabled={isUIDisabled}
              />
              <CyberButton onClick={handleSubmit} disabled={isUIDisabled} className="w-full sm:w-auto">
                提交
              </CyberButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LogicPuzzleView;