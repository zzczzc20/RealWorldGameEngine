import React, { useState } from 'react';
import { publish } from '../services/EventService';
import CyberButton from './ui/CyberButton';
import CyberCard from './ui/CyberCard';

/**
 * 裂隙调谐器演示组件 - 用于测试和展示裂隙系统
 */
function RiftTunerDemo() {
  const [demoStep, setDemoStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const demoScenarios = [
    {
      title: "场景1: 任务选择后的裂隙",
      description: "模拟玩家接受任务后触发的现实裂隙",
      persona: "Echo_Alternate",
      difficulty: "medium",
      message: "在另一个选择中，这个任务会带来意想不到的后果..."
    },
    {
      title: "场景2: 拒绝帮助后的裂隙", 
      description: "模拟玩家拒绝帮助某人后的平行世界回声",
      persona: "AhMing_Alternate",
      difficulty: "hard",
      message: "如果你当时选择了帮助我...也许一切都不同了。"
    },
    {
      title: "场景3: 关键对话后的裂隙",
      description: "模拟重要对话后触发的AI人格分裂",
      persona: "Kiera_Alternate", 
      difficulty: "easy",
      message: "在我的世界里，你的话语改变了一切的走向。"
    },
    {
      title: "场景4: 系统异常裂隙",
      description: "模拟系统故障时出现的不稳定裂隙信号",
      persona: "System_Alternate",
      difficulty: "hard", 
      message: "错误：检测到时间线异常...你不应该在这里..."
    }
  ];

  /**
   * 触发演示裂隙
   */
  const triggerDemoRift = (scenario) => {
    console.log('[RiftTunerDemo] 触发演示裂隙:', scenario);
    
    // 发布裂隙检测事件
    publish('rift_detected', {
      riftId: `demo_${Date.now()}`,
      config: {
        targetPersona: scenario.persona,
        difficulty: scenario.difficulty,
        riftMessage: scenario.message,
        successThreshold: 70,
        alternateScenario: {
          description: scenario.description,
          consequences: "演示模式 - 无实际后果",
          mood: "mysterious"
        }
      },
      triggerStep: {
        stepId: 'demo_step',
        type: 'demo'
      },
      scriptId: 'rift_demo'
    });
  };

  /**
   * 直接触发裂隙低语（跳过游戏）
   */
  const triggerDirectWhisper = (scenario) => {
    console.log('[RiftTunerDemo] 直接触发裂隙低语:', scenario);
    
    // 直接发布裂隙低语事件
    publish('rift_whisper_received', {
      persona: scenario.persona,
      message: `[演示模式] ${scenario.message}`,
      score: 85,
      timestamp: Date.now()
    });
  };

  /**
   * 加载演示脚本
   */
  const loadDemoScript = () => {
    console.log('[RiftTunerDemo] 加载演示脚本');
    
    // 发布高优先级警报来加载演示脚本
    publish('high_priority_alert', {
      scriptId: 'rift_demo'
    });
  };

  /**
   * 重置演示
   */
  const resetDemo = () => {
    setDemoStep(0);
    console.log('[RiftTunerDemo] 演示已重置');
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-40">
        <CyberButton
          onClick={() => setIsVisible(true)}
          className="!bg-purple-600 hover:!bg-purple-500 !text-xs !px-3 !py-2"
        >
          裂隙演示
        </CyberButton>
      </div>
    );
  }

  return (
    <div className="fixed top-4 left-4 z-50 max-w-md">
      <CyberCard className="bg-gray-900/95 border-purple-600 backdrop-blur-sm">
        <div className="p-4">
          {/* 标题栏 */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-purple-400">
              裂隙调谐器演示
            </h3>
            <button 
              onClick={() => setIsVisible(false)}
              className="text-gray-500 hover:text-gray-300"
            >
              ✕
            </button>
          </div>

          {/* 说明文本 */}
          <div className="mb-4 text-sm text-gray-300">
            <p className="mb-2">
              这个演示展示了AI多重人格的现实裂隙机制。你可以：
            </p>
            <ul className="list-disc list-inside text-xs text-gray-400 space-y-1">
              <li>触发裂隙调谐器小游戏</li>
              <li>直接查看裂隙低语效果</li>
              <li>加载完整的演示脚本</li>
            </ul>
          </div>

          {/* 演示场景 */}
          <div className="space-y-3">
            {demoScenarios.map((scenario, index) => (
              <div key={index} className="bg-gray-800/50 p-3 rounded border border-gray-700">
                <div className="text-sm font-medium text-cyan-300 mb-1">
                  {scenario.title}
                </div>
                <div className="text-xs text-gray-400 mb-2">
                  {scenario.description}
                </div>
                <div className="flex space-x-2">
                  <CyberButton
                    onClick={() => triggerDemoRift(scenario)}
                    className="!text-xs !px-2 !py-1 !bg-purple-600 hover:!bg-purple-500"
                  >
                    触发裂隙
                  </CyberButton>
                  <CyberButton
                    onClick={() => triggerDirectWhisper(scenario)}
                    className="!text-xs !px-2 !py-1 !bg-cyan-600 hover:!bg-cyan-500"
                  >
                    直接低语
                  </CyberButton>
                </div>
              </div>
            ))}
          </div>

          {/* 控制按钮 */}
          <div className="mt-4 space-y-2">
            <CyberButton
              onClick={loadDemoScript}
              className="w-full !bg-green-600 hover:!bg-green-500"
            >
              加载完整演示脚本
            </CyberButton>
            
            <div className="flex space-x-2">
              <CyberButton
                onClick={resetDemo}
                className="flex-1 !bg-gray-600 hover:!bg-gray-500 !text-xs"
              >
                重置演示
              </CyberButton>
              <CyberButton
                onClick={() => setIsVisible(false)}
                className="flex-1 !bg-red-600 hover:!bg-red-500 !text-xs"
              >
                关闭面板
              </CyberButton>
            </div>
          </div>

          {/* 状态信息 */}
          <div className="mt-3 pt-3 border-t border-gray-700">
            <div className="text-xs text-gray-500 font-mono">
              演示步骤: {demoStep + 1}/{demoScenarios.length + 1}
              <br />
              系统状态: 就绪
            </div>
          </div>
        </div>
      </CyberCard>
    </div>
  );
}

export default RiftTunerDemo;