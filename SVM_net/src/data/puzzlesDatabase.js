// SVM_net/src/data/puzzlesDatabase.js

/**
 * @typedef {object} Puzzle
 * @property {string} puzzleId - Unique identifier for the puzzle.
 * @property {string} title - Display name for the puzzle.
 * @property {string} description - Brief overview or current objective for the player.
 * @property {'locked' | 'unsolved' | 'solved'} status - Initial status in DB, typically 'locked' or 'unsolved'.
 * @property {'code' | 'observation' | 'sequence' | 'external_event'} solutionType - Defines how the puzzle is solved.
 * @property {any} [solution] - e.g., for solutionType: 'code', this would be the expected code string.
 * @property {object} [initialVariables] - Optional: an object defining initial internal state variables for this puzzle.
 * @property {string[]} [relatedClueIds] - Optional: Clue IDs relevant to this puzzle.
 * @property {import('../core/ScriptParser').ScriptStep[]} [onSolveActions] - Optional: A small sequence of script steps to execute immediately upon solving this puzzle.
 */

/** @type {Object.<string, Puzzle>} */
export const puzzlesDB = {
  firstPhotoClue: {
    puzzleId: 'firstPhotoClue',
    title: '被遮挡的照片',
    description: '还原Echo发来的照片中被遮挡的前两个字。',
    status: 'locked',
    solutionType: 'code',
    solution: '青衣', 
    initialVariables: { attemptsMade: 0, hintUnlocked: false },
    relatedClueIds: ['clue_echo_photo'],
    onSolveActions: [
      { type: 'UNLOCK_CLUE', clueId: 'clue_photo_revealed', nextStep: null },
      { type: 'dialogue', personaId: 'echo', text: '没错,就是这个地方...', nextStep: null }
    ],
    solvedDisplay: {
      type: 'text',
      content: "照片谜题解开了，这里是一个幼稚园。"
    }
  },

  newsPuzzle: {
    puzzleId: 'newsPuzzle',
    title: '新闻事件年份',
    description: '电脑中的新闻事件发生在哪一年？',
    status: 'locked',
    solutionType: 'code',
    solution: '2060',
    initialVariables: { attemptsMade: 0, hintUnlocked: false },
    relatedClueIds: ['clue_computer_news'],
    onSolveActions: [
      { type: 'UNLOCK_CLUE', clueId: 'email_photo', nextStep: null },
    ],
    solvedDisplay: {
      type: 'text',
      content: "你找到了新闻事件的年份 - 2060年。"
    }
  },

  newsPuzzle01: {
    puzzleId: 'newsPuzzle01',
    title: '新闻主角',
    description: '新闻主角是谁？（请用大写字母回答）',
    status: 'locked',
    solutionType: 'code',
    solution: 'SERA',
    initialVariables: { attemptsMade: 0, hintUnlocked: false },
    relatedClueIds: ['email_photo_01'],
    onSolveActions: [
      { type: 'UNLOCK_CLUE', clueId: 'email_photo_01', nextStep: null },
    ],
    solvedDisplay: {
      type: 'text',
      content: "你找到了新闻的主角 - SERA。"
    }
  },
  meaningPuzzle: {
    puzzleId: 'meaningPuzzle',
    title: '垃圾场的意义',
    description: '这个地方对你来说意味着什么？',
    status: 'locked',
    solutionType: 'code',
    solution: '家',
    initialVariables: { attemptsMade: 0, hintUnlocked: false },
    relatedClueIds: ['clue_echo_photo', 'clue_photo_revealed'],
    onSolveActions: [
    ],
    solvedDisplay: {
      type: 'text',
      content: "你明白了这个地方的意义 - 这里是家。"
    }
  },
  soulfulHerbalTea: {
    puzzleId: 'soulfulHerbalTea',
    title: '凉茶配方',
    description: '请在线下调好凉茶得到代码',
    status: 'locked',
    solutionType: 'code',
    solution: 'HerbalTea',
    initialVariables: { attemptsMade: 0, hintUnlocked: false },
    relatedClueIds: ['clue_echo_photo', 'clue_photo_revealed'],
    onSolveActions: [
    ],
    solvedDisplay: {
      type: 'text',
      content: "你成功调制出了正确的凉茶配方。"
    }
  },
  powerStationPuzzle: {
    puzzleId: 'powerStationPuzzle',
    title: '电站警告',
    description: '在这座废弃电站的控制室里，你发现了一些奇怪的标记。这些标记似乎在警告着什么...',
    status: 'locked',
    solutionType: 'code',
    solution: 'DANGER',
    initialVariables: { attemptsMade: 0, hintUnlocked: false },
    relatedClueIds: ['clue_power_station_marks', 'clue_control_room'],
    onSolveActions: [
      { type: 'dialogue', personaId: 'echo', text: '这里确实很危险...我们得小心行事。', nextStep: null }
    ],
    solvedDisplay: {
      type: 'text',
      content: "你成功解读了警告标记 - 这座电站充满危险。"
    }
  },

  libraryPuzzle: {
    puzzleId: 'libraryPuzzle',
    title: '隐藏的图书馆',
    description: '这所中学里似乎藏着一个图书馆，这所中学的名字是什么？（后两个字）',
    status: 'locked',
    solutionType: 'code',
    solution: '慕德',
    initialVariables: { attemptsMade: 0, hintUnlocked: false },
    relatedClueIds: ['clue_school_map', 'clue_library_hints'],
    onSolveActions: [
      { type: 'dialogue', personaId: 'echo', text: '慕德...这个名字背后一定还有更多故事。', nextStep: null }
    ],
    solvedDisplay: {
      type: 'text',
      content: "你找到了隐藏的图书馆 - 它位于慕德中学内。"
    }
  },
  playgroundPuzzle0: {
    puzzleId: 'playgroundPuzzle0',
    title: '兔子的数量',
    description: '可爱的兔子在跳跃。兔嘴兔尾朝上，兔身兔头不见，数目几何？',
    status: 'locked',
    solutionType: 'code',
    solution: '9',
    initialVariables: { attemptsMade: 0, hintUnlocked: false },
    relatedClueIds: ['clue_playground_rabbits'],
    onSolveActions: [
      { type: 'dialogue', personaId: 'echo', text: '没错，正好9只兔子...它们在告诉我们什么呢？', nextStep: null }
    ],
    solvedDisplay: {
      type: 'text',
      content: "这个数字似乎暗示着某种重要的信息。"
    }
  },
  playgroundPuzzle: {
    puzzleId: 'playgroundPuzzle',
    title: '井字棋的秘密',
    description: '在这个简单的井字棋游戏中，似乎隐藏着一个几何规律。仔细观察圆形的数量...',
    status: 'locked',
    solutionType: 'code',
    solution: '5',
    initialVariables: { attemptsMade: 0, hintUnlocked: false },
    relatedClueIds: ['clue_playground_tictactoe'],
    onSolveActions: [
      { type: 'dialogue', personaId: 'echo', text: '没错，正是5个圆...这代表着什么呢？', nextStep: null }
    ],
    solvedDisplay: {
      type: 'text',
      content: "你发现了井字棋中的5个圆形图案，这似乎暗示着某种重要的信息。"
    }
  },
  playgroundPuzzle1: {
    puzzleId: 'playgroundPuzzle1',
    title: '转盘处的隐秘数字',
    description: '在废弃的游乐场转盘处，你发现了一些神秘的数字痕迹。这些数字似乎在暗示着什么...',
    status: 'locked',
    solutionType: 'code',
    solution: '8',
    initialVariables: { attemptsMade: 0, hintUnlocked: false },
    relatedClueIds: ['clue_playground_tictactoe'],
    onSolveActions: [
      { type: 'dialogue', personaId: 'echo', text: '没错，是数字8...这个数字背后有什么含义呢？', nextStep: null }
    ],
    solvedDisplay: {
      type: 'text',
      content: "你在转盘上的照片处发现了数字8的痕迹，这个数字似乎暗示着某个重要的信息。"
    }
  },
  KM_archive_puzzle: {
    puzzleId: 'KM_archive_puzzle',
    title: '加密档案',
    description: '一个需要密码的加密档案。KGF留下的话似乎暗示着什么...',
    status: 'locked',
    solutionType: 'code',
    solution: 'PURIFICATION',
    initialVariables: { 
      attemptsMade: 0, 
      hintUnlocked: false,
      hintShown: false
    },
    relatedClueIds: ['clue_KGF_message'],
    onSolveActions: [
      { type: 'dialogue', personaId: 'system', text: '档案解密成功。', nextStep: null },
      { type: 'UNLOCK_CLUE', clueId: 'KM_archive_contents', nextStep: null }
    ],
    solvedDisplay: {
      type: 'text',
      content: "你成功解开了加密档案，里面的内容令人不安..."
    }
  },
  KGF_Blueprint_Puzzle: {
    puzzleId: 'KGF_Blueprint_Puzzle',
    title: 'KGF的笔记谜题',
    description: '笔记1："庇护所即是牢籠。" 笔记2："出口即是陷阱。" 笔记3："最穩固的支撐，來自於虛空。"',
    status: 'locked',
    solutionType: 'code',
    solution: 'ATEN',
    initialVariables: { 
      attemptsMade: 0, 
      hintUnlocked: false,
      hintShown: false
    },
    relatedClueIds: ['clue_KGF_notes'],
    onSolveActions: [
      { type: 'dialogue', personaId: 'system', text: '笔记谜题解开了。', nextStep: null },
      { type: 'UNLOCK_CLUE', clueId: 'KGF_blueprint_revealed', nextStep: null }
    ],
    solvedDisplay: {
      type: 'text',
      content: "你解开了KGF留下的笔记谜题，获得了重要的线索..."
    }
  },
  mingTakCodeEntry: {
    puzzleId: 'mingTakCodeEntry',
    title: '明德商场入口密码',
    description: '找到进入明德商场某个区域的密码。',
    status: 'locked', // Example: Starts locked
    solutionType: 'code',
    solution: '958', // Example solution code
    initialVariables: { attemptsMade: 0, hintUnlocked: false },
    relatedClueIds: ['clue_dragon_riddle', 'clue_clock_shop_observation'],
    onSolveActions: [
      { type: 'UNLOCK_CLUE', clueId: 'clue_mingTak_access_granted', nextStep: null },
      { type: 'dialogue', personaId: 'echo', text: '通路已开启...', nextStep: null }
    ],
    solvedDisplay: {
      type: 'text',
      content: "Access code accepted. The way into Ming Tak's restricted area is now open."
    }
  },
  gatekeeperPuzzle: {
    puzzleId: 'gatekeeperPuzzle',
    title: "Gatekeeper's Riddle",
    description: 'Solve the riddle to pass the ancient gate.',
    status: 'locked',
    solutionType: 'code',
    solution: 'open_sesame',
    initialVariables: { attempts: 0 },
    onSolveActions: [
        { type: 'dialogue', personaId: 'narrator', text: 'The Gatekeeper acknowledges your wisdom.', nextStep: null }
    ],
    solvedDisplay: {
      type: 'text',
      content: "The Gatekeeper's mechanism has whirred and retracted, granting passage. The ancient phrase was correct."
    }
  },
  disableMainframeSecurity: {
    puzzleId: 'disableMainframeSecurity',
    title: 'Disable Mainframe Security',
    description: 'The corporate mainframe is protected. Find a way to bypass its defenses.',
    status: 'locked',
    solutionType: 'sequence',
    solution: null,
    initialVariables: { stage: 1, coolantFlowing: false, accessKeyVerified: false, finalOverrideEngaged: false },
    onSolveActions: [{ type: 'dialogue', personaId: 'echo', text: 'Mainframe security disengaged.', nextStep: null }]
  },
  coolant_pump_code: {
    puzzleId: 'coolant_pump_code',
    title: 'Coolant Pump Activation',
    description: 'Find the code to activate the coolant pumps.',
    status: 'locked',
    solutionType: 'code',
    solution: 'C00L4NT',
    initialVariables: {},
    onSolveActions: [
        { type: 'dialogue', personaId: 'system_voice', text: 'Coolant pump activated.', nextStep: null }
    ]
  },
  access_key_puzzle: {
    puzzleId: 'access_key_puzzle',
    title: 'Security Terminal Access Key',
    description: 'Obtain and verify the access key for the security terminal.',
    status: 'locked',
    solutionType: 'code',
    solution: 'K3YMASTER',
    initialVariables: {},
    onSolveActions: [
        { type: 'dialogue', personaId: 'system_voice', text: 'Access key verified.', nextStep: null }
    ]
  }
};