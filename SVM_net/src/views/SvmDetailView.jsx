// src/views/SvmDetailView.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import products from '../data/productData'; 
import CyberButton from '../components/ui/CyberButton';
import CyberCard from '../components/ui/CyberCard';
import { publish } from '../services/EventService'; 
import { useScriptContext } from '../context/ScriptContext';
import { useWorldStateContext } from '../context/WorldStateContext';

const getNestedValue = (obj, pathString) => {
  if (!pathString || typeof pathString !== 'string' || !obj) return undefined;
  const path = pathString.split('.');
  let current = obj;
  for (let i = 0; i < path.length; i++) {
    const key = path[i];
    if (current === null || typeof current !== 'object' || !current.hasOwnProperty(key)) return undefined;
    current = current[key];
  }
  return current;
};

function SvmDetailView({ svmId, onBack }) {
  const { 
    svms, player, updatePlayerCredits, updatePlayerInventory,
    currentPuzzleState, discoveredClues, attemptSolvePuzzle
  } = useWorldStateContext();
  
  const selectedSvm = svms.find(svm => svm.id === svmId);
  const { activeEngineDetails } = useScriptContext();

  const [purchaseStatus, setPurchaseStatus] = useState({});
  const [codeInputValue, setCodeInputValue] = useState('');
  const [interactionFeedback, setInteractionFeedback] = useState('');

  const evaluateHookConditions = useCallback((conditions) => {
    if (!conditions || conditions.length === 0) return true;
    for (const condition of conditions) {
      let conditionMet = false;
      switch (condition.type) {
        case 'puzzleStatus':
          conditionMet = currentPuzzleState[condition.puzzleId]?.status === condition.expectedStatus;
          break;
        case 'puzzleStateVar':
          const puzzleForVar = currentPuzzleState[condition.puzzleId];
          if (puzzleForVar?.variables) {
            const actualValue = getNestedValue(puzzleForVar.variables, condition.path);
            switch (condition.operator) {
              case '===': case 'equals': conditionMet = actualValue === condition.value; break;
              case '!==': case 'notEquals': conditionMet = actualValue !== condition.value; break;
              case '>': conditionMet = actualValue > condition.value; break;
              case '>=': conditionMet = actualValue >= condition.value; break;
              case '<': conditionMet = actualValue < condition.value; break;
              case '<=': conditionMet = actualValue <= condition.value; break;
              case 'exists': conditionMet = typeof actualValue !== 'undefined' && actualValue !== null; break;
              case 'notExists': conditionMet = typeof actualValue === 'undefined' || actualValue === null; break;
              case 'contains':
                if (Array.isArray(actualValue)) conditionMet = actualValue.includes(condition.value);
                else if (typeof actualValue === 'string') conditionMet = actualValue.includes(String(condition.value));
                else conditionMet = false;
                break;
              default: conditionMet = false;
            }
          }
          break;
        case 'playerHasClue':
          conditionMet = discoveredClues.some(clue => clue.id === condition.clueId);
          break;
        default: conditionMet = false;
      }
      if (!conditionMet) return false;
    }
    return true;
  }, [currentPuzzleState, discoveredClues]);

  const activeDisplayHook = useMemo(() => {
    if (!selectedSvm?.puzzleHooks) return null;
    const displayHooks = selectedSvm.puzzleHooks.filter(h => h.mode === 'conditional_media_display');
    const sortedHooks = [...displayHooks].sort((a, b) => (b.priority || 0) - (a.priority || 0));
    for (const hook of sortedHooks) {
      if (evaluateHookConditions(hook.conditions)) return hook;
    }
    return null;
  }, [selectedSvm, evaluateHookConditions]);

  const activeInteractionHook = useMemo(() => {
    if (!selectedSvm?.puzzleHooks) return null;
    const interactionHooks = selectedSvm.puzzleHooks.filter(h => h.mode === 'puzzle_interaction_interface');
    const sortedHooks = [...interactionHooks].sort((a, b) => (b.priority || 0) - (a.priority || 0));
    for (const hook of sortedHooks) {
      if (evaluateHookConditions(hook.conditions)) return hook;
    }
    return null;
  }, [selectedSvm, evaluateHookConditions]);

  useEffect(() => {
    setInteractionFeedback('');
    setCodeInputValue('');
  }, [activeDisplayHook, activeInteractionHook, svmId]);

  if (!selectedSvm) {
    return (
      <div className="container mx-auto p-4"><p>SVM not found.</p>
        <CyberButton onClick={onBack} className="mt-4 !bg-transparent !text-cyan-400 hover:!bg-gray-700/50">{'< Back to Map'}</CyberButton>
      </div>
    );
  }

  const handlePurchase = (product) => {
    if (!product || player.credits < product.price || selectedSvm.status !== 'Online') {
      setPurchaseStatus(prev => ({ ...prev, [product.productId]: 'failed_conditions' }));
      setTimeout(() => setPurchaseStatus(prev => ({ ...prev, [product.productId]: null })), 3000);
      return;
    }

    setPurchaseStatus(prev => ({ ...prev, [product.productId]: 'processing' }));

    // Simulate API call or direct state update
    setTimeout(() => {
      // Deduct credits
      publish('requestWorldStateUpdate', {
        target: 'player',
        property: 'credits',
        value: { _operation: 'add', value: -product.price }
      });

      // Add item to inventory
      // Assuming product.itemId exists and is the identifier for inventory
      if (product.itemId) {
        publish('requestWorldStateUpdate', {
          target: 'player',
          property: 'inventory',
          value: { id: product.itemId, name: product.name, quantity: 1 } // Add one quantity of the item
        });
      } else {
        console.warn(`Product ${product.productId} - ${product.name} is missing an itemId. Cannot add to inventory.`);
      }
      
      setPurchaseStatus(prev => ({ ...prev, [product.productId]: 'success' }));
      console.log(`[SvmDetailView] Item purchased: ${product.name}, itemId: ${product.itemId}`);
      publish('item_purchased', { productId: product.productId, itemId: product.itemId, name: product.name, price: product.price });

      setTimeout(() => setPurchaseStatus(prev => ({ ...prev, [product.productId]: null })), 3000);
    }, 1000); // Simulate network delay
  };
  
  const handleCodeSubmit = async () => {
    if (!activeInteractionHook || activeInteractionHook.interactionType !== 'code_input' || !activeInteractionHook.puzzleIdToAffect) return;
    setInteractionFeedback('Submitting...');
    const result = await attemptSolvePuzzle(activeInteractionHook.puzzleIdToAffect, codeInputValue);
    setInteractionFeedback(result.message || 'Attempt processed.');
  };

  const handleGenericButtonClick = () => {
    if (!activeInteractionHook || activeInteractionHook.interactionType !== 'generic_button' || !activeInteractionHook.eventOnInteraction) return;
    publish(activeInteractionHook.eventOnInteraction, { svmId: selectedSvm.id, hookId: activeInteractionHook.hookId, puzzleId: activeInteractionHook.puzzleIdToAffect });
    setInteractionFeedback(`Event '${activeInteractionHook.eventOnInteraction}' published.`);
    setTimeout(() => setInteractionFeedback(''), 3000);
  };

  let showSimulateArrival = false;
  const simulateArrivalEventName = `arrived_at_svm_${svmId}`;
  for (const [, step] of activeEngineDetails.entries()) {
      if (step?.type === 'waitForEvent' && step.eventName === simulateArrivalEventName) {
          showSimulateArrival = true;
          break;
      }
  }

  const renderMediaItem = (mediaInfo, keyPrefix = "media") => {
    if (!mediaInfo) return null;
    if (mediaInfo.type === 'text') {
      return <p key={`${keyPrefix}-text`} className="text-gray-200 whitespace-pre-wrap text-lg my-2">{mediaInfo.content}</p>;
    }
    if (mediaInfo.type === 'image_url' && mediaInfo.content) {
      return (
        <div key={`${keyPrefix}-image`} className="text-center my-2">
          <img src={mediaInfo.content} alt={mediaInfo.caption || keyPrefix} className="max-w-full h-auto rounded-md mx-auto border border-gray-600 shadow-lg" />
          {mediaInfo.caption && <p className="text-sm text-gray-400 italic mt-1">{mediaInfo.caption}</p>}
        </div>
      );
    }
    return null;
  };
  
  const renderSvmPrimaryContent = () => {
    let primaryVisualContent = null; // Will hold JSX for an image, if any
    let primaryTextContent = null;   // Will hold JSX for text, if any
    let hookWarning = null;

    const hookMediaInfo = activeDisplayHook?.mediaKey ? selectedSvm.displayableMedia?.[activeDisplayHook.mediaKey] : null;
    const scriptMediaContent = selectedSvm.currentDisplay; // This can be {type: 'text', content: '...'} or {type: 'image', mediaKey: '...'}
    let scriptMediaInfo = null;
    if (scriptMediaContent?.type === 'image' && scriptMediaContent.mediaKey) {
      scriptMediaInfo = selectedSvm.displayableMedia?.[scriptMediaContent.mediaKey];
    } else if (scriptMediaContent?.type === 'text') {
      scriptMediaInfo = scriptMediaContent; // Direct text content
    }

    if (activeDisplayHook && !hookMediaInfo && activeDisplayHook.mediaKey) {
      hookWarning = <p className="text-yellow-300">Hook Warning: MediaKey '{activeDisplayHook.mediaKey}' not found.</p>;
    }
    if (scriptMediaContent?.type === 'image' && scriptMediaContent.mediaKey && !scriptMediaInfo) {
        // This case is for script-defined image where mediaKey is invalid
        primaryVisualContent = <p className="text-red-400">Error: Image mediaKey '{scriptMediaContent.mediaKey}' (from script) not found or invalid.</p>;
    }


    // Determine primary visual (image)
    if (hookMediaInfo?.type === 'image_url') {
      primaryVisualContent = renderMediaItem(hookMediaInfo, `hook-${activeDisplayHook.hookId}`);
    } else if (scriptMediaInfo?.type === 'image_url') {
      primaryVisualContent = renderMediaItem(scriptMediaInfo, `script-${scriptMediaContent.mediaKey}`);
    }

    // Determine primary text
    // If hook provides text, it's a candidate.
    // If script provides text AND hook doesn't provide an image (which would take precedence), script text is a candidate.
    if (hookMediaInfo?.type === 'text') {
      primaryTextContent = renderMediaItem(hookMediaInfo, `hook-${activeDisplayHook.hookId}`);
    }
    
    // If an image is being displayed (either from hook or script),
    // and the hook's primary role was to provide text, this text becomes supplementary to the image.
    // If no image, and hook text is already set as primaryTextContent, this block is skipped.
    if (primaryVisualContent && hookMediaInfo?.type === 'text') {
        // If primaryTextContent is already hookMediaInfo, we don't need to set it again as supplementary.
        // This ensures hook text is shown with an image (from script) or by itself.
        // If hook provided an image, its text (if any, via caption) is handled by renderMediaItem.
        // This logic is for when hook is text, and an image (from script or a *different* hook if we had multiple display hooks) is primary.
        // For current setup (one activeDisplayHook), if hookMediaInfo.type is 'text', it's already primaryTextContent.
        // The only case this matters is if script provides image, and hook provides text.
         if (scriptMediaInfo?.type === 'image_url' && hookMediaInfo?.type === 'text') {
            // primaryVisualContent is script's image, primaryTextContent is hook's text.
            // This is the "smart-combo": image from script, text from hook.
         } else if (hookMediaInfo?.type === 'image_url' && scriptMediaInfo?.type === 'text') {
            // Hook provides image (already primaryVisualContent), script provides text.
            // We could choose to display script's text as supplementary if desired.
            // For now, hook's image takes full precedence.
            primaryTextContent = null; // Hook image overrides script text.
         }
    }


    // Fallback if no specific text from hook or script (when an image isn't primary)
    if (!primaryVisualContent && !primaryTextContent && scriptMediaInfo?.type === 'text') {
      primaryTextContent = renderMediaItem(scriptMediaInfo, 'script-text');
    }
    
    if (primaryVisualContent || primaryTextContent) {
      return (
        <>
          {hookWarning}
          {primaryVisualContent}
          {primaryTextContent && <div className={primaryVisualContent ? "mt-2" : ""}>{primaryTextContent}</div>}
        </>
      );
    }

    // Ultimate fallback
    return (
      <>
        {hookWarning}
        <p className="text-gray-400">{selectedSvm.description}</p>
      </>
    );
  };

  return (
    <div className="container mx-auto p-4 text-gray-200">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-cyan-400">{selectedSvm.name}</h1>
          <p className="text-gray-500">{selectedSvm.location}</p>
          <div className={`inline-block mt-2 px-3 py-1 rounded text-sm font-semibold ${selectedSvm.status === 'Online' ? 'bg-green-500/20 text-green-300 border border-green-500/50' : 'bg-red-500/20 text-red-300 border border-red-500/50'}`}>
            {selectedSvm.status.toUpperCase()}
          </div>
        </div>
        <CyberButton onClick={onBack} className="!bg-gray-700 hover:!bg-gray-600 !text-cyan-300">
          {'< 返回地图'}
        </CyberButton>
      </div>

      <CyberCard className="my-6 bg-gray-800/80 border-cyan-600/50 shadow-cyan-500/25">
        <div className="p-5">
          {renderSvmPrimaryContent()}
        </div>
      </CyberCard>

      {activeInteractionHook && (
        <CyberCard className="my-6 bg-gray-800/80 border-purple-600/50 shadow-purple-500/25">
          <div className="p-5">
            <h3 className="text-xl font-semibold text-purple-300 mb-3">{activeInteractionHook.promptText || '交互指令'}</h3>
            {activeInteractionHook.interactionType === 'code_input' && (
              <div className="space-y-3">
                <input 
                  type="text"
                  value={codeInputValue}
                  onChange={(e) => setCodeInputValue(e.target.value)}
                  placeholder="输入代码..."
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none placeholder-gray-500"
                />
                <CyberButton onClick={handleCodeSubmit} className="w-full !bg-purple-600 hover:!bg-purple-700">
                  {activeInteractionHook.buttonText || '提交'}
                </CyberButton>
              </div>
            )}
            {activeInteractionHook.interactionType === 'generic_button' && (
              <CyberButton onClick={handleGenericButtonClick} className="w-full !bg-teal-500 hover:!bg-teal-600">
                {activeInteractionHook.buttonText || '执行'}
              </CyberButton>
            )}
            {interactionFeedback && (
              <p className={`mt-3 text-center text-sm ${interactionFeedback.toLowerCase().includes('success') || interactionFeedback.toLowerCase().includes('solved') || interactionFeedback.toLowerCase().includes('published') ? 'text-green-400' : 'text-red-400'}`}>
                {interactionFeedback}
              </p>
            )}
          </div>
        </CyberCard>
      )}
      
      {showSimulateArrival && (
          <div className="my-6 p-4 bg-yellow-800/30 border border-yellow-600/50 rounded text-center">
              <CyberButton onClick={() => publish(simulateArrivalEventName, { svmId: svmId })} className="!bg-yellow-500 hover:!bg-yellow-600 !text-black">
                  模拟到达 SVM-{svmId}
              </CyberButton>
          </div>
      )}

      <CyberCard className="mb-6 bg-gray-800/80 border-gray-700/50">
          {/* Product list remains unchanged */}
          <div className="p-5">
            <h2 className="text-2xl font-semibold mb-4 text-cyan-400">可用商品</h2>
            {selectedSvm.status !== 'Online' && (
                <p className="text-center text-red-400 mb-4 p-2 bg-red-900/50 rounded-md border border-red-700">⚠️ 此 SVM 当前离线，商品无法购买。</p>
            )}
            <div className="divide-y divide-gray-700">
              {products
                .filter(product => !product.svmId || product.svmId.includes(svmId))
                .map((product) => (
                <div key={product.productId} className="py-4 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium text-gray-100">{product.name}</h3>
                    <p className="text-sm text-gray-400">{product.description}</p>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    <span className="text-lg font-semibold text-cyan-300">${product.price.toFixed(2)}</span>
                    <CyberButton
                      onClick={() => handlePurchase(product)}
                      disabled={selectedSvm.status !== 'Online' || purchaseStatus[product.productId] === 'processing' || player.credits < product.price}
                      className={`py-2 px-4 w-32 text-center text-sm transition-colors duration-200 ${
                        purchaseStatus[product.productId] === 'processing' ? '!bg-gray-600 !text-gray-400 cursor-wait' :
                        player.credits < product.price || selectedSvm.status !== 'Online' ? '!bg-red-700/50 !text-red-400 cursor-not-allowed' : 
                        '!bg-cyan-600 hover:!bg-cyan-700'
                      }`}
                    >
                      {purchaseStatus[product.productId] === 'processing' ? '处理中...' :
                       player.credits < product.price ? '余额不足' : 
                       selectedSvm.status !== 'Online' ? '终端离线' : '购买'}
                    </CyberButton>
                    <div className="h-4 text-xs">
                      {purchaseStatus[product.productId] === 'success' && <span className="text-green-400">购买成功!</span>}
                      {purchaseStatus[product.productId] === 'failed_credits' && <span className="text-red-400">信用点不足!</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
      </CyberCard>
    </div>
  );
}

export default SvmDetailView;