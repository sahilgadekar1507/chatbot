# In backend/services/insights_service.py
import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

def get_company_insights(company_name):
    """
    Calls the Gemini API to get placement-focused insights for a given company.
    """
    try:
        gemini_api_key = os.getenv("GEMINI_API_KEY")
        if not gemini_api_key:
            return {"error": "GEMINI_API_KEY not found in .env file."}
        
        genai.configure(api_key=gemini_api_key)

        # This is the same powerful prompt from your Node.js server
        prompt = f"""
        Analyze "{company_name}" for a student preparing for job placements in India. Provide the following information in a structured JSON object. Do not include any text, markdown, or comments before or after the JSON object.

        The JSON object must contain these exact keys: "companyTrends", "faq", "vacancyData", "aptitudeOverview".

        - "companyTrends": A list of 3 recent, significant trends about the company. Each item must be an object with a "trend" (a short title) and a "description" (a 1-2 sentence explanation).
        - "faq": A list of 5 frequently asked interview questions for software engineering roles at this company. Each item must be an object with a "question" and a concise "answer".
        - "vacancyData": A short, insightful paragraph analyzing the common types of job roles this company is actively hiring for.
        - "aptitudeOverview": A short, helpful paragraph describing the typical aptitude tests or online assessment rounds the company uses.
        """

        model = genai.GenerativeModel('gemini-1.5-flash-latest')
        generation_config = {"response_mime_type": "application/json"}
        response = model.generate_content(prompt, generation_config=generation_config)
        
        insights_json = json.loads(response.text)
        return insights_json

    except Exception as e:
        print(f"An error occurred in insights service: {e}")
        return {"error": "Failed to get insights from Gemini API."}