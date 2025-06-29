// src/components/LogicPuzzleGame.jsx
import React, { useState } from 'react';
import { publish } from '../services/EventService';
import CyberCard from './ui/CyberCard';
import CyberButton from './ui/CyberButton';
import LogicPuzzleView from './LogicPuzzleView'; // The core game logic will be in here

function LogicPuzzleGame({ isVisible, onClose, taskData, onSuccess, onFailure }) {
  const [gameState, setGameState] = useState('playing'); // playing, completed, failed

  const handleSolve = () => {
    setGameState('completed');
    // The onSuccess handler is now the single source of truth for completing the task.
    // It will call completeTask in WorldStateContext, which publishes the 'task_completed' event.
    // This avoids publishing the event twice.
    if (onSuccess) {
      onSuccess({ taskId: taskData.taskId, status: 'success' });
    }
  };

  const handleFail = () => {
    setGameState('failed');
    if (onFailure) {
      onFailure({ taskId: taskData.taskId, status: 'failed' });
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 font-sans">
      <CyberCard className="w-full max-w-4xl bg-gray-900/90 border-cyan-500/50 shadow-2xl shadow-cyan-500/20 backdrop-blur-sm">
        <div className="p-6 relative">
          
          {gameState === 'playing' && (
            <LogicPuzzleView 
              task={taskData}
              onSolve={handleSolve}
              onFail={handleFail}
            />
          )}

          {gameState === 'completed' && (
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold text-green-400 animate-pulse">
                {taskData.successMessage || 'Puzzle Solved!'}
              </h2>
              <p className="text-gray-300">你成功揭開了設計師的神秘面紗。</p>
              <CyberButton onClick={onClose} className="w-full">
                關閉
              </CyberButton>
            </div>
          )}

          {gameState === 'failed' && (
             <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold text-red-500">
                {taskData.failureMessage || '身份驗證失敗'}
              </h2>
              <p className="text-gray-300">線索組合錯誤，請重試。</p>
              <CyberButton onClick={() => setGameState('playing')} className="w-full !bg-yellow-500 hover:!bg-yellow-400">
                重試
              </CyberButton>
            </div>
          )}

        </div>
      </CyberCard>
    </div>
  );
}

export default LogicPuzzleGame;