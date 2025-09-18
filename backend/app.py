# In backend/app.py
import os
from flask import Flask
from flask_cors import CORS
from routes.resume import resume_bp
from routes.interview_routes import interview_bp
from routes.page_routes import page_bp # <-- 1. IMPORT
from routes.insights_routes import insights_bp # <-- 1. IMPORT

app = Flask(__name__)
CORS(app)

app.register_blueprint(page_bp) # <-- 2. REGISTER THE PAGE ROUTES
app.register_blueprint(resume_bp)
app.register_blueprint(interview_bp)
app.register_blueprint(insights_bp) # <-- 2. REGISTER

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))  # Render gives you a PORT
    app.run(host="0.0.0.0", port=port, debug=True)