import json
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from notebooklm_mcp.api_client import NotebookLMClient

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes (important for Render/Cloud)

# Configuration from Environment Variables (For security and Render deployment)
NOTEBOOK_ID = os.environ.get("NOTEBOOK_ID", "3fcd759c-88d3-4c9a-8e25-a35988e28bb8")
COOKIES_RAW = os.environ.get("COOKIES")
CSRF_TOKEN = os.environ.get("CSRF_TOKEN")
SESSION_ID = os.environ.get("SESSION_ID")

def get_client():
    if not all([COOKIES_RAW, CSRF_TOKEN, SESSION_ID]):
        # Fallback to local auth file if env vars are missing (for local testing only)
        AUTH_FILE = os.path.expanduser("~/.notebooklm-mcp/auth.json")
        if os.path.exists(AUTH_FILE):
            with open(AUTH_FILE, "r") as f:
                auth_data = json.load(f)
            return NotebookLMClient(
                cookies=auth_data.get("cookies", {}),
                csrf_token=auth_data.get("csrf_token", ""),
                session_id=auth_data.get("session_id", "")
            )
        raise ValueError("Missing authentication environment variables: COOKIES, CSRF_TOKEN, SESSION_ID")
    
    # Use environment variables
    try:
        # Expected COOKIES format: JSON string or simple header string
        # If it's a JSON string, try to parse it
        cookies_dict = json.loads(COOKIES_RAW) if COOKIES_RAW.startswith('{') else COOKIES_RAW
    except:
        cookies_dict = COOKIES_RAW

    return NotebookLMClient(
        cookies=cookies_dict,
        csrf_token=CSRF_TOKEN,
        session_id=SESSION_ID
    )

@app.route('/api/query', methods=['POST'])
def handle_query():
    data = request.json
    user_query = data.get('query')
    conversation_id = data.get('conversation_id')

    if not user_query:
        return jsonify({"error": "No query provided"}), 400

    try:
        client = get_client()
        # Querying NotebookLM
        result = client.query(
            notebook_id=NOTEBOOK_ID,
            query_text=user_query,
            conversation_id=conversation_id
        )
        
        if result:
            # We return EXACTLY what NotebookLM gives us: 'answer' (Markdown) and 'conversation_id'
            return jsonify({
                "answer": result.get("answer"),
                "conversation_id": result.get("conversation_id"),
                "status": "success"
            })
        else:
            return jsonify({"error": "Failed to get response from NotebookLM"}), 500
            
    except Exception as e:
        print(f"Error in backend: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    print(f"Proxy server starting on port {port}")
    app.run(host='0.0.0.0', port=port, debug=False)
