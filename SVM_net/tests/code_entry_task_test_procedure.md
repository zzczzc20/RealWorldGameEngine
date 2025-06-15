# Code Entry Task 测试流程 (v3 - Final)

本文档提供了测试最终版代码输入流程的详细步骤和预期结果，该流程使用 `taskOffer` 提供子任务，接受后通过 `updateWorldState` 设置状态，再由 UI 响应状态显示代码输入界面。

## 测试环境准备

1.  确保已经应用了所有代码更改：
    *   `taskData.js` 包含 `CODE_ENTRY` 类型的任务 (`TASK_CAMERA_HACK`, `TASK_DATA_EXTRACTION`, `206`) 并定义了 `correctCode`。
    *   `svm05_data_heist_main.yaml` 使用 `taskOffer` (步骤 21, 41) 提供子任务，接受后通过 `updateWorldState` (步骤 22, 42) 设置 `pendingCodeEntryTaskId`，然后通过 `waitForEvent` (步骤 23, 43) 等待 `task_outcome`。
    *   `CodeEntryTaskPanel.jsx` 已创建并实现，接收 `activeTask` prop，发布 `task_outcome` 事件。
    *   `App.jsx` 正确导入并根据 `activeTask.pendingCodeEntryTaskId` 渲染 `CodeEntryTaskPanel`，根据 `activeEngineDetails` 中的 `taskOffer` 步骤渲染 `TaskOfferPanel`。
    *   `WorldStateContext.jsx` 支持脚本中的状态更新格式 (特别是 `pendingCodeEntryTaskId`)。
    *   `UplinkInterface.jsx` 已被移除或标记为弃用。
    *   `SvmDetailView.jsx` 不再包含渲染代码输入界面的逻辑。

## 测试流程 1：摄像头黑客任务

### 步骤 1：触发主任务
1.  **操作**：通过某种方式接受主任务 `TASK_SVM05_HEIST_MAIN`。
2.  **预期结果**：`svm05_data_heist_main` 脚本启动，进入步骤 10 (AI 对话)。

### 步骤 2：获取黑客工具 (如果需要)
1.  **操作**：根据 AI 提示，如果需要，前往 SVM-7 购买 `CorpSec Hacking Tool`。
2.  **预期结果**：脚本在步骤 14 等待 `player_inventory_updated` 事件。购买后，脚本继续。

### 步骤 3：到达 SVM-5
1.  **操作**：前往 SVM-5 (如果不在那里)。
2.  **预期结果**：脚本在步骤 16 等待 `player_reached_svm` 事件。到达后，脚本进入步骤 21。

### 步骤 4：接受并触发摄像头黑客子任务
1.  **操作**：脚本自动执行到步骤 21 (`taskOffer`)。
2.  **预期结果**：
    *   `App.jsx` 检测到 `taskOffer` 步骤，渲染 `TaskOfferPanel` 显示 `TASK_CAMERA_HACK` 任务。
    *   脚本暂停在步骤 21。
3.  **操作**：在 `TaskOfferPanel` 中点击 "接受"。
4.  **预期结果**：
    *   `TaskOfferPanel` 消失。
    *   `handleAcceptTask` 在 `App.jsx` 中被调用，设置 `activeTask` 为 `TASK_CAMERA_HACK`。
    *   `TaskOfferPanel` 通知脚本 `branchChoice: 'Accept'`。
    *   脚本执行 `nextStepOnAccept: 22`。
    *   脚本执行步骤 22 (`updateWorldState`)，将 `activeTask.pendingCodeEntryTaskId` 设置为 "TASK_CAMERA_HACK"。
    *   脚本立即前进到步骤 23 (`waitForEvent: task_outcome`)。
    *   脚本暂停在步骤 23。
5.  **操作**：导航到 `TaskListView` (或包含执行按钮的任何其他 UI)。找到 "Disable CorpSec Camera (SVM-05)" 任务，点击其 "Execute" 按钮。
6.  **预期结果**：
    *   `handleExecuteTask` 在 `App.jsx` 中被调用，设置 `executingTaskId` 为 "TASK_CAMERA_HACK"。
    *   `App.jsx` 检测到 `executingTaskId`，渲染 `CodeEntryTaskPanel`。

### 步骤 5：执行摄像头黑客任务 (失败)
1.  **操作**：在 `CodeEntryTaskPanel` 中输入错误的代码 (例如 "WRONG-CODE")。
2.  **操作**：点击 "Submit Code" 按钮。
3.  **预期结果**：
    *   `CodeEntryTaskPanel` 显示失败消息 ("Override Failed...")。
    *   `CodeEntryTaskPanel` 发布 `task_outcome` 事件，包含 `{ taskId: 'TASK_CAMERA_HACK', outcome: 'failure' }`。
    *   脚本 (在步骤 23 等待) 接收到事件，进入步骤 24 (`branch`)。
    *   脚本分支判断 (步骤 24) 结果为 False，进入步骤 26 (AI 对话提示失败)。
    *   `CodeEntryTaskPanel` 在短暂显示失败消息后调用 `onClose`，`App.jsx` 将 `executingTaskId` 设为 `null`，面板消失。
    *   脚本最终进入步骤 120，主任务失败。

### 步骤 6：执行摄像头黑客任务 (成功)
1.  **操作**：(重新开始或回退到步骤 22/23) 在 `CodeEntryTaskPanel` 中输入正确的代码 `ALPHA-9`。
2.  **操作**：点击 "Submit Code" 按钮。
3.  **预期结果**：
    *   `CodeEntryTaskPanel` 显示成功消息 ("CAMERA DISABLED...")。
    *   `CodeEntryTaskPanel` 发布 `task_outcome` 事件，包含 `{ taskId: 'TASK_CAMERA_HACK', outcome: 'success' }`。
    *   脚本 (在步骤 23 等待) 接收到事件，进入步骤 24 (`branch`)。
    *   脚本分支判断 (步骤 24) 结果为 True，进入步骤 30。
    *   `CodeEntryTaskPanel` 在短暂显示成功消息后调用 `onClose`，`App.jsx` 将 `executingTaskId` 设为 `null`，面板消失。
    *   脚本继续执行，进入检查 Data Spike 的流程 (步骤 31)。

## 测试流程 2：数据提取任务

### 步骤 7：获取 Data Spike (如果需要)
1.  **操作**：(假设摄像头黑客已成功) 根据 AI 提示 (步骤 31)，如果需要，前往 SVM-7 购买 `Data Spike`。
2.  **预期结果**：脚本在步骤 35 等待 `player_inventory_updated` 事件。购买后，脚本进入步骤 41。

### 步骤 8：接受并触发数据提取子任务
1.  **操作**：脚本自动执行到步骤 41 (`taskOffer`)。
2.  **预期结果**：
    *   `App.jsx` 检测到 `taskOffer` 步骤，渲染 `TaskOfferPanel` 显示 `TASK_DATA_EXTRACTION` 任务。
    *   脚本暂停在步骤 41。
3.  **操作**：在 `TaskOfferPanel` 中点击 "接受"。
4.  **预期结果**：
    *   `TaskOfferPanel` 消失。
    *   `handleAcceptTask` 在 `App.jsx` 中被调用，设置 `activeTask` 为 `TASK_DATA_EXTRACTION`。
    *   `TaskOfferPanel` 通知脚本 `branchChoice: 'Accept'`。
    *   脚本执行 `nextStepOnAccept: 42`。
    *   脚本执行步骤 42 (`updateWorldState`)，将 `activeTask.pendingCodeEntryTaskId` 设置为 "TASK_DATA_EXTRACTION"。
    *   脚本立即前进到步骤 43 (`waitForEvent: task_outcome`)。
    *   脚本暂停在步骤 43。
5.  **操作**：导航到 `TaskListView` (或包含执行按钮的任何其他 UI)。找到 "Extract Data (SVM-05)" 任务，点击其 "Execute" 按钮。
6.  **预期结果**：
    *   `handleExecuteTask` 在 `App.jsx` 中被调用，设置 `executingTaskId` 为 "TASK_DATA_EXTRACTION"。
    *   `App.jsx` 检测到 `executingTaskId`，渲染 `CodeEntryTaskPanel`。

### 步骤 9：执行数据提取任务 (失败)
1.  **操作**：在 `CodeEntryTaskPanel` 中输入错误的代码。
2.  **操作**：点击 "Submit Code" 按钮。
3.  **预期结果**：
    *   `CodeEntryTaskPanel` 显示失败消息 ("Extraction Failed...")。
    *   `CodeEntryTaskPanel` 发布 `task_outcome` 事件，包含 `{ taskId: 'TASK_DATA_EXTRACTION', outcome: 'failure' }`。
    *   脚本 (在步骤 43 等待) 接收到事件，进入步骤 44 (`branch`)。
    *   脚本分支判断 (步骤 44) 结果为 False，进入步骤 46 (AI 对话提示失败)。
    *   `CodeEntryTaskPanel` 在短暂显示失败消息后调用 `onClose`，`App.jsx` 将 `executingTaskId` 设为 `null`，面板消失。
    *   脚本最终进入步骤 120，主任务失败。

### 步骤 10：执行数据提取任务 (成功)
1.  **操作**：(重新开始或回退到步骤 42/43) 在 `CodeEntryTaskPanel` 中输入正确的代码 `OMEGA-3`。
2.  **操作**：点击 "Submit Code" 按钮。
3.  **预期结果**：
    *   `CodeEntryTaskPanel` 显示成功消息 ("DATA EXTRACTED...")。
    *   `CodeEntryTaskPanel` 发布 `task_outcome` 事件，包含 `{ taskId: 'TASK_DATA_EXTRACTION', outcome: 'success' }`。
    *   脚本 (在步骤 43 等待) 接收到事件，进入步骤 44 (`branch`)。
    *   脚本分支判断 (步骤 44) 结果为 True，进入步骤 50。
    *   `CodeEntryTaskPanel` 在短暂显示成功消息后调用 `onClose`，`App.jsx` 将 `executingTaskId` 设为 `null`，面板消失。
    *   脚本执行后续的成功步骤 (添加库存、AI 对话、奖励、声望、结束脚本)。
    *   玩家库存、信用点、声望正确更新。
    *   主任务完成，活动任务为空。

## 调试提示

- 检查浏览器控制台：
  - `[TaskOfferPanel]` 是否按预期出现和消失。
  - `[CodeEntryTaskPanel]` 日志，确认渲染的任务和发布的 `task_outcome` 事件。
  - `[ScriptParser]` 日志，确认脚本执行的步骤和接收到的事件 (`branchChoice`, `task_outcome`)。
  - `[WorldStateContext]` 日志，确认状态更新是否按预期执行 (特别是 `pendingCodeEntryTaskId`)。
- 确认 `taskData.js` 中定义的 `taskId` 和 `correctCode`。
- 确认 `App.jsx` 是否根据 `activeEngineDetails` 中的 `taskOffer` 步骤渲染 `TaskOfferPanel` (非 CODE_ENTRY 类型)。
- 确认 `TaskListView` 是否为活动的 `CODE_ENTRY` 任务显示 "Execute" 按钮。
- 确认点击 "Execute" 按钮后 `App.jsx` 是否根据 `executingTaskId` 状态渲染 `CodeEntryTaskPanel`。
- 确认 `CodeEntryTaskPanel` 是否在成功/失败后调用 `onClose`。
- 确认脚本中的 `waitForEvent` 是否在等待正确的 `eventName` (`task_outcome`) 和 `taskId`。