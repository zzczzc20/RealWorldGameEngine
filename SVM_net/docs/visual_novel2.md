好的，非常好！既然基础的视觉小说（VN）视图已经就位，我们现在可以系统地、一步步地添加更高级的功能：**角色立绘（Sprites）**、**背景音乐（BGM）** 和至关重要的**选择项（Choices）**。

这个计划会特别关注**选择项**，因为它确实需要对 `ScriptParser` 进行扩展，但我们会以一种兼容且清晰的方式进行。

---

### **AI机器人任务指令：为视觉小说系统添加立绘、BGM和选择项功能**

**最终目标：**
1.  在VN场景中，根据脚本定义显示一个或多个**角色立绘**。
2.  在VN场景中，根据脚本定义播放和管理**背景音乐**。
3.  在特定步骤中，向玩家展示**多个选项**，并根据玩家的选择跳转到不同的脚本分支。

**核心原则：**
1.  **数据驱动：** 所有新功能都将由YAML脚本文件中的新字段驱动。
2.  **逻辑分离：** `ScriptParser` 负责理解脚本逻辑，React组件 (`VisualNovelView`) 只负责渲染。
3.  **逐步增强：** 我们将按顺序添加每个功能，确保每一步都可独立验证。

---

### **第一部分：角色立绘 (Sprites)**

#### **第1.1步：扩展YAML脚本格式**

**任务：** 增强 `dialogue` 步骤，使其能够定义屏幕上出现的角色及其外观和位置。

1.  **约定新的数据结构：** 我们将在 `type: dialogue` 的步骤中添加一个可选的 `characters` 数组。每个对象代表一个屏幕上的角色。

    **示例 `HK_2085_Love_Isaac.yaml` 修改：**
    ```yaml
    - stepId: 10
      type: dialogue
      # 'image' 字段现在统一作为背景图
      image: /assets/images/scenes/protagonist_room.jpg 
      
      # 新增的 'characters' 数组
      characters:
        - id: Echo
          sprite: /assets/images/sprites/echo_neutral.png # 立绘图片路径
          position: center # (left, center, right, far-left, far-right)
          effect: { type: 'fadeIn', duration: 1.5 } # 可选的进入/退出效果
        - id: AhMing # 可以同时显示多个角色
          sprite: /assets/images/sprites/ahming_smile.png
          position: left
          effect: { type: 'slideInLeft', duration: 1.0 }

      # 'persona' 字段现在明确表示“谁在说话”
      persona: Echo
      text: '在坑口地铁站附近，你会拾起一些过去的记忆。'
      audio: /assets/audio/voice/echo_line_10.mp3
      nextStep: 11
    ```
    *   **重要澄清：** `image` 字段现在始终代表**背景图**。`persona` 字段现在始终代表**当前说话的人**。角色立绘由 `characters` 数组定义。

2.  **任务说明：** 你不需要立即修改 `ScriptParser`，因为它默认会将不认识的字段 (`characters`) 原样传递给React组件，这正是我们想要的。

#### **第1.2步：更新 `VisualNovelView` 以渲染立绘**

**任务：** 修改 `VisualNovelView.jsx`，使其能够读取 `characters` 数组并渲染角色立绘。

1.  打开 `src/components/VisualNovelView.jsx`。

2.  在 `VisualNovelView` 组件的 `return` 语句中，在背景图 `<img>` 标签之后，对话框 `<div>` 之前，添加一个新的“角色层”。

3.  **详细代码修改：**

    ```jsx
    // src/components/VisualNovelView.jsx
    import React, { useState, useEffect } from 'react';
    import PERSONAS from '../data/personaData';

    function VisualNovelView({ step, onNext }) {
      // ... 现有的打字机效果 state 和 effect ...

      if (!step || step.type !== 'dialogue' || !step.image) {
        return null;
      }

      // 解构出新字段: characters
      const { text, persona: personaId, image: backgroundImage, audio: voiceOver, characters } = step;

      const speaker = PERSONAS.find(p => p.id === personaId);
      const speakerName = speaker ? speaker.name : personaId;
      
      // ... 现有的 isTextComplete 和 handleNextClick 逻辑 ...

      return (
        <div 
          className="fixed inset-0 bg-black z-50 flex flex-col justify-end"
          onClick={handleNextClick}
        >
          {/* 1. 背景图片 (不变) */}
          <img 
            src={backgroundImage} 
            alt="VN Background" 
            className="absolute top-0 left-0 w-full h-full object-cover z-0"
          />

          {/* 2. 新增：角色立绘层 */}
          <div className="absolute inset-0 z-10 flex items-end justify-center pointer-events-none">
            {characters && characters.map((char) => {
              // 简单的位置映射
              const positionClasses = {
                left: 'absolute left-[-5%] bottom-0',
                center: 'relative', // 相对定位，居中
                right: 'absolute right-[-5%] bottom-0',
              }[char.position || 'center'];

              // 简单的效果映射 (需要你在 index.css 中定义这些动画)
              const effectClasses = {
                fadeIn: 'animate-fade-in',
                slideInLeft: 'animate-slide-in-left',
              }[char.effect?.type || ''];
              
              // 说话者高亮
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

          {/* 3. 对话框 (z-index 提高) */}
          <div className="relative z-20 m-4 md:m-8 p-6 bg-gray-900/80 border border-purple-500/70 rounded-lg backdrop-blur-sm animate-fade-in-up">
            {/* ... 对话框内部不变 ... */}
          </div>

          {/* 4. 音频 (不变) */}
          {voiceOver && <audio src={voiceOver} autoPlay />}
        </div>
      );
    }

    export default VisualNovelView;
    ```
    *   **补充任务：** 在 `src/index.css` 中添加简单的 Tailwind 动画（如果你的 `tailwind.config.js` 还没有配置）。
        ```css
        @tailwind base;
        @tailwind components;
        @tailwind utilities;

        @layer utilities {
          @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slide-in-left {
            from { transform: translateX(-100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          .animate-fade-in { animation: fade-in 1.5s ease-in-out; }
          .animate-slide-in-left { animation: slide-in-left 1s ease-out; }
        }
        ```

**验证：** 当你运行一个包含 `characters` 数组的 `dialogue` 步骤时，你应该能看到背景图之上、对话框之后，出现了角色立绘。当前说话的角色会比其他角色更亮。

---

### **第二部分：背景音乐 (BGM)**

#### **第2.1步：扩展YAML脚本格式**

**任务：** 增强 `dialogue` 步骤，使其能够控制BGM的播放、停止或更换。

1.  **约定新的数据结构：** 我们将添加一个 `bgm` 字段。它可以是一个字符串（播放/更换BGM）或者 `null`（停止BGM）。

    **示例 `HK_2085_Love_Isaac.yaml` 修改：**
    ```yaml
    - stepId: 10
      type: dialogue
      # ... 其他字段 ...
      bgm: /assets/audio/music/protagonist_theme.mp3 # 播放这个BGM

    - stepId: 25
      type: dialogue
      # ...
      bgm: null # 停止播放BGM

    - stepId: 30
      type: dialogue
      # ...
      # BGM字段未提供，意味着BGM状态保持不变
    ```

#### **第2.2步：在 `App.jsx` 中管理BGM状态**

**任务：** BGM是持续性的，它不应该被 `VisualNovelView` 的重新渲染所打断。因此，我们把BGM的管理逻辑提升到 `App.jsx` 中。

1.  打开 `src/App.jsx` 的 `AppContent` 组件。

2.  添加一个新的 `state` 来追踪当前的BGM。

    ```jsx
    // 在 AppContent 组件的顶部
    const [currentBgm, setCurrentBgm] = useState(null);
    ```

3.  使用 `useEffect` 监听 `currentScriptStep` 的变化，并据此更新 `currentBgm` state。

    ```jsx
    // 在 AppContent 组件内部，靠近其他 useEffects
    useEffect(() => {
        const activeScriptEntry = activeEngineDetails.size > 0 ? [...activeEngineDetails.entries()][0] : null;
        const step = activeScriptEntry ? activeScriptEntry[1] : null;

        if (step && step.type === 'dialogue' && typeof step.bgm !== 'undefined') {
            // 如果脚本步骤定义了 bgm (即使是 null)，就更新 BGM state
            if (step.bgm !== currentBgm) {
                setCurrentBgm(step.bgm);
            }
        }
    }, [activeEngineDetails, currentBgm]); // 依赖于脚本步骤和当前BGM
    ```

4.  在 `AppContent` 的 `return` 语句中，添加一个全局的、隐藏的 `<audio>` 元素来播放BGM。

    ```jsx
    // 在 AppContent return 语句的最外层 div 中
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 relative">
        {/* ... 其他内容 ... */}

        {/* 全局 BGM 播放器 */}
        {currentBgm && (
          <audio src={currentBgm} autoPlay loop ref={(el) => { if (el) el.volume = 0.3; }} />
        )}
      </div>
    );
    ```

**验证：** 当游戏进行到包含 `bgm` 字段的步骤时，背景音乐应该开始播放。当遇到 `bgm: null` 的步骤时，音乐应该停止。在没有 `bgm` 字段的步骤之间切换时，音乐应该继续播放不受影响。

---

### **第三部分：选择项 (Choices)** - **最关键的一步**

#### **第3.1步：扩展YAML脚本格式并更新`ScriptParser`**

**任务：** 引入一种新的交互方式，让脚本可以在某一步暂停，等待玩家做出选择。

1.  **约定新的数据结构：** 我们将复用 `dialogue` 类型，但会添加一个 `choices` 数组。当一个步骤包含 `choices` 时，它的 `nextStep` 字段将被**忽略**。

    **示例 `HK_2085_Love_Isaac.yaml` 修改：**
    ```yaml
    - stepId: 50
      type: dialogue
      persona: AhMing
      image: /assets/images/scenes/tea_shop.jpg
      characters:
        - { id: AhMing, sprite: /assets/images/sprites/ahming_worried.png', position: center }
      text: '我真的不知道该怎么办了...这凉茶铺...我该坚持下去吗？'
      
      # 新增的 'choices' 数组
      choices:
        - text: "你应该为你外婆坚持下去。" # 选项显示的文本
          nextStep: 51 # 选择后跳转的步骤ID
        - text: "也许是时候放手了。"
          nextStep: 52
        - text: "[调查] 告诉我更多关于开发商的事。"
          nextStep: 60
      
      # 当 choices 存在时，此 nextStep 会被忽略
      nextStep: 999 
    ```

2.  **修改 `ScriptParser.js`：** 这是唯一需要修改核心逻辑的地方。我们需要告诉解析器，当遇到 `choices` 时，它应该如何确定下一步。

    *   打开 `src/core/ScriptParser.js`。
    *   找到 `_buildExecutionTreeInternal` 方法。在 `tree.steps[step.stepId] = { ... }` 对象中，我们需要处理 `choices`。
    *   找到 `notify` 方法。这是核心修改点。当一个步骤有 `choices` 时，它应该等待一个特定的事件（比如 `playerChoiceMade`），而不是自动前进。

3.  **详细代码修改 `ScriptParser.js`：**

    ```javascript
    // src/core/ScriptParser.js

    // ... 在 _buildExecutionTreeInternal 方法中 ...
    stepsArray.forEach(step => {
      // ...
      tree.steps[step.stepId] = {
        ...step,
        // 如果有 choices，确保它们也被复制过来
        choices: step.choices || null, // <--- 新增
        next: ScriptParser._resolveInternal(step, 'nextStep'),
        // ... 其他 nextStep 字段
      };
    });

    // ... 在 notify 方法中 ...
    // ... 在 switch (step.type) 之前
    let next = null;
    this._stateUpdatePublished = false;

    // --- 新增：处理玩家选择事件 ---
    if (step.choices && eventName === 'playerChoiceMade') {
      const chosenNextStep = eventData.nextStep;
      // 验证玩家的选择是否合法
      if (step.choices.some(c => c.nextStep === chosenNextStep)) {
        console.log(`[ScriptParser] Player choice made. Proceeding to step: ${chosenNextStep}`);
        next = chosenNextStep;
      } else {
        console.warn(`[ScriptParser] Invalid choice received: ${chosenNextStep}. Ignoring.`);
      }
    }
    // --------------------------------

    // ... 在 switch (step.type) 内部 ...
    switch (step.type) {
      case 'dialogue':
        // 如果当前步骤有选项，它不应该通过 dialogueClosed 事件推进。
        // 它必须等待 'playerChoiceMade' 事件。
        if (step.choices) {
          // 什么都不做，等待选择事件
        } else if (eventName === 'dialogueClosed') {
          next = step.next;
        }
        break;
      // ... 其他 case ...
    }

    // ... 在 notify 方法的末尾，在 advancement 逻辑中 ...
    if (next !== null && typeof next !== 'undefined') {
      // ... 现有推进逻辑不变 ...
    } else if (step.choices && eventName !== 'playerChoiceMade') {
        // 如果步骤有选项，并且当前事件不是选择事件，则脚本暂停。
        // `next` 保持为 null，脚本不会前进。
        console.log(`[ScriptParser] Step ${this.current} is paused, waiting for player choice.`);
    } else if (step.endScript === true) {
      // ... 现有结束逻辑 ...
    }
    ```

#### **第3.2步：更新 `VisualNovelView` 以显示选项**

**任务：** 修改 `VisualNovelView.jsx`，当 `step` 对象包含 `choices` 数组时，渲染可点击的选项按钮。

1.  打开 `src/components/VisualNovelView.jsx`。
2.  在 `return` 语句中，添加渲染选项的逻辑。选项应该覆盖在对话框之上，或者在屏幕中央。
3.  **详细代码修改：**

    ```jsx
    // src/components/VisualNovelView.jsx
    import React from 'react';
    import CyberButton from './ui/CyberButton'; // 确保导入按钮组件
    // ... 其他 imports

    // 修改 props，增加 onChoice 回调
    function VisualNovelView({ step, onNext, onChoice }) {
      // ...
      const { /*...,*/ choices } = step;

      // ...

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
          className="fixed inset-0 bg-black z-50 flex flex-col justify-end"
          onClick={handleNextClick}
        >
          {/* ... 背景和角色层 ... */}

          {/* 如果有对话文本，显示对话框 */}
          {text && (
            <div className="relative z-20 ...">
              {/* ... 对话框内容 ... */}
            </div>
          )}

          {/* 新增：选项层 */}
          {choices && isTextComplete && ( // 仅在文本显示完毕后显示选项
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-black/50">
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

          {/* ... 音频 ... */}
        </div>
      );
    }
    ```

#### **第3.3步：在 `App.jsx` 中连接选择逻辑**

**任务：** 实现 `onChoice` 回调函数，当玩家点击选项时，发布新的 `playerChoiceMade` 事件。

1.  打开 `src/App.jsx` 的 `AppContent` 组件。

2.  定义一个新的处理函数 `handlePlayerChoice`。

    ```jsx
    // 在 AppContent 组件内部
    const handlePlayerChoice = (chosenNextStep) => {
      const activeScriptEntry = activeEngineDetails.size > 0 ? [...activeEngineDetails.entries()][0] : null;
      if (activeScriptEntry) {
        const scriptId = activeScriptEntry[0];
        console.log(`[App.jsx] Player chose option. Notifying script '${scriptId}' with 'playerChoiceMade' and nextStep: ${chosenNextStep}`);
        // 使用 notifyScript 直接将选择结果发送给特定的脚本引擎
        notifyScript(scriptId, 'playerChoiceMade', { nextStep: chosenNextStep });
      }
    };
    ```

3.  将此函数传递给 `VisualNovelView`。

    ```jsx
    // 在 App.jsx 的渲染逻辑中
    if (isVisualNovelStep) {
        return (
            <VisualNovelView 
                step={currentScriptStep}
                onNext={handleVisualNovelNext}
                onChoice={handlePlayerChoice} // <--- 传递新函数
            />
        );
    }
    ```

**验证：** 当游戏进行到包含 `choices` 的步骤时，对话框文本显示完毕后，屏幕上应出现选项按钮。点击一个按钮，游戏应该会根据该选项的 `nextStep` 跳转到相应的后续剧情。

---

**任务完成！**

你已经成功地指导AI机器人为你的VN系统添加了三大核心功能。你的系统现在支持：
*   **丰富的场景表现：** 背景 + 立绘 + BGM。
*   **交互式剧情：** 玩家的选择可以真正影响故事的走向。

这个架构既利用了React的声明式UI优势，也保持了你后端逻辑的清晰和强大，是理想的演进方向。