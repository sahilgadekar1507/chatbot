# In backend/routes/page_routes.py
from flask import Blueprint, render_template

page_bp = Blueprint("pages", __name__, template_folder='templates')

@page_bp.route("/")
def dashboard():
    return render_template("index.html")

@page_bp.route("/mock-interview")
def mock_interview():
    return render_template("mock-interview.html")

@page_bp.route("/company-insights")
def company_insights():
    return render_template("company-insights.html")

# --- ADD THIS NEW FUNCTION ---
@page_bp.route("/resume-analysis")
def resume_analysis():
    return render_template("resume-analysis.html")