from flask import Flask, request, jsonify
from flask_cors import CORS
import traceback

# Vercel expects an 'app' instance to be exposed
app = Flask(__name__)
CORS(app)

@app.route('/', methods=['POST'])
def interest_analysis_handler():
    """
    This function handles POST requests to /api/interest-analysis.
    Flask's request.get_json() correctly handles JSON request bodies.
    """
    try:
        data = request.get_json()
        if not data or 'financial_data' not in data:
            return jsonify({"success": False, "error": "No financial data provided"}), 400

        financial_data = data['financial_data']
        
        def parseFloat(value):
            try:
                return float(value) if value is not None else 0.0
            except (ValueError, TypeError):
                return 0.0
        
        interest_metrics = [
            '01-Bank Charges', '02-Interest on Borrowings', 
            '03-Interest on Vehicle Loan', '04-MG', 'Finance Cost'
        ]
        
        total_interest = 0
        interest_breakdown = {}
        
        for metric in interest_metrics:
            total_amount = sum(parseFloat(item.get(metric, 0)) for item in financial_data)
            if total_amount > 0:
                interest_breakdown[metric] = {
                    'total_amount': total_amount,
                    'outlet_count': len([item for item in financial_data if parseFloat(item.get(metric, 0)) > 0]),
                    'average_amount': total_amount / len(financial_data) if financial_data else 0
                }
                total_interest += total_amount
        
        outlet_analysis = []
        for item in financial_data:
            outlet_interest = sum(parseFloat(item.get(metric, 0)) for metric in interest_metrics)
            revenue = parseFloat(item.get('TOTAL REVENUE', 0))
            interest_rate = (outlet_interest / revenue * 100) if revenue > 0 else 0
            
            outlet_analysis.append({
                'outlet': item.get('Outlet', 'Unknown'),
                'manager': item.get('Outlet Manager', 'Unknown'),
                'total_interest': outlet_interest,
                'revenue': revenue,
                'interest_rate': interest_rate,
                'interest_breakdown': {metric: parseFloat(item.get(metric, 0)) for metric in interest_metrics}
            })
        
        outlet_analysis.sort(key=lambda x: x['interest_rate'])
        
        response = {
            "success": True,
            "total_interest_costs": total_interest,
            "interest_breakdown": interest_breakdown,
            "outlet_analysis": outlet_analysis,
            "average_interest_rate": sum(item['interest_rate'] for item in outlet_analysis) / len(outlet_analysis) if outlet_analysis else 0,
            "message": f"Interest analysis completed for {len(financial_data)} outlets"
        }
        
        return jsonify(response)
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Interest analysis failed: {str(e)}",
            "traceback": traceback.format_exc()
        }), 500
