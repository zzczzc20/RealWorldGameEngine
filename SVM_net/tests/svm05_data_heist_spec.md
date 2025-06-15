# SVM-05 Data Heist - 测试规范 (v2 - Task-Based)

## 概述

SVM-05 Data Heist 是一个多阶段的任务，玩家需要从 SVM-05 窃取 CorpSec 的敏感数据。此版本规范反映了基于任务的简化流程，其中代码输入环节通过特定的 `CODE_ENTRY` 任务实现。

## 前置条件

- 玩家已经登录游戏
- SVM-05 和 SVM-07 在地图上可见
- 玩家初始状态：
  - 信用点：1000 (或足够购买工具)
  - 库存：没有特殊工具 (CorpSec Hacking Tool, Data Spike)
  - 声望：(根据需要设定初始值)

## 任务流程 (简化版)

### 阶段 1：任务启动与准备

1.  **触发条件**：
    *   (假设) 玩家通过某个介绍性脚本或交互接受了主任务 `TASK_SVM05_HEIST_MAIN`。
    *   `svm05_data_heist_main` 脚本因 `task_accepted` 事件 (taskId: `TASK_SVM05_HEIST_MAIN`) 而启动。
2.  **预期结果 (脚本步骤 10-11)**：
    *   AI 助手 (Whisper) 对话，提示第一个目标是禁用摄像头，并询问是否有 `CorpSec Hacking Tool`。
    *   脚本根据玩家库存 (`hacking_tool_corpsec`) 进行分支。

### 阶段 2：获取黑客工具 (如果需要)

1.  **触发条件 (脚本步骤 12-16)**：玩家库存中没有 `hacking_tool_corpsec`。
2.  **预期结果**：
    *   AI 助手提示前往 SVM-7 购买工具，并告知价格。
    *   主任务 `TASK_SVM05_HEIST_MAIN` 的 `currentObjective` 更新为 "Acquire 'CorpSec Hacking Tool' from SVM-7 and return to SVM-5."。
    *   脚本暂停，等待 `player_inventory_updated` 事件 (获得工具) 和 `player_reached_svm` 事件 (到达 SVM-5)。
3.  **测试步骤**：
    *   前往 SVM-7。
    *   购买 `CorpSec Hacking Tool`。
    *   返回 SVM-5。
4.  **验证点**：
    *   玩家库存中添加了 `hacking_tool_corpsec`。
    *   信用点减少。
    *   脚本在玩家到达 SVM-5 后继续执行，进入步骤 20。

### 阶段 3：执行摄像头黑客任务

1.  **触发条件 (脚本步骤 20-21)**：玩家拥有 `hacking_tool_corpsec` 并已到达 SVM-5。
2.  **预期结果**：
    *   主任务 `TASK_SVM05_HEIST_MAIN` 的 `currentObjective` 更新为 "Disable the surveillance camera near SVM-05 via the provided task."。
    *   脚本提供子任务 `TASK_CAMERA_HACK` (`taskOffer` 步骤 21)。
    *   `CodeEntryTaskPanel` 应该出现，显示 `TASK_CAMERA_HACK` 的标题 ("Disable CorpSec Camera (SVM-05)") 和描述。
3.  **测试步骤 (成功路径)**：
    *   在 `CodeEntryTaskPanel` 中输入正确的代码 `ALPHA-9`。
    *   点击 "Submit Code" 按钮。
4.  **验证点 (成功路径)**：
    *   `CodeEntryTaskPanel` 显示成功消息 ("CAMERA DISABLED...")。
    *   `CodeEntryTaskPanel` 发布 `task_outcome` 事件，包含 `{ taskId: 'TASK_CAMERA_HACK', outcome: 'success' }`。
    *   脚本 (在步骤 23 等待) 接收到事件，进入步骤 24。
    *   脚本分支判断 (步骤 24) 结果为 True，进入步骤 30。
    *   (可选) `environment.camera_svm5_vicinity.status` 更新为 `disabled`。
    *   AI 助手对话 (步骤 31)，提示需要 `Data Spike`。
5.  **测试步骤 (失败路径)**：
    *   在 `CodeEntryTaskPanel` 中输入错误的代码。
    *   点击 "Submit Code" 按钮。
6.  **验证点 (失败路径)**：
    *   `CodeEntryTaskPanel` 显示失败消息 ("Override Failed...")。
    *   `CodeEntryTaskPanel` 发布 `task_outcome` 事件，包含 `{ taskId: 'TASK_CAMERA_HACK', outcome: 'failure' }`。
    *   脚本 (在步骤 23 等待) 接收到事件，进入步骤 24。
    *   脚本分支判断 (步骤 24) 结果为 False，进入步骤 26。
    *   AI 助手对话 (步骤 26)，提示任务失败，引导玩家中止或重试（当前脚本直接导向主任务失败 120）。
    *   主任务 `TASK_SVM05_HEIST_MAIN` 最终失败 (脚本进入步骤 120, 121)。

### 阶段 4：获取 Data Spike (如果需要)

1.  **触发条件 (脚本步骤 31-35)**：摄像头黑客成功，但玩家库存中没有 `data_spike`。
2.  **预期结果**：
    *   AI 助手提示需要 `Data Spike` 并告知获取方式/地点。
    *   主任务 `TASK_SVM05_HEIST_MAIN` 的 `currentObjective` 更新为 "Acquire 'Data Spike' from SVM-7 and return to SVM-5."。
    *   脚本暂停，等待 `player_inventory_updated` 事件 (获得工具)。
3.  **测试步骤**：
    *   前往 SVM-7。
    *   购买 `Data Spike`。
4.  **验证点**：
    *   玩家库存中添加了 `data_spike`。
    *   信用点减少。
    *   脚本继续执行，进入步骤 40。

### 阶段 5：执行数据提取任务

1.  **触发条件 (脚本步骤 40-41)**：玩家拥有 `data_spike` (并且摄像头已禁用)。
2.  **预期结果**：
    *   主任务 `TASK_SVM05_HEIST_MAIN` 的 `currentObjective` 更新为 "Extract data from SVM-05 using the provided task."。
    *   脚本提供子任务 `TASK_DATA_EXTRACTION` (`taskOffer` 步骤 41)。
    *   `CodeEntryTaskPanel` 应该出现，显示 `TASK_DATA_EXTRACTION` 的标题 ("Extract Data (SVM-05)") 和描述。
3.  **测试步骤 (成功路径)**：
    *   在 `CodeEntryTaskPanel` 中输入正确的代码 `OMEGA-3`。
    *   点击 "Submit Code" 按钮。
4.  **验证点 (成功路径)**：
    *   `CodeEntryTaskPanel` 显示成功消息 ("DATA EXTRACTED...")。
    *   `CodeEntryTaskPanel` 发布 `task_outcome` 事件，包含 `{ taskId: 'TASK_DATA_EXTRACTION', outcome: 'success' }`。
    *   脚本 (在步骤 43 等待) 接收到事件，进入步骤 44。
    *   脚本分支判断 (步骤 44) 结果为 True，进入步骤 50。
    *   玩家库存中添加了 `svm05_corpseclogs` (步骤 50)。
    *   AI 助手对话 (步骤 51)，提示任务完成。
    *   玩家获得信用点奖励 (步骤 52)。
    *   玩家声望更新 (步骤 53)。
    *   活动任务设置为空，脚本结束 (步骤 54)。
5.  **测试步骤 (失败路径)**：
    *   在 `CodeEntryTaskPanel` 中输入错误的代码。
    *   点击 "Submit Code" 按钮。
6.  **验证点 (失败路径)**：
    *   `CodeEntryTaskPanel` 显示失败消息 ("Extraction Failed...")。
    *   `CodeEntryTaskPanel` 发布 `task_outcome` 事件，包含 `{ taskId: 'TASK_DATA_EXTRACTION', outcome: 'failure' }`。
    *   脚本 (在步骤 43 等待) 接收到事件，进入步骤 44。
    *   脚本分支判断 (步骤 44) 结果为 False，进入步骤 46。
    *   AI 助手对话 (步骤 46)，提示任务失败。
    *   主任务 `TASK_SVM05_HEIST_MAIN` 最终失败 (脚本进入步骤 120, 121)。

## 技术验证点

1.  **任务触发与状态更新**：
    *   主任务 (`TASK_SVM05_HEIST_MAIN`) 正确启动脚本。
    *   脚本能正确更新主任务的 `currentObjective`。
2.  **子任务提供与处理**：
    *   脚本能通过 `taskOffer` 正确提供 `CODE_ENTRY` 类型的子任务 (`TASK_CAMERA_HACK`, `TASK_DATA_EXTRACTION`)。
    *   `App.jsx` 能正确识别并渲染 `CodeEntryTaskPanel`。
3.  **代码输入与事件发布**：
    *   `CodeEntryTaskPanel` 能正确验证输入代码。
    *   `CodeEntryTaskPanel` 能根据验证结果发布包含正确 `taskId` 和 `outcome` (`success`/`failure`) 的 `task_outcome` 事件。
4.  **脚本事件等待与分支**：
    *   脚本的 `waitForEvent` (步骤 23, 43) 能正确接收 `task_outcome` 事件。
    *   脚本的 `branch` (步骤 24, 44) 能根据 `task_outcome` 事件中的 `outcome` 正确跳转。
5.  **动态内容注入**：
    *   AI 对话中的 `${...}` 占位符能正确替换为玩家名称、信用点等信息。

## 用户界面验证

1.  **`CodeEntryTaskPanel`**：
    *   正确显示任务标题和描述。
    *   提供代码输入框和提交按钮。
    *   根据成功/失败显示相应的消息。
2.  **任务列表/状态**：
    *   主任务的目标 (`currentObjective`) 随着脚本进度更新。
    *   (如果实现) 玩家可以看到提供的子任务。
3.  **玩家状态**：
    *   信用点、库存、声望在任务成功或失败后正确更新。

## 调试提示

- 检查浏览器控制台，查看 `CodeEntryTaskPanel` 发布的 `task_outcome` 事件以及 `ScriptParser` 的步骤日志。
- 确认 `taskData.js` 中定义的 `taskId` 和 `correctCode` 与脚本及界面中的引用一致。
- 确认 `App.jsx` 中的条件渲染逻辑是否正确显示 `CodeEntryTaskPanel`。