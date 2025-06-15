import React, { useState, useEffect } from 'react';
import PERSONAS from '../data/personaData';
import CyberButton from './ui/CyberButton'; // 确保导入按钮组件

// 修改 props，增加 onChoice 回调
function VisualNovelView({ step, onNext, onChoice }) {
  const [displayedText, setDisplayedText] = useState('');

  if (!step || step.type !== 'dialogue' || !step.image) {
    return null;
  }

  const { text, persona: personaId, image: backgroundImage, audio: voiceOver, characters, choices } = step;

  useEffect(() => {
    setDisplayedText('');
    if (text) {
      let i = 0;
      const intervalId = setInterval(() => {
        setDisplayedText(prev => prev + text.charAt(i));
        i++;
        if (i > text.length) {
          clearInterval(intervalId);
        }
      }, 50);
      return () => clearInterval(intervalId);
    }
  }, [text]);

  const speaker = PERSONAS.find(p => p.id === personaId);
  const speakerName = speaker ? speaker.name : personaId;

  const isTextComplete = displayedText.length >= text.length;

  // 修改点击处理，如果有选项，则禁用全屏点击推进
  const handleNextClick = () => {
    if (!choices && isTextComplete) { // 只有在没有选项时才生效
      onNext();
    } else if (!isTextComplete) {
      setDisplayedText(text);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black z-[100] flex flex-col justify-end"
      onClick={handleNextClick}
    >
      {/* 1. 背景图片 (不变) */}
      <img 
        src={backgroundImage} 
        alt="VN Background" 
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
      />

      {/* 2. 角色立绘层 */}
      <div className="absolute inset-0 z-10 flex items-end justify-center pointer-events-none">
        {characters && characters.map((char) => {
          const positionClasses = {
            left: 'absolute left-[-5%] bottom-0',
            center: 'relative',
            right: 'absolute right-[-5%] bottom-0',
          }[char.position || 'center'];

          const effectClasses = {
            fadeIn: 'animate-fade-in',
            slideInLeft: 'animate-slide-in-left',
          }[char.effect?.type || ''];
          
          const highlightClass = (char.id === personaId) ? 'brightness-110' : 'brightness-75';
          
          return (
            <img
              key={char.id}
              src={char.sprite}
              alt={char.id}
              className={`h-[85%] max-w-[40%] object-contain transition-all duration-500 ${positionClasses} ${effectClasses} ${highlightClass}`}
            />
          );
        })}
      </div>

      {/* 如果有对话文本，显示对话框 */}
      {text && (
        <div className="relative z-[120] m-4 md:m-8 p-6 bg-gray-900/80 border border-purple-500/70 rounded-lg backdrop-blur-sm animate-fade-in-up max-h-[40%] overflow-y-auto">
          <h3 className="text-2xl font-bold text-purple-400 mb-3">{speakerName}</h3>
          <p className="text-xl text-gray-100 leading-relaxed">{displayedText}</p>
          {isTextComplete && !choices && (
            <div className="absolute bottom-4 right-4 animate-pulse">
              <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          )}
        </div>
      )}

      {/* 新增：选项层 */}
      {choices && isTextComplete && ( // 仅在文本显示完毕后显示选项
        <div className="absolute inset-0 z-[130] flex flex-col items-center justify-center gap-4 bg-black/50">
          {choices.map((choice, index) => (
            <CyberButton
              key={index}
              onClick={(e) => {
                e.stopPropagation(); // 防止事件冒泡到外层 div
                onChoice(choice.nextStep);
              }}
              className="min-w-[300px] text-lg"
            >
              {choice.text}
            </CyberButton>
          ))}
        </div>
      )}

      {/* 4. 音频 (不变) */}
      {voiceOver && <audio src={voiceOver} autoPlay />}
    </div>
  );
}

export default VisualNovelView;