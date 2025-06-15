import React, { useState, useEffect } from 'react';
import { subscribe, unsubscribe } from '../services/EventService';
import RiftTunerGame from './RiftTunerGame';
import RiftWhisperDisplay from './RiftWhisperDisplay';
import riftTunerService from '../services/RiftTunerService';

/**
 * 裂隙管理器 - 统一管理裂隙调谐器游戏和裂隙低语显示
 */
function RiftManager() {
  const [gameVisible, setGameVisible] = useState(false);
  const [currentRiftConfig, setCurrentRiftConfig] = useState(null);
  const [riftDetectionNotification, setRiftDetectionNotification] = useState(null);

  useEffect(() => {
    // 监听裂隙检测事件
    const handleRiftDetected = (data) => {
      console.log('[RiftManager] 检测到裂隙:', data);
      showRiftDetectionNotification(data);
    };

    subscribe('rift_detected', handleRiftDetected);

    return () => {
      unsubscribe('rift_detected', handleRiftDetected);
    };
  }, []);

  /**
   * 显示裂隙检测通知
   */
  const showRiftDetectionNotification = (riftData) => {
    setRiftDetectionNotification(riftData);
    
    // 自动隐藏通知
    setTimeout(() => {
      setRiftDetectionNotification(null);
    }, 10000);
  };

  /**
   * 启动裂隙调谐器游戏
   */
  const startRiftTunerGame = (riftData) => {
    setCurrentRiftConfig(riftData.config);
    setGameVisible(true);
    setRiftDetectionNotification(null);
  };

  /**
   * 关闭裂隙调谐器游戏
   */
  const closeRiftTunerGame = () => {
    setGameVisible(false);
    setCurrentRiftConfig(null);
  };

  /**
   * 处理游戏成功
   */
  const handleGameSuccess = (score, riftMessage) => {
    console.log('[RiftManager] 裂隙调谐成功:', { score, riftMessage });
    closeRiftTunerGame();
  };

  /**
   * 处理游戏失败
   */
  const handleGameFailure = (score) => {
    console.log('[RiftManager] 裂隙调谐失败:', { score });
    closeRiftTunerGame();
  };

  /**
   * 忽略裂隙检测
   */
  const ignoreRiftDetection = () => {
    setRiftDetectionNotification(null);
  };

  return (
    <>
      {/* 裂隙检测通知 */}
      {riftDetectionNotification && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
          <div className="bg-gray-900/95 border-2 border-purple-600 rounded-lg p-6 max-w-md backdrop-blur-sm">
            <div className="text-center space-y-4">
              {/* 动画效果 */}
              <div className="relative">
                <div className="w-16 h-16 mx-auto border-4 border-purple-500 rounded-full animate-pulse">
                  <div className="w-full h-full bg-gradient-to-r from-purple-600 to-cyan-500 rounded-full opacity-50 animate-ping" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl text-purple-300">◊</span>
                </div>
              </div>

              {/* 通知文本 */}
              <div>
                <h3 className="text-lg font-semibold text-purple-400 mb-2">
                  异常时空扰动检测
                </h3>
                <p className="text-sm text-gray-300 mb-1">
                  检测到现实裂隙信号
                </p>
                <p className="text-xs text-cyan-400">
                  来自平行可能性的意识片段正在泄露...
                </p>
              </div>

              {/* 操作按钮 */}
              <div className="flex space-x-3">
                <button
                  onClick={() => startRiftTunerGame(riftDetectionNotification)}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded transition-colors"
                >
                  启动调谐器
                </button>
                <button
                  onClick={ignoreRiftDetection}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded transition-colors"
                >
                  忽略信号
                </button>
              </div>

              {/* 装饰性信息 */}
              <div className="text-xs text-gray-500 font-mono">
                信号强度: {Math.floor(Math.random() * 30 + 70)}%
                <br />
                频率: {(Math.random() * 10 + 40).toFixed(2)} Hz
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 裂隙调谐器游戏 */}
      <RiftTunerGame
        isVisible={gameVisible}
        onClose={closeRiftTunerGame}
        gameConfig={currentRiftConfig}
        onSuccess={handleGameSuccess}
        onFailure={handleGameFailure}
      />

      {/* 裂隙低语显示 */}
      <RiftWhisperDisplay />
    </>
  );
}

export default RiftManager;