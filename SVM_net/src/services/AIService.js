// src/services/AIService.js
import OpenAI from "openai";

/**
 * Calls the OpenRouter API to get a chat completion.
 * 
 * IMPORTANT: Passing the API key from the client-side like this is insecure
 * and only suitable for a temporary demo. In a real application, the API key
 * should be handled securely on a backend server/proxy.
 * 
 * @param {string} apiKey - The user's OpenRouter API Key.
 * @param {string} userMessage - The message from the user.
 * @param {Array<{role: string, content: string}>} history - Optional chat history.
 * @returns {Promise<string>} - A promise that resolves with the assistant's message content.
 * @throws {Error} - Throws an error if the API call fails.
 */
export async function getOpenRouterCompletion(apiKey, userMessage, history = []) {
  if (!apiKey) {
    throw new Error("OpenRouter API Key is required.");
  }
  if (!userMessage) {
    throw new Error("User message cannot be empty.");
  }

  const apiUrl = "https://openrouter.ai/api/v1/chat/completions";
  // Recommended model (check OpenRouter for availability and pricing)
  // const model = "meta-llama/llama-4-maverick:free";
  const model = "google/gemini-2.5-flash-lite-preview-06-17";

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        // Optional, but recommended by OpenRouter:
        // "HTTP-Referer": `${YOUR_SITE_URL}`, // Your site URL
        // "X-Title": `${YOUR_SITE_NAME}`, // Your site name
      },
      body: JSON.stringify({
        model: model,
        messages: history.length > 0 ? history : [{ role: "user", content: userMessage }]
        // Optional parameters (temperature, max_tokens, etc.) can be added here
        // "temperature": 0.7, 
        // "max_tokens": 150, 
      })
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        // Handle cases where the error response is not valid JSON
        throw new Error(`OpenRouter API Error: ${response.status} ${response.statusText}`);
      }
      console.error("OpenRouter API Error Data:", errorData);
      throw new Error(`OpenRouter API Error: ${response.status} - ${errorData?.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();

    if (data.choices && data.choices.length > 0 && data.choices[0].message?.content) {
      return data.choices[0].message.content.trim();
    } else {
      console.error("Invalid response structure from OpenRouter:", data);
      throw new Error("Received an invalid response structure from OpenRouter.");
    }

  } catch (error) {
    console.error("Error calling OpenRouter API:", error);
    // Re-throw the error so the calling component can handle it
    throw error; 
  }
}

/**
 * Calls the DeepSeek API to get a chat completion.
 * 
 * IMPORTANT: Passing the API key from the client-side like this is insecure
 * and only suitable for a temporary demo. In a real application, the API key
 * should be handled securely on a backend server/proxy.
 * 
 * @param {string} apiKey - The user's DeepSeek API Key.
 * @param {string} userMessage - The message from the user.
 * @param {Array<{role: string, content: string}>} history - Optional chat history.
 * @returns {Promise<string>} - A promise that resolves with the assistant's message content.
 * @throws {Error} - Throws an error if the API call fails.
 */
export async function getDeepSeekCompletion(apiKey, userMessage, history = []) {
  if (!apiKey) {
    throw new Error("DeepSeek API Key is required.");
  }
  if (!userMessage) {
    throw new Error("User message cannot be empty.");
  }

  // Mask the API key for logging (show only first few and last few characters)
  const maskedApiKey = apiKey.length > 10 
    ? `${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 5)}` 
    : 'KEY_TOO_SHORT';
  
  console.log("DeepSeek API Request Details:");
  console.log("Base URL: https://api.deepseek.com");
  console.log("API Key (masked):", maskedApiKey);
  console.log("Model: deepseek-chat");
  console.log("Messages:", history.length > 0 ? history : [{ role: "user", content: userMessage }]);

  const openai = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: apiKey,
    dangerouslyAllowBrowser: true // Allow running in browser environment for demo purposes
  });

  try {
    const messages = history.length > 0 ? history : [{ role: "user", content: userMessage }];
    const completion = await openai.chat.completions.create({
      messages: messages,
      model: "deepseek-chat",
    });

    if (completion.choices && completion.choices.length > 0 && completion.choices[0].message?.content) {
      console.log("DeepSeek API Response received successfully.");
      return completion.choices[0].message.content.trim();
    } else {
      console.error("Invalid response structure from DeepSeek:", completion);
      throw new Error("Received an invalid response structure from DeepSeek. Please check API connectivity or response format.");
    }
  } catch (error) {
    console.error("Error calling DeepSeek API:", error);
    throw new Error(`Failed to connect to DeepSeek API: ${error.message}. Please check your network connection or API key validity.`);
  }
}

/**
 * Calls the SambaNova API to get a chat completion.
 *
 * @param {string} apiKey - The user's SambaNova API Key.
 * @param {string} userMessage - The message from the user.
 * @param {Array<{role: string, content: string}>} history - Optional chat history.
 * @returns {Promise<string>} - A promise that resolves with the assistant's message content.
 * @throws {Error} - Throws an error if the API call fails.
 */
export async function getSambaNovaCompletion(apiKey, userMessage, history = []) {
  if (!apiKey) {
    throw new Error("SambaNova API Key is required.");
  }
  if (!userMessage && (!history || history.length === 0)) { // Allow empty userMessage if history is present
    throw new Error("User message cannot be empty if history is not provided.");
  }

  const maskedApiKey = apiKey.length > 8 ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` : 'KEY_TOO_SHORT';
  console.log("SambaNova API Request Details:");
  console.log("Base URL: https://api.sambanova.ai/v1");
  console.log("API Key (masked):", maskedApiKey);
  const model = "Llama-4-Maverick-17B-128E-Instruct"; // As specified by user
  console.log("Model:", model);
  
  const messagesForAPI = history.length > 0 ? history : [{ role: "user", content: userMessage }];
  if (history.length > 0 && userMessage) { // If history and userMessage both exist, add userMessage to history
      messagesForAPI.push({role: "user", content: userMessage});
  }
  console.log("Messages:", messagesForAPI);


  const openai = new OpenAI({
    baseURL: 'https://api.sambanova.ai/v1',
    apiKey: apiKey,
    dangerouslyAllowBrowser: true, // Allow running in browser environment for demo purposes
    defaultHeaders: {
      'X-Stainless-Lang': null,
      'X-Stainless-Arch': null,
      'X-Stainless-OS': null,
      'X-Stainless-Runtime': null,
      'X-Stainless-Package-Version': null,
      'X-Stainless-Runtime-Version': null,
      'X-Stainless-Retry-Count': null,
      'X-Stainless-Retry-After': null,
      'X-Stainless-Timeout': null // Added for timeout header
    }
  });

  try {
    const completion = await openai.chat.completions.create({
      messages: messagesForAPI,
      model: model,
    });

    if (completion.choices && completion.choices.length > 0 && completion.choices[0].message?.content) {
      console.log("SambaNova API Response received successfully.");
      return completion.choices[0].message.content.trim();
    } else {
      console.error("Invalid response structure from SambaNova:", completion);
      throw new Error("Received an invalid response structure from SambaNova. Please check API connectivity or response format.");
    }
  } catch (error) {
    console.error("Error calling SambaNova API:", error);
    let errorMessage = `Failed to connect to SambaNova API: ${error.message}.`;
    if (error.response && error.response.data && error.response.data.detail) {
        errorMessage += ` Details: ${JSON.stringify(error.response.data.detail)}`;
    } else if (error.status) {
        errorMessage += ` Status: ${error.status}.`;
    }
    errorMessage += " Please check your network connection or API key validity.";
    throw new Error(errorMessage);
  }
}

/**
 * Calls the Grok API to get a chat completion.
 *
 * IMPORTANT: Passing the API key from the client-side like this is insecure
 * and only suitable for a temporary demo. In a real application, the API key
 * should be handled securely on a backend server/proxy.
 *
 * @param {string} apiKey - The user's Grok API Key.
 * @param {string} userMessage - The message from the user.
 * @param {Array<{role: string, content: string}>} history - Optional chat history.
 * @returns {Promise<string>} - A promise that resolves with the assistant's message content.
 * @throws {Error} - Throws an error if the API call fails.
 */
export async function getGrokCompletion(apiKey, userMessage, history = []) {
  if (!apiKey) {
    throw new Error("Grok API Key is required.");
  }
  if (!userMessage) {
    throw new Error("User message cannot be empty.");
  }

  // Mask the API key for logging (show only first few and last few characters)
  const maskedApiKey = apiKey.length > 10
    ? `${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 5)}`
    : 'KEY_TOO_SHORT';
  
  console.log("Grok API Request Details:");
  console.log("Base URL: https://api.x.ai/v1");
  console.log("API Key (masked):", maskedApiKey);
  console.log("Model: grok-3-mini-fast");
  console.log("Messages:", history.length > 0 ? history : [{ role: "user", content: userMessage }]);

  const openai = new OpenAI({
    baseURL: 'https://api.x.ai/v1',
    apiKey: apiKey,
    dangerouslyAllowBrowser: true // Allow running in browser environment for demo purposes
  });

  try {
    const messages = history.length > 0 ? history : [{ role: "user", content: userMessage }];
    console.log("Sending prompt to AI:", JSON.stringify(messages, null, 2));
    const completion = await openai.chat.completions.create({
      messages: messages,
      model: "grok-3-mini-fast",
    });

    if (completion.choices && completion.choices.length > 0 && completion.choices[0].message?.content) {
      console.log("Grok API Response received successfully.");
      return completion.choices[0].message.content.trim();
    } else {
      console.error("Invalid response structure from Grok:", completion);
      throw new Error("Received an invalid response structure from Grok. Please check API connectivity or response format.");
    }
  } catch (error) {
    console.error("Error calling Grok API:", error);
    throw new Error(`Failed to connect to Grok API: ${error.message}. Please check your network connection or API key validity.`);
  }
}

/**
 * Generic function to get chat completion based on the selected provider.
 *
 * @param {string} provider - The API provider ('openrouter', 'deepseek', 'sambanova', or 'grok').
 * @param {string} apiKey - The API key for the selected provider.
 * @param {string} userMessage - The message from the user.
 * @param {Array<{role: string, content: string}>} history - Optional chat history.
 * @returns {Promise<string>} - A promise that resolves with the assistant's message content.
 * @throws {Error} - Throws an error if the API call fails or provider is invalid.
 */
export async function getAICompletion(provider, apiKey, userMessage, history = []) {
  if (provider === 'openrouter') {
    return await getOpenRouterCompletion(apiKey, userMessage, history);
  } else if (provider === 'deepseek') {
    return await getDeepSeekCompletion(apiKey, userMessage, history);
  } else if (provider === 'sambanova') {
    return await getSambaNovaCompletion(apiKey, userMessage, history);
  } else if (provider === 'grok') {
    return await getGrokCompletion(apiKey, userMessage, history);
  } else {
    throw new Error("Invalid API provider specified. Use 'openrouter', 'deepseek', 'sambanova', or 'grok'.");
  }
}

/**
 * Handles AI-driven dialogue generation based on a prompt and persona.
 *
 * @param {string} provider - The API provider ('openrouter' or 'deepseek').
 * @param {string} apiKey - The API key for the selected provider.
 * @param {string} prompt - The prompt describing what the AI should say.
 * @param {string} persona - Optional persona/character the AI should adopt.
 * @param {Array<{role: string, content: string}>} history - Optional chat history.
 * @returns {Promise<string>} - A promise that resolves with the generated dialogue.
 * @throws {Error} - Throws an error if the API call fails.
 */
export async function getAIDialogueCompletion(provider, apiKey, prompt, persona = null, history = []) {
  if (!apiKey) {
    throw new Error("API Key is required.");
  }
  if (!prompt) {
    throw new Error("Prompt cannot be empty.");
  }

  // Construct a system message that includes the persona if provided
  const systemMessage = persona
    ? `You are ${persona}. ${prompt}`
    : prompt;
  
  // Prepare the messages array with the system message
  const messages = [
    { role: "system", content: systemMessage },
    ...history
  ];

  try {
    // Use the existing completion function
    // Provide a minimal user message if history is empty, as API might require it.
    const placeholderUserMessage = history.length === 0 ? "Proceed." : null;
    const response = await getAICompletion(provider, apiKey, placeholderUserMessage, messages);
    return response;
  } catch (error) {
    console.error("Error in AI dialogue generation:", error);
    throw error;
  }
}

/**
 * Handles AI decision-making based on a prompt and options.
 *
 * @param {string} provider - The API provider ('openrouter' or 'deepseek').
 * @param {string} apiKey - The API key for the selected provider.
 * @param {string} prompt - The prompt describing the decision to be made.
 * @param {Array<{condition: string, nextStep: number, description: string}>} options - The options to choose from.
 * @returns {Promise<number>} - A promise that resolves with the chosen nextStep ID.
 * @throws {Error} - Throws an error if the API call fails.
 */
export async function getAIDecisionCompletion(provider, apiKey, prompt, options, defaultNextStep = null) {
  if (!apiKey) {
    throw new Error("API Key is required.");
  }
  if (!prompt) {
    throw new Error("Prompt cannot be empty.");
  }
  if (!options || !Array.isArray(options) || options.length === 0) {
    throw new Error("Options must be a non-empty array.");
  }

  // Construct a detailed system message that explains the task
  const systemMessage = `
You are an AI assistant making a decision in a game scenario.
Based on the following prompt, you must choose ONE option from the list provided.
Your response MUST be EXCLUSIVELY the nextStep value (a number) of your chosen option.
Do NOT include ANY text, explanation, spaces, or additional characters before or after the number.
Do NOT respond with the option number (e.g., 1, 2); ONLY the nextStep value is acceptable.
Failure to respond with just the nextStep value as a single number will result in an invalid response and disrupt the game flow.

PROMPT: ${prompt}

OPTIONS:
${options.map((opt, index) => `${index + 1}. ${opt.description} (nextStep: ${opt.nextStep})`).join('\n')}

CRITICAL INSTRUCTION: Respond ONLY with the nextStep value (a NUMBER) of your chosen option. Absolutely no other text, characters, or formatting is permitted, and do NOT use the option number. For example, if you choose an option with nextStep ${options[0]?.nextStep || '50'}, your response must be exactly "${options[0]?.nextStep || '50'}".
`;

  // Prepare the messages array
  const messages = [
    { role: "system", content: systemMessage },
    { role: "user", content: "Make your decision now." }
  ];

  try {
    // Log the full prompt and messages sent to the AI for debugging
    console.log("Full prompt sent to AI for decision:", systemMessage);
    console.log("Full messages array sent to AI:", messages);
    
    // Use the completion function with a placeholder user message
    const response = await getAICompletion(provider, apiKey, "Make your decision now.", messages);
    
    // Parse the response to extract a number
    const numberMatch = response.match(/\d+/);
    if (numberMatch) {
      const chosenNumber = parseInt(numberMatch[0], 10);
      
      // Check if the number directly matches a nextStep value
      const chosenOption = options.find(opt => opt.nextStep === chosenNumber);
      if (chosenOption) {
        console.log(`AI response '${chosenNumber}' directly matched to nextStep: ${chosenOption.nextStep}`);
        return chosenOption.nextStep;
      }
    }
    
    // If we couldn't parse a valid number or map it to a nextStep, use the default if provided
    if (defaultNextStep !== null) {
      console.warn("Could not parse a valid nextStep from AI response, using default:", defaultNextStep, "Full AI response:", response);
      return defaultNextStep;
    }
    
    // If no default is provided, throw an error
    throw new Error("Could not parse a valid nextStep from AI response: " + response);
  } catch (error) {
    console.error("Error in AI decision-making:", error);
    throw error;
  }
}