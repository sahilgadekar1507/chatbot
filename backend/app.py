from flask import Flask
from flask_cors import CORS
from routes.resume import resume_bp
from routes.interview_routes import interview_bp

app = Flask(__name__)
# Allow requests from your frontend's origin (http://localhost:8000)
CORS(app, resources={r"/*": {"origins": "http://localhost:8000"}})

app.register_blueprint(resume_bp)
app.register_blueprint(interview_bp)

if __name__ == "__main__":
    app.run(debug=True)