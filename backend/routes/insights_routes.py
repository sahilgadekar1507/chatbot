# In backend/routes/insights_routes.py
from flask import Blueprint, jsonify
from services.insights_service import get_company_insights

insights_bp = Blueprint("insights", __name__)

@insights_bp.route("/api/company-insights/<company_name>", methods=["GET"])
def fetch_company_insights(company_name):
    result = get_company_insights(company_name)
    if "error" in result:
        return jsonify(result), 500
    return jsonify(result)