import React, { useState, useEffect, useRef } from 'react'; // Import useRef
import ChatWindow from './ChatWindow';
import { subscribe, unsubscribe } from '../services/EventService';
import { useWorldStateContext } from '../context/WorldStateContext';
import { useScriptContext } from '../context/ScriptContext';
import PERSONAS from '../data/personaData';

/**
 * @typedef {Object} ChatMessage
 * @property {string} role - The role of the message sender (e.g., 'user', 'assistant', personaId, 'system', 'script').
 * @property {string} content - The text content of the message.
 * @property {string} [image] - Optional URL of an image associated with the message.
 * @property {string} [source] - Optional source of the message (e.g., 'script', 'ai-script').
 * @property {number} [stepId] - Optional script step ID.
 * @property {string} [scriptId] - Optional script ID.
 */

function AIChatContainer({ isVisible, onClose, apiProvider, apiKey, language, onUnreadMessagesChange }) { // Added apiProvider
  const { activeEngineDetails } = useScriptContext();
  const { 
    svms, 
    activeTask, 
    personas, 
    /** @type {Record<string, ChatMessage[]>} */
    chatHistories,
    setChatHistories,
    updatePersonaFavorability
  } = useWorldStateContext();
  
  const [activePersona, setActivePersona] = useState(null);
  const [aiTypingState, setAiTypingState] = useState({}); // Tracks AI typing status per persona
  
  const initialUnreadMessages = {};
  PERSONAS.forEach(persona => {
    initialUnreadMessages[persona.id] = false;
  });
  const [unreadMessages, setUnreadMessages] = useState(initialUnreadMessages);

  const lastProcessedStepRef = useRef(null); // For dialogue steps from currentScriptStep
  const lastNavigatedStepRef = useRef(null);
  const processedAiDialogueStepsRef = useRef(new Set()); // For aiDialogueReady events
  const lastAiDialogueStepProcessedForTypingRef = useRef(null); // For triggering AI typing indicator
  const processedDialogueStepsRef = useRef(new Set()); // For script dialogue steps

  useEffect(() => {
    if (activePersona) {
      setUnreadMessages(prev => ({ ...prev, [activePersona]: false }));
    }
  }, [activePersona]);
  
  useEffect(() => {
    const hasUnread = Object.values(unreadMessages).some(unread => unread);
    onUnreadMessagesChange(hasUnread);
  }, [unreadMessages, onUnreadMessagesChange]);
  
  const activeScriptEntry = activeEngineDetails.size > 0 ? [...activeEngineDetails.entries()][0] : null;
  const activeScriptId = activeScriptEntry ? activeScriptEntry[0] : null;
  const currentScriptStep = activeScriptEntry ? activeScriptEntry[1] : null; 

  useEffect(() => {
    console.log(`[AIChatContainer] Active script ID changed to: ${activeScriptId}. Clearing processed refs.`);
    processedAiDialogueStepsRef.current.clear();
    lastAiDialogueStepProcessedForTypingRef.current = null;
    processedDialogueStepsRef.current.clear(); // Clear this ref too
  }, [activeScriptId]);
 
  const formattedScriptContext = Array.from(activeEngineDetails.entries()).map(([scriptId, step]) => {
    if (step) return `${scriptId} (Step: ${step.stepId} - ${step.type})`;
    return `${scriptId} (Unknown)`;
  });

  useEffect(() => {
    if (currentScriptStep && currentScriptStep.stepId !== undefined) {
        const stepIdentifierForProcessing = `${activeScriptId}-${currentScriptStep.stepId}`; // Used for lastProcessedStepRef
        if (lastProcessedStepRef.current !== stepIdentifierForProcessing) {
           // This ref is mainly for preventing re-adding 'dialogue' type messages if currentScriptStep object changes identity but not content.
           // For aiDialogue, the message addition is handled by 'aiDialogueReady' event.
           lastProcessedStepRef.current = stepIdentifierForProcessing; 
        }

        const stepPersonaRaw = currentScriptStep.persona; 
        const stepOwnerRaw = currentScriptStep.owner || stepPersonaRaw; 
        const stepCharacterRaw = currentScriptStep.character || stepPersonaRaw;
        
        const ownerPersonaObj = PERSONAS.find(p => p.id.toLowerCase() === (stepOwnerRaw || '').toLowerCase());
        const ownerId = ownerPersonaObj ? ownerPersonaObj.id : 'Nova'; // Owner of the chat window for this dialogue/aiDialogue
        
        const characterPersonaObj = PERSONAS.find(p => p.id.toLowerCase() === (stepCharacterRaw || '').toLowerCase());
        const characterId = characterPersonaObj ? characterPersonaObj.id : 'Nova'; // Actual character speaking in 'dialogue'

        const currentStepIdentifierNav = `${activeScriptId}-${currentScriptStep.stepId}`; // Used for lastNavigatedStepRef

        // Handle AI Typing indicator start & Navigation for AI Dialogue
        // Handle AI Typing indicator start & Navigation for AI Dialogue
        if (currentScriptStep.type === 'aiDialogue') {
          const aiStepIdentifier = `${activeScriptId}-${currentScriptStep.stepId}`;
          
          // New logic: Immediately add the prompt as the first message
          if (!processedAiDialogueStepsRef.current.has(aiStepIdentifier)) {
            /** @type {ChatMessage} */
            const initialMessage = {
              role: currentScriptStep.persona, // The AI persona is the speaker
              content: currentScriptStep.prompt,
              source: 'script',
              stepId: currentScriptStep.stepId,
              scriptId: activeScriptId,
            };

            setChatHistories(prevChatHistories => {
              const currentHistory = prevChatHistories?.[ownerId] || [];
              return { ...prevChatHistories, [ownerId]: [...currentHistory, initialMessage] };
            });

            processedAiDialogueStepsRef.current.add(aiStepIdentifier);
            console.log(`[AIChatContainer] Added initial aiDialogue prompt for step ${aiStepIdentifier}`);
          }

          // REMOVED: AI Typing indicator logic is no longer needed for the first message.
          // const aiStepIdentifierForTyping = `${activeScriptId}-${currentScriptStep.stepId}`;
          // if (lastAiDialogueStepProcessedForTypingRef.current !== aiStepIdentifierForTyping) {
          //   const typingOwnerId = ownerId;
          //   console.log(`[AIChatContainer] aiDialogue step ${aiStepIdentifierForTyping} detected. Setting typing true for ${typingOwnerId}.`);
          //   setAiTypingState(prev => ({ ...prev, [typingOwnerId]: true }));
          //   lastAiDialogueStepProcessedForTypingRef.current = aiStepIdentifierForTyping;
          // }
          
          // Navigation for AI Dialogue
          if (lastNavigatedStepRef.current !== currentStepIdentifierNav) {
            const targetPersonaIdForNav = ownerId;
            const targetPersonaData = personas[targetPersonaIdForNav];
            if (targetPersonaData?.requiresChatWindow) {
                console.log(`[AIChatContainer] Navigating to ${targetPersonaIdForNav} (requiresChatWindow: true) for aiDialogue step.`);
                setActivePersona(targetPersonaIdForNav);
            }
            lastNavigatedStepRef.current = currentStepIdentifierNav;
          }
        } else if (currentScriptStep.type === 'dialogue') {
            const dialogueStepIdentifier = `${activeScriptId}-${currentScriptStep.stepId}`;
            if (!processedDialogueStepsRef.current.has(dialogueStepIdentifier)) {
                /** @type {ChatMessage} */
                const scriptMessage = {
                    role: characterId,
                    content: currentScriptStep.text,
                    image: currentScriptStep.image,
                    audio: currentScriptStep.audio,
                    source: 'script',
                    stepId: currentScriptStep.stepId,
                    scriptId: activeScriptId
                };
                
                setChatHistories(prevChatHistories => {
                    const currentHistory = prevChatHistories?.[ownerId] || [];
                    // The inner de-dup based on lastMsg can be kept as a secondary safeguard,
                    // but the processedDialogueStepsRef should be the primary guard.
                    const lastMsg = currentHistory[currentHistory.length - 1];
                    if (lastMsg && lastMsg.scriptId === scriptMessage.scriptId && lastMsg.stepId === scriptMessage.stepId && lastMsg.source === scriptMessage.source && lastMsg.content === scriptMessage.content) {
                        console.log(`[AIChatContainer] Dialogue message for ${dialogueStepIdentifier} already present by content check. This should ideally be caught by processedDialogueStepsRef.`);
                        return prevChatHistories;
                    }
                    console.log(`[AIChatContainer] Adding dialogue message for owner ${ownerId} (Step: ${dialogueStepIdentifier}):`, scriptMessage);
                    return { ...prevChatHistories, [ownerId]: [...currentHistory, scriptMessage] };
                });
                processedDialogueStepsRef.current.add(dialogueStepIdentifier);
                console.log(`[AIChatContainer] Marked dialogue step ${dialogueStepIdentifier} as processed.`);

            } else {
                console.log(`[AIChatContainer] Dialogue step ${dialogueStepIdentifier} already processed by processedDialogueStepsRef. Skipping message add.`);
            }

            // Navigation for Dialogue
            if (lastNavigatedStepRef.current !== currentStepIdentifierNav) {
                const targetPersonaIdForNav = ownerId; // For dialogue, navigate to owner
                // const targetPersonaData = PERSONAS.find(p => p.id === targetPersonaIdForNav); // OLD: Uses static data
                const targetPersonaData = personas[targetPersonaIdForNav]; // NEW: Uses dynamic state from WorldStateContext
                if (targetPersonaData?.requiresChatWindow) {
                    console.log(`[AIChatContainer] Navigating to ${targetPersonaIdForNav} (requiresChatWindow: true) for dialogue step.`);
                    setActivePersona(targetPersonaIdForNav);
                }
                lastNavigatedStepRef.current = currentStepIdentifierNav; 
            }
            if (ownerId !== activePersona) {
                setUnreadMessages(prev => ({ ...prev, [ownerId]: true }));
            }
        }
        // Clear typing state if current step is not aiDialogue (or if it's a new non-aiDialogue step)
        // This might be too broad, typing state is cleared by aiDialogueReady.
        // else if (aiTypingState[ownerId]) {
        //   setAiTypingState(prev => ({ ...prev, [ownerId]: false }));
        // }

    } else { 
        lastProcessedStepRef.current = null;
        lastNavigatedStepRef.current = null;
        // Consider clearing lastAiDialogueStepProcessedForTypingRef.current = null; if script truly ends.
    }
  }, [currentScriptStep, activeScriptId, activePersona, setActivePersona, setChatHistories, personas]); // ADDED 'personas' to dependency array

  useEffect(() => {
    const handlePersonaUpdate = (data) => {
      if (data && data.id && data.property === 'requiresChatWindow' && data.value === true) {
        setActivePersona(data.id);
      }
    };
    subscribe('persona_updated', handlePersonaUpdate);
    return () => unsubscribe('persona_updated', handlePersonaUpdate);
  }, []);

  useEffect(() => { 
    const handleAIDialogue = (data) => {
      if (!data || !data.text || !data.scriptId || data.stepId === undefined) {
        console.warn("[AIChatContainer aiDialogueReady] Incomplete data:", data);
        return;
      }
      
      const aiOwnerRaw = data.owner || data.persona || data.character;
      const aiOwnerPersona = PERSONAS.find(p => p.id.toLowerCase() === (aiOwnerRaw || '').toLowerCase());
      const ownerIdForMessage = aiOwnerPersona ? aiOwnerPersona.id : 'Nova';

      const aiMessageStepIdentifier = `${data.scriptId}-${data.stepId}`;
      if (processedAiDialogueStepsRef.current.has(aiMessageStepIdentifier)) {
        console.log(`[AIChatContainer aiDialogueReady] Step ${aiMessageStepIdentifier} already processed. Clearing typing for ${ownerIdForMessage}.`);
        setAiTypingState(prev => ({ ...prev, [ownerIdForMessage]: false }));
        return;
      }

      const aiCharacterRaw = data.character || data.persona;
      const aiCharacterPersona = PERSONAS.find(p => p.id.toLowerCase() === (aiCharacterRaw || '').toLowerCase());
      const characterIdForMessage = aiCharacterPersona ? aiCharacterPersona.id : 'Nova';
      
      let messageContent = data.text;
      const favorabilityRegex = /update_favorability\((-?\d+)\)/;
      const match = messageContent.match(favorabilityRegex);

      if (match) {
        const favorabilityChange = parseInt(match[1], 10);
        console.log(`[AIChatContainer] Found favorability update: ${match[0]}. Changing by ${favorabilityChange} for ${characterIdForMessage}.`);
        updatePersonaFavorability(characterIdForMessage, favorabilityChange);
        messageContent = messageContent.replace(favorabilityRegex, '').trim();
      }
      
      if (!messageContent) {
        console.log("[AIChatContainer] Message content is empty after processing commands. Not adding to history.");
        setAiTypingState(prev => ({ ...prev, [ownerIdForMessage]: false }));
        processedAiDialogueStepsRef.current.add(aiMessageStepIdentifier); // Mark as processed even if no message is shown
        return;
      }

      /** @type {ChatMessage} */
      const aiMessage = {
        role: characterIdForMessage,
        content: messageContent,
        source: 'ai-script',
        stepId: data.stepId,
        scriptId: data.scriptId
      };

      setChatHistories(prevChatHistories => ({
        ...prevChatHistories,
        [ownerIdForMessage]: [...(prevChatHistories?.[ownerIdForMessage] || []), aiMessage]
      }));
      processedAiDialogueStepsRef.current.add(aiMessageStepIdentifier);
      console.log(`[AIChatContainer aiDialogueReady] Added msg for ${ownerIdForMessage}, marked ${aiMessageStepIdentifier} processed.`);
      
      setAiTypingState(prev => ({ ...prev, [ownerIdForMessage]: false }));

      if (ownerIdForMessage !== activePersona) {
        setUnreadMessages(prev => ({ ...prev, [ownerIdForMessage]: true }));
      }
    };

    subscribe('aiDialogueReady', handleAIDialogue);
    return () => unsubscribe('aiDialogueReady', handleAIDialogue);
  }, [activePersona, chatHistories, setChatHistories, activeScriptId, updatePersonaFavorability]);

  /** @param {string} personaId, @param {ChatMessage} message */
  const updateChatHistory = (personaId, message) => {
    setChatHistories(prevChatHistories => ({
      ...prevChatHistories,
      [personaId]: [...(prevChatHistories?.[personaId] || []), message] 
    }));
  };

  const [showFreeChatNotification, setShowFreeChatNotification] = useState(false);

  useEffect(() => {
    if (currentScriptStep && currentScriptStep.type === 'aiDialogue') {
      setShowFreeChatNotification(true);
      const timer = setTimeout(() => setShowFreeChatNotification(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [currentScriptStep]);

  if (!isVisible) return null;
  const chatPersona = activePersona ? PERSONAS.find(p => p.id.toLowerCase() === activePersona.toLowerCase()) : null;

  return (
    <div className="relative">
      <div className="fixed bottom-4 right-4 w-[350px] h-[650px] bg-gray-900 border border-purple-600 rounded-lg shadow-lg flex flex-col z-50 overflow-hidden">
      <div className="p-2 bg-gray-800 border-b border-purple-600 flex justify-between items-center">
        <h3 className="text-purple-400 font-semibold">Chats</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
      </div>
      <div className="flex flex-col flex-grow min-h-0"> 
        {activePersona === null ? (
          <div className="flex-grow overflow-y-auto bg-gray-900"> 
            {personas && typeof personas === 'object' && !Array.isArray(personas) ? (
              PERSONAS.filter(pData => {
                const key = Object.keys(personas).find(k => k.toLowerCase() === pData.id.toLowerCase());
                return key && personas[key]?.requiresChatWindow === true;
              }).map(pMap => (
                <button key={pMap.id} onClick={() => setActivePersona(pMap.id)}
                  className="w-full px-4 py-2 text-left border-b border-gray-700 hover:bg-gray-800 flex items-center justify-between">
                  <div className="flex items-center">
                    {pMap.avatar && <img src={pMap.avatar} alt={pMap.name || 'Unknown'} className="w-8 h-8 rounded-full border border-purple-500 mr-2"/>}
                    <span>{pMap.name || 'Unknown'}</span>
                  </div>
                  {unreadMessages[pMap.id] && <span className="w-2 h-2 bg-red-500 rounded-full"></span>}
                </button>
              ))
            ) : ( <div className="p-4 text-gray-500">Loading personas...</div> )}
          </div>
        ) : (
          <>
            <div className="p-2 bg-gray-800 border-b border-purple-600 flex justify-between items-center">
              <button onClick={() => setActivePersona(null)} className="text-gray-400 hover:text-white flex items-center">
                &larr; Back to Chats
              </button>
              <h4 className="text-purple-400 font-semibold">{chatPersona?.name}</h4>
            </div>
            <div className="flex flex-col flex-grow min-h-0"> 
            {(() => { 
              /** @type {ChatMessage[]} */
              const historyForWindow = chatHistories?.[activePersona] ?? [];
              const isCurrentlyAiTyping = aiTypingState[activePersona] || false;
              return (
                <ChatWindow
                  persona={chatPersona}
                  chatHistory={historyForWindow} 
                  updateChatHistory={(message) => updateChatHistory(activePersona, message)}
                  isAiCurrentlyTyping={isCurrentlyAiTyping} 
                  activeTask={activeTask}
                  svms={svms}
                  formattedScriptContext={formattedScriptContext}
                  apiProvider={apiProvider} // Pass apiProvider
                  apiKey={apiKey}
                  language={language}
                  activeScriptId={activeScriptId}
                  currentScriptStep={currentScriptStep}
                  onClose={onClose}
                />
              );
            })()}
            </div>
          </>
        )}
      </div>
        {showFreeChatNotification && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-gray-800 border border-purple-600 text-purple-300 px-6 py-3 rounded-lg shadow-lg text-center animate-fade-in-out">
              自由聊天，可以和所有角色聊天，结束按Continue
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export default AIChatContainer;