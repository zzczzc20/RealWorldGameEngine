import React, { useState, useEffect, useRef, useCallback } from 'react';
import CyberButton from './ui/CyberButton';
import CyberCard from './ui/CyberCard';
import { publish } from '../services/EventService';
import { useWorldStateContext } from '../context/WorldStateContext';

// 裂隙调谐器游戏组件 - 专注于频率调谐
function RiftTunerGame({ 
  isVisible, 
  onClose, 
  taskData,
  onSuccess, 
  onFailure 
}) {
  const { personas, completeTask: completeTaskInContext } = useWorldStateContext();
  
  // 游戏状态
  const [gameState, setGameState] = useState('idle'); // idle, playing, completed, failed
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [capturedMessages, setCapturedMessages] = useState([]);
  const [score, setScore] = useState(0);
  
  // 频率调谐状态
  const [targetFrequency, setTargetFrequency] = useState(50);
  const [currentFrequency, setCurrentFrequency] = useState(25);
  const [signalLocked, setSignalLocked] = useState(false);
  const [lockDuration, setLockDuration] = useState(0);
  const [interferenceLevel, setInterferenceLevel] = useState(20);
  const [signalStrength, setSignalStrength] = useState(0);
  
  // 动态效果
  const [baseTargetFrequency, setBaseTargetFrequency] = useState(50); // 基础目标频率
  const [frequencyDrift, setFrequencyDrift] = useState(0);
  const [lastLockTime, setLastLockTime] = useState(0);
  
  const gameTimerRef = useRef(null);
  const driftTimerRef = useRef(null);

  // 从taskData获取消息列表
  const riftMessages = taskData?.riftMessages || [];
  const totalMessages = riftMessages.length;

  // 初始化游戏
  useEffect(() => {
    console.log(`useEffect triggered: isVisible=${isVisible}, gameState=${gameState}`); // 调试信息
    if (isVisible && gameState === 'idle') {
      console.log('Initializing game...'); // 调试信息
      initializeGame();
    }
    return () => {
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
      if (driftTimerRef.current) clearInterval(driftTimerRef.current);
    };
  }, [isVisible, gameState]); // 添加gameState依赖

  // 初始化游戏
  const initializeGame = useCallback(() => {
    console.log('initializeGame called'); // 调试信息
    setGameState('playing');
    setCurrentMessageIndex(0);
    setCapturedMessages([]);
    setScore(0);
    setSignalLocked(false);
    setLockDuration(0);
    initializeTargetFrequency();
    
    // 延迟启动频率漂移，确保状态已更新
    setTimeout(() => {
      console.log('Starting frequency drift after delay');
      startFrequencyDrift();
    }, 100);
  }, []);

  // 初始化目标频率
  const initializeTargetFrequency = () => {
    const baseFreq = Math.floor(Math.random() * 50) + 30; // 30-80 Hz 作为基础频率
    console.log(`Initializing target frequency: baseFreq=${baseFreq}`); // 调试信息
    setBaseTargetFrequency(baseFreq);
    setTargetFrequency(baseFreq);
    setInterferenceLevel(Math.random() * 20 + 15); // 15-35% 干扰
  };

  // 启动频率漂移系统
  const startFrequencyDrift = () => {
    console.log('Starting frequency drift system...'); // 调试信息
    
    if (driftTimerRef.current) {
      clearInterval(driftTimerRef.current);
      console.log('Cleared existing drift timer');
    }
    
    driftTimerRef.current = setInterval(() => {
      console.log(`Drift timer tick, gameState: ${gameState}`); // 调试信息
      
      // 移除gameState检查，确保漂移始终运行
      // if (gameState !== 'playing') {
      //   clearInterval(driftTimerRef.current);
      //   return;
      // }

      // 目标频率围绕基础频率持续浮动
      setTargetFrequency(prev => {
        // 使用正弦波和随机噪声的组合来创建自然的浮动
        const time = Date.now() / 1000; // 转换为秒
        const sineWave = Math.sin(time * 0.5) * 8; // 更快的正弦波，±8Hz
        const randomNoise = (Math.random() - 0.5) * 6; // 更大的随机噪声，±3Hz
        const drift = sineWave + randomNoise;
        
        // 围绕基础频率浮动，限制在±12Hz范围内
        const newFreq = baseTargetFrequency + drift;
        const clampedFreq = Math.max(baseTargetFrequency - 12, Math.min(baseTargetFrequency + 12, newFreq));
        
        // 更频繁的调试信息
        console.log(`Target frequency drift: base=${baseTargetFrequency.toFixed(1)}, prev=${prev.toFixed(1)}, new=${clampedFreq.toFixed(1)}, drift=${drift.toFixed(1)}`);
        
        return clampedFreq;
      });

      // 干扰强度也轻微变化
      setInterferenceLevel(prev => {
        const change = (Math.random() - 0.5) * 5; // 增加干扰变化幅度
        return Math.max(10, Math.min(45, prev + change));
      });

      // 更新信号强度
      updateSignalStrength();
    }, 500); // 暂时改为500ms，更容易观察
  };

  // 更新信号强度
  const updateSignalStrength = () => {
    const distance = Math.abs(targetFrequency - currentFrequency);
    const baseStrength = Math.max(0, 100 - distance * 3);
    const interferenceReduction = baseStrength * (interferenceLevel / 100);
    const finalStrength = Math.max(0, baseStrength - interferenceReduction);
    setSignalStrength(finalStrength);
  };

  // 处理频率调节
  const handleFrequencyChange = (delta) => {
    // 应用干扰效果
    const interferenceEffect = (Math.random() - 0.5) * (interferenceLevel / 15);
    const actualDelta = delta + interferenceEffect;
    
    const newFreq = Math.max(0, Math.min(100, currentFrequency + actualDelta));
    setCurrentFrequency(newFreq);
    
    const distance = Math.abs(targetFrequency - newFreq);
    
    // 检查信号锁定 - 由于目标频率持续大幅浮动，需要合适的容差
    if (distance < 3.0) {
      if (!signalLocked) {
        setSignalLocked(true);
        setLockDuration(0);
        setLastLockTime(Date.now());
      }
    } else {
      if (signalLocked) {
        setSignalLocked(false);
        setLockDuration(0);
      }
    }
  };

  // 监控锁定持续时间
  useEffect(() => {
    let lockTimer;
    if (signalLocked) {
      lockTimer = setInterval(() => {
        setLockDuration(prev => {
          const newDuration = prev + 0.1;
          
          // 当锁定时间达到3秒时，捕获一条消息
          if (newDuration >= 3.0 && currentMessageIndex < totalMessages) {
            captureMessage();
            return 0; // 重置锁定时间
          }
          
          return newDuration;
        });
      }, 100);
    }
    
    return () => {
      if (lockTimer) clearInterval(lockTimer);
    };
  }, [signalLocked, currentMessageIndex, totalMessages]);

  // 捕获消息
  const captureMessage = () => {
    if (currentMessageIndex < totalMessages) {
      const message = riftMessages[currentMessageIndex];
      setCapturedMessages(prev => [...prev, message]);
      setCurrentMessageIndex(prev => prev + 1);
      setScore(prev => prev + 100);
      
      // 重置锁定状态，但保持目标频率继续浮动
      setSignalLocked(false);
      setLockDuration(0);
      
      // 检查是否完成所有消息
      if (currentMessageIndex + 1 >= totalMessages) {
        completeTask();
      }
    }
  };

  // 完成任务
  const completeTask = () => {
      setGameState('completed');
      
      const taskId = taskData?.taskId || 'rift_tuner_demo';
      const taskResult = {
          score: score + 100,
          capturedMessages: [...capturedMessages, riftMessages[currentMessageIndex]],
          taskData,
          completedAt: Date.now()
      };
      
      console.log(`[RiftTunerGame] Completing task with ID: ${taskId}`);
      console.log(`[RiftTunerGame] Task result:`, taskResult);
      
      // 使用 setTimeout 延迟状态更新，避免在渲染过程中直接更新
      setTimeout(() => {
          // 通过WorldStateContext标记任务完成
          if (completeTaskInContext) {
              console.log(`[RiftTunerGame] Calling completeTaskInContext for task ID: ${taskId}`);
              completeTaskInContext(taskId, taskResult);
          } else {
              console.warn(`[RiftTunerGame] completeTaskInContext function not available`);
          }
          
          // 发布任务完成事件（保持向后兼容）
          console.log(`[RiftTunerGame] Publishing 'task_completed' event for task ID: ${taskId}`);
          publish('task_completed', {
              taskId: taskId,
              ...taskResult
          });
          
          if (onSuccess) {
              console.log(`[RiftTunerGame] Calling onSuccess callback for task ID: ${taskId}`);
              onSuccess(taskResult);
          } else {
              console.warn(`[RiftTunerGame] onSuccess callback not provided`);
          }
      }, 0);
  };

  // 获取当前反馈信息
  const getCurrentFeedback = () => {
    const distance = Math.abs(targetFrequency - currentFrequency);
    
    if (signalLocked) {
      return `信号锁定中... ${lockDuration.toFixed(1)}s / 3.0s`;
    } else if (distance < 2) {
      return '频率匹配！保持调谐...';
    } else if (distance < 4) {
      return '接近目标频率，微调中...';
    } else if (distance < 8) {
      return '信号微弱，继续调节...';
    } else {
      return '搜索浮动信号中...';
    }
  };

  // 渲染频率调谐界面
  const renderFrequencyTuner = () => (
    <div className="space-y-4">
      {/* 任务信息 */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-purple-300 mb-2">
          <span className="animate-pulse">◊</span> {taskData?.title || '裂隙调谐器'} <span className="animate-pulse">◊</span>
        </h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="text-cyan-300">消息: {currentMessageIndex}/{totalMessages}</div>
          <div className="text-yellow-300">分数: {score}</div>
        </div>
      </div>
      
      {/* 主控制面板 */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 rounded-lg border border-purple-600/30 shadow-lg">
        {/* 状态指示器 */}
        <div className="grid grid-cols-4 gap-2 mb-4 text-xs">
          <div className="text-center">
            <div className="text-cyan-300 font-mono">{currentFrequency.toFixed(1)} Hz</div>
            <div className="text-gray-400">当前频率</div>
          </div>
          <div className="text-center">
            <div className="text-yellow-300 font-mono animate-pulse">{targetFrequency.toFixed(1)} Hz</div>
            <div className="text-gray-400">目标频率</div>
          </div>
          <div className="text-center">
            <div className={`font-mono ${signalLocked ? 'text-green-400 animate-pulse' : 'text-red-300'}`}>
              {signalLocked ? 'LOCKED' : 'DRIFT'}
            </div>
            <div className="text-gray-400">信号状态</div>
          </div>
          <div className="text-center">
            <div className="text-purple-300 font-mono">{signalStrength.toFixed(0)}%</div>
            <div className="text-gray-400">信号强度</div>
          </div>
        </div>

        {/* 频谱可视化 */}
        <div className="relative h-32 bg-black rounded-lg mb-4 overflow-hidden border border-cyan-500/30">
          {/* 背景网格 */}
          <div className="absolute inset-0 opacity-20">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="absolute w-full border-t border-cyan-500/20" style={{ top: `${i * 10}%` }} />
            ))}
            {[...Array(10)].map((_, i) => (
              <div key={i} className="absolute h-full border-l border-cyan-500/20" style={{ left: `${i * 10}%` }} />
            ))}
          </div>
          
          {/* 当前频率波形 */}
          <div
            className="absolute bottom-0 transition-all duration-300 ease-out"
            style={{
              height: `${currentFrequency}%`,
              width: '100%',
              background: `linear-gradient(to top,
                ${signalLocked ? '#10b981' : '#06b6d4'} 0%,
                ${signalLocked ? '#34d399' : '#67e8f9'} 50%,
                ${signalLocked ? '#6ee7b7' : '#a7f3d0'} 100%)`,
              opacity: 0.6 + (signalStrength / 200),
              boxShadow: signalLocked ? '0 0 20px #10b981' : '0 0 10px #06b6d4'
            }}
          />
          
          {/* 目标频率线 */}
          <div
            className="absolute w-full border-t-2 border-yellow-400 transition-all duration-500"
            style={{
              bottom: `${targetFrequency}%`,
              boxShadow: '0 0 10px #fbbf24'
            }}
          >
            <div className="absolute -right-12 -top-3 text-xs text-yellow-400 font-mono bg-black/50 px-1 rounded">
              {targetFrequency.toFixed(1)}
            </div>
          </div>
          
          {/* 干扰效果 */}
          {interferenceLevel > 25 && (
            <div className="absolute inset-0 bg-red-500/10 animate-pulse" />
          )}
          
          {/* 信号锁定效果 */}
          {signalLocked && (
            <div className="absolute inset-0 border-2 border-green-400 animate-pulse rounded-lg" />
          )}
          
          {/* 频谱分析线 */}
          <div className="absolute inset-0">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute bg-cyan-400/30 transition-all duration-100"
                style={{
                  left: `${i * 5}%`,
                  width: '2px',
                  height: `${Math.random() * 30 + 10}%`,
                  bottom: '0'
                }}
              />
            ))}
          </div>
        </div>

        {/* 锁定进度条 */}
        {signalLocked && (
          <div className="mb-4">
            <div className="text-xs text-gray-400 mb-1">信号锁定进度</div>
            <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-cyan-500 transition-all duration-100"
                style={{ width: `${(lockDuration / 3.0) * 100}%` }}
              />
            </div>
            <div className="text-xs text-center mt-1 text-green-400">
              {lockDuration.toFixed(1)}s / 3.0s
            </div>
          </div>
        )}

        {/* 控制按钮 */}
        <div className="grid grid-cols-4 gap-2 mb-2">
          <CyberButton
            onClick={() => handleFrequencyChange(-5)}
            className="!bg-red-700 hover:!bg-red-600 !text-xs !py-2"
          >
            -5
          </CyberButton>
          <CyberButton
            onClick={() => handleFrequencyChange(-1)}
            className="!bg-red-500 hover:!bg-red-400 !text-xs !py-2"
          >
            -1
          </CyberButton>
          <CyberButton
            onClick={() => handleFrequencyChange(1)}
            className="!bg-green-500 hover:!bg-green-400 !text-xs !py-2"
          >
            +1
          </CyberButton>
          <CyberButton
            onClick={() => handleFrequencyChange(5)}
            className="!bg-green-700 hover:!bg-green-600 !text-xs !py-2"
          >
            +5
          </CyberButton>
        </div>
        
        {/* 精密调节 */}
        <div className="grid grid-cols-6 gap-1">
          {[-0.5, -0.2, -0.1, 0.1, 0.2, 0.5].map(delta => (
            <CyberButton
              key={delta}
              onClick={() => handleFrequencyChange(delta)}
              className="!bg-gray-600 hover:!bg-gray-500 !text-xs !py-1"
            >
              {delta > 0 ? '+' : ''}{delta}
            </CyberButton>
          ))}
        </div>
      </div>

      {/* 反馈信息 */}
      <div className="text-center">
        <div className={`text-sm font-semibold ${
          signalLocked ? 'text-green-400' : 
          signalStrength > 70 ? 'text-yellow-400' : 
          signalStrength > 30 ? 'text-orange-400' : 'text-gray-400'
        }`}>
          {getCurrentFeedback()}
        </div>
        <div className="text-xs text-gray-400 mt-1">
          干扰强度: {interferenceLevel.toFixed(0)}%
        </div>
      </div>
    </div>
  );

  // 渲染已捕获的消息
  const renderCapturedMessages = () => (
    <div className="space-y-2 max-h-40 overflow-y-auto">
      <h4 className="text-sm font-semibold text-purple-300">已接收的裂隙低语:</h4>
      {capturedMessages.map((message, index) => (
        <div key={index} className="bg-purple-900/30 p-2 rounded border border-purple-600/50">
          <p className="text-purple-300 text-xs italic">
            "{message}"
          </p>
        </div>
      ))}
    </div>
  );

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <CyberCard className="w-full max-w-lg bg-gradient-to-br from-gray-900 via-gray-800/90 to-gray-900 border-purple-600/50 shadow-xl shadow-purple-500/20">
        <div className="p-6 relative">
          {/* 背景效果 */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-cyan-500 to-purple-500" />
          </div>
          
          {/* 游戏内容 */}
          {gameState === 'playing' && (
            <div className="relative z-10 space-y-4">
              {renderFrequencyTuner()}
              {capturedMessages.length > 0 && renderCapturedMessages()}
            </div>
          )}

          {/* 任务完成界面 */}
          {gameState === 'completed' && (
            <div className="text-center space-y-4 relative z-10">
              <div className="text-lg font-semibold text-green-400">
                {taskData?.successMessage || '裂隙调谐完成！'}
              </div>
              <div className="text-cyan-300">
                最终分数: {score}
              </div>
              <div className="text-sm text-gray-300">
                成功接收 {capturedMessages.length} 条裂隙低语
              </div>
              {renderCapturedMessages()}
              <CyberButton onClick={onClose} className="w-full">
                关闭
              </CyberButton>
            </div>
          )}

          {/* 控制按钮 */}
          {gameState === 'playing' && (
            <div className="mt-4 flex justify-center relative z-10">
              <CyberButton onClick={onClose} className="!bg-gray-600 hover:!bg-gray-500">
                取消调谐
              </CyberButton>
            </div>
          )}
        </div>
      </CyberCard>
    </div>
  );
}

export default RiftTunerGame;