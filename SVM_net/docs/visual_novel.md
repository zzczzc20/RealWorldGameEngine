好的，没问题。这是一个极其详尽、分步明确的任务计划，旨在指导一个能力有限的AI机器人，在**最小化代码改动**的前提下，将你现有的对话系统升级为更具沉浸感的视觉小说（Visual Novel）界面。

我们将严格遵循你提供的思路：**扩展现有的 `dialogue` 步骤类型**，而不是引入新的类型。

---

### **AI机器人任务指令：升级对话系统为视觉小说界面**

**最终目标：** 将游戏中 `type: dialogue` 的脚本步骤，从一个聊天窗口式的界面，渲染为一个全屏的、包含背景图、角色语音和对话框的视觉小说界面。

**核心原则：**
1.  **最小化改动：** 我们将复用现有的事件系统 (`EventService`)、状态管理 (`WorldStateContext`, `ScriptContext`) 和脚本解析器 (`ScriptParser`)。
2.  **扩展而非重构：** 我们不改变 `dialogue` 类型的核心逻辑，只增强它的渲染方式。
3.  **分步实施：** 严格按照以下步骤操作，每一步都是一个独立且可验证的任务。

---

### **第一步：创建核心的 `VisualNovelView` 组件**

**任务：** 创建一个新的React组件，它将负责渲染视觉小说的全屏界面。这是我们新UI的基石。

1.  在 `src/components/` 目录下创建一个新文件，命名为 `VisualNovelView.jsx`。

2.  打开 `VisualNovelView.jsx`，编写以下**骨架代码**。这个组件将接收两个关键 `props`：
    *   `step`: 当前的脚本步骤对象（包含 `text`, `image`, `audio`, `persona` 等信息）。
    *   `onNext`: 一个回调函数，当用户点击界面以继续对话时调用。

3.  将以下代码复制到 `VisualNovelView.jsx` 中：

    ```jsx
    // src/components/VisualNovelView.jsx
    import React from 'react';
    import PERSONAS from '../data/personaData'; // 导入角色数据以获取角色名称

    // 这个组件将作为全屏覆盖层
    function VisualNovelView({ step, onNext }) {
      // 如果没有有效的步骤，或者步骤没有背景图（这是我们判断是否为VN场景的关键），则不渲染
      if (!step || step.type !== 'dialogue' || !step.image) {
        return null;
      }

      // 从步骤中解构出需要的数据
      const { text, persona: personaId, image: backgroundImage, audio: voiceOver } = step;

      // 根据 personaId 查找完整的角色信息
      const speaker = PERSONAS.find(p => p.id === personaId);
      const speakerName = speaker ? speaker.name : personaId;

      return (
        // 1. 全屏容器，使用 fixed 定位覆盖整个页面
        <div 
          className="fixed inset-0 bg-black z-50 flex flex-col justify-end"
          onClick={onNext} // 整个界面都可以点击以继续
        >
          {/* 2. 背景图片 */}
          <img 
            src={backgroundImage} 
            alt="Visual Novel Background" 
            className="absolute top-0 left-0 w-full h-full object-cover z-0"
          />

          {/* 3. 对话框 (使用类似 CyberCard 的样式) */}
          <div className="relative z-10 m-4 md:m-8 p-6 bg-gray-900/80 border border-purple-500/70 rounded-lg backdrop-blur-sm animate-fade-in-up">
            {/* 说话人名称 */}
            <h3 className="text-2xl font-bold text-purple-400 mb-3">{speakerName}</h3>
            
            {/* 对话文本 */}
            <p className="text-xl text-gray-100 leading-relaxed">{text}</p>
            
            {/* "点击继续" 的提示图标 */}
            <div className="absolute bottom-4 right-4 animate-pulse">
              <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* 4. 角色语音 (隐藏的 audio 元素，自动播放) */}
          {voiceOver && <audio src={voiceOver} autoPlay />}
        </div>
      );
    }

    export default VisualNovelView;
    ```

**验证：** 此步骤完成后，你应该有了一个新的 `VisualNovelView.jsx` 文件，它能够根据传入的 `step` 数据渲染出一个基本的视觉小说场景。

---

### **第二步：在主应用中集成 `VisualNovelView`**

**任务：** 修改 `App.jsx`，让它在检测到视觉小说类型的对话步骤时，渲染我们新创建的 `VisualNovelView` 组件，而不是其他视图。

1.  打开 `src/App.jsx` 文件。

2.  在 `AppContent` 组件的顶部，导入我们刚刚创建的 `VisualNovelView`：
    ```jsx
    import VisualNovelView from './components/VisualNovelView';
    ```

3.  在 `AppContent` 组件内部，找到 `return (...)` 语句。我们需要在其中添加渲染逻辑。

4.  在 `return` 语句的**最外层 `div` 的内部**，但在 `<Navbar />` 组件的**下方**，添加以下代码块。这将实现我们的核心渲染切换逻辑：

    ```jsx
    // 在 AppContent 组件的 return 语句内添加
    
    {/* ... 现有的 Navbar ... */}

    {/* --- 视觉小说渲染逻辑 --- */}
    {(() => {
        // 从 useScriptContext 获取当前脚本步骤
        const activeScriptEntry = activeEngineDetails.size > 0 ? [...activeEngineDetails.entries()][0] : null;
        const currentScriptStep = activeScriptEntry ? activeScriptEntry[1] : null;

        // 判断是否应该显示视觉小说界面
        const isVisualNovelStep = currentScriptStep && currentScriptStep.type === 'dialogue' && currentScriptStep.image;

        if (isVisualNovelStep) {
            // 如果是，渲染 VisualNovelView
            return (
                <VisualNovelView 
                    step={currentScriptStep}
                    onNext={() => { /* 我们将在下一步实现这个函数 */ }} 
                />
            );
        } else {
            // 如果不是，渲染原来的主视图
            return (
                <main className="py-6">
                    {renderCurrentView()}
                </main>
            );
        }
    })()}

    {/* ... 现有的浮动按钮和 Overlay Panels ... */}
    ```

    **重要提示：** 将你现有的 `<main className="py-6">{renderCurrentView()}</main>` 移动到上面代码块的 `else` 分支中。这样可以确保视觉小说视图和地图/任务视图不会同时显示。

**验证：** 此时，当你运行游戏并触发一个带有 `image` 字段的 `dialogue` 步骤时，你应该能看到一个全屏的、带有背景和对话框的界面，覆盖在地图等其他视图之上。点击它目前不会有任何反应。

---

### **第三步：实现对话推进逻辑**

**任务：** 让用户能够通过点击 `VisualNovelView` 来推进对话，即触发脚本的下一步。

1.  继续在 `src/App.jsx` 的 `AppContent` 组件中工作。

2.  在 `AppContent` 组件内部，定义一个名为 `handleVisualNovelNext` 的新函数。这个函数将负责通知脚本引擎继续执行。

    ```jsx
    // 在 AppContent 组件内部，与其他 handle... 函数放在一起
    const handleVisualNovelNext = () => {
        const activeScriptEntry = activeEngineDetails.size > 0 ? [...activeEngineDetails.entries()][0] : null;
        if (activeScriptEntry) {
            const scriptId = activeScriptEntry[0];
            const step = activeScriptEntry[1];
            // 我们的 ScriptParser 中的 'dialogue' 步骤是通过 'dialogueClosed' 事件来推进的。
            // 我们复用这个事件，因为它已经存在并且能完美工作。
            if (step && step.type === 'dialogue') {
                console.log(`[App.jsx] Advancing VN script. Notifying script '${scriptId}' with 'dialogueClosed'.`);
                notifyScript(scriptId, 'dialogueClosed', {});
            }
        }
    };
    ```

3.  现在，回到你在第二步中添加的渲染逻辑块，将 `onNext` prop 指向我们新创建的函数：

    ```jsx
    // ...
    if (isVisualNovelStep) {
        return (
            <VisualNovelView 
                step={currentScriptStep}
                onNext={handleVisualNovelNext} // <--- 在这里进行修改
            />
        );
    } 
    // ...
    ```

**验证：** 重新运行游戏。当你看到视觉小说界面时，点击屏幕上的任何地方。对话应该会推进到脚本中的 `nextStep`。如果下一步仍然是带 `image` 的 `dialogue`，界面内容会更新；如果下一步是其他类型（如 `updateWorldState` 或切换到地图），视觉小说界面应该会消失，并显示回原来的地图/任务视图。

---

### **第四步：优化体验 - 添加打字机效果**

**任务：** 为了让视觉小说感觉更生动，我们将为对话文本添加一个经典的打字机效果。

1.  打开 `src/components/VisualNovelView.jsx` 文件。

2.  在组件内部，使用 `useState` 和 `useEffect` 来实现打字机逻辑。

3.  修改 `VisualNovelView.jsx` 如下：

    ```jsx
    // src/components/VisualNovelView.jsx
    import React, { useState, useEffect } from 'react'; // 导入 useState 和 useEffect
    import PERSONAS from '../data/personaData';

    function VisualNovelView({ step, onNext }) {
      const [displayedText, setDisplayedText] = useState('');

      // 如果没有有效的步骤，则不渲染
      if (!step || step.type !== 'dialogue' || !step.image) {
        return null;
      }

      const { text, persona: personaId, image: backgroundImage, audio: voiceOver } = step;
      
      // 打字机效果的 Effect Hook
      useEffect(() => {
        setDisplayedText(''); // 每当 text 变化时，重置显示的文本
        if (text) {
          let i = 0;
          const intervalId = setInterval(() => {
            setDisplayedText(prev => prev + text.charAt(i));
            i++;
            if (i > text.length) {
              clearInterval(intervalId);
            }
          }, 50); // 50ms 的打字速度，你可以调整

          return () => clearInterval(intervalId); // 组件卸载或 text 变化时清除 interval
        }
      }, [text]); // 这个 effect 依赖于 text prop

      const speaker = PERSONAS.find(p => p.id === personaId);
      const speakerName = speaker ? speaker.name : personaId;
      
      // 检查文本是否已完全显示
      const isTextComplete = displayedText.length >= text.length;

      // 修改 onNext 的调用逻辑，只有在文本显示完毕后才响应点击
      const handleNextClick = () => {
        if (isTextComplete) {
            onNext();
        } else {
            // 如果文本还没显示完，点击则立即显示全部文本
            setDisplayedText(text);
        }
      };

      return (
        <div 
          className="fixed inset-0 bg-black z-50 flex flex-col justify-end"
          onClick={handleNextClick} // 使用新的点击处理函数
        >
          {/* ... 背景图片 ... */}
          <img 
            src={backgroundImage} 
            alt="Visual Novel Background" 
            className="absolute top-0 left-0 w-full h-full object-cover z-0"
          />

          <div className="relative z-10 m-4 md:m-8 p-6 bg-gray-900/80 border border-purple-500/70 rounded-lg backdrop-blur-sm animate-fade-in-up">
            <h3 className="text-2xl font-bold text-purple-400 mb-3">{speakerName}</h3>
            
            {/* 使用 state 中的 displayedText */}
            <p className="text-xl text-gray-100 leading-relaxed h-24">{displayedText}</p> 
            
            {/* 只有在文本完全显示后才显示 "点击继续" 提示 */}
            {isTextComplete && (
              <div className="absolute bottom-4 right-4 animate-pulse">
                <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            )}
          </div>
          {voiceOver && <audio src={voiceOver} autoPlay />}
        </div>
      );
    }

    export default VisualNovelView;
    ```
    *注意：我还在 `p` 标签上添加了 `h-24` (高度) 来防止对话框因文字长度变化而跳动，你可以根据需要调整。*

**验证：** 再次运行游戏。现在，当视觉小说场景出现时，对话文本应该会一个字一个字地出现。在文本显示过程中点击屏幕会立即显示全部文本。当文本完全显示后，再次点击才会推进到下一步。

---

**任务完成！**

你已成功地指导AI机器人将你的对话系统升级为了一个功能性的视觉小说界面。这个新系统无缝地集成了你现有的强大脚本和事件逻辑，同时提供了更具沉浸感的用户体验。

**后续可扩展方向（给你的提示）：**
*   **角色立绘（Sprites）：** 扩展YAML格式，支持 `characters: [{ id: 'Echo', sprite: 'path/to/sprite.png', position: 'center' }]`，并在 `VisualNovelView` 中渲染他们。
*   **背景音乐（BGM）：** 在YAML中添加 `bgm` 字段，并在 `VisualNovelView` 中用一个循环播放的 `<audio>` 标签来处理。
*   **选择项（Choices）：** 扩展YAML格式，支持 `choices: [{ text: '接受', nextStep: 20 }, { text: '拒绝', nextStep: 21 }]`，并在 `VisualNovelView` 中渲染成按钮。