from flask import Blueprint, request, jsonify
from services.interview_service import handle_audio_answer

interview_bp = Blueprint("interview", __name__)

@interview_bp.route("/interview-answer", methods=["POST"])
def process_interview_answer():
    if 'audio' not in request.files:
        return jsonify({"error": "No audio file found"}), 400
    
    question = request.form.get('question', '')
    if not question:
        return jsonify({"error": "No question was provided"}), 400

    audio_file = request.files['audio']
    result = handle_audio_answer(audio_file, question)

    if "error" in result:
        return jsonify(result), 500

    return jsonify(result)