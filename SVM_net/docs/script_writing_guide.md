# SVM-Net 游戏脚本写作指南

本文档为 SVM-Net 游戏的 YAML 脚本创作者提供详细的格式规范和功能说明。请遵循本指南来创建可被 `ScriptParser` 正确解析和执行的交互式剧情脚本。

---

## 一、 脚本基本结构

每个脚本文件都是一个独立的 YAML 文件，其顶层结构包含脚本的元数据和所有步骤的定义。

```yaml
# 脚本的唯一标识符，必需
scriptId: HK_2085_Love_Isaac 

# 脚本的标题，可选
title: "香港 2085 - 爱上艾萨克"

# 脚本的入口步骤 ID，必需
entry: 1 

# 包含所有脚本步骤的列表
steps:
  - stepId: 1
    # ... 步骤的具体定义 ...
  - stepId: 2
    # ... 步骤的具体定义 ...
```

-   `scriptId` (必需): 字符串格式，脚本的唯一ID。
-   `title` (可选): 字符串格式，脚本的显示名称。
-   `entry` (必需): 数字或字符串格式，指定脚本从哪个 `stepId` 开始执行。
-   `steps` (必需): 一个包含所有步骤对象的数组。

---

## 二、 步骤 (Step) 详解

`steps` 数组中的每个对象都代表游戏中的一个具体操作或事件。每个步骤都必须包含 `stepId` 和 `type`。

### 通用字段

-   `stepId` (必需): 数字或字符串，步骤的唯一标识符。
-   `type` (必需): 字符串，定义步骤的类型。
-   `nextStep` (可选): 指定下一个要执行的步骤 `stepId`。这是最常用的导航方式。
-   `endScript` (可选): 布尔值，如果为 `true`，则在此步骤的交互完成后结束整个脚本。

### 步骤类型 (type)

#### 1. `dialogue` - 对话与视觉小说

这是功能最丰富的步骤类型，用于显示对话、旁白以及完整的视觉小说场景。

**基本用法 (聊天框式对话):**

```yaml
- stepId: 10
  type: dialogue
  persona: Echo # 说话人的 personaId
  text: "你好，世界。"
  nextStep: 11
```

**高级用法 (视觉小说场景):**

```yaml
- stepId: 12
  type: dialogue
  persona: AhMing # 当前说话的角色 ID
  image: /assets/images/scenes/tea_shop.jpg # 场景背景图
  bgm: /assets/audio/music/protagonist_theme.mp3 # 背景音乐
  audio: /assets/audio/voice/ahming_line_1.mp3 # 角色语音
  
  # 屏幕上显示的角色立绘
  characters:
    - id: AhMing # 角色 ID
      sprite: /assets/images/sprites/ahming_worried.png # 立绘图片
      position: center # 位置 (left, center, right)
      effect: { type: 'fadeIn', duration: 1.5 } # 入场效果
    - id: Echo
      sprite: /assets/images/sprites/echo_neutral.png
      position: right
      
  text: "我真的不知道该怎么办了..."

  # 玩家选项
  choices:
    - text: "你应该为你外婆坚持下去。"
      nextStep: 13 # 选择后跳转的 stepId
    - text: "也许是时候放手了。"
      nextStep: 14
      
  # 当 choices 存在时，此 nextStep 会被忽略
  nextStep: 999 
```

**`dialogue` 字段详解:**

-   `persona`: 说话人的 `personaId`。
-   `text`: 显示的对话或旁白文本。支持[占位符](#iv-高级功能)。
-   `image`: **背景图** 的路径。这是触发视觉小说模式的关键。
-   `audio`: 角色**语音**的音频文件路径。
-   `bgm`: **背景音乐**的音频文件路径。设为 `null` 可以停止当前播放的BGM。如果省略该字段，BGM状态不变。
-   `characters`: 一个对象数组，定义屏幕上所有**角色立绘**。
    -   `id`: 角色 `personaId`。
    -   `sprite`: 立绘图片路径。
    -   `position`: `left`, `center`, `right`。
    -   `effect`: 可选的入场效果，如 `{ type: 'fadeIn' }`。
-   `choices`: 一个对象数组，定义**玩家选项**。
    -   `text`: 按钮上显示的文本。
    -   `nextStep`: 选择此项后跳转到的 `stepId`。

#### 2. `aiDialogue` - AI驱动的对话

此步骤会向AI服务请求生成一段对话。

```yaml
- stepId: 20
  type: aiDialogue
  persona: Kiera # 与玩家对话的 AI 角色
  owner: Echo # 此对话发生在哪个角色的聊天窗口中
  prompt: "根据玩家最近的行为，生成一句鼓励的话。"
  nextStep: 21
```

-   `persona`: AI角色的 `personaId`。
-   `owner`: 对话窗口所属角色的 `personaId`。
-   `prompt`: 发送给AI服务的指令文本。支持[占位符](#iv-高级功能)。

#### 3. `branch` - 条件分支

根据一个或多个条件来决定下一步的走向。

```yaml
- stepId: 30
  type: branch
  condition:
    operator: AND
    clauses:
      - { target: 'player', property: 'credits', operator: '>=', value: 100 }
      - { target: 'svms', id: 3, property: 'status', operator: '===', value: 'Online' }
  nextStepOnTrue: 31 # 条件为真时跳转
  nextStepOnFalse: 32 # 条件为假时跳转
```

-   `condition`: 定义判断逻辑，详见[条件判断](#iv-高级功能)。
-   `nextStepOnTrue`: 条件成立时跳转的 `stepId`。
-   `nextStepOnFalse`: 条件不成立时跳转的 `stepId`。

#### 4. `updateWorldState` - 更新世界状态

直接修改游戏世界的状态，如玩家属性、SVM状态等。

```yaml
- stepId: 40
  type: updateWorldState
  target: player # 要修改的状态对象 (e.g., player, svms, personas)
  property: credits
  value: 500 # 将 player.credits 设置为 500
  nextStep: 41

- stepId: 42
  type: updateWorldState
  target: svms
  id: 3 # 具体要修改的对象的 ID
  property: status
  value: "Offline" # 将 svms[3] 的 status 设置为 "Offline"
  nextStep: 43
```

#### 5. `waitForEvent` - 等待特定事件

暂停脚本，直到接收到指定名称和/或满足条件的事件。

```yaml
- stepId: 50
  type: waitForEvent
  eventName: task_completed # 等待的事件名称
  # 可选，对接收到的事件数据进行判断
  condition: 
    target: eventData 
    property: taskId 
    operator: === 
    value: "heist_data"
  nextStep: 51
```

-   `eventName`: 要等待的事件的字符串名称。
-   `condition`: 可选，用于校验接收到的事件数据。

#### 6. `aiDecision` - AI决策

让AI根据给定的选项做出选择，并跳转到相应的步骤。

```yaml
- stepId: 60
  type: aiDecision
  persona: System
  prompt: "基于当前经济状况，决定是投资科技股还是稳定资产。"
  options:
    - { text: "投资科技股", nextStep: 61 }
    - { text: "投资稳定资产", nextStep: 62 }
  defaultNextStep: 62 # AI服务失败时的默认选项
```

#### 7. 任务、线索和谜题系统

-   `UNLOCK_TASK`: 解锁一个新任务。
    -   `taskId`: 要解锁的任务ID。
-   `WAIT_FOR_TASK_COMPLETED`: 等待一个任务完成。
    -   `taskId`: 要等待的任务ID。
-   `UNLOCK_CLUE`: 解锁一条新线索。
    -   `clueId`: 要解锁的线索ID。
-   `ACTIVATE_PUZZLE`: 激活一个谜题。
    -   `puzzleId`: 要激活的谜题ID。
-   `WAIT_FOR_PUZZLE_SOLVED`: 等待一个谜题被解决。
    -   `puzzleId`: 要等待的谜题ID。
-   `UPDATE_PUZZLE_STATE`: 更新一个谜题内部的状态。
    -   `puzzleId`: 谜题ID。
    -   `path`: 要修改的属性路径 (e.g., "variables.keyFound")。
    -   `value`: 新的值。

#### 8. 其他类型

-   `DISPLAY_SVM_CONTENT`: 在特定SVM的界面上显示内容。
    -   `svmId`, `contentType` (`text`/`image`/`audio`), `contentValueOrKey`
-   `TRIGGER_DATA_SYNC`: 触发向后端同步数据。

---

## 三、 导航逻辑

脚本的流程由各种 `nextStep` 字段控制。

-   `nextStep`: 最通用的下一步。
-   `nextStepOnTrue` / `nextStepOnFalse`: 用于 `branch` 步骤。
-   `nextStepOnAccept` / `nextStepOnDecline`: 用于 `taskOffer` 等步骤。
-   `choices`: `dialogue` 步骤中的选项，每个选项都有自己的 `nextStep`。

---

## 四、 高级功能

### 1. 条件判断 (`condition`)

`branch` 和 `waitForEvent` 步骤使用 `condition` 对象来定义逻辑。

**结构:**

-   **逻辑操作符:**
    ```yaml
    condition:
      operator: AND # 或 OR
      clauses:
        - { ...子条件1... }
        - { ...子条件2... }
    ```
-   **基本比较:**
    ```yaml
    condition:
      target: 'player' # 'player', 'svms', 'personas', 'eventData' 等
      id: 3 # 可选，用于数组或对象中的具体条目
      property: 'credits' # 要比较的属性名，支持点表示法 (e.g., 'data.level')
      operator: '>=' # '===', '!=', '>', '>=', '<', '<=', 'contains', 'not_contains'
      value: 100 # 要比较的值
    ```

### 2. 占位符替换

在 `dialogue` 的 `text` 或 `aiDialogue` 的 `prompt` 中，你可以使用 `${...}` 语法来动态插入世界状态的值。

**示例:**

```yaml
- stepId: 100
  type: dialogue
  persona: System
  text: "你好, ${player.name}。你当前有 ${player.credits} 信用点。SVM-3 的状态是: ${svms[3].status}。"
  nextStep: 101
```

解析器会自动将 `${player.name}` 替换为世界状态中 `player` 对象的 `name` 属性值。