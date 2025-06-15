# SVM_net 轻量级后端集成计划 (v0.2 - 线下活动数据收集版)

## 1. 项目目标与范围 (修订版)

**1.1 核心目标**

本计划旨在为 SVM_net 项目的线下活动快速搭建一个**轻量化到极致**的后端服务。其核心目标是**收集并存储**前端应用在用户参与活动过程中产生的关键交互数据。此后端的主要服务对象是活动组织者，用于后续的数据分析和用户行为理解。

**1.2 核心收集数据**

后端将主要收集以下类型的数据，这些数据通常存储在前端的 `localStorage` 中或由前端应用实时生成：

*   **聊天记录 (`chatHistory`)**: 用户与不同 Persona 的完整对话历史。这将以 JSON 格式存储。
*   **玩家状态 (`playerState`)**: 包括玩家的基本信息（如 `player.name`, `player.credits`）、物品栏 (`player.inventory`)、声望 (`player.reputation`) 等。以 JSON 格式存储。
*   **已发现线索 (`discoveredClues`)**: 玩家在游戏中解锁的线索列表。以 JSON 格式存储。
*   **谜题状态 (`currentPuzzleState`)**: 玩家正在进行的或已完成的谜题的状态和进度。以 JSON 格式存储。
*   **重要游戏事件日志 (`eventLog`)**: 可选，用于记录玩家触发的关键游戏事件（如任务接受/完成、重要选择等），每条日志包含事件类型、时间戳和相关参数。

**1.3 范围限制**

为确保方案的轻量化和快速实施，本项目范围严格限定如下：

*   **数据单向同步**: 数据流主要为前端向后端发送，后端负责持久化存储。不包含复杂的双向数据同步或实时状态更新功能。
*   **无复杂用户认证**: 初期不设立独立的用户账户系统或密码认证机制。使用前端生成的唯一会话ID (Session ID) 来区分和关联来自不同用户/设备的数据。
*   **本地化/简易部署优先**: 后端服务设计为易于在本地环境（如活动现场的服务器或开发人员的笔记本电脑）快速部署和运行。
*   **功能最小化**: 仅实现数据接收和存储的核心功能，避免不必要的复杂性。

## 2. 技术选型 (轻量化)

*   **后端框架**: **Flask (Python)** - 以其微框架特性、简洁性和快速开发能力被选用。
*   **数据库**: **SQLite** - 单文件、无服务器的数据库引擎，配置简单，无需额外服务安装，非常适合轻量级应用和快速原型开发。
*   **数据交换格式**: **JSON** - 通用、易于人类阅读和机器解析的数据格式。

## 3. 数据模型 (SQLite)

数据库将包含一个核心数据表，用于存储所有收集到的用户活动数据。

**表名: `UserActivityLog`**

| 字段名             | 类型                                     | 约束/描述                                     |
| ------------------ | ---------------------------------------- | --------------------------------------------- |
| `id`               | INTEGER                                  | PRIMARY KEY AUTOINCREMENT                     |
| `session_id`       | TEXT                                     | NOT NULL, 用于标识唯一用户会话                 |
| `data_type`        | TEXT                                     | NOT NULL, 描述数据类型 (e.g., "chatHistory", "playerState", "puzzleAttempt", "eventLog") |
| `data_content`     | TEXT                                     | NOT NULL, 存储 JSON 序列化后的具体数据内容     |
| `client_timestamp` | TEXT                                     | NOT NULL, ISO8601 格式，数据在客户端产生的时间戳 |
| `server_timestamp` | DATETIME                                 | DEFAULT CURRENT_TIMESTAMP, 数据被服务器接收的时间戳 |

**说明:**
*   `session_id`: 由前端生成一个 UUID，并在整个用户活动期间保持一致，随每次数据提交发送。
*   `data_type`: 使得可以存储多种不同结构的数据在同一个表中，方便查询时按类型筛选。
*   `data_content`: 存储如 `chatHistory` 对象、`player` 对象等的完整 JSON 字符串。

## 4. API 设计 (Flask - 极简)

后端将提供一个核心 API 端点用于接收前端提交的数据。

**端点: `POST /api/log_data`**

*   **请求方法**: `POST`
*   **请求头**: `Content-Type: application/json`
*   **请求体 (JSON)**:
    ```json
    {
      "sessionId": "string_unique_session_identifier",
      "dataType": "string_data_category", // e.g., "chatHistory", "playerState", "discoveredClues", "currentPuzzleState"
      "clientTimestamp": "string_iso_8601_timestamp", // e.g., "2025-05-11T14:30:00Z"
      "payload": { /* JSON object or array, a.k.a. data_content */ } 
    }
    ```
    **示例 - 提交聊天记录:**
    ```json
    {
      "sessionId": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      "dataType": "chatHistory",
      "clientTimestamp": "2025-05-11T14:35:10Z",
      "payload": {
        "Echo": [
          {"role": "Echo", "content": "Message 1...", "timestamp": "..."},
          {"role": "Player", "content": "Response 1...", "timestamp": "..."}
        ],
        "AhMing": [
          {"role": "AhMing", "content": "Ming's message...", "timestamp": "..."}
        ]
      }
    }
    ```
    **示例 - 提交玩家状态:**
    ```json
    {
      "sessionId": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      "dataType": "playerState",
      "clientTimestamp": "2025-05-11T14:36:00Z",
      "payload": {
        "name": "Neon Runner",
        "credits": 950,
        "inventory": [{"id": "item_A", "quantity": 1}],
        "reputation": {"corp_X": 10}
      }
    }
    ```

*   **响应**:
    *   **成功 (201 Created)**:
        ```json
        {
          "status": "success",
          "message": "Data logged successfully.",
          "log_id": 123 // 新插入记录的 id (可选)
        }
        ```
    *   **失败 (例如 400 Bad Request, 500 Internal Server Error)**:
        ```json
        {
          "status": "error",
          "message": "Error description."
        }
        ```

## 5. 前端集成概要

前端应用需要进行以下改造以配合轻量级后端：

1.  **Session ID 管理**:
    *   在应用首次加载时，检查 `localStorage` 中是否存在 `sessionId`。
    *   如果不存在，则生成一个新的 UUID (v4) 作为 `sessionId`，并将其存储在 `localStorage` 中。
    *   后续所有对 `/api/log_data` 的请求都应包含此 `sessionId`。

2.  **数据收集与封装**:
    *   编写通用函数从 `localStorage` 中读取指定键（如 `worldState`）的数据。
    *   从 `worldState` 中提取需要上传的核心数据片段（如 `chatHistories`, `player`, `discoveredClues`, `currentPuzzleState`）。
    *   为每种数据类型（或每次提交），构建符合 `/api/log_data` 请求体格式的 JSON 对象，包含 `sessionId`、`dataType`、当前的客户端时间戳 (`clientTimestamp`) 以及实际的 `payload`。

3.  **数据发送**:
    *   确定数据发送的时机：
        *   **特定事件触发**: 例如，当一个重要的游戏章节结束、玩家完成一个关键任务、或 `chatHistory` 发生显著变化后。
        *   **定期批量发送**: 例如，每隔几分钟，将期间积累的所有待发送数据打包发送（可能需要前端队列管理）。
        *   **活动结束时**: 在用户明确表示结束活动或关闭应用前，尝试发送所有未发送的数据。
    *   使用浏览器的 `fetch` API (或 `axios` 等库) 向 `/api/log_data` 端点发送 `POST` 请求。

4.  **错误处理与重试机制 (可选但推荐)**:
    *   处理网络请求失败的情况（例如，服务器不可达）。
    *   考虑实现简单的重试机制，或将发送失败的数据暂存在前端队列中，稍后再次尝试。

## 6. 后端实现步骤 (Flask + SQLite)

1.  **环境准备**:
    *   安装 Python 3.x。
    *   创建项目目录，设置虚拟环境 (e.g., `python -m venv venv`)。
    *   激活虚拟环境，安装 Flask: `pip install Flask`.

2.  **Flask 应用基础**:
    *   创建主应用文件 (e.g., `app.py`)。
    *   初始化 Flask 应用实例。

3.  **数据库初始化**:
    *   在 `app.py` 或单独的 `database.py` 中编写函数：
        *   连接到 SQLite 数据库文件 (e.g., `user_data.db`)。如果文件不存在，SQLite 会自动创建。
        *   执行 `CREATE TABLE IF NOT EXISTS UserActivityLog (...)` SQL语句来创建表（如果尚不存在）。
    *   可以在应用启动时调用此初始化函数。

4.  **API 端点实现 (`/api/log_data`)**:
    *   在 `app.py` 中定义路由和处理函数。
    *   函数接收 POST 请求，从 `request.json` 获取数据。
    *   进行基本的数据校验（例如，`sessionId`, `dataType`, `payload` 是否存在）。
    *   将 `payload` (实际数据内容) JSON 序列化为字符串。
    *   使用 `sqlite3` 模块连接数据库，执行 `INSERT` 语句将数据（`session_id`, `data_type`, 序列化后的 `payload`, `client_timestamp`）存入 `UserActivityLog` 表。
    *   返回成功的 JSON 响应。处理可能的数据库错误并返回相应的错误响应。

5.  **运行与测试**:
    *   通过 `flask run` (或 `python app.py`) 启动 Flask 开发服务器。
    *   使用 Postman、curl 或编写简单的 Python 脚本来发送测试数据到 `/api/log_data` 端点，验证数据是否正确存入 SQLite 数据库。

## 7. 部署与运维 (极简方案)

*   **部署**:
    *   在用于线下活动的计算机上安装 Python 和 Flask。
    *   将 Flask 应用代码（`app.py` 等）和 SQLite 数据库文件（例如 `user_data.db`，初始为空或已创建表结构）放置在同一目录或指定路径。
    *   通过命令行在该计算机上启动 Flask 应用 (`flask run --host=0.0.0.0` 使其可被局域网内设备访问，如果前端应用运行在不同设备上)。
    *   确保防火墙允许对 Flask 应用端口（默认为 5000）的访问。
*   **数据访问与导出**:
    *   活动期间或结束后，可以直接使用 SQLite 数据库浏览器工具 (如 DB Browser for SQLite) 打开 `user_data.db` 文件来查看、查询和导出数据 (如导出为 CSV)。
*   **数据备份**:
    *   定期（例如，每小时或每日活动结束时）手动复制 `user_data.db` 文件到安全位置（如U盘、云存储）作为备份。

## 8. 总结

此轻量级后端集成计划旨在以最小的开发成本和最快的速度，为 SVM_net 项目的线下活动提供一个可靠的用户数据收集方案。通过采用 Flask 和 SQLite，我们可以快速搭建并部署一个满足核心需求的后端服务，为后续的用户行为分析和产品迭代提供数据支持。该方案保持了极大的简洁性，避免了当前阶段不必要的复杂功能。

## 9. 未来迭代方向

虽然当前版本的后端以极致轻量化为目标，主要服务于线下活动的数据单向收集，但随着项目的发展和用户需求的增加，未来可以考虑以下迭代方向，以构建一个更全面、更强大的后端系统：

1.  **用户账户系统与认证**:
    *   实现完整的用户注册、登录和会话管理机制（例如，使用用户名/密码，或集成OAuth等第三方登录）。
    *   用户数据将与特定账户严格绑定，为个性化服务和跨设备数据同步打下基础。
    *   **实现细节考量**:
        *   选择合适的认证库/框架（如Flask-Login, Flask-Security, 或针对API的JWT方案）。
        *   设计用户表结构（用户ID, 用户名, 密码哈希, 邮箱等）。
        *   实现注册、登录、登出、密码重置等API端点。
        *   前端需要相应的UI界面和API调用逻辑。

2.  **双向数据同步与状态恢复 (详细方案计划)**:
    *   **2.1 核心目标与用户场景**:
        *   **目标**: 允许已认证用户将其游戏核心状态（如玩家进度、聊天记录、脚本状态等）保存到云端，并在需要时（如更换设备、重新安装应用、或从特定存档点恢复）从云端恢复这些状态到前端应用。
        *   **场景**:
            *   玩家在新设备上登录后，可以下载其最新的云存档继续游戏。
            *   玩家在本地数据意外丢失后，可以从云端恢复。
            *   （高级）玩家可以在多个设备间交替游戏，云端作为状态同步的中心。

    *   **2.2 前提条件**:
        *   **用户账户系统**: 必须已实现，所有状态数据与唯一用户ID关联。
        *   **后端数据存储调整**:
            *   可能需要一个新的表，例如 `UserGameStates`，用于存储每个用户的完整或部分可恢复状态快照。
            *   `UserGameStates` 表结构示例 (SQLite):
                *   `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
                *   `user_id` (INTEGER NOT NULL, FOREIGN KEY references Users(id))
                *   `state_snapshot` (TEXT NOT NULL) - 存储JSON序列化后的完整游戏状态。
                *   `version_timestamp` (TEXT NOT NULL, ISO8601 format) - 存档创建时间戳，用于版本控制和排序。
                *   `description` (TEXT, NULLABLE) - 用户或系统生成的存档描述。
                *   `is_auto_save` (BOOLEAN DEFAULT FALSE) - 标记是否为自动存档。
            *   考虑为 `(user_id, version_timestamp)` 创建唯一索引或将其作为复合主键的一部分。

    *   **2.3 数据同步机制设计**:
        *   **2.3.1 数据范围定义**:
            *   明确哪些前端状态需要被同步。关键数据包括：
                *   `WorldStateContext`: `player`, `chatHistories`, `discoveredClues`, `currentPuzzleState`, `svms` (可能只同步关键变化或配置), `activeTask`。
                *   `ScriptContext`: `activeEngineDetails` (用于恢复脚本执行状态和当前步骤)。
            *   前端需要提供一个函数来收集和序列化这些状态为一个统一的JSON对象。
        *   **2.3.2 上传 (前端到后端 - 状态保存)**:
            *   **API 端点 (Flask)**: `POST /api/v1/user/gamestate`
                *   请求头: 需要包含认证凭证 (如 JWT Bearer Token)。
                *   请求体 (JSON):
                    ```json
                    {
                      "stateData": { /* 序列化后的完整游戏状态对象 */ },
                      "description": "手动存档 - 完成第一章", // 可选
                      "isAutoSave": false // 可选
                    }
                    ```
                *   后端逻辑: 验证用户身份，接收状态数据，生成/使用客户端提供的时间戳作为版本标识，存入 `UserGameStates` 表。可限制用户存档数量或总大小。
            *   **触发时机**:
                *   用户手动触发“云存档”按钮。
                *   游戏内关键节点自动触发（例如，完成一个主要任务或章节后，由脚本通过 `TRIGGER_DATA_SYNC` 配合特定payload，或前端直接调用）。
                *   应用退出前（`beforeunload` 事件，尽力而为）。
        *   **2.3.3 下载 (后端到前端 - 状态恢复)**:
            *   **API 端点 (Flask)**:
                *   `GET /api/v1/user/gamestate/latest`: 获取用户最新的云存档。
                *   `GET /api/v1/user/gamestate/versions`: 获取用户所有云存档的版本列表（时间戳、描述）。
                *   `GET /api/v1/user/gamestate/<version_timestamp>`: 获取指定版本的云存档。
                *   请求头: 需要包含认证凭证。
                *   响应体 (JSON):
                    ```json
                    {
                      "userId": "user_id_here",
                      "versionTimestamp": "timestamp_of_this_save",
                      "description": "存档描述",
                      "stateData": { /* 反序列化后的游戏状态对象 */ }
                    }
                    ```
            *   **触发时机**:
                *   用户登录后，应用初始化时自动检查并提示是否有云存档可恢复。
                *   用户从存档列表中手动选择一个版本进行恢复。
        *   **2.3.4 数据冲突处理策略 (初期简化)**:
            *   **上传时**: 默认采用“最后写入者获胜”(LWW)策略，即新的上传会覆盖同用户较旧的“最新”标记（如果只保留一个最新档的话），或者直接新增一条带时间戳的记录。如果限制存档槽位，则可能覆盖最旧的非保护存档。
            *   **下载/恢复时**: 如果本地存在未同步的较新更改，应提示用户：“云端存档与本地进度存在差异。选择：[使用云端存档覆盖本地] 或 [保留本地进度（本次不恢复）]”。复杂的自动合并初期不考虑。

    *   **2.4 前端实现要点**:
        *   **状态管理**: `WorldStateContext` 和 `ScriptContext` 需要提供方法来接收从服务器获取的状态数据，并用其安全地重置或更新当前上下文的状态。这可能涉及到清空现有状态、重新加载引擎等操作。
        *   **UI/UX**:
            *   提供“云存档”、“加载云存档”、“管理云存档”的界面。
            *   清晰展示同步状态（进行中、成功、失败）和错误信息。
            *   在恢复存档前进行用户确认。
        *   **错误处理**: 健壮地处理网络错误、认证失败、服务器错误等。

    *   **2.5 后端实现要点 (Flask + SQLite/升级数据库)**:
        *   **认证集成**: 所有相关API端点必须受用户认证保护。
        *   **数据库操作**: 实现对 `UserGameStates` 表的CRUD操作。
        *   **数据校验**: 对接收到的 `stateData` 进行基础的结构校验，防止存入格式错误的数据。
        *   **（提及）更优技术栈**:
            *   **数据库**: 对于频繁更新和查询整个状态快照，NoSQL数据库（如MongoDB）可能更自然。PostgreSQL的JSONB类型也是强大选项。
            *   **实时/差异同步**: 若追求更无缝的体验（如Google Docs般的后台同步），WebSocket是必需的，配合差异比较与合并算法（例如Operational Transformation或CRDTs），但这将是显著的复杂度提升，远超当前轻量级目标。

    *   **2.6 安全性与数据一致性**:
        *   所有状态数据通过HTTPS传输。
        *   后端在写入数据库时，应确保操作的原子性（对SQLite来说，单条INSERT/UPDATE通常是原子的）。
        *   定期备份后端数据库。

    *   **2.7 分阶段实施建议**:
        *   **MVP**: 实现用户手动触发的完整状态上传（保存到最新槽位）和从最新槽位下载恢复。
        *   **V2**: 支持多存档槽位（基于时间戳版本），允许用户查看版本列表并选择恢复。加入定期自动云存档功能。
        *   **V3 (高级)**: 探索更细粒度的状态同步（例如，只同步变化的部分，但这需要更复杂的客户端和服务器端逻辑）或基于WebSocket的近实时同步（如果项目需求明确）。

3.  **数据库升级与优化**:
    *   当数据量持续增长或查询分析需求变得复杂时，考虑从 SQLite 迁移到更专业的数据库解决方案，例如：
        *   **PostgreSQL**: 功能强大的开源关系型数据库，适合结构化数据和复杂查询。
        *   **MongoDB**: 流行的 NoSQL 文档数据库，对于存储灵活多变的 JSON 结构数据（如游戏状态、聊天记录）具有优势。
    *   针对新数据库进行性能优化、索引建立和备份策略调整。

4.  **实时交互功能 (WebSocket)**:
    *   集成 WebSocket 技术，建立持久的双向通信通道，以支持：
        *   玩家间的实时互动（如组队、交易、PvP等，如果游戏设计需要）。
        *   服务器驱动的全局游戏事件（如天气变化、特殊NPC出现、限时活动开启）。
        *   更即时的状态通知和更新。

5.  **API 扩展与后端逻辑增强**:
    *   根据游戏玩法的丰富和运营需求，增加更多功能的 API 端点，例如：
        *   排行榜系统（数据计算与查询）。
        *   成就系统（成就达成验证与记录）。
        *   游戏内购或虚拟物品交易的服务器端验证与处理。
        *   更复杂的服务器端游戏逻辑（如AI NPC行为控制、大型副本状态管理、反作弊机制）。

6.  **安全性增强**:
    *   引入更完善的API安全机制，如基于Token的认证（JWT）、API请求频率限制、输入数据严格校验等。
    *   加强数据传输安全（如全站HTTPS）。
    *   数据库访问权限控制、数据加密存储（针对敏感信息）。

7.  **部署与运维的专业化**:
    *   从本地运行转向专业的云平台部署（如AWS, Google Cloud, Azure, 阿里云等），利用其提供的弹性计算、托管数据库、负载均衡、CDN等服务。
    *   采用容器化技术（如 Docker, Kubernetes）简化部署和管理，实现服务的可移植性和弹性伸缩。
    *   建立 CI/CD (持续集成/持续部署) 流程，自动化测试和上线过程。
    *   完善日志收集、系统监控和告警机制，确保服务稳定性和快速故障响应。

8.  **数据分析与洞察平台**:
    *   将收集到的用户行为数据对接到专业的数据分析工具或平台（如Google Analytics, Mixpanel, 或自建数据仓库+BI工具）。
    *   进行更深入的用户画像分析、游戏漏斗分析、留存分析、付费行为分析等，为产品迭代、运营策略调整和商业决策提供数据驱动的洞察。

这些迭代方向可以根据项目的实际进展、资源投入和市场反馈分阶段、有选择地进行实施，逐步将轻量级的数据收集后端演进为一个功能完善、性能可靠、安全可扩展的“真正的后端”系统。