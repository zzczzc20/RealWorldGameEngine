import React, { useState, useEffect, useMemo } from 'react';
import { useWorldStateContext } from '../context/WorldStateContext';
import CyberButton from './ui/CyberButton';
import CyberCard from './ui/CyberCard'; // Assuming CyberCard can be used for list items

// Helper to render media items (text or image)
const renderMediaItem = (mediaInfo, keyPrefix = "media") => {
  if (!mediaInfo) return null;
  if (mediaInfo.type === 'text') {
    return <p key={`${keyPrefix}-text`} className="text-gray-300 whitespace-pre-wrap my-2">{mediaInfo.content}</p>;
  }
  if (mediaInfo.type === 'image_url' && mediaInfo.content) {
    return (
      <div key={`${keyPrefix}-image`} className="text-center my-2">
        <img src={mediaInfo.content} alt={mediaInfo.caption || keyPrefix} className="max-w-full h-auto rounded-md mx-auto border border-gray-700 shadow-md" />
        {mediaInfo.caption && <p className="text-xs text-gray-500 italic mt-1">{mediaInfo.caption}</p>}
      </div>
    );
  }
  return null;
};


const PuzzleInteractionView = ({ isVisible, onClose }) => {
  const { currentPuzzleState, attemptSolvePuzzle } = useWorldStateContext();
  
  const [selectedPuzzleId, setSelectedPuzzleId] = useState(null);
  const [inputValues, setInputValues] = useState({}); // { [puzzleId]: string }
  const [feedbackMessages, setFeedbackMessages] = useState({}); // { [puzzleId]: string }

  const displayablePuzzles = useMemo(() => {
    return Object.values(currentPuzzleState)
      .filter(p => p && (p.status === 'unsolved' || p.status === 'solved'))
      .sort((a, b) => {
        // Unsolved puzzles first
        if (a.status === 'unsolved' && b.status !== 'unsolved') return -1;
        if (a.status !== 'unsolved' && b.status === 'unsolved') return 1;
        // Then sort by title (or ID if title missing)
        return (a.title || a.puzzleId).localeCompare(b.title || b.puzzleId);
      });
  }, [currentPuzzleState]);

  const selectedPuzzle = useMemo(() => {
    if (!selectedPuzzleId) return null;
    return currentPuzzleState[selectedPuzzleId] || null;
  }, [selectedPuzzleId, currentPuzzleState]);

  useEffect(() => {
    if (!isVisible) {
      setSelectedPuzzleId(null);
      setInputValues({});
      setFeedbackMessages({});
    }
  }, [isVisible]);

  // Clear feedback for a specific puzzle if it gets solved or its details change significantly
  useEffect(() => {
    if (selectedPuzzle && feedbackMessages[selectedPuzzle.puzzleId]) {
        if (selectedPuzzle.status === 'solved') {
            // Optionally keep success message or clear it
            // For now, let's clear it as solvedDisplay will take over
            setFeedbackMessages(prev => ({...prev, [selectedPuzzle.puzzleId]: ''}));
        }
    }
  }, [selectedPuzzle, feedbackMessages]);


  const handleSelectPuzzle = (puzzle) => {
    setSelectedPuzzleId(puzzle.puzzleId);
    // No need to clear inputValue/feedbackMessage here as they are per-puzzle
  };

  const handleBackToList = () => {
    setSelectedPuzzleId(null);
  };

  const handleInputChange = (puzzleId, value) => {
    setInputValues(prev => ({ ...prev, [puzzleId]: value }));
    if (feedbackMessages[puzzleId]) { // Clear feedback when user types
        setFeedbackMessages(prev => ({...prev, [puzzleId]: ''}));
    }
  };

  const handleSubmitSolution = async (puzzleId) => {
    const solutionAttempt = inputValues[puzzleId] || '';
    if (solutionAttempt.trim() === '') {
      setFeedbackMessages(prev => ({ ...prev, [puzzleId]: '请输入解答。' }));
      return;
    }
    setFeedbackMessages(prev => ({ ...prev, [puzzleId]: '尝试中...' }));
    try {
      const result = await attemptSolvePuzzle(puzzleId, solutionAttempt);
      setFeedbackMessages(prev => ({ ...prev, [puzzleId]: result.message || '尝试已处理。' }));
      if (result.success) {
        setInputValues(prev => ({ ...prev, [puzzleId]: '' })); // Clear input on success
      }
    } catch (error) {
      console.error("Error attempting puzzle solution:", error);
      setFeedbackMessages(prev => ({ ...prev, [puzzleId]: '解答尝试出错。' }));
    }
  };

  if (!isVisible) {
    return null;
  }

  const getStatusPill = (status) => {
    let bgColor = 'bg-gray-600';
    let textColor = 'text-gray-100';
    if (status === 'solved') { bgColor = 'bg-green-600/80'; textColor = 'text-green-100'; }
    if (status === 'unsolved') { bgColor = 'bg-yellow-600/80'; textColor = 'text-yellow-100'; }
    return <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${bgColor} ${textColor}`}>{status}</span>;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-2 sm:p-4 backdrop-blur-md">
      <div className="bg-gray-900 border border-purple-500/70 rounded-lg shadow-2xl shadow-purple-500/30 w-full max-w-md sm:max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-purple-700/50">
          <h2 className="text-xl sm:text-2xl font-semibold text-purple-300">
            {selectedPuzzle ? `谜题: ${selectedPuzzle.title}` : '活动谜题中心'}
          </h2>
          <button
            onClick={selectedPuzzle ? handleBackToList : onClose}
            className="text-gray-400 hover:text-white text-2xl sm:text-3xl px-2"
            aria-label={selectedPuzzle ? "返回谜题列表" : "关闭谜题中心"}
          >
            {selectedPuzzle ? '‹ 返回' : '×'}
          </button>
        </div>

        <div className="overflow-y-auto p-4 sm:p-6 space-y-4 flex-grow">
          {!selectedPuzzle ? (
            // Puzzle List View
            displayablePuzzles.length > 0 ? (
              displayablePuzzles.map((puzzle) => (
                <CyberCard 
                  key={puzzle.puzzleId} 
                  className="p-4 !border-purple-600/50 hover:!border-purple-400 transition-all duration-200 cursor-pointer"
                  onClick={() => handleSelectPuzzle(puzzle)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-lg sm:text-xl font-medium text-purple-300">{puzzle.title || '无标题谜题'}</h3>
                    {getStatusPill(puzzle.status)}
                  </div>
                  <p className="text-sm text-gray-400 mt-1 line-clamp-2">{puzzle.description || '暂无描述'}</p>
                </CyberCard>
              ))
            ) : (
              <p className="text-gray-400 text-center py-8">当前没有已激活的谜题。</p>
            )
          ) : (
            // Single Puzzle Detail/Interaction View
            <div>
              <p className="text-gray-300 mb-2"><strong className="text-purple-400">描述:</strong> {selectedPuzzle.description || '暂无描述'}</p>
              <div className="mb-4 flex items-center gap-2">
                <strong className="text-purple-400">状态:</strong> {getStatusPill(selectedPuzzle.status)}
              </div>
              
              {selectedPuzzle.status === 'unsolved' && selectedPuzzle.solutionType === 'code' && (
                <div className="space-y-3 my-4 p-4 bg-gray-800/50 rounded-md border border-gray-700">
                  <label htmlFor={`puzzleInput-${selectedPuzzle.puzzleId}`} className="block text-sm font-medium text-purple-300">输入解答代码:</label>
                  <input 
                    id={`puzzleInput-${selectedPuzzle.puzzleId}`}
                    type="text" 
                    value={inputValues[selectedPuzzle.puzzleId] || ''} 
                    onChange={(e) => handleInputChange(selectedPuzzle.puzzleId, e.target.value)} 
                    placeholder="代码..."
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none placeholder-gray-500"
                  />
                  <CyberButton 
                    onClick={() => handleSubmitSolution(selectedPuzzle.puzzleId)}
                    className="w-full !bg-purple-600 hover:!bg-purple-700"
                  >
                    提交
                  </CyberButton>
                </div>
              )}

              {feedbackMessages[selectedPuzzle.puzzleId] && (
                <p className={`my-3 text-center text-sm ${feedbackMessages[selectedPuzzle.puzzleId].toLowerCase().includes('solved') || feedbackMessages[selectedPuzzle.puzzleId].toLowerCase().includes('correct') ? 'text-green-400' : 'text-red-400'}`}>
                  {feedbackMessages[selectedPuzzle.puzzleId]}
                </p>
              )}

              {selectedPuzzle.status === 'solved' && (
                selectedPuzzle.solvedDisplay ? (
                  <div className="mt-4 p-3 bg-green-800/20 border border-green-700/50 rounded-md">
                    <h4 className="text-md font-semibold text-green-300 mb-2">谜题已解决:</h4>
                    {renderMediaItem(selectedPuzzle.solvedDisplay, `solved-${selectedPuzzle.puzzleId}`)}
                  </div>
                ) : (
                  <p className="mt-4 text-center text-green-400 font-semibold">此谜题已成功解决！</p>
                )
              )}
            </div>
          )}
        </div>
        
        {!selectedPuzzle && (
             <div className="p-4 border-t border-purple-700/50 text-right">
                <CyberButton 
                    onClick={onClose}
                    className="!bg-gray-700 hover:!bg-gray-600 !text-gray-300"
                >
                    关闭
                </CyberButton>
            </div>
        )}
      </div>
    </div>
  );
};

export default PuzzleInteractionView;