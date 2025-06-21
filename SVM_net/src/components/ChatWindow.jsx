import React, { useState, useEffect, useRef } from 'react';
import CyberButton from './ui/CyberButton';
import { getAICompletion } from '../services/AIService'; // Changed to getAICompletion
import { getSystemPrompt } from '../services/AIContext';
import { notifyScript, publish, subscribe, unsubscribe } from '../services/EventService';
import PERSONAS from '../data/personaData'; // Import PERSONAS
import { useWorldStateContext } from '../context/WorldStateContext'; // Import context

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
const { personas, updatePersonaFavorability } = useWorldStateContext(); // Use context

// This useEffect is for scrolling, it's fine.
useEffect(() => {
  if (chatHistoryRef.current) {
    chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
  }
}, [chatHistory]);

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading || isAiCurrentlyTyping || !apiKey || !persona) return;
    setError(null);
    setIsLoading(true);

    const userMessage = { role: 'user', content: message };
    updateChatHistory(userMessage);
    publish('userInputUpdated', { input: message, persona: persona.id });
    setMessage('');

    try {
      const personaState = personas[persona.id];
      let tools = [];
      let systemPromptContent = getSystemPrompt(activeTask, svms, formattedScriptContext, apiKey, language, persona.id);

      if (personaState?.hasFavorability) {
        const favorabilityTool = {
          type: 'function',
          function: {
            name: 'update_favorability',
            description: "根据玩家的对话或行为，调整与特定角色的好感度。",
            parameters: {
              type: "object",
              properties: {
                personaId: {
                  type: "string",
                  description: `需要调整好感度的角色的ID，当前角色ID是 '${persona.id}'。`
                },
                change: {
                  type: "integer",
                  description: "好感度的变化值。正数表示增加，负数表示减少。变化范围通常在 -5 到 5 之间。"
                },
                reason: {
                  type: "string",
                  description: "根据玩家的哪句话或哪个行为做出此次好感度调整的简要原因。"
                }
              },
              required: ["personaId", "change", "reason"]
            }
          }
        };
        tools.push(favorabilityTool);
        systemPromptContent += `\n\n--- 好感度系统指令 ---\n你正在扮演的角色有一个好感度指数，当前值为 ${personaState.favorability} (范围0-100)。你需要根据用户的言行，在对话的适当时候，秘密地使用 'update_favorability' 工具来调整这个值。这个调整过程对用户是不可见的。调整后，请根据新的好感度继续你的对话。`;
      }

      const systemMessage = { role: 'system', content: systemPromptContent };
      
      const historyForLLM = chatHistory
        .filter(msg => msg.role !== 'system' && msg.role !== 'tool')
        .map(msg => ({
          role: (msg.role === 'user' || msg.role !== persona.id) ? 'user' : 'assistant',
          content: msg.content
        }));

      let messages = [systemMessage, ...historyForLLM, userMessage];

      // Loop to handle potential tool calls
      for (let i = 0; i < 5; i++) { // Limit iterations to prevent infinite loops
        const completion = await getAICompletion(apiProvider, apiKey, messages, tools);
        const choice = completion.message;

        if (choice.tool_calls) {
          console.log("AI requested tool call:", choice.tool_calls);
          messages.push(choice); // Add AI's tool request to history

          for (const toolCall of choice.tool_calls) {
            const functionName = toolCall.function.name;
            const args = JSON.parse(toolCall.function.arguments);

            if (functionName === 'update_favorability') {
              updatePersonaFavorability(args.personaId, args.change);
              console.log(`Favorability for ${args.personaId} changed by ${args.change}. Reason: ${args.reason}`);
              
              messages.push({
                tool_call_id: toolCall.id,
                role: 'tool',
                name: functionName,
                content: JSON.stringify({ status: 'success', newFavorability: (personas[args.personaId]?.favorability || 0) + args.change })
              });
            }
          }
        } else {
          // No tool call, this is the final text response.
          // Still, we need to check for inline commands like update_favorability.
          let messageContent = choice.content;
          const favorabilityRegex = /update_favorability\((-?\d+)\)/;
          const match = messageContent.match(favorabilityRegex);

          if (match) {
            const favorabilityChange = parseInt(match[1], 10);
            console.log(`[ChatWindow] Found inline favorability update: ${match[0]}. Changing by ${favorabilityChange} for ${persona.id}.`);
            updatePersonaFavorability(persona.id, favorabilityChange);
            messageContent = messageContent.replace(favorabilityRegex, '').trim();
          }

          if (messageContent) {
            const assistantMessage = { role: persona.id || 'assistant', content: messageContent };
            updateChatHistory(assistantMessage);
          } else {
            console.log("[ChatWindow] Assistant message was empty after processing inline commands.");
          }
          
          break; // Exit loop
        }
      }

    } catch (err) {
      console.error(`Error calling AI provider (${apiProvider}):`, err);
      setError('AI Error: ' + err.message);
    }
    setIsLoading(false);
  };

  const handleContinue = () => {
    const proceed = () => {
      if (activeScriptId && currentScriptStep) {
        notifyScript(activeScriptId, 'dialogueClosed', {});
        if (currentScriptStep.type === 'aiDialogue' && persona) {
          publish('userInputUpdated', { input: '', persona: persona.id });
        }
      } else {
        console.warn("Continue clicked but no active dialogue or aiDialogue step found.");
      }
    };

    if (currentScriptStep?.type === 'aiDialogue') {
      if (window.confirm("您确定要结束与AI的对话吗？")) {
        proceed();
      }
    } else if (currentScriptStep?.type === 'dialogue') {
      proceed();
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
        <div className="flex items-center">
          <h3 className="text-purple-400 font-semibold">{persona?.name || 'Chat'}</h3>
          {persona && personas[persona.id]?.hasFavorability && (
            <span className="ml-3 px-2 py-0.5 text-xs bg-pink-600 text-white rounded-full shadow">
              好感度: {personas[persona.id].favorability}
            </span>
          )}
        </div>
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