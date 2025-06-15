// src/views/UserProfileView.jsx
import React, { useState } from 'react';
import CyberCard from '../components/ui/CyberCard'; // Import the new card
import CyberButton from '../components/ui/CyberButton'; // Import CyberButton
// import userData from '../data/userData'; // Remove static data import
import { useWorldStateContext } from '../context/WorldStateContext'; // Import the context hook

// 辅助函数：将派系ID转换为可读名称
const getFactionName = (factionId) => {
  const factionNames = {
    'CorpSec': '企业安全部门',
    'Underground': '地下组织',
    'Tiger_Claws': '虎爪帮',
    'Chrome_Zealots': '铬金狂热者',
    'Protocol_Zero': '零协议',
    'Concrete_Rats': '混凝土鼠帮',
    'Forge_Burners': '熔炉焚烧者'
  };
  
  return factionNames[factionId] || factionId;
};

function UserProfileView() {
  const { player } = useWorldStateContext(); // Get player state from context
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');

  // 清除游戏进度的函数
  const handleResetGame = () => {
    if (resetConfirmText === 'RESET') {
      // 清除所有localStorage数据
      localStorage.clear();
      // 刷新页面重新开始
      window.location.reload();
    }
  };

  // Handle case where player data might not be loaded yet (optional, depends on context setup)
  if (!player) {
    return <div className="text-center text-cyan-400 p-8">Loading player data...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      {/* Use CyberCard for profile */}
      <CyberCard>
        {/* Header */}
        <div className="p-6 border-b border-cyan-500/30">
          <h1 className="text-2xl font-bold text-cyan-400">Player Profile</h1>
        </div>
        
        {/* Body */}
        <div className="p-6">
          {/* Avatar and Basic Info */}
          <div className="flex items-center mb-6">
            <div className="w-20 h-20 rounded-full bg-cyan-600 flex items-center justify-center text-black text-3xl font-bold shadow-lg shadow-cyan-500/30">
              {player.name.charAt(0).toUpperCase()} {/* Use player name from context */}
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-bold">{player.name}</h2> {/* Use player name */}
              {/* <p className="text-gray-400">{userData.rank}</p>  We don't have rank in player state yet */}
              <p className="text-gray-400">Operator</p> {/* Placeholder for rank/title */}
            </div>
          </div>
          
          {/* Key Stats Grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-6">
            {/* Reusable Stat Display Component (Concept) - For now, inline */}
            {/* Level is not in player state yet, using placeholder */}
            <div className="bg-gray-700/50 p-4 rounded border border-gray-600 text-center">
              <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Level</div>
              <div className="text-3xl font-bold text-cyan-300">1</div> {/* Placeholder */}
            </div>
            <div className="bg-gray-700/50 p-4 rounded border border-gray-600 text-center">
              <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Credits</div> {/* Changed Points to Credits */}
              <div className="text-3xl font-bold text-cyan-300">{player.credits}</div> {/* Use player credits */}
            </div>
            {/* Completed Tasks not in player state yet, using placeholder */}
            <div className="bg-gray-700/50 p-4 rounded border border-gray-600 text-center">
              <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Tasks Done</div>
              <div className="text-3xl font-bold text-cyan-300">0</div> {/* Placeholder */}
            </div>
          </div>
          
          {/* Detailed Stats List */}
          {/* Inventory Section */}
          <div className="mt-8">
            <h3 className="font-semibold text-lg mb-3 text-cyan-400">Inventory</h3>
            <div className="bg-gray-700/50 p-4 rounded border border-gray-600">
              {player.inventory && player.inventory.length > 0 ? (
                <ul className="divide-y divide-gray-600">
                  {player.inventory.map(item => (
                    <li key={item.id} className="flex justify-between items-center py-2">
                      <span className="text-gray-100">{item.name}</span>
                      <span className="text-cyan-300 font-mono">x{item.quantity}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400 italic">Inventory is empty.</p>
              )}
            </div>
          </div>

          {/* Reputation Section */}
          <div className="mt-8">
            <h3 className="font-semibold text-lg mb-3 text-cyan-400">Reputation</h3>
            <div className="bg-gray-700/50 p-4 rounded border border-gray-600">
              {player.reputation && Object.keys(player.reputation).length > 0 ? (
                <ul className="divide-y divide-gray-600">
                  {Object.entries(player.reputation).map(([factionId, score]) => (
                    <li key={factionId} className="flex justify-between items-center py-2">
                      <span className="text-gray-100">{getFactionName(factionId)}</span>
                      <span className={`font-medium ${score >= 0 ? 'text-green-400' : 'text-red-400'}`}>{score}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400 italic">No faction reputation established.</p>
              )}
            </div>
          </div>

          {/* 危险操作区域 */}
          <div className="mt-8">
            <h3 className="font-semibold text-lg mb-3 text-red-400 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              危险操作
            </h3>
            <div className="bg-red-900/20 border-2 border-red-500/50 p-4 rounded-lg">
              <div className="mb-4">
                <div className="flex items-center mb-2">
                  <svg className="w-6 h-6 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <h4 className="text-red-300 font-bold text-lg">重置游戏进度</h4>
                </div>
                <p className="text-red-200 text-sm mb-3">
                  ⚠️ <strong>警告：</strong>此操作将永久删除所有游戏数据，包括：
                </p>
                <ul className="text-red-200 text-sm mb-4 ml-4 list-disc">
                  <li>玩家进度和等级</li>
                  <li>物品和装备</li>
                  <li>任务完成状态</li>
                  <li>声望和关系</li>
                  <li>所有存档数据</li>
                </ul>
                <p className="text-red-300 text-sm font-bold mb-4">
                  此操作无法撤销！请谨慎操作！
                </p>
              </div>
              
              <CyberButton
                onClick={() => setShowResetModal(true)}
                className="!bg-red-600 hover:!bg-red-500 !border-red-400 !text-white"
              >
                🗑️ 重置游戏进度
              </CyberButton>
            </div>
          </div>

        </div>
      </CyberCard>

      {/* 重置确认模态框 */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-red-500 rounded-xl p-6 max-w-md mx-4 shadow-2xl shadow-red-500/30">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto bg-red-500 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-red-300 font-bold text-xl mb-2">⚠️ 最终确认</h3>
              <p className="text-red-200 mb-4">
                您即将删除所有游戏数据！此操作无法撤销！
              </p>
            </div>
            
            <div className="mb-6">
              <label className="block text-red-300 font-bold mb-2">
                请输入 "RESET" 来确认删除：
              </label>
              <input
                type="text"
                value={resetConfirmText}
                onChange={(e) => setResetConfirmText(e.target.value)}
                className="w-full bg-gray-700 text-white p-3 rounded border-2 border-red-500/50 focus:border-red-400 focus:ring-2 focus:ring-red-400/20 transition-all duration-300"
                placeholder="输入 RESET"
              />
            </div>
            
            <div className="flex gap-3">
              <CyberButton
                onClick={() => {
                  setShowResetModal(false);
                  setResetConfirmText('');
                }}
                className="flex-1 !bg-gray-600 hover:!bg-gray-500"
              >
                取消
              </CyberButton>
              <CyberButton
                onClick={handleResetGame}
                disabled={resetConfirmText !== 'RESET'}
                className={`flex-1 ${
                  resetConfirmText === 'RESET'
                    ? '!bg-red-600 hover:!bg-red-500'
                    : '!bg-gray-600 !cursor-not-allowed opacity-50'
                }`}
              >
                确认重置
              </CyberButton>
            </div>
          </div>
        </div>
      )}
    </div>
  ); // Correctly close the return statement with a parenthesis and semicolon
} // Add the missing closing brace for the UserProfileView function

export default UserProfileView;