import React, { useState, useEffect, useRef } from 'react';
import CyberButton from './ui/CyberButton';
import { getAICompletion } from '../services/AIService'; // Changed to getAICompletion
import { getSystemPrompt } from '../services/AIContext';
import { notifyScript, publish, subscribe, unsubscribe } from '../services/EventService';
import PERSONAS from '../data/personaData'; // Import PERSONAS

function ChatWindow({ 
  persona, 
  chatHistory, 
  updateChatHistory, 
  activeTask, 
  svms,
  formattedScriptContext,
  apiProvider, // Added apiProvider
  apiKey,
  language,
  activeScriptId,
  currentScriptStep, 
  onClose,
  isAiCurrentlyTyping // Added new prop
}) {
  console.log("[ChatWindow] Received persona prop:", JSON.stringify(persona));
  console.log("[ChatWindow] Received isAiCurrentlyTyping:", isAiCurrentlyTyping);


  const chatHistoryRef = useRef(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false); // For user-sent messages
  const [error, setError] = useState(null);

  const systemPrompt = persona ? getSystemPrompt(activeTask, svms, formattedScriptContext, apiKey, language, persona.id) : '';
  const systemMessage = { role: 'system', content: systemPrompt };

  useEffect(() => {
    if (activeTask && !chatHistory.some(msg => msg.role === 'system') && persona) {
      updateChatHistory(systemMessage);
    }
  }, [activeTask, persona]); // Adjusted dependencies

  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading || isAiCurrentlyTyping || !apiKey || !persona) return; // Prevent send if AI is typing
    setError(null);
    setIsLoading(true);
    const userMessage = { role: 'user', content: message };
    // Sanitize roles for the API call
    const historyForLLM = chatHistory
      .filter(msg => msg.role !== 'system')
      .map(msg => {
        if (msg.role === 'user') {
          return msg;
        } else if (persona && msg.role === persona.id) { // Current AI persona's past messages
          return { ...msg, role: 'assistant' };
        } else { // Other characters' past messages, treat as user context for the current AI
          return { ...msg, role: 'user' };
        }
      });
    updateChatHistory(userMessage);
    publish('userInputUpdated', { input: message, persona: persona.id });
    setMessage('');
    try {
      // Use getAICompletion with provider
      const assistantContent = await getAICompletion(apiProvider, apiKey, message, [
        systemMessage,
        ...historyForLLM,
        userMessage
      ]);
      const assistantMessage = { role: persona.id || 'assistant', content: assistantContent };
      updateChatHistory(assistantMessage);
    } catch (err) {
      console.error(`Error calling AI provider (${apiProvider}):`, err); // Updated error log
      setError('AI Error: ' + err.message);
    }
    setIsLoading(false);
  };

  const handleContinue = () => {
    if (activeScriptId && currentScriptStep && (currentScriptStep.type === 'dialogue' || currentScriptStep.type === 'aiDialogue')) {
      notifyScript(activeScriptId, 'dialogueClosed', {});
      if (currentScriptStep.type === 'aiDialogue' && persona) {
        publish('userInputUpdated', { input: '', persona: persona.id });
      }
    } else {
      console.warn("Continue clicked but no active dialogue or aiDialogue step found.");
    }
  };

   const handleClose = () => {
     if (activeScriptId && currentScriptStep &&
         (currentScriptStep.type === 'dialogue' || currentScriptStep.type === 'aiDialogue') &&
         currentScriptStep.waitFor === 'dialogueClosed') {
       publish('debugUserInputs', {});
       setTimeout(() => {
         notifyScript(activeScriptId, 'dialogueClosed', {});
       }, 1000); 
     } else {
       onClose();
     }
   };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      <div className="flex-shrink-0 flex justify-between items-center p-2 bg-gray-800 border-b border-purple-600">
        <h3 className="text-purple-400 font-semibold">{persona?.name || 'Chat'}</h3>
        <button onClick={handleClose} className="text-gray-400 hover:text-white">
          &times;
        </button>
      </div>
      <div ref={chatHistoryRef} className="flex-grow min-h-0 overflow-y-auto p-2 space-y-2 text-gray-200">
        {chatHistory.map((msg, idx) => {
           if (msg.role === 'system') return null;
           const isUser = msg.role === 'user';
           const senderPersona = PERSONAS.find(p => p.id.toLowerCase() === msg.role?.toLowerCase());
           const alignment = isUser ? 'justify-end' : 'justify-start';
           const bubbleStyle = isUser
             ? 'bg-cyan-700 text-white'
             : senderPersona 
             ? 'bg-gray-700 text-gray-100' 
             : 'bg-purple-900 border border-purple-600 text-purple-200 italic'; 
           return (
             <div key={idx} className={`flex mb-2 ${alignment}`}>
               <div className="w-10 flex-shrink-0 self-end mr-2">
                 {!isUser && senderPersona?.avatar && (
                   <img src={senderPersona.avatar} alt={senderPersona.name} className="w-12 h-12 rounded-full border border-purple-500"/>
                 )}
               </div>
               <div className={`max-w-[80%]`}>
                 {!isUser && msg.role !== persona?.id && (
                    <span className={`text-xs text-purple-400 block mb-1`}>{senderPersona?.name || msg.role}:</span>
                  )}
                 <div className={`px-3 py-1 rounded-lg ${bubbleStyle} chat-bubble-content`}>
                   {msg.image && ( <img src={msg.image} alt="Chat Image" className="max-w-full h-auto rounded mb-2" /> )}
                   {msg.audio && (
                     <audio controls className="max-w-full mb-2">
                       <source src={msg.audio} type="audio/mpeg" />
                       您的浏览器不支持音频播放。
                     </audio>
                   )}
                   <span>{msg.content}</span>
                 </div>
               </div>
             </div>
           );
         })}
         {/* Updated isLoading condition */}
         {(isLoading || isAiCurrentlyTyping) && <div className="text-gray-400 italic text-center">{persona?.name || 'AI'} is typing...</div>}
         {error && <div className="text-red-400 text-center">{error}</div>}
       </div>
       <div className="flex-shrink-0 border-t border-purple-600 bg-gray-800">
         {currentScriptStep && (currentScriptStep.type === 'dialogue' || currentScriptStep.type === 'aiDialogue') && (
           <div className="p-2 text-center">
             <CyberButton onClick={handleContinue} className="w-full">
               Continue
             </CyberButton>
           </div>
         )}
         <div className="p-2 flex items-center">
           <input
             type="text"
             value={message}
             onChange={e => setMessage(e.target.value)}
             onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
             placeholder={currentScriptStep?.type === 'dialogue' ? "Waiting for script..." : "type a message..."}
             className="flex-grow px-2 py-1 bg-gray-900 border border-gray-600 text-gray-100 rounded-l focus:outline-none"
             disabled={isLoading || isAiCurrentlyTyping || currentScriptStep?.type === 'dialogue'} // Disable input if AI is typing or it's a dialogue step
           />
           <CyberButton
             onClick={handleSendMessage}
             disabled={isLoading || isAiCurrentlyTyping || !message.trim() || currentScriptStep?.type === 'dialogue'} // Disable send if AI is typing or it's a dialogue step
             className="rounded-l-none bg-purple-600 hover:bg-purple-500"
           >
             Send
           </CyberButton>
         </div>
       </div>
     </div>
   );
}
export default ChatWindow;