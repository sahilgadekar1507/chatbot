import io
import os
import json
import pdfplumber
from docx import Document
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

def analyze_resume_with_gemini(file_path, file_content):
    file_stream = io.BytesIO(file_content)
    full_text = ""
    if file_path.endswith(".pdf"):
        full_text = extract_text_from_pdf(file_stream)
    elif file_path.endswith(".docx"):
        full_text = extract_text_from_docx(file_stream)
    else:
        return {"error": "Unsupported file type."}

    try:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key: return {"error": "GEMINI_API_KEY not found in .env file."}
        genai.configure(api_key=api_key)
        
        prompt = "You are an expert resume analyzer. Parse the following resume text into a structured JSON format with keys like 'basics' (for name, email, phone), 'experience', 'education', 'skills', and 'projects'."
        
        model = genai.GenerativeModel('gemini-1.5-flash-latest')
        generation_config = {"response_mime_type": "application/json"}
        response = model.generate_content([prompt, full_text], generation_config=generation_config)
        
        analysis_json = json.loads(response.text)
        return {"analysis": analysis_json, "full_text": full_text}
    except Exception as e:
        print(f"An error occurred in resume analysis: {e}")
        return {"error": "Failed to get analysis from Gemini API."}

def generate_questions_from_text(resume_text):
    try:
        gemini_api_key = os.getenv("GEMINI_API_KEY")
        if not gemini_api_key: return {"error": "GEMINI_API_KEY not found in .env file."}
        genai.configure(api_key=gemini_api_key)
        
        prompt = f"""
        You are a senior hiring manager. Based on the following resume text, generate a list of interview questions.
        Format your response as a single JSON object with three keys: "project_questions", "technical_questions", and "behavioral_questions". Each key should hold an array of question strings.
        --- RESUME TEXT ---
        {resume_text}
        ---
        """
        model = genai.GenerativeModel('gemini-1.5-flash-latest')
        generation_config = {"response_mime_type": "application/json"}
        response = model.generate_content(prompt, generation_config=generation_config)
        
        return {"questions": response.text}
    except Exception as e:
        print(f"An error occurred while generating questions: {e}")
        return {"error": "An internal error occurred during question generation."}

# Helper Functions
def extract_text_from_pdf(file_stream):
    text = ""
    with pdfplumber.open(file_stream) as pdf:
        for page in pdf.pages:
            text += page.extract_text() + "\n"
    return text

def extract_text_from_docx(file_stream):
    doc = Document(file_stream)
    text = "\n".join([para.text for para in doc.paragraphs])
    return text