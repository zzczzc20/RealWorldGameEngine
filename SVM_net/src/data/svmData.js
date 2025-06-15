// src/data/svmData.js
const svms = [
  {
    id: 1,
    name: "Central Plaza SVM",
    status: "Online",
    location: "Central Plaza Mall",
    latitude: 22.2799,
    longitude: 114.1658,
    owner: "Protocol Zero",
    description:"A splinter group of former corporate security forces, maintaining strict discipline and protocols but operating outside the law. Known for coordinated tactics and high-grade (often stolen) equipment.",
    mapVisibility: false,
    displayableMedia: {
      entrancePhoto: {
        type: 'image_url',
        content: '/assets/images/ming_tak_entrance.png',
        caption: '明德商场入口 (测试图)'
      },
      gatekeeperHintText: {
        type: 'text',
        content: 'Hint: The guardian seeks a common magical phrase. All lowercase, words joined by an underscore.',
        caption: 'Gatekeeper Puzzle Hint'
      },
      gatekeeperSolvedMessage: {
        type: 'text',
        content: 'The way is open. The Gatekeeper acknowledges your wit.',
        caption: 'Gatekeeper Puzzle Solved'
      }
    },
    puzzleHooks: [
      {
        hookId: 'cp_display_hint_for_gatekeeper',
        mode: 'conditional_media_display',
        priority: 10,
        conditions: [
          { type: 'puzzleStatus', puzzleId: 'gatekeeperPuzzle', expectedStatus: 'unsolved' },
        ],
        mediaKey: 'gatekeeperHintText'
      },
      {
        hookId: 'cp_interact_gatekeeper',
        mode: 'puzzle_interaction_interface',
        priority: 5,
        conditions: [
          { type: 'puzzleStatus', puzzleId: 'gatekeeperPuzzle', expectedStatus: 'unsolved' }
        ],
        interactionType: 'code_input',
        puzzleIdToAffect: 'gatekeeperPuzzle',
        promptText: "Speak the ancient phrase to the Gatekeeper:",
        buttonText: "Utter Phrase"
      },
      {
        hookId: 'cp_gatekeeper_solved_display',
        mode: 'conditional_media_display',
        priority: 1,
        conditions: [
          { type: 'puzzleStatus', puzzleId: 'gatekeeperPuzzle', expectedStatus: 'solved' }
        ],
        mediaKey: 'gatekeeperSolvedMessage'
      }
    ]
  },
  {
    id: 2,
    name: "Metro Station SVM",
    status: "Online",
    location: "Downtown Metro Station",
    latitude: 22.2855,
    longitude: 114.1577,
    owner: "Chrome Zealots",
    description:"Believe heavily in cybernetic enhancement, often to the point of fanaticism, viewing unmodified flesh as heresy. Their modifications might be more baroque or extreme than practical.",
    mapVisibility: false
  },
  {
    id: 3, // Corrected ID
    name: "Tech Park SVM",
    status: "Offline",
    location: "Tech Innovation Park",
    latitude: 22.4200,
    longitude: 114.2086,
    owner: "Chrome Zealots",
    description:"Believe heavily in cybernetic enhancement, often to the point of fanaticism, viewing unmodified flesh as heresy. Their modifications might be more baroque or extreme than practical.",
    mapVisibility: false
  },
  {
    id: 4,
    name: "University SVM", // Restored name
    status: "Online",
    location: "City University Campus",
    latitude: 22.3378,
    longitude: 114.1731,
    owner: "Concrete Rats",
    description:"Masters of navigating the underbelly of the city – sewers, maintenance tunnels, hidden passages. Specialize in information gathering, smuggling, and guerilla tactics in tight urban spaces.",
    mapVisibility: false
  },
  {
    id: 5,
    name: "Beach Front SVM",
    status: "Offline",
    location: "Coastal Promenade",
    latitude: 22.2820,
    longitude: 114.1742,
    owner: "Forge Burners",
    description:"Often ex-factory workers or disgruntled engineers who target corporate industrial sites. Known for arson, sabotage, and using repurposed industrial tools as weapons.",
    mapVisibility: false
  },
  {
    id: 7,
    name: "Black Market SVM",
    status: "Online",
    location: "Underground District",
    latitude: 22.3050,
    longitude: 114.1695,
    owner: "Tiger Claws",
    description: "控制着城市大部分黑市交易的帮派，专门从事非法商品交易、走私和情报买卖。这台SVM是他们在地下区域的主要交易点，提供各种难以获取的工具和设备。",
    mapVisibility: false,
    locationName: "黑市"
  },
  {
    id: 8,
    name: "Peicheng playground",
    status: "Online",
    location: "Peicheng Playground",
    latitude: 22.3167,
    longitude: 114.267832,
    owner: "NSGD (Police)",
    description: "这是一处游乐场，孩子的乐园",
    mapVisibility: false
  },
  {
    id: 9,
    name: "Dump",
    status: "Online",
    location: "Underground District",
    latitude: 22.3153,
    longitude: 114.2661,
    owner: "NSGD (Police)",
    description: "由于资本垄断，垃圾回收的费用过高，这小角落成为了附近居民的废弃垃圾场，常有流浪者和无家可归者在此聚集。虽然环境恶劣，但偶尔会有意外的发现。",
    mapVisibility: true
  },
  {
    id: 10,
    name: "Shadowlane",
    status: "Online",
    location: "Underground District",
    latitude:  22.316917, 
    longitude: 114.266806,
    owner: "Shadow Syndicate (Tribe)",
    description: "一处暗巷，邪恶的事情在这里发生",
    mapVisibility: false
  },
  {
    id: 11,
    name: "MingTak Shopping Mall",
    status: "Online",
    location:  "Underground District",
    latitude: 22.31606,
    longitude: 114.268276,
    owner: "NSGD (Police)",
    description: "坑口区平民窟附近的商场，阿明上班的OK便利店所在的位置，也是主人公和阿明遇见的地方",
    mapVisibility: false
  }
];

export default svms;