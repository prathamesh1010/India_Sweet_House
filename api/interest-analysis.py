from http.server import BaseHTTPRequestHandler
import json
import traceback

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        return

    def do_POST(self):
        try:
            # Parse JSON request body
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data.decode('utf-8'))
            except json.JSONDecodeError:
                self.send_error_response("Invalid JSON in request body")
                return
            
            if not data or 'financial_data' not in data:
                self.send_error_response("No financial data provided")
                return

            financial_data = data['financial_data']
            
            # Calculate interest analysis metrics
            interest_metrics = [
                '01-Bank Charges',
                '02-Interest on Borrowings', 
                '03-Interest on Vehicle Loan',
                '04-MG',
                'Finance Cost'
            ]
            
            # Helper function to safely parse float values
            def parseFloat(value):
                try:
                    return float(value) if value is not None else 0.0
                except (ValueError, TypeError):
                    return 0.0
            
            # Calculate total interest costs
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
            
            # Calculate interest rates by outlet
            outlet_analysis = []
            for item in financial_data:
                outlet = item.get('Outlet', 'Unknown')
                manager = item.get('Outlet Manager', 'Unknown')
                revenue = parseFloat(item.get('TOTAL REVENUE', 0))
                
                outlet_interest = sum(parseFloat(item.get(metric, 0)) for metric in interest_metrics)
                interest_rate = (outlet_interest / revenue * 100) if revenue > 0 else 0
                
                outlet_analysis.append({
                    'outlet': outlet,
                    'manager': manager,
                    'total_interest': outlet_interest,
                    'revenue': revenue,
                    'interest_rate': interest_rate,
                    'interest_breakdown': {metric: parseFloat(item.get(metric, 0)) for metric in interest_metrics}
                })
            
            # Sort by interest rate for efficiency analysis
            outlet_analysis.sort(key=lambda x: x['interest_rate'])
            
            response = {
                "success": True,
                "total_interest_costs": total_interest,
                "interest_breakdown": interest_breakdown,
                "outlet_analysis": outlet_analysis,
                "average_interest_rate": sum(item['interest_rate'] for item in outlet_analysis) / len(outlet_analysis) if outlet_analysis else 0,
                "message": f"Interest analysis completed for {len(financial_data)} outlets"
            }
            
            # Send response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            self.wfile.write(json.dumps(response).encode())
            
        except Exception as e:
            self.send_error_response(f"Interest analysis failed: {str(e)}")
    
    def send_error_response(self, error_message):
        self.send_response(500)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        response = {
            "success": False,
            "error": error_message,
            "traceback": traceback.format_exc()
        }
        
        self.wfile.write(json.dumps(response).encode())
