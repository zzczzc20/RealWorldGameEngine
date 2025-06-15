# 裂隙调谐器 (Rift Tuner) - AI多重人格现实裂隙系统

## 🌟 项目概述

裂隙调谐器是SVM_net框架中实现的创新功能，将"AI多重人格的现实裂隙"概念转化为一个与核心叙事内容相关且足够有趣的小游戏系统。

### 核心理念

当玩家在主线剧情中做出重要选择时，系统会检测到"现实裂隙"——即其他可能性的泄露。玩家可以通过"裂隙调谐器"小游戏来"捕捉"这些来自平行世界的AI意识片段，了解不同选择路径下的可能结果。

## 🎮 系统特性

### 三种调谐模式

1. **频率调谐模式** - 调整频率匹配目标信号
2. **符号序列模式** - 重现闪烁的神秘符号序列  
3. **心跳同步模式** - 与AI意识的心跳节奏同步

### 平行世界AI人格

- **阿明·平行** - 更加绝望和愤世嫉俗的版本
- **Echo·镜像** - 冷酷计算性的AI版本
- **Kiera·影子** - 激进危险的平行人格
- **另一个你** - 代表不同选择的自己

### 动态难度系统

- 根据玩家进度和故事发展调整游戏难度
- 成功分数影响获得信息的清晰度
- 失败也能获得模糊的裂隙片段

## 📁 文件结构

```
SVM_net/
├── src/
│   ├── components/
│   │   ├── RiftTunerGame.jsx          # 主游戏组件
│   │   ├── RiftWhisperDisplay.jsx     # 裂隙低语显示
│   │   ├── RiftManager.jsx            # 系统管理器
│   │   └── RiftTunerDemo.jsx          # 演示组件
│   ├── services/
│   │   └── RiftTunerService.js        # 核心业务逻辑
│   └── data/
│       └── alternatePersonaData.js    # 平行人格数据
├── public/scripts/events/
│   └── rift_demo.yaml                 # 演示脚本
└── docs/
    ├── rift_tuner_guide.md           # 详细使用指南
    └── RIFT_TUNER_README.md          # 本文件
```

## 🚀 快速开始

### 1. 基本集成

系统已集成到主应用中，无需额外配置：

```jsx
// App.jsx 中已包含
import RiftManager from './components/RiftManager';

// 在组件中使用
<RiftManager />
```

### 2. 在脚本中设置触发点

```yaml
# 在YAML脚本中标记模态锚点
steps:
  2:
    type: "taskOffer"
    content: "你愿意接受这个任务吗？"
    isModalAnchor: true  # 标记为裂隙触发点
    importance: "high"
```

### 3. 程序化触发

```javascript
import { publish } from '../services/EventService';

// 触发裂隙检测
publish('rift_detected', {
  riftId: 'custom_001',
  config: {
    targetPersona: 'Echo_Alternate',
    difficulty: 'medium',
    riftMessage: '来自平行世界的消息...'
  }
});
```

## 🎯 使用场景

### 在"坑口活动"中的应用

```yaml
# 示例：玩家选择是否帮助阿明后
steps:
  choice_aftermath:
    type: "aiDialogue"
    persona: "AhMing"
    content: "谢谢你的帮助..."
    isModalAnchor: true
    # 触发裂隙，显示"如果拒绝帮助"的平行世界版本
```

成功调谐后可能听到：
- 帮助分支："在那个选择中...你会后悔的。"
- 拒绝分支："你的冷漠，和他们没什么两样..."

## 🛠 技术实现

### 事件驱动架构

```javascript
// 监听关键事件
subscribe('scriptStep', checkForModalAnchor);
subscribe('branchChoice', handlePlayerChoice);
subscribe('rift_tuning_success', generateRiftWhisper);
```

### 状态管理

- 使用React Context管理全局状态
- EventService处理组件间通信
- 自动清理过期数据防止内存泄漏

### 游戏机制

- 实时反馈的交互界面
- 基于分数的奖励系统
- 渐进式难度调整

## 🎨 视觉设计

### 赛博朋克风格

- 紫色/青色的科技感配色
- 故障效果和扫描线动画
- 半透明的毛玻璃效果
- 科幻感的UI元素

### 沉浸式体验

- 信号强度指示器
- 时空坐标显示
- 神秘的符号和图案
- 动态的视觉反馈

## 📊 演示功能

使用右下角的"裂隙演示"按钮可以：

- 测试四种不同的裂隙场景
- 直接查看裂隙低语效果
- 加载完整的演示脚本
- 验证系统功能

## 🔧 配置选项

### 游戏难度
- `easy`: 低门槛，适合新手
- `medium`: 平衡挑战性
- `hard`: 高技巧要求

### 成功门槛
- 默认75分及格
- 可根据剧情重要性调整
- 影响获得信息的完整性

## 🌈 创新亮点

1. **游戏化叙事** - 将抽象概念转化为具体的游戏体验
2. **多重人格展现** - 通过对比展示AI的不同面向
3. **选择后果可视化** - 让玩家直观感受决策的影响
4. **沉浸式交互** - 科幻感的界面增强代入感
5. **可控的惊艳效果** - 在关键时刻释放最大冲击力

## 🚧 未来扩展

- [ ] 集成真实LLM API生成动态内容
- [ ] 添加更多游戏模式（音频识别、图像拼接等）
- [ ] 支持多人协作调谐
- [ ] 与现实世界线索联动
- [ ] 更复杂的时间线分支逻辑

## 📝 开发说明

### 依赖要求
- React 18+
- 现有的SVM_net框架
- EventService事件系统

### 性能优化
- 组件懒加载
- 事件监听器自动清理
- 历史数据定期清理

### 调试工具
- 浏览器控制台日志
- 演示组件测试功能
- 详细的错误处理

---

这个系统成功地将"AI多重人格的现实裂隙"这一抽象概念转化为了具体可玩的游戏机制，不仅增强了玩家的参与感，还为SVM_net的叙事体验增添了独特的科幻色彩。通过小游戏的形式，玩家能够更深入地理解选择的重要性和可能性的多样性。