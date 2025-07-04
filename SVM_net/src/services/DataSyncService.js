import { v4 as uuidv4 } from 'uuid';

// 后端 API 地址 - 请根据您的实际后端运行地址和端口进行修改
// 如果您的 Flask 应用运行在本地的 5001 端口 (如 app.py 中的设置)
const API_ENDPOINT = 'https://php-perceived-newark-swaziland.trycloudflare.com/api/log_data'; 
// 如果您的前端和后端在不同源（例如，前端通过 vite dev server 运行在不同端口），
// 您可能需要在 Flask 后端配置 CORS (Cross-Origin Resource Sharing)。
// 一个简单的 Flask CORS 设置是: pip install flask-cors, 然后在 app.py 中:
// from flask_cors import CORS
// app = Flask(__name__)
// CORS(app) // 这将允许所有源的跨域请求，生产环境中应配置得更严格

const SESSION_ID_KEY = 'svmUserSessionId';

let currentSessionId = localStorage.getItem(SESSION_ID_KEY);

if (!currentSessionId) {
    currentSessionId = uuidv4();
    localStorage.setItem(SESSION_ID_KEY, currentSessionId);
    console.log(`[DataSyncService] New session ID generated: ${currentSessionId}`);
} else {
    console.log(`[DataSyncService] Existing session ID found: ${currentSessionId}`);
}

/**
 * Logs specified data to the backend.
 * @param {string} dataType - A string identifier for the type of data being logged (e.g., "chatHistory", "playerState", "puzzleAttempt").
 * @param {object} payload - The actual data object to be logged.
 * @returns {Promise<object>} A promise that resolves with the server's JSON response on success, or rejects on error.
 */
export const logDataToBackend = async (dataType, payload) => {
    if (!currentSessionId) {
        console.error("[DataSyncService] Session ID is not available. Cannot log data.");
        return Promise.reject(new Error("Session ID missing"));
    }
    if (!dataType || typeof dataType !== 'string' || dataType.trim() === '') {
        console.error("[DataSyncService] dataType must be a non-empty string.");
        return Promise.reject(new Error("Invalid dataType"));
    }
    if (payload === undefined || payload === null) { // Allow empty objects/arrays, but not undefined/null
        console.error("[DataSyncService] payload cannot be undefined or null.");
        return Promise.reject(new Error("Invalid payload"));
    }

    const clientTimestamp = new Date().toISOString();
    const requestBody = {
        sessionId: currentSessionId,
        dataType,
        clientTimestamp,
        payload
    };

    console.log(`[DataSyncService] Attempting to log data:`, requestBody);

    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        const responseData = await response.json(); // Try to parse JSON regardless of response.ok for more info

        if (!response.ok) {
            console.error(`[DataSyncService] Error logging data (${dataType}). Status: ${response.status}. Response:`, responseData);
            throw new Error(`Server error: ${response.status} - ${responseData.message || response.statusText || 'Unknown server error'}`);
        }
        
        console.log(`[DataSyncService] Data (${dataType}) logged successfully:`, responseData);
        return responseData;
    } catch (error) {
        // This catches network errors and errors thrown from response.ok check
        console.error(`[DataSyncService] Failed to log data (${dataType}) to backend:`, error.message);
        // Optional: Implement more sophisticated retry logic or a queuing system here for offline support
        throw error; // Re-throw the error so the caller can handle it
    }
};

// --- Example Usage (Illustrative - to be implemented in appropriate components) ---
/*
import { logDataToBackend } from './DataSyncService';

// Example: Logging chat history (e.g., when a conversation ends or periodically)
const someChatHistory = { 
    "Echo": [{"role": "Echo", "content": "Test message"}],
    "AhMing": [{"role": "Player", "content": "Hello Ah Ming"}] 
};
logDataToBackend('chatHistory', someChatHistory)
    .then(response => console.log('Chat history sync response:', response))
    .catch(error => console.error('Chat history sync failed:', error));

// Example: Logging player state (e.g., when player stats change significantly or on game save)
const currentPlayerState = { 
    name: 'NeonRunner', 
    credits: 500, 
    inventory: [{id: 'item_1', quantity: 2}] 
};
logDataToBackend('playerState', currentPlayerState)
    .then(response => console.log('Player state sync response:', response))
    .catch(error => console.error('Player state sync failed:', error));
*/