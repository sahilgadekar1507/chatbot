from flask import Blueprint, request, jsonify
from services.resume_parser import analyze_resume_with_gemini, generate_questions_from_text

resume_bp = Blueprint("resume", __name__)

@resume_bp.route("/analyze-resume", methods=["POST"])
def upload_resume():
    if 'resume' not in request.files: return jsonify({"error": "No resume file found"}), 400
    file = request.files['resume']
    if file.filename == '': return jsonify({"error": "No selected file"}), 400
    file_content = file.read()
    analysis_result = analyze_resume_with_gemini(file.filename, file_content)
    if "error" in analysis_result: return jsonify(analysis_result), 400
    return jsonify(analysis_result)

@resume_bp.route("/generate-questions-from-text", methods=["POST"])
def generate_questions_from_text_route():
    data = request.get_json()
    if not data or 'resume_text' not in data:
        return jsonify({"error": "No resume text provided"}), 400
    
    resume_text = data['resume_text']
    result = generate_questions_from_text(resume_text)
    
    if "error" in result: return jsonify(result), 500
    return jsonify(result)