// src/components/StartupScreen.jsx
import React, { useState } from 'react';
import CyberButton from './ui/CyberButton'; // Import CyberButton
import CyberCard from './ui/CyberCard';   // Import CyberCard

// Define language options
const languageOptions = [
  { code: 'en', name: 'English' },
  { code: 'zh', name: '中文' },
  { code: 'ja', name: '日本語' },
];

// Define API provider options
const apiProviderOptions = [
  { id: 'openrouter', name: 'OpenRouter' },
  { id: 'deepseek', name: 'DeepSeek' },
  { id: 'sambanova', name: 'SambaNova' },
  { id: 'grok', name: 'Grok' }
];

function StartupScreen({ onSubmit }) {
  const [apiProvider, setApiProvider] = useState(apiProviderOptions[0].id); // Default to OpenRouter
  const [openRouterKey, setOpenRouterKey] = useState('');
  const [deepSeekKey, setDeepSeekKey] = useState('');
  const [sambaNovaKey, setSambaNovaKey] = useState('');
  const [grokKey, setGrokKey] = useState('');
  const [language, setLanguage] = useState(languageOptions[0].code); // Default to English
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    let valid = true;
    let apiKey = '';
    
    if (apiProvider === 'openrouter') {
      apiKey = openRouterKey.trim();
      if (!apiKey) {
        setError('OpenRouter API Key cannot be empty.');
        valid = false;
      } else if (!apiKey.startsWith('sk-or-v1-')) {
        setError('Invalid OpenRouter API Key format (should start with sk-or-v1-).');
        valid = false;
      }
    } else if (apiProvider === 'deepseek') {
      apiKey = deepSeekKey.trim();
      if (!apiKey) {
        setError('DeepSeek API Key cannot be empty.');
        valid = false;
      }
    } else if (apiProvider === 'sambanova') {
      apiKey = sambaNovaKey.trim();
      if (!apiKey) {
        setError('SambaNova API Key cannot be empty.');
        valid = false;
      }
    } else if (apiProvider === 'grok') {
      apiKey = grokKey.trim();
      if (!apiKey) {
        setError('Grok API Key cannot be empty.');
        valid = false;
      }
    } else {
      setError('Invalid API provider selected.');
      valid = false;
    }

    if (valid) {
      setError('');
      onSubmit(apiProvider, apiKey, language); // Pass provider, key, and language
    }
  };

  return (
    // Use CyberCard for consistent styling
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50">
       <CyberCard className="max-w-md w-full bg-gray-900 border border-purple-600 p-6">
         <h1 className="text-2xl font-bold text-purple-400 mb-6 text-center">Enter Settings</h1>
         <form onSubmit={handleSubmit} className="space-y-4">
           {/* API Provider Selection */}
           <div>
             <label htmlFor="apiProviderSelect" className="block text-sm font-medium text-gray-300 mb-1">
               API Provider:
             </label>
             <select
               id="apiProviderSelect"
               value={apiProvider}
               onChange={(e) => setApiProvider(e.target.value)}
               className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
             >
               {apiProviderOptions.map(option => (
                 <option key={option.id} value={option.id}>
                   {option.name}
                 </option>
               ))}
             </select>
           </div>

           {/* API Key Input for OpenRouter */}
           {apiProvider === 'openrouter' && (
             <div>
               <label htmlFor="openRouterKeyInput" className="block text-sm font-medium text-gray-300 mb-1">
                 OpenRouter API Key:
               </label>
               <input
                 id="openRouterKeyInput"
                 type="password" // Use password type for keys
                 value={openRouterKey}
                 onChange={(e) => setOpenRouterKey(e.target.value)}
                 placeholder="sk-or-v1-..."
                 className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
               />
             </div>
           )}

           {/* API Key Input for DeepSeek */}
           {apiProvider === 'deepseek' && (
             <div>
               <label htmlFor="deepSeekKeyInput" className="block text-sm font-medium text-gray-300 mb-1">
                 DeepSeek API Key:
               </label>
               <input
                 id="deepSeekKeyInput"
                 type="password" // Use password type for keys
                 value={deepSeekKey}
                 onChange={(e) => setDeepSeekKey(e.target.value)}
                 placeholder="Enter DeepSeek API Key..."
                 className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
               />
             </div>
           )}
           
           {/* API Key Input for SambaNova */}
           {apiProvider === 'sambanova' && (
             <div>
               <label htmlFor="sambaNovaKeyInput" className="block text-sm font-medium text-gray-300 mb-1">
                 SambaNova API Key:
               </label>
               <input
                 id="sambaNovaKeyInput"
                 type="password" // Use password type for keys
                 value={sambaNovaKey}
                 onChange={(e) => setSambaNovaKey(e.target.value)}
                 placeholder="Enter SambaNova API Key..."
                 className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
               />
             </div>
           )}

           {/* API Key Input for Grok */}
           {apiProvider === 'grok' && (
             <div>
               <label htmlFor="grokKeyInput" className="block text-sm font-medium text-gray-300 mb-1">
                 Grok API Key:
               </label>
               <input
                 id="grokKeyInput"
                 type="password"
                 value={grokKey}
                 onChange={(e) => setGrokKey(e.target.value)}
                 placeholder="Enter Grok API Key..."
                 className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
               />
             </div>
           )}

           {/* Language Selection Dropdown */}
           <div>
             <label htmlFor="languageSelect" className="block text-sm font-medium text-gray-300 mb-1">
               AI Language / AI 语言 / AI言語:
             </label>
             <select
               id="languageSelect"
               value={language}
               onChange={(e) => setLanguage(e.target.value)}
               className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
             >
               {languageOptions.map(option => (
                 <option key={option.code} value={option.code}>
                   {option.name}
                 </option>
               ))}
             </select>
           </div>

           {/* Error Message */}
           {error && <p className="text-xs text-red-400">{error}</p>}

           {/* Submit Button */}
           <CyberButton type="submit" className="w-full mt-6">
             Start Game / 开始游戏 / ゲーム開始
           </CyberButton>
         </form>
       </CyberCard>
     </div>
  );
}

export default StartupScreen;