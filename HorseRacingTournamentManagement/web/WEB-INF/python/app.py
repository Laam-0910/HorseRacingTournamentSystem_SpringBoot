from flask import Flask, request, jsonify
from flask_cors import CORS
from chatbot import chat
from predictor import predict_race, train_model

app = Flask(__name__)
app.json.ensure_ascii = False
CORS(app)

@app.route("/chat", methods=["POST"])
def chatbot():
    data = request.json
    message = data.get("message", "").strip()
    lang = data.get("lang", None)
    if not message:
        return jsonify({"success": False, "error": "message is required"}), 400
    reply = chat(message, lang)
    return jsonify({"success": True, "reply": reply})

@app.route("/predict/<int:race_id>", methods=["GET"])
def predict(race_id):
    try:
        result = predict_race(race_id)
        return jsonify({"success": True, "predictions": result, "race_id": race_id})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/train", methods=["POST"])
def retrain():
    model = train_model()
    return jsonify({"success": model is not None, "message": "Model retrained"})

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)