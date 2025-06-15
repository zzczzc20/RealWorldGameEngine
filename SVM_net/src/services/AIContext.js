 // src/services/AIContext.js
 // Add language and persona parameters
 import PERSONAS from '../data/personaData.js';
 
 export function getSystemPrompt(activeTask, svmData, scriptContext = [], apiKey, language = 'en', persona = 'Nova') {
   let languageInstruction = '';
   switch (language) {
     case 'zh':
       languageInstruction = '请用简体中文回答。';
       break;
     case 'ja':
       languageInstruction = '日本語で答えてください。';
       break;
     case 'en':
     default:
       languageInstruction = 'Respond in English.';
       break;
   }
 
   let personaInstruction = '';
   const selectedPersona = PERSONAS.find(p => p.id === persona) || PERSONAS[0];
   personaInstruction = selectedPersona.instruction;
 
   const basePrompt = `${personaInstruction}
        Current Context:
        - Active Task: ${activeTask ? activeTask.title : 'None'}${activeTask ? ` (${activeTask.description})` : ''}
        - Script Context: ${scriptContext && scriptContext.length > 0 ? scriptContext.join(', ') : 'None'}
        ${languageInstruction}`; // Add language instruction here
   // Removed API Key from system prompt - it should not be sent to the LLM

   // - SVM Statuses: ${svmData.map(svm => `${svm.name} owned by tribe ${svm.owner} owner description:${svm.description} (${svm.location}): ${svm.status}`).join(', ')} Is currently disabled since it is not very related to the active task.
   return basePrompt;
 }
 
 // Function to append language instruction to script prompts
 export function appendLanguageInstruction(prompt, language = 'en') {
   let languageInstruction = '';
   switch (language) {
     case 'zh':
       languageInstruction = '请用简体中文回答。';
       break;
     case 'ja':
       languageInstruction = '日本語で答えてください。';
       break;
     case 'en':
     default:
       languageInstruction = 'Respond in English.';
       break;
   }
   return `${prompt} ${languageInstruction}`;
 }