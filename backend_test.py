"""
TruckShield Backend API Test Suite
Tests all endpoints with authorization, risk engine, OCR, and data isolation
"""
import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any, Optional

class TruckShieldAPITester:
    def __init__(self, base_url="https://logistics-risk-lab.preview.emergentagent.com/api/v1"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.tests_failed = 0
        self.failed_tests = []
        
    def log(self, message: str, level: str = "INFO"):
        """Log test messages"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
    
    def run_test(self, name: str, method: str, endpoint: str, 
                 expected_status: int, data: Optional[Dict] = None,
                 files: Optional[Dict] = None, headers: Optional[Dict] = None) -> tuple:
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        req_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            req_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            req_headers.update(headers)
        
        if files:
            req_headers.pop('Content-Type', None)
        
        self.tests_run += 1
        self.log(f"Testing {name}...", "TEST")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=req_headers, timeout=30)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files, data=data, headers=req_headers, timeout=30)
                else:
                    response = requests.post(url, json=data, headers=req_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=req_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=req_headers, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            success = response.status_code == expected_status
            
            try:
                response_data = response.json()
            except:
                response_data = {"raw": response.text}
            
            if success:
                self.tests_passed += 1
                self.log(f"✅ PASSED - {name} (Status: {response.status_code})", "PASS")
            else:
                self.tests_failed += 1
                self.failed_tests.append({
                    "test": name,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "response": response_data
                })
                self.log(f"❌ FAILED - {name} (Expected {expected_status}, got {response.status_code})", "FAIL")
                self.log(f"Response: {json.dumps(response_data, indent=2)}", "DEBUG")
            
            return success, response_data, response.status_code
        
        except Exception as e:
            self.tests_failed += 1
            self.failed_tests.append({
                "test": name,
                "error": str(e)
            })
            self.log(f"❌ FAILED - {name} (Error: {str(e)})", "FAIL")
            return False, {}, 0
    
    def test_health(self):
        """Test health endpoint"""
        self.log("\n=== HEALTH CHECK ===", "SECTION")
        success, data, _ = self.run_test(
            "Health Check",
            "GET",
            "health",
            200
        )
        if success and data.get("success"):
            self.log(f"Health status: {data.get('data', {}).get('status')}", "INFO")
        return success
    
    def test_auth_register(self, email: str, password: str, full_name: str, 
                          company_name: str, phone: str):
        """Test user registration"""
        self.log("\n=== AUTH REGISTRATION ===", "SECTION")
        success, data, _ = self.run_test(
            "Register New User",
            "POST",
            "auth/register",
            201,
            data={
                "email": email,
                "password": password,
                "full_name": full_name,
                "company_name": company_name,
                "phone": phone
            }
        )
        
        if success:
            if data.get("success") and "token" in data.get("data", {}):
                self.token = data["data"]["token"]
                self.user_id = data["data"]["user"].get("id")
                self.log(f"Registered user: {email}", "INFO")
                
                # Check password_hash is NOT exposed
                if "password_hash" in data["data"]["user"]:
                    self.log("⚠️  WARNING: password_hash exposed in response!", "WARN")
                    return False
                return True
        return False
    
    def test_auth_login(self, email: str, password: str):
        """Test user login"""
        self.log("\n=== AUTH LOGIN ===", "SECTION")
        success, data, _ = self.run_test(
            "Login User",
            "POST",
            "auth/login",
            200,
            data={
                "email": email,
                "password": password
            }
        )
        
        if success:
            if data.get("success") and "token" in data.get("data", {}):
                self.token = data["data"]["token"]
                self.user_id = data["data"]["user"].get("id")
                self.log(f"Logged in as: {email}", "INFO")
                
                # Check password_hash is NOT exposed
                if "password_hash" in data["data"]["user"]:
                    self.log("⚠️  WARNING: password_hash exposed in response!", "WARN")
                    return False
                return True
        return False
    
    def test_auth_me(self):
        """Test get current user profile"""
        self.log("\n=== AUTH ME ===", "SECTION")
        success, data, _ = self.run_test(
            "Get Current User Profile",
            "GET",
            "auth/me",
            200
        )
        
        if success and data.get("success"):
            user = data.get("data", {})
            self.log(f"User profile: {user.get('email')}", "INFO")
            return True
        return False
    
    def test_auth_negative(self):
        """Test negative auth scenarios"""
        self.log("\n=== AUTH NEGATIVE TESTS ===", "SECTION")
        
        # Wrong password
        success, data, status = self.run_test(
            "Login with Wrong Password",
            "POST",
            "auth/login",
            401,
            data={
                "email": "demo@truckshield.app",
                "password": "WrongPassword123"
            }
        )
        
        if not success or not data.get("error"):
            self.log("❌ Wrong password should return 401 with error envelope", "FAIL")
            return False
        
        # Missing token on protected route
        old_token = self.token
        self.token = None
        success, data, status = self.run_test(
            "Access Protected Route Without Token",
            "GET",
            "auth/me",
            401
        )
        self.token = old_token
        
        if not success or not data.get("error"):
            self.log("❌ Missing token should return 401 with error envelope", "FAIL")
            return False
        
        return True
    
    def test_vehicles(self):
        """Test vehicle CRUD operations"""
        self.log("\n=== VEHICLES ===", "SECTION")
        
        # Create vehicle
        success, data, _ = self.run_test(
            "Create Vehicle",
            "POST",
            "vehicles",
            201,
            data={
                "vehicle_number": f"TEST-{datetime.now().strftime('%H%M%S')}",
                "vehicle_type": "TRUCK",
                "capacity": "10000 kg",
                "status": "active"
            }
        )
        
        if not success or not data.get("success"):
            return False
        
        vehicle_id = data["data"].get("id")
        self.log(f"Created vehicle: {vehicle_id}", "INFO")
        
        # List vehicles
        success, data, _ = self.run_test(
            "List Vehicles",
            "GET",
            "vehicles",
            200
        )
        
        if success and data.get("success"):
            vehicles = data.get("data", [])
            self.log(f"Found {len(vehicles)} vehicles", "INFO")
            return True
        
        return False
    
    def test_trips_crud(self):
        """Test trip CRUD operations"""
        self.log("\n=== TRIPS CRUD ===", "SECTION")
        
        # Create trip
        success, data, _ = self.run_test(
            "Create Trip",
            "POST",
            "trips",
            201,
            data={
                "origin": "Mumbai, Maharashtra",
                "destination": "Delhi, NCR",
                "declared_distance_km": 1400,
                "vehicle_number": "MH01AB1234",
                "vehicle_type": "TRUCK",
                "goods_description": "Electronics",
                "invoice_value": 500000
            }
        )
        
        if not success or not data.get("success"):
            return False
        
        trip_id = data["data"].get("id")
        self.log(f"Created trip: {trip_id}", "INFO")
        
        # Get trip by ID
        success, data, _ = self.run_test(
            "Get Trip by ID",
            "GET",
            f"trips/{trip_id}",
            200
        )
        
        if not success:
            return False
        
        # List trips
        success, data, _ = self.run_test(
            "List Trips",
            "GET",
            "trips",
            200
        )
        
        if not success:
            return False
        
        # Update trip
        success, data, _ = self.run_test(
            "Update Trip",
            "PUT",
            f"trips/{trip_id}",
            200,
            data={
                "invoice_value": 600000
            }
        )
        
        if not success:
            return False
        
        # Delete trip
        success, data, _ = self.run_test(
            "Delete Trip",
            "DELETE",
            f"trips/{trip_id}",
            200
        )
        
        return success
    
    def test_trip_analyze(self):
        """Test trip risk analysis"""
        self.log("\n=== TRIP RISK ANALYSIS ===", "SECTION")
        
        # Create a trip
        success, data, _ = self.run_test(
            "Create Trip for Analysis",
            "POST",
            "trips",
            201,
            data={
                "origin": "Mumbai, Maharashtra",
                "destination": "Pune, Maharashtra",
                "declared_distance_km": 150,
                "vehicle_number": "MH12CD5678",
                "vehicle_type": "TRUCK",
                "goods_description": "Textiles",
                "invoice_value": 200000
            }
        )
        
        if not success:
            return False
        
        trip_id = data["data"].get("id")
        
        # Analyze trip
        success, data, _ = self.run_test(
            "Analyze Trip Risk",
            "POST",
            f"trips/{trip_id}/analyze",
            200
        )
        
        if not success or not data.get("success"):
            return False
        
        analysis = data.get("data", {})
        
        # Validate analysis structure
        required_fields = ["score", "level", "factors", "recommendations"]
        for field in required_fields:
            if field not in analysis:
                self.log(f"❌ Missing field in analysis: {field}", "FAIL")
                return False
        
        # Validate score range
        score = analysis.get("score", -1)
        if not (0 <= score <= 100):
            self.log(f"❌ Score out of range: {score}", "FAIL")
            return False
        
        # Validate level
        level = analysis.get("level")
        if level not in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]:
            self.log(f"❌ Invalid risk level: {level}", "FAIL")
            return False
        
        # Validate factors (should have 5 factors)
        factors = analysis.get("factors", [])
        if len(factors) != 5:
            self.log(f"⚠️  Expected 5 factors, got {len(factors)}", "WARN")
        
        # Validate factor structure
        for factor in factors:
            required_factor_fields = ["factor_type", "severity", "score", "title", "description", "recommendation"]
            for field in required_factor_fields:
                if field not in factor:
                    self.log(f"❌ Missing field in factor: {field}", "FAIL")
                    return False
        
        self.log(f"Risk Score: {score}, Level: {level}, Factors: {len(factors)}", "INFO")
        
        # Get trip risk
        success, data, _ = self.run_test(
            "Get Trip Risk Evaluation",
            "GET",
            f"trips/{trip_id}/risk",
            200
        )
        
        if success and data.get("success"):
            self.log("Risk evaluation persisted successfully", "INFO")
            return True
        
        return False
    
    def test_routes_analyze(self):
        """Test route analysis"""
        self.log("\n=== ROUTE ANALYSIS ===", "SECTION")
        
        success, data, _ = self.run_test(
            "Analyze Route",
            "POST",
            "routes/analyze",
            200,
            data={
                "origin": "Mumbai, Maharashtra",
                "destination": "Bangalore, Karnataka"
            }
        )
        
        if success and data.get("success"):
            route_data = data.get("data", {})
            if "estimated_distance_km" in route_data and "is_demo" in route_data:
                self.log(f"Route distance: {route_data.get('estimated_distance_km')} km (demo: {route_data.get('is_demo')})", "INFO")
                return True
        
        return False
    
    def test_documents(self):
        """Test document upload and OCR"""
        self.log("\n=== DOCUMENTS ===", "SECTION")
        
        # Create a simple test image (1x1 pixel PNG)
        import base64
        test_image = base64.b64decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        )
        
        # Upload document
        success, data, _ = self.run_test(
            "Upload Document",
            "POST",
            "documents",
            201,
            files={
                "file": ("test_invoice.png", test_image, "image/png")
            },
            data={
                "document_type": "INVOICE"
            }
        )
        
        if not success or not data.get("success"):
            self.log("Document upload failed", "FAIL")
            return False
        
        doc_id = data["data"].get("id")
        self.log(f"Uploaded document: {doc_id}", "INFO")
        
        # Check extracted_data structure
        doc_data = data["data"]
        if "extracted_data" not in doc_data:
            self.log("❌ Missing extracted_data in response", "FAIL")
            return False
        
        extracted = doc_data.get("extracted_data", {})
        if "fields" not in extracted:
            self.log("❌ Missing fields in extracted_data", "FAIL")
            return False
        
        # Check validation_result
        if "validation_result" not in doc_data:
            self.log("❌ Missing validation_result in response", "FAIL")
            return False
        
        validation = doc_data.get("validation_result", {})
        if "status" not in validation:
            self.log("❌ Missing status in validation_result", "FAIL")
            return False
        
        self.log(f"Document validation status: {validation.get('status')}", "INFO")
        
        # Get document by ID
        success, data, _ = self.run_test(
            "Get Document by ID",
            "GET",
            f"documents/{doc_id}",
            200
        )
        
        if not success:
            return False
        
        # Validate document
        success, data, _ = self.run_test(
            "Validate Document",
            "POST",
            f"documents/{doc_id}/validate",
            200
        )
        
        if not success:
            return False
        
        # Download document
        success, data, _ = self.run_test(
            "Download Document",
            "GET",
            f"documents/{doc_id}/download",
            200
        )
        
        return success
    
    def test_incidents(self):
        """Test incident reporting"""
        self.log("\n=== INCIDENTS ===", "SECTION")
        
        # Create incident
        success, data, _ = self.run_test(
            "Create Incident",
            "POST",
            "incidents",
            201,
            data={
                "incident_type": "ACCIDENT",
                "location_name": "Mumbai-Pune Expressway, KM 45",
                "reason": "Minor collision at toll plaza",
                "outcome": "resolved",
                "notes": "Vehicle damage minimal"
            }
        )
        
        if not success or not data.get("success"):
            return False
        
        incident_id = data["data"].get("id")
        self.log(f"Created incident: {incident_id}", "INFO")
        
        # List incidents
        success, data, _ = self.run_test(
            "List Incidents",
            "GET",
            "incidents",
            200
        )
        
        if not success:
            return False
        
        # Get incident by ID
        success, data, _ = self.run_test(
            "Get Incident by ID",
            "GET",
            f"incidents/{incident_id}",
            200
        )
        
        return success
    
    def test_analytics(self):
        """Test analytics dashboard"""
        self.log("\n=== ANALYTICS ===", "SECTION")
        
        success, data, _ = self.run_test(
            "Get Analytics Dashboard",
            "GET",
            "analytics/dashboard",
            200
        )
        
        if success and data.get("success"):
            dashboard = data.get("data", {})
            required_fields = ["kpis", "risk_distribution", "recent_trips", "recent_incidents", "alerts"]
            
            for field in required_fields:
                if field not in dashboard:
                    self.log(f"❌ Missing field in dashboard: {field}", "FAIL")
                    return False
            
            self.log(f"Dashboard KPIs: {dashboard.get('kpis')}", "INFO")
            return True
        
        return False
    
    def test_authorization(self):
        """Test data isolation between users"""
        self.log("\n=== AUTHORIZATION & DATA ISOLATION ===", "SECTION")
        
        # Create User A (current user)
        user_a_token = self.token
        
        # Create a trip for User A
        success, data, _ = self.run_test(
            "Create Trip for User A",
            "POST",
            "trips",
            201,
            data={
                "origin": "Mumbai",
                "destination": "Delhi",
                "declared_distance_km": 1400,
                "vehicle_number": "MH01AB1234",
                "vehicle_type": "TRUCK",
                "goods_description": "Electronics",
                "invoice_value": 500000
            }
        )
        
        if not success:
            return False
        
        user_a_trip_id = data["data"].get("id")
        self.log(f"User A trip: {user_a_trip_id}", "INFO")
        
        # Create User B
        user_b_email = f"userb_{datetime.now().strftime('%H%M%S')}@test.com"
        success = self.test_auth_register(
            user_b_email,
            "TestPass123!",
            "User B",
            "Test Company B",
            "+919876543210"
        )
        
        if not success:
            self.log("Failed to create User B", "FAIL")
            return False
        
        user_b_token = self.token
        self.log(f"Created User B: {user_b_email}", "INFO")
        
        # Try to access User A's trip as User B
        success, data, status = self.run_test(
            "User B Access User A's Trip (should fail)",
            "GET",
            f"trips/{user_a_trip_id}",
            404
        )
        
        if status != 404:
            self.log(f"❌ User B should NOT be able to access User A's trip (got {status})", "FAIL")
            self.token = user_a_token
            return False
        
        self.log("✅ Data isolation working: User B cannot access User A's trip", "PASS")
        
        # Restore User A token
        self.token = user_a_token
        
        return True
    
    def print_summary(self):
        """Print test summary"""
        self.log("\n" + "="*60, "SECTION")
        self.log("TEST SUMMARY", "SECTION")
        self.log("="*60, "SECTION")
        self.log(f"Total Tests: {self.tests_run}", "INFO")
        self.log(f"Passed: {self.tests_passed} ✅", "INFO")
        self.log(f"Failed: {self.tests_failed} ❌", "INFO")
        
        if self.tests_failed > 0:
            self.log("\nFailed Tests:", "SECTION")
            for failed in self.failed_tests:
                self.log(f"  - {failed.get('test')}", "FAIL")
                if "error" in failed:
                    self.log(f"    Error: {failed['error']}", "DEBUG")
                else:
                    self.log(f"    Expected: {failed.get('expected')}, Got: {failed.get('actual')}", "DEBUG")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        self.log(f"\nSuccess Rate: {success_rate:.1f}%", "INFO")
        
        return self.tests_failed == 0


def main():
    """Main test execution"""
    tester = TruckShieldAPITester()
    
    # Test health
    if not tester.test_health():
        print("\n❌ Health check failed. Backend may not be running.")
        return 1
    
    # Test auth with demo account
    if not tester.test_auth_login("demo@truckshield.app", "Demo@12345"):
        print("\n❌ Demo login failed. Cannot proceed with tests.")
        return 1
    
    # Test auth me
    tester.test_auth_me()
    
    # Test auth negative scenarios
    tester.test_auth_negative()
    
    # Test new user registration
    test_email = f"test_{datetime.now().strftime('%Y%m%d_%H%M%S')}@test.com"
    tester.test_auth_register(
        test_email,
        "TestPass123!",
        "Test User",
        "Test Company",
        "+919876543210"
    )
    
    # Test vehicles
    tester.test_vehicles()
    
    # Test trips CRUD
    tester.test_trips_crud()
    
    # Test trip analysis
    tester.test_trip_analyze()
    
    # Test routes
    tester.test_routes_analyze()
    
    # Test documents
    tester.test_documents()
    
    # Test incidents
    tester.test_incidents()
    
    # Test analytics
    tester.test_analytics()
    
    # Test authorization
    tester.test_authorization()
    
    # Print summary
    success = tester.print_summary()
    
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())
