import sqlite3
import json
from flask import Flask, request, jsonify
from flask_cors import CORS # Import CORS
from datetime import datetime

# --- Configuration ---
DATABASE_URL = 'user_activity.db' # SQLite database file will be created in the same directory

# --- Flask App Initialization ---
app = Flask(__name__)
CORS(app) # Enable CORS for all routes by default

# --- Database Setup ---
def get_db_connection():
    """Establishes a connection to the SQLite database."""
    conn = sqlite3.connect(DATABASE_URL)
    conn.row_factory = sqlite3.Row # Allows accessing columns by name
    return conn

def init_db():
    """Initializes the database and creates the UserActivityLog table if it doesn't exist."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS UserActivityLog (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            data_type TEXT NOT NULL,
            data_content TEXT NOT NULL,
            client_timestamp TEXT NOT NULL,
            server_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()
    print("Database initialized.")

# --- API Endpoints ---
@app.route('/api/log_data', methods=['POST'])
def log_data():
    """
    Receives user activity data from the frontend and logs it into the database.
    Expected JSON payload:
    {
      "sessionId": "string_unique_session_identifier",
      "dataType": "string_data_category", 
      "clientTimestamp": "string_iso_8601_timestamp", 
      "payload": { ... } // JSON object or array
    }
    """
    if not request.is_json:
        return jsonify({"status": "error", "message": "Request must be JSON"}), 400

    data = request.get_json()

    session_id = data.get('sessionId')
    data_type = data.get('dataType')
    client_timestamp = data.get('clientTimestamp')
    payload = data.get('payload')

    if not all([session_id, data_type, client_timestamp, payload is not None]):
        return jsonify({
            "status": "error", 
            "message": "Missing required fields: sessionId, dataType, clientTimestamp, payload"
        }), 400

    try:
        # Serialize payload to JSON string to store in TEXT column
        data_content_json = json.dumps(payload)
    except TypeError as e:
        return jsonify({"status": "error", "message": f"Error serializing payload: {str(e)}"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO UserActivityLog (session_id, data_type, data_content, client_timestamp)
            VALUES (?, ?, ?, ?)
        ''', (session_id, data_type, data_content_json, client_timestamp))
        conn.commit()
        log_id = cursor.lastrowid
        conn.close()
        return jsonify({
            "status": "success", 
            "message": "Data logged successfully.",
            "log_id": log_id
        }), 201
    except sqlite3.Error as e:
        app.logger.error(f"Database error: {e}")
        return jsonify({"status": "error", "message": f"Database error: {str(e)}"}), 500
    except Exception as e:
        app.logger.error(f"An unexpected error occurred: {e}")
        return jsonify({"status": "error", "message": f"An unexpected error occurred: {str(e)}"}), 500

# --- Main Execution ---
if __name__ == '__main__':
    init_db() # Initialize the database when the app starts
    # For development, running with debug=True is helpful.
    # For a simple local deployment for an event, host='0.0.0.0' makes it accessible on your local network.
    app.run(host='0.0.0.0', port=5001, debug=True)