// src/components/TaskOfferPanel.jsx
import React from 'react';
import { notifyScript } from '../services/EventService';
import { useWorldStateContext } from '../context/WorldStateContext';
import CyberCard from './ui/CyberCard';
import CyberButton from './ui/CyberButton';
// Removed useWorldStateContext import as logic is passed via props

// Accept onAccept and onDecline callbacks from App.jsx
function TaskOfferPanel({ task, scriptId, onAccept, onDecline }) {
  if (!task) return null;
  // Destructure fields from the task object
  const { title, description, reward, difficulty, type } = task;

  // Removed internal handleChoice logic
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50">
      <CyberCard className="max-w-lg w-full bg-gray-900 border border-purple-600 p-6">
        <h2 className="text-2xl font-bold text-purple-400 mb-2">{title}</h2>
        {/* Display Task Type and Difficulty */}
        <div className="text-sm text-gray-400 mb-4">
          <span>类型: {type || '未知'}</span>
          <span className="ml-4">难度: {difficulty || '未知'}</span>
        </div>
        <p className="text-gray-200 mb-4">{description}</p>
        {/* Display Reward */}
        {reward !== undefined && (
            <p className="text-yellow-400 mb-6 font-semibold">奖励: {reward} 信用点</p>
        )}
        <div className="flex justify-center space-x-4">
          <CyberButton
            onClick={onAccept} // Call the passed onAccept callback
            className="bg-green-600 hover:bg-green-500"
          >
            接受
          </CyberButton>
          <CyberButton
            onClick={onDecline} // Call the passed onDecline callback
            className="bg-red-600 hover:bg-red-500"
          >
            拒绝
          </CyberButton>
        </div>
      </CyberCard>
    </div>
  );
}

export default TaskOfferPanel;