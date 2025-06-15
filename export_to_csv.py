import sqlite3
import json
import csv
from datetime import datetime

DATABASE_URL = 'user_activity.db'

def export_chat_history_to_csv(conn, writer):
    """
    Exports chat history data to a CSV writer.
    Each chat message becomes a row in the CSV.
    """
    cursor = conn.cursor()
    cursor.execute("SELECT session_id, client_timestamp, server_timestamp, data_content FROM UserActivityLog WHERE data_type = 'chatHistories'") # Corrected dataType
    
    writer.writerow([
        'session_id', 
        'submission_client_timestamp', # Timestamp when the whole chatHistory object was submitted
        'submission_server_timestamp', # Timestamp when server received it
        'persona_id_conversation_with', 
        'message_role', 
        'message_content',
        'message_image', # Added for potential image in chat
        'message_source', # Added for potential source in chat
        'message_step_id', # Added for potential stepId in chat
        'message_script_id', # Added for potential scriptId in chat
        'message_timestamp' # Assuming messages might have their own timestamps
    ])
    
    for row in cursor.fetchall():
        session_id, client_ts, server_ts, data_content_json = row
        try:
            chat_histories_obj = json.loads(data_content_json)
            if not isinstance(chat_histories_obj, dict):
                print(f"Skipping row for session {session_id}: chatHistories data_content is not a dictionary.")
                continue

            for persona_id, messages in chat_histories_obj.items():
                if not isinstance(messages, list):
                    print(f"Skipping messages for persona {persona_id} in session {session_id}: messages is not a list.")
                    continue
                for message in messages:
                    if not isinstance(message, dict):
                        print(f"Skipping a message for persona {persona_id} in session {session_id}: message is not a dictionary.")
                        continue
                    writer.writerow([
                        session_id,
                        client_ts,
                        server_ts,
                        persona_id,
                        message.get('role'),
                        message.get('content'),
                        message.get('image'),
                        message.get('source'),
                        message.get('stepId'),
                        message.get('scriptId'),
                        message.get('timestamp') # Assuming individual messages might have a 'timestamp' field
                    ])
        except json.JSONDecodeError:
            print(f"Skipping row for session {session_id}: Could not decode chatHistories JSON: {data_content_json[:100]}...")
        except Exception as e:
            print(f"An error occurred processing chat history for session {session_id}: {e}")

def export_other_data_to_csv(conn, writer, data_type_filter=None):
    """
    Exports other data types to a CSV writer.
    If data_type_filter is provided, only exports that type.
    Otherwise, exports all types except 'chatHistories'.
    """
    query = "SELECT id, session_id, data_type, client_timestamp, server_timestamp, data_content FROM UserActivityLog"
    params = []
    if data_type_filter:
        query += " WHERE data_type = ?"
        params.append(data_type_filter)
    else:
        query += " WHERE data_type != 'chatHistories'" # Corrected dataType

    cursor = conn.cursor()
    cursor.execute(query, params)
    
    writer.writerow([
        'db_id', 
        'session_id', 
        'data_type', 
        'submission_client_timestamp', 
        'submission_server_timestamp', 
        'data_content_json'
    ])
    
    for row in cursor.fetchall():
        writer.writerow(row)

def main():
    timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S")
    conn = None
    try:
        conn = sqlite3.connect(DATABASE_URL)
        conn.row_factory = sqlite3.Row # Access columns by name

        # Export Chat History
        chat_history_filename = f'chatHistory_export_{timestamp_str}.csv'
        with open(chat_history_filename, 'w', newline='', encoding='utf-8') as csvfile:
            csv_writer = csv.writer(csvfile)
            print(f"Exporting chat histories to {chat_history_filename}...")
            export_chat_history_to_csv(conn, csv_writer)
            print(f"Chat histories export complete.")

        # Export Player State
        player_state_filename = f'playerState_export_{timestamp_str}.csv'
        with open(player_state_filename, 'w', newline='', encoding='utf-8') as csvfile:
            csv_writer = csv.writer(csvfile)
            print(f"Exporting playerState to {player_state_filename}...")
            export_other_data_to_csv(conn, csv_writer, data_type_filter='playerState')
            print(f"PlayerState export complete.")
            
        # Export Discovered Clues
        discovered_clues_filename = f'discoveredClues_export_{timestamp_str}.csv'
        with open(discovered_clues_filename, 'w', newline='', encoding='utf-8') as csvfile:
            csv_writer = csv.writer(csvfile)
            print(f"Exporting discoveredClues to {discovered_clues_filename}...")
            export_other_data_to_csv(conn, csv_writer, data_type_filter='discoveredClues')
            print(f"DiscoveredClues export complete.")

        # Export Current Puzzle State
        current_puzzle_state_filename = f'currentPuzzleState_export_{timestamp_str}.csv'
        with open(current_puzzle_state_filename, 'w', newline='', encoding='utf-8') as csvfile:
            csv_writer = csv.writer(csvfile)
            print(f"Exporting currentPuzzleState to {current_puzzle_state_filename}...")
            export_other_data_to_csv(conn, csv_writer, data_type_filter='currentPuzzleState')
            print(f"CurrentPuzzleState export complete.")

        # Export any other remaining data types (excluding chatHistories, playerState, etc. if handled separately)
        # For simplicity, this example will create a generic "other_data" for anything not explicitly handled.
        # A more robust solution might iterate unique data_types from the DB.
        other_data_filename = f'other_activity_log_export_{timestamp_str}.csv'
        with open(other_data_filename, 'w', newline='', encoding='utf-8') as csvfile:
            csv_writer = csv.writer(csvfile)
            print(f"Exporting other data types to {other_data_filename}...")
            # Modify export_other_data_to_csv to exclude already exported types if needed,
            # or simply run it for all non-chatHistory types if that's acceptable.
            # For this version, let's make a specific query for truly "other" data.
            cursor = conn.cursor()
            cursor.execute("SELECT id, session_id, data_type, client_timestamp, server_timestamp, data_content FROM UserActivityLog WHERE data_type NOT IN ('chatHistories', 'playerState', 'discoveredClues', 'currentPuzzleState')")
            csv_writer.writerow(['db_id', 'session_id', 'data_type', 'submission_client_timestamp', 'submission_server_timestamp', 'data_content_json'])
            for row in cursor.fetchall():
                csv_writer.writerow(row)
            print(f"Other data types export complete.")

    except sqlite3.Error as e:
        print(f"Database error: {e}")
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == '__main__':
    main()