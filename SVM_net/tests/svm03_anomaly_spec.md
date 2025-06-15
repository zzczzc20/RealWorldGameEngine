# SVM-03 异常事件用户体验流程规范 (v2.0)

本文档以用户故事的形式，详细描述了 `svm03_anomaly.yaml` 脚本触发后的预期用户体验流程，包括屏幕显示、用户操作和系统反馈，旨在为手动测试和未来更高级别的自动化测试提供清晰指引。

---

## 核心流程 1: 接受调查任务 (SVM Offline 分支)

**场景:** 用户正在城市中探索，与 IdeActuator 应用交互。

1.  **警报触发 (系统事件):**
    *   **触发:** 系统内部检测到 SVM-03 信号异常，发布 `high_priority_alert` 事件。
    *   **屏幕显示:**
        *   (可选) 屏幕边缘可能出现红色闪烁或播放简短警报音效。
        *   右下角的紫色圆形聊天按钮出现角标或动画，提示有新消息。如果聊天面板已打开，则直接显示新消息。
    *   **系统反馈 (内部):** `EventService` 捕获事件，查找并激活 `svm03_anomaly` 脚本。`ScriptContext` 更新，`activeEngineDetails` 包含 `svm03_anomaly` 及其当前步骤 (Step 1)。

2.  **初步警告 (Step 1: Dialogue):**
    *   **屏幕显示:** `AIChatPanel` (如果未打开则自动打开) 显示：
        *   **头像:** Nova (AI 助手) 的头像 (`ai-avatar.png`)。
        *   **角色:** Nova
        *   **消息:** "警告：检测到 SVM-03 信号异常。协议零通讯中断。需要立即调查。" (消息带有特殊样式，如紫色背景/边框)。
    *   **用户操作:** 用户阅读消息后，点击聊天面板右上角的关闭按钮 "×"。
    *   **系统反馈 (内部):** `AIChatPanel` 调用 `onClose` -> `App.toggleChat` -> `EventService.notifyScript('svm03_anomaly', 'dialogueClosed', {})` -> 脚本引擎前进到 Step 2。`ScriptContext` 更新。

3.  **任务提议 (Step 2: TaskOffer):**
    *   **屏幕显示:** `TaskOfferPanel` 模态框弹出，覆盖在地图或其他视图之上。面板显示：
        *   **标题:** 调查 SVM-03
        *   **描述:** 前往 SVM-03，评估情况。该区域可能存在敌对活动。回报发现。
        *   **奖励:** 150 (或其他单位)
        *   **难度:** Medium
        *   **类型:** INVESTIGATION
        *   包含“接受”和“拒绝”两个 `CyberButton`。
    *   **用户操作:** 用户点击“接受”按钮。
    *   **系统反馈 (内部):** `TaskOfferPanel` 调用 `onAccept` (或其他回调) -> `EventService.notifyScript('svm03_anomaly', 'branchChoice', { choice: 'Accept' })` -> 脚本引擎前进到 Step 3。`ScriptContext` 更新。

4.  **接受确认与地图更新 (Step 3 -> Step 5):**
    *   **屏幕显示:**
        *   `TaskOfferPanel` 关闭。
        *   聊天面板 (`AIChatPanel`) 再次弹出或提示新消息。
    *   **系统反馈 (内部):** 脚本引擎处理 Step 3 (`updateWorldState`)，内部状态改变（例如，标记 SVM-03 需要高亮），然后自动前进到 Step 5。`ScriptContext` 更新两次（一次到 Step 3，一次到 Step 5）。
    *   **地图响应 (`MapView`):** 接收到状态更新（通过 Context 或 props），SVM-03 的地图标记变为醒目的高亮状态（例如，黄色边框，带有脉冲动画），指示其为当前活动任务目标。
    *   **聊天面板内容:** 显示 Nova 头像和消息：“任务已接受。SVM-03 位置已在地图上标记。请谨慎行事，操作员。” (Step 5)
    *   **用户操作:** 用户关闭聊天面板。
    *   **系统反馈 (内部):** `notifyScript('svm03_anomaly', 'dialogueClosed', {})` -> 脚本引擎前进到 Step 6 (`waitForEvent`)。`ScriptContext` 更新。

5.  **到达地点 (Step 6: waitForEvent -> Step 7: branch -> Step 8: Dialogue):**
    *   **用户行为 (概念):** 用户根据地图指引，在现实世界中移动到 SVM-03 附近。
    *   **系统触发 (测试模拟):** 发布 `arrived_at_svm_3` 事件，并假设世界状态为 `{ svm: { 3: { status: 'Offline' } } }`。
    *   **系统反馈 (内部):**
        *   `EventService` 捕获事件并转发给 `svm03_anomaly` 引擎。
        *   引擎处理 Step 6，接收到匹配事件，前进到 Step 7。
        *   引擎处理 Step 7 (`branch`)，检查 `worldState.svm[3].status` 是否为 "Offline"。条件为真，前进到 Step 8。
        *   `ScriptContext` 更新两次。
    *   **屏幕显示:** 聊天面板再次弹出或提示新消息。
    *   **聊天面板内容:** 显示 Nova 头像和消息：“确认：SVM-03 已离线。扫描到附近有未识别的电子信号...可能是干扰源。” (Step 8)
    *   **用户操作:** 用户关闭聊天面板。
    *   **系统反馈 (内部):** `notifyScript('svm03_anomaly', 'dialogueClosed', {})` -> 脚本引擎前进到 Step 10。`ScriptContext` 更新。

6.  **后续任务提议 (Step 10: TaskOffer):**
    *   **屏幕显示:** `TaskOfferPanel` 弹出，显示：
        *   **标题:** 收集信号样本
        *   **描述:** 使用诊断工具收集 SVM-03 周围的异常信号样本。
        *   **奖励:** 100
        *   **难度:** Medium
        *   **类型:** DATA_COLLECTION
    *   **系统反馈 (内部):** 脚本到达 `endScript: true` 的步骤，执行引擎标记为完成。`EventService` 检测到完成，发布 `scriptFinished` 事件。`ScriptContext` 更新，移除 `svm03_anomaly`。
    *   **用户操作:** 用户可以接受或拒绝新任务（此脚本流程结束）。

---

## 核心流程 2: 拒绝调查任务

**场景:** 同流程 1，直到任务提议面板 (Step 2) 弹出。

1.  **任务提议 (Step 2: TaskOffer):**
    *   **屏幕显示:** `TaskOfferPanel` 显示 "调查 SVM-03" 任务。
    *   **用户操作:** 用户点击“拒绝”按钮。
    *   **系统反馈 (内部):** `TaskOfferPanel` 调用 `onDecline` (或其他回调) -> `EventService.notifyScript('svm03_anomaly', 'branchChoice', { choice: 'Decline' })` -> 脚本引擎前进到 Step 4。`ScriptContext` 更新。

2.  **拒绝确认 (Step 4: Dialogue):**
    *   **屏幕显示:**
        *   `TaskOfferPanel` 关闭。
        *   聊天面板再次弹出或提示新消息。
    *   **聊天面板内容:** 显示 Nova 头像和消息：“明白。异常信号已记录。请保持警惕。” (Step 4)
    *   **用户操作:** 用户关闭聊天面板。
    *   **系统反馈 (内部):** `notifyScript('svm03_anomaly', 'dialogueClosed', {})` -> 脚本引擎尝试前进，但 Step 4 有 `endScript: true` 且无 `nextStep`，引擎标记为完成。`EventService` 检测到完成，发布 `scriptFinished` 事件。`ScriptContext` 更新，移除 `svm03_anomaly`。
    *   **地图响应 (`MapView`):** 无变化，SVM-03 不会高亮。

---

## 核心流程 3: 到达地点 (SVM Online 分支)

**场景:** 同流程 1，直到用户到达 SVM-03 附近。

1.  **到达地点 (Step 6: waitForEvent -> Step 7: branch -> Step 9: Dialogue):**
    *   **用户行为 (概念):** 用户移动到 SVM-03 附近。
    *   **系统触发 (测试模拟):** 发布 `arrived_at_svm_3` 事件，但这次提供世界状态 `{ svm: { 3: { status: 'Online' } } }`。
    *   **系统反馈 (内部):**
        *   `EventService` 捕获事件并转发给 `svm03_anomaly` 引擎。
        *   引擎处理 Step 6，接收到匹配事件，前进到 Step 7。
        *   引擎处理 Step 7 (`branch`)，检查 `worldState.svm[3].status` 是否为 "Offline"。条件为假，前进到 Step 9。
        *   `ScriptContext` 更新两次。
    *   **屏幕显示:** 聊天面板再次弹出或提示新消息。
    *   **聊天面板内容:** 显示 Nova 头像和消息：“SVM-03 仍在运行，但读数不稳定。建议进行本地诊断。” (Step 9)
    *   **用户操作:** 用户关闭聊天面板。
    *   **系统反馈 (内部):** `notifyScript('svm03_anomaly', 'dialogueClosed', {})` -> 脚本引擎前进到 Step 10。`ScriptContext` 更新。

2.  **后续任务提议 (Step 10: TaskOffer):**
    *   **(同流程 1 的步骤 6)** `TaskOfferPanel` 弹出，显示 "收集信号样本" 任务。脚本结束。

---

## 总结

这份规范通过用户故事的形式，更细致地描述了 `svm03_anomaly` 脚本的预期行为，整合了 UI 显示、用户交互和内部状态变化，应能更好地指导后续的手动测试和功能验证。
