import os
import google.generativeai as genai
from deepgram import DeepgramClient, PrerecordedOptions, BufferSource

def handle_audio_answer(audio_file, interview_question):
    try:
        deepgram_api_key = os.getenv("DEEPGRAM_API_KEY")
        if not deepgram_api_key:
            return {"error": "DEEPGRAM_API_KEY not found in .env file."}
        audio_buffer = audio_file.read()
        deepgram = DeepgramClient(deepgram_api_key)
        payload: BufferSource = {"buffer": audio_buffer}
        options = PrerecordedOptions(model="nova-2", smart_format=True)
        response = deepgram.listen.prerecorded.v("1").transcribe_file(payload, options)
        transcribed_text = response["results"]["channels"][0]["alternatives"][0]["transcript"]
        
        if not transcribed_text:
            return {"error": "Could not understand the audio. Please speak more clearly."}

        gemini_api_key = os.getenv("GEMINI_API_KEY")
        if not gemini_api_key:
            return {"error": "GEMINI_API_KEY not found in .env file."}
        genai.configure(api_key=gemini_api_key)
        
        prompt = f"""
        You are an expert hiring manager reviewing an interview answer.
        The question asked was: "{interview_question}"
        The candidate's transcribed answer is: "{transcribed_text}"
        Analyze the answer and provide a score from 1 to 10 and detailed feedback.
        Format your response as a single JSON object with keys for "transcribed_text", "overall_score", and "overall_feedback".
        """
        
        model = genai.GenerativeModel('gemini-1.5-flash-latest')
        generation_config = {"response_mime_type": "application/json"}
        gemini_response = model.generate_content(prompt, generation_config=generation_config)
        
        return {"analysis": gemini_response.text}
    except Exception as e:
        print(f"An error occurred in the interview service: {e}")
        return {"error": "An internal error occurred during analysis."}