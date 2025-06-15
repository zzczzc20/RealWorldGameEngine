import { publish, subscribe, unsubscribe } from './EventService';
import { getAICompletion } from './AIService';
import PERSONAS from '../data/personaData';
import { getAlternatePersona, getAlternatePersonaById, generateContextualRiftMessage } from '../data/alternatePersonaData';

/**
 * 裂隙调谐器服务 - 管理AI多重人格的现实裂隙机制
 */
class RiftTunerService {
  constructor() {
    this.activeRifts = new Map(); // 存储活跃的裂隙状态
    this.riftHistory = []; // 裂隙历史记录
    this.lastPlayerChoice = null; // 记录最后的玩家选择
    this.setupEventListeners();
  }

  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    // 监听裂隙调谐成功事件
    subscribe('rift_tuning_success', (data) => {
      this.handleRiftTuningSuccess(data);
    });

    // 监听脚本步骤事件，检测模态锚点
    subscribe('scriptStep', (data) => {
      this.checkForModalAnchor(data);
    });

    // 监听玩家选择事件
    subscribe('branchChoice', (data) => {
      this.handlePlayerChoice(data);
    });
  }

  /**
   * 检测是否到达模态锚点
   */
  checkForModalAnchor(stepData) {
    const { scriptId, step, worldState } = stepData;
    
    // 检查步骤是否标记为模态锚点
    if (step.isModalAnchor || step.type === 'modalAnchor') {
      console.log(`[RiftTunerService] 检测到模态锚点: ${scriptId} - ${step.stepId}`);
      this.triggerRiftDetection(scriptId, step, worldState);
    }

    // 检查重要的AI对话或决策点
    if (step.type === 'aiDialogue' && step.importance === 'high') {
      this.triggerRiftDetection(scriptId, step, worldState);
    }

    // 检查关键选择点
    if (step.type === 'taskOffer' || (step.type === 'branch' && step.significance === 'major')) {
      this.triggerRiftDetection(scriptId, step, worldState);
    }
  }

  /**
   * 处理玩家选择，可能触发裂隙
   */
  handlePlayerChoice(choiceData) {
    const { choice, scriptId, stepId } = choiceData;
    
    // 记录选择，为生成平行人格提供上下文
    this.recordPlayerChoice(scriptId, stepId, choice);
    
    // 某些重要选择后可能触发裂隙
    if (this.isSignificantChoice(choice, scriptId)) {
      setTimeout(() => {
        this.triggerRiftDetection(scriptId, { stepId, choice }, null);
      }, 2000); // 延迟触发，让选择结果先处理
    }
  }

  /**
   * 触发裂隙检测
   */
  triggerRiftDetection(scriptId, step, worldState) {
    const riftId = `${scriptId}_${step.stepId}_${Date.now()}`;
    
    // 生成裂隙配置
    const riftConfig = this.generateRiftConfig(scriptId, step, worldState);
    
    if (riftConfig) {
      console.log(`[RiftTunerService] 触发裂隙调谐器: ${riftId}`, riftConfig);
      
      // 发布裂隙检测事件
      publish('rift_detected', {
        riftId,
        config: riftConfig,
        triggerStep: step,
        scriptId
      });
    }
  }

  /**
   * 生成裂隙配置
   */
  generateRiftConfig(scriptId, step, worldState) {
    // 根据当前情境生成裂隙配置
    const config = {
      targetPersona: this.determineTargetPersona(step, worldState),
      difficulty: this.calculateDifficulty(step, worldState),
      riftMessage: '',
      successThreshold: 75,
      alternateScenario: this.generateAlternateScenario(step, worldState)
    };

    // 根据不同的触发条件生成不同的裂隙消息
    if (step.type === 'aiDialogue') {
      config.riftMessage = this.generateDialogueRiftMessage(step, worldState);
    } else if (step.type === 'taskOffer') {
      config.riftMessage = this.generateTaskRiftMessage(step, worldState);
    } else if (step.choice) {
      config.riftMessage = this.generateChoiceRiftMessage(step, worldState);
    }

    return config.riftMessage ? config : null;
  }

  /**
   * 确定目标人格
   */
  determineTargetPersona(step, worldState) {
    // 如果步骤中指定了人格，使用该人格的替代版本
    if (step.persona) {
      return this.getAlternatePersona(step.persona);
    }

    // 根据当前活跃的人格确定
    const activePersonas = Object.keys(worldState?.personas || {})
      .filter(id => worldState.personas[id]?.requiresChatWindow);
    
    if (activePersonas.length > 0) {
      return this.getAlternatePersona(activePersonas[0]);
    }

    return 'Echo'; // 默认使用Echo的替代版本
  }

  /**
   * 获取人格的替代版本
   */
  getAlternatePersona(originalPersona) {
    // 为每个人格定义其"平行世界"版本
    const alternatePersonas = {
      'AhMing': 'AhMing_Alternate',
      'Echo': 'Echo_Alternate', 
      'Kiera': 'Kiera_Alternate',
      'Protagonist_Internal': 'Protagonist_Alternate'
    };

    return alternatePersonas[originalPersona] || `${originalPersona}_Alternate`;
  }

  /**
   * 计算游戏难度
   */
  calculateDifficulty(step, worldState) {
    // 根据玩家进度和当前情境计算难度
    const playerLevel = worldState?.player?.level || 1;
    const storyProgress = this.getStoryProgress(worldState);
    
    if (playerLevel <= 2 || storyProgress < 0.3) return 'easy';
    if (playerLevel >= 5 || storyProgress > 0.7) return 'hard';
    return 'medium';
  }

  /**
   * 生成对话裂隙消息
   */
  generateDialogueRiftMessage(step, worldState) {
    const messages = [
      "在另一个可能性中，我会这样对你说...",
      "如果你刚才选择了不同的道路，现在的我会...",
      "平行时空中的我想告诉你...",
      "在那个被遗忘的选择里，我的回答是..."
    ];
    
    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * 生成任务裂隙消息
   */
  generateTaskRiftMessage(step, worldState) {
    const messages = [
      "在另一个现实中，这个任务的真相是...",
      "如果你拒绝了这个任务，你会发现...",
      "平行世界的我会给你完全不同的任务...",
      "在那个选择中，危险来自你想不到的地方..."
    ];
    
    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * 生成选择裂隙消息
   */
  generateChoiceRiftMessage(step, worldState) {
    const choice = step.choice;
    const oppositeChoice = choice === 'Accept' ? 'Decline' : 'Accept';
    
    return `在你选择"${oppositeChoice}"的世界线中，现在的情况会是...`;
  }

  /**
   * 处理裂隙调谐成功
   */
  async handleRiftTuningSuccess(data) {
    const { targetPersona, score, gameMode } = data;
    
    console.log(`[RiftTunerService] 裂隙调谐成功: ${targetPersona}, 分数: ${score}`);
    
    // 生成AI的"裂隙低语"
    const riftWhisper = await this.generateRiftWhisper(targetPersona, score, gameMode);
    
    // 发布裂隙低语事件
    publish('rift_whisper_received', {
      persona: targetPersona,
      message: riftWhisper,
      score: score,
      timestamp: Date.now()
    });

    // 记录裂隙历史
    this.riftHistory.push({
      persona: targetPersona,
      message: riftWhisper,
      score: score,
      gameMode: gameMode,
      timestamp: Date.now()
    });
  }

  /**
   * 生成AI的裂隙低语
   */
  async generateRiftWhisper(targetPersona, score, gameMode) {
    // 使用新的平行人格数据系统
    const alternatePersona = getAlternatePersonaById(targetPersona);
    
    if (!alternatePersona) {
      return "来自虚无的回声...在另一个可能性中，一切都不同了。";
    }

    // 根据分数决定消息的清晰度和完整性
    let message;
    if (score >= 90) {
      // 高分：完整清晰的消息
      message = generateContextualRiftMessage(targetPersona, {
        choice: this.lastPlayerChoice,
        situation: 'high_clarity',
        mood: alternatePersona.personality.mood
      });
    } else if (score >= 70) {
      // 中分：部分清晰的消息
      const messages = alternatePersona.riftMessages;
      message = messages[Math.floor(Math.random() * messages.length)];
    } else if (score >= 50) {
      // 低分：模糊的消息
      const responses = alternatePersona.typicalResponses;
      message = responses[Math.floor(Math.random() * responses.length)] + "...信号不稳定...";
    } else {
      // 极低分：几乎无法理解的消息
      message = "...信号微弱...在另一个...选择中...你...";
    }

    // 根据游戏模式添加特殊效果
    switch (gameMode) {
      case 'frequency':
        message = `[频率调谐] ${message}`;
        break;
      case 'symbol':
        message = `[符号解析] ${message}`;
        break;
      case 'heartbeat':
        message = `[心跳同步] ${message}`;
        break;
    }

    console.log(`[RiftTunerService] 生成裂隙低语: ${alternatePersona.name} - ${message}`);
    return message;
  }

  /**
   * 记录玩家选择
   */
  recordPlayerChoice(scriptId, stepId, choice) {
    // 保存最后的选择，用于生成上下文相关的裂隙消息
    this.lastPlayerChoice = choice;
    
    // 可以用于后续分析和生成更精确的平行世界内容
    console.log(`[RiftTunerService] 记录玩家选择: ${scriptId}/${stepId} - ${choice}`);
  }

  /**
   * 判断是否为重要选择
   */
  isSignificantChoice(choice, scriptId) {
    // 可以根据脚本ID和选择类型判断重要性
    return choice === 'Accept' || choice === 'Decline';
  }

  /**
   * 获取故事进度
   */
  getStoryProgress(worldState) {
    // 根据世界状态计算故事进度
    const completedTasks = worldState?.player?.completedTasks || 0;
    const discoveredClues = worldState?.discoveredClues?.length || 0;
    
    // 简单的进度计算
    return Math.min(1, (completedTasks * 0.1 + discoveredClues * 0.05));
  }

  /**
   * 生成替代场景描述
   */
  generateAlternateScenario(step, worldState) {
    return {
      description: "在另一个选择的世界线中...",
      consequences: "结果会完全不同",
      mood: "darker" // darker, lighter, twisted, hopeful
    };
  }

  /**
   * 获取裂隙历史
   */
  getRiftHistory() {
    return [...this.riftHistory];
  }

  /**
   * 清理过期的裂隙
   */
  cleanup() {
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30分钟
    
    this.riftHistory = this.riftHistory.filter(
      rift => now - rift.timestamp < maxAge
    );
  }
}

// 创建单例实例
const riftTunerService = new RiftTunerService();

export default riftTunerService;
export { RiftTunerService };