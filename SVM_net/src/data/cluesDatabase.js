// src/data/cluesDatabase.js

/**
 * @typedef {Object} Clue
 * @property {string} id - Unique identifier for the clue.
 * @property {string} puzzleId - Identifier of the puzzle this clue belongs to.
 * @property {string} title - Short, displayable title for the clue.
 * @property {'text' | 'image_url' | 'audio_url' | 'video_url' | 'location_coord'} type - Type of clue content.
 * @property {string} content - The actual text, URL to media, or stringified coordinates.
 * @property {string} [description] - Optional longer description or player's thoughts about the clue.
 * @property {string} source - How the clue was obtained (e.g., "Echo_dialogue_A2", "SVM_HangHauStation_display").
 * @property {number} [timestamp] - When the clue was discovered (will be set on unlock).
 * @property {boolean} [isViewed] - Has the player explicitly viewed this clue in their log? (will be set to false on unlock).
 * @property {{ type: 'clue'|'svm'|'location'|'character', id: string }[]} [relatedEntities] - Links to other relevant game entities.
 */

/** @type {Record<string, Clue>} */
export const cluesDB = {
  HHMTR_01: {
    id: 'HHMTR_01',
    puzzleId: 'WhereIsIt',
    title: '来自Echo的神秘讯息',
    type: 'text',
    content: '在坑口地铁站附近，你会拾起一些过去的记忆。',
    description: '在Echo的办公室里找到的。',
    source: 'echo_dialogue_A01',
  },
  clue_echo_photo: {
    id: 'clue_echo_photo',
    puzzleId: 'firstPhotoClue',
    title: 'Echo发来的照片',
    type: 'image_url',
    content: '/assets/images/dump_0.png',
    description: '一张Echo发来的照片，看地点似乎有种熟悉的感觉，但我却不知道这里是哪里，不知为何，有一些部分被遮挡住了。',
    source: 'echo_message_photo',
    relatedEntities: [
      {
        type: 'character',
        id: 'echo'
      }
    ]
  },
  clue_photo_revealed: {
    id: 'clue_photo_revealed',
    puzzleId: 'firstPhotoClue',
    title: 'Echo发来的照片',
    type: 'image_url',
    content: '/assets/images/dump_0_un.jpg',
    description: '原来是一所幼稚园',
    source: 'echo_message_photo',
    relatedEntities: [
      {
        type: 'character',
        id: 'echo'
      }
    ]
  },
  clue_playground_tictactoe: {
    id: 'clue_playground_tictactoe',
    puzzleId: 'playgroundPuzzle',
    title: '神秘的井字棋',
    type: 'image_url',
    content: '/assets/images/game.png',
    description: '"左右上下列阵，圆不为叉所动，叉可随圆反转，圆叉叉叉圆叉。" - 这首诗似乎在描述一局井字棋的布局和变化。最后一句暗示了棋子的排列方式。',
    source: 'playground_puzzle_01',
    relatedEntities: [
      {
        type: 'location',
        id: 'playground'
      }
    ]
  },
  mingTak_note01: {
    id: 'mingTak_note01',
    puzzleId: 'mingTakMystery', // Example puzzle ID
    title: '地铁站的神秘便条',
    type: 'text',
    content: '“在明德商场，寻找时间的守护者。留意那些不再转动的指针。”',
    description: '在坑口地铁站一个旧广告牌后面找到的。',
    source: 'environment_pickup_A01', 
    // timestamp and isViewed will be populated by WorldStateContext when unlocked
  },
  mingTak_photo01: {
    id: 'mingTak_photo01',
    puzzleId: 'mingTakMystery',
    title: '一张褪色的商场照片',
    type: 'image_url',
    content: '/assets/images/ming_tak_old_photo.jpg', // Placeholder path
    description: '照片的背面写着一个日期，但字迹模糊不清。',
    source: 'svm_interaction_B02',
  },
  email_photo: {
    id: 'email_photo',
    puzzleId: 'newsPuzzle',
    title: '收到的邮件',
    type: 'image_url',
    content: '/assets/images/email.png', // Placeholder path
    description: '二十年前的时间介绍',
    source: 'svm_interaction_B02',
  },
  Kiera_new_card: {
    id: 'Kiera_new_card',
    puzzleId: 'newsPuzzle',
    title: '神秘的Kiera卡片',
    type: 'image_url',
    content: '/assets/images/kiera_new_card_closeup.png',
    description: '一张带有神秘符号的Kiera卡片',
    source: 'svm_interaction_B02',
  },
  // Add more predefined clues here as needed for different puzzles
};

// Function to get a clue by its ID, ensuring a fresh copy for modification (like setting timestamp)
export const getClueById = (clueId) => {
  const clueTemplate = cluesDB[clueId];
  if (clueTemplate) {
    return { ...clueTemplate }; // Return a copy
  }
  return null;
};