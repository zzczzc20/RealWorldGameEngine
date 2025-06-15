import React, { useState, useEffect } from 'react';
import { subscribe, unsubscribe } from '../services/EventService';
import CyberCard from './ui/CyberCard';

/**
 * 裂隙低语显示组件 - 展示来自平行世界AI人格的神秘信息
 */
function RiftWhisperDisplay() {
  const [whispers, setWhispers] = useState([]);
  const [currentWhisper, setCurrentWhisper] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [glitchEffect, setGlitchEffect] = useState(false);

  useEffect(() => {
    // 监听裂隙低语事件
    const handleRiftWhisper = (data) => {
      console.log('[RiftWhisperDisplay] 收到裂隙低语:', data);
      showWhisper(data);
    };

    subscribe('rift_whisper_received', handleRiftWhisper);

    return () => {
      unsubscribe('rift_whisper_received', handleRiftWhisper);
    };
  }, []);

  /**
   * 显示裂隙低语
   */
  const showWhisper = (whisperData) => {
    const whisper = {
      id: Date.now(),
      persona: whisperData.persona,
      message: whisperData.message,
      score: whisperData.score,
      timestamp: whisperData.timestamp,
      isRead: false
    };

    // 添加到历史记录
    setWhispers(prev => [whisper, ...prev.slice(0, 9)]); // 最多保留10条

    // 显示当前低语
    setCurrentWhisper(whisper);
    setIsVisible(true);
    
    // 触发故障效果
    triggerGlitchEffect();

    // 自动隐藏（可选）
    setTimeout(() => {
      setIsVisible(false);
    }, 8000);
  };

  /**
   * 触发故障效果
   */
  const triggerGlitchEffect = () => {
    setGlitchEffect(true);
    
    // 多次闪烁效果
    const glitchSequence = [200, 100, 300, 150, 250];
    let delay = 0;
    
    glitchSequence.forEach((duration, index) => {
      setTimeout(() => {
        setGlitchEffect(index % 2 === 0);
      }, delay);
      delay += duration;
    });

    // 最后关闭故障效果
    setTimeout(() => {
      setGlitchEffect(false);
    }, delay);
  };

  /**
   * 关闭当前低语
   */
  const closeCurrentWhisper = () => {
    setIsVisible(false);
    if (currentWhisper) {
      setWhispers(prev => 
        prev.map(w => 
          w.id === currentWhisper.id ? { ...w, isRead: true } : w
        )
      );
    }
  };

  /**
   * 获取人格显示名称
   */
  const getPersonaDisplayName = (persona) => {
    const names = {
      'AhMing_Alternate': '阿明·平行',
      'Echo_Alternate': 'Echo·镜像',
      'Kiera_Alternate': 'Kiera·影子',
      'Protagonist_Alternate': '另一个你'
    };
    return names[persona] || persona.replace('_Alternate', '·异界');
  };

  /**
   * 获取信号强度显示
   */
  const getSignalStrength = (score) => {
    if (score >= 90) return { level: '强', color: 'text-green-400', bars: 5 };
    if (score >= 70) return { level: '中', color: 'text-yellow-400', bars: 4 };
    if (score >= 50) return { level: '弱', color: 'text-orange-400', bars: 3 };
    return { level: '微弱', color: 'text-red-400', bars: 2 };
  };

  if (!isVisible || !currentWhisper) return null;

  const signal = getSignalStrength(currentWhisper.score);

  return (
    <>
      {/* 故障效果覆盖层 */}
      {glitchEffect && (
        <div className="fixed inset-0 pointer-events-none z-40">
          <div className="w-full h-full bg-gradient-to-r from-transparent via-purple-500/10 to-transparent animate-pulse" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent" 
               style={{ 
                 animation: 'glitch-scan 0.1s infinite',
                 backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)'
               }} />
        </div>
      )}

      {/* 主要低语显示 */}
      <div className="fixed top-4 right-4 z-50 max-w-sm">
        <CyberCard className={`bg-gray-900/95 border-purple-600 backdrop-blur-sm transition-all duration-300 ${
          glitchEffect ? 'animate-pulse border-red-500' : ''
        }`}>
          <div className="p-4">
            {/* 头部信息 */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                <span className="text-xs text-purple-400 font-mono">
                  裂隙信号检测
                </span>
              </div>
              <button 
                onClick={closeCurrentWhisper}
                className="text-gray-500 hover:text-gray-300 text-sm"
              >
                ✕
              </button>
            </div>

            {/* 信号强度指示器 */}
            <div className="flex items-center space-x-2 mb-3">
              <span className="text-xs text-gray-400">信号强度:</span>
              <div className="flex space-x-1">
                {[...Array(5)].map((_, i) => (
                  <div 
                    key={i}
                    className={`w-1 h-3 ${
                      i < signal.bars ? signal.color.replace('text-', 'bg-') : 'bg-gray-700'
                    }`}
                  />
                ))}
              </div>
              <span className={`text-xs ${signal.color}`}>{signal.level}</span>
            </div>

            {/* 来源人格 */}
            <div className="mb-3">
              <div className="text-xs text-cyan-400 mb-1">
                信号来源: {getPersonaDisplayName(currentWhisper.persona)}
              </div>
              <div className="text-xs text-gray-500 font-mono">
                时空坐标: {new Date(currentWhisper.timestamp).toLocaleTimeString()}
              </div>
            </div>

            {/* 低语内容 */}
            <div className={`bg-black/50 p-3 rounded border-l-4 border-purple-500 ${
              glitchEffect ? 'animate-pulse' : ''
            }`}>
              <div className="text-sm text-purple-300 italic leading-relaxed">
                {currentWhisper.message}
              </div>
            </div>

            {/* 底部装饰 */}
            <div className="mt-3 flex justify-between items-center text-xs text-gray-600">
              <span>◊ 平行现实回声 ◊</span>
              <span className="font-mono">#{currentWhisper.id.toString().slice(-4)}</span>
            </div>
          </div>
        </CyberCard>
      </div>

      {/* 历史记录指示器 */}
      {whispers.length > 1 && (
        <div className="fixed bottom-4 right-4 z-40">
          <div className="bg-gray-800/90 rounded-full px-3 py-1 text-xs text-purple-400 border border-purple-600/50">
            <span className="animate-pulse">◊</span> {whispers.length - 1} 条历史信号
          </div>
        </div>
      )}

      {/* CSS动画样式 */}
      <style jsx>{`
        @keyframes glitch-scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
      `}</style>
    </>
  );
}

export default RiftWhisperDisplay;