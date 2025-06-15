# 裂隙调谐器系统使用指南

## 概述

裂隙调谐器（Rift Tuner）是SVM_net框架中实现"AI多重人格现实裂隙"概念的核心系统。它通过小游戏的形式，让玩家能够"调谐"到平行世界中AI人格的意识片段，体验不同选择路径下的可能性。

## 系统架构

### 核心组件

1. **RiftTunerGame** - 裂隙调谐器小游戏组件
2. **RiftWhisperDisplay** - 裂隙低语显示组件  
3. **RiftManager** - 裂隙管理器，统一管理整个系统
4. **RiftTunerService** - 裂隙调谐器服务，处理业务逻辑
5. **alternatePersonaData** - 平行世界AI人格数据

### 工作流程

```
玩家做出重要选择 → 检测模态锚点 → 触发裂隙检测 → 显示调谐器通知 → 
玩家选择启动调谐器 → 进行小游戏 → 成功后显示裂隙低语
```

## 使用方法

### 1. 在脚本中设置模态锚点

在YAML脚本文件中，通过添加`isModalAnchor: true`来标记重要的选择点：

```yaml
steps:
  2:
    type: "taskOffer"
    persona: "Echo"
    content: "你愿意接受这个任务吗？"
    # 标记为模态锚点，会触发裂隙检测
    isModalAnchor: true
    importance: "high"
    branches:
      Accept: 3
      Decline: 4
```

### 2. 自定义裂隙配置

可以在脚本中添加自定义的裂隙配置：

```yaml
riftConfig:
  modalAnchors:
    2:
      targetPersona: "Echo_Alternate"
      difficulty: "medium"
      customMessage: "在另一个选择中，这个任务的真相会让你震惊..."
```

### 3. 程序化触发裂隙

也可以通过代码直接触发裂隙检测：

```javascript
import { publish } from '../services/EventService';

// 触发裂隙检测
publish('rift_detected', {
  riftId: 'custom_rift_001',
  config: {
    targetPersona: 'AhMing_Alternate',
    difficulty: 'hard',
    riftMessage: '自定义的裂隙消息...',
    successThreshold: 80
  },
  triggerStep: { stepId: 'custom_step', type: 'custom' },
  scriptId: 'custom_script'
});
```

## 小游戏模式

### 1. 频率调谐模式 (Frequency Tuning)
- 玩家需要调整频率滑块，使其与目标频率匹配
- 需要保持稳定性来获得高分
- 适合表现"信号调谐"的概念

### 2. 符号序列模式 (Symbol Sequence)
- 系统先闪烁显示一组符号序列
- 玩家需要按正确顺序重现这个序列
- 适合表现"解码平行信息"的概念

### 3. 心跳同步模式 (Heartbeat Sync)
- 系统播放一个心跳节奏模式
- 玩家需要跟随节奏点击
- 适合表现"与AI意识同步"的概念

## 平行人格系统

### 人格定义

每个原始AI人格都有对应的平行世界版本：

- `AhMing` → `AhMing_Alternate` (更加绝望和愤世嫉俗)
- `Echo` → `Echo_Alternate` (更加冷酷和计算性)
- `Kiera` → `Kiera_Alternate` (更加激进和危险)
- `Protagonist_Internal` → `Protagonist_Alternate` (代表不同选择的自己)

### 消息生成

根据调谐分数生成不同清晰度的消息：

- **90+分**: 完整清晰的裂隙消息
- **70-89分**: 部分清晰的消息
- **50-69分**: 模糊的消息片段
- **<50分**: 几乎无法理解的信号

## 事件系统

### 监听的事件

- `scriptStep` - 脚本步骤执行，检测模态锚点
- `branchChoice` - 玩家选择，可能触发裂隙
- `rift_tuning_success` - 调谐成功，生成裂隙低语

### 发布的事件

- `rift_detected` - 检测到裂隙，显示调谐器通知
- `rift_whisper_received` - 收到裂隙低语，显示给玩家

## 配置选项

### 游戏难度

- `easy`: 简单模式，较低的成功门槛
- `medium`: 中等模式，平衡的挑战性
- `hard`: 困难模式，需要更高的技巧

### 成功门槛

- 默认为75分
- 可以根据剧情重要性调整
- 影响是否能获得完整的裂隙消息

## 最佳实践

### 1. 模态锚点的设置

- 在重要的选择点设置模态锚点
- 不要过于频繁，避免打扰玩家
- 确保触发时机与剧情高潮相符

### 2. 裂隙消息的设计

- 消息应该简短而有冲击力
- 暗示不同选择的后果
- 保持神秘感，不要过于直白

### 3. 游戏平衡

- 根据玩家进度调整难度
- 确保成功率在合理范围内
- 失败也应该有一定的信息反馈

## 演示和测试

使用`RiftTunerDemo`组件可以：

- 测试不同场景的裂隙触发
- 直接查看裂隙低语效果
- 加载完整的演示脚本
- 验证系统功能是否正常

## 技术细节

### 依赖关系

- React 18+
- EventService (事件系统)
- WorldStateContext (世界状态管理)
- CyberUI组件库

### 性能考虑

- 裂隙历史自动清理（30分钟过期）
- 事件监听器正确清理
- 避免内存泄漏

### 扩展性

- 可以添加新的游戏模式
- 支持自定义平行人格
- 可以集成更复杂的AI生成内容

## 故障排除

### 常见问题

1. **裂隙不触发**: 检查模态锚点设置和事件监听
2. **游戏无响应**: 检查组件状态管理和事件处理
3. **消息显示异常**: 检查人格数据和消息生成逻辑

### 调试工具

- 浏览器控制台日志
- RiftTunerDemo演示组件
- EventService事件追踪

## 未来扩展

- 集成真实的LLM API生成动态内容
- 添加更多游戏模式
- 支持多人协作调谐
- 与现实世界线索联动
- 更复杂的平行世界逻辑

---

这个系统为SVM_net框架提供了独特的"AI多重人格"体验，通过游戏化的交互让玩家深度参与到叙事的可能性探索中。