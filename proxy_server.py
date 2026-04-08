import json
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app)

# Configuración desde Render (Variables de Entorno)
NOTEBOOK_ID = os.environ.get("NOTEBOOK_ID", "3fcd759c-88d3-4c9a-8e25-a35988e28bb8")
COOKIES_RAW = os.environ.get("GOOGLE_COOKIES")

@app.route('/', methods=['GET'])
def health_check():
    return jsonify({"status": "online", "message": "Proxy server is running"}), 200

@app.route('/api/query', methods=['POST'])
def handle_query():
    data = request.json
    user_query = data.get('query')
    
    if not user_query:
        return jsonify({"error": "No query provided"}), 400

    # Mensaje de confirmación para verificar que el servidor recibe datos
    return jsonify({
        "answer": f"¡Servidor conectado exitosamente! Recibí tu pregunta: '{user_query}'. El siguiente paso es vincular la lógica de NotebookLM.",
        "status": "success"
    })

if __name__ == '__main__':
    # Render asigna dinámicamente un puerto, por defecto usamos 10000
    port = int(os.environ.get("PORT", 10000))
    app.run(host='0.0.0.0', port=port)

# Despliegue final 1
