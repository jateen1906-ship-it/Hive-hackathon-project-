"""TruckShield Backend API Tests - Billing & Gating Features"""
import requests
import sys
from datetime import datetime

BASE_URL = "https://logistics-risk-lab.preview.emergentagent.com/api/v1"

class TruckShieldTester:
    def __init__(self):
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.passed_tests = []

    def log(self, emoji, message):
        print(f"{emoji} {message}")

    def test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{BASE_URL}/{endpoint}"
        h = {'Content-Type': 'application/json'}
        if self.token:
            h['Authorization'] = f'Bearer {self.token}'
        if headers:
            h.update(headers)

        self.tests_run += 1
        self.log("🔍", f"Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=h, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=h, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=h, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=h, timeout=10)

            success = response.status_code == expected_status
            
            try:
                resp_json = response.json()
            except:
                resp_json = {}

            if success:
                self.tests_passed += 1
                self.log("✅", f"PASSED - Status: {response.status_code}")
                self.passed_tests.append(name)
                return True, resp_json
            else:
                self.log("❌", f"FAILED - Expected {expected_status}, got {response.status_code}")
                self.log("📄", f"Response: {resp_json}")
                self.failed_tests.append(f"{name} (expected {expected_status}, got {response.status_code})")
                return False, resp_json

        except Exception as e:
            self.log("❌", f"FAILED - Error: {str(e)}")
            self.failed_tests.append(f"{name} (exception: {str(e)})")
            return False, {}

    def run_all_tests(self):
        self.log("🚀", "Starting TruckShield Backend Tests")
        self.log("=" * 60, "")

        # 1. Auth - Login with demo account (FREE tier)
        self.log("📋", "TEST SUITE 1: Authentication")
        success, resp = self.test(
            "Login with demo@truckshield.app",
            "POST",
            "auth/login",
            200,
            data={"email": "demo@truckshield.app", "password": "Demo@12345"}
        )
        if success and resp.get("success") and resp.get("data", {}).get("token"):
            self.token = resp["data"]["token"]
            self.user_id = resp["data"].get("user", {}).get("id")
            self.log("🔑", f"Token acquired, user_id: {self.user_id}")
        else:
            self.log("🛑", "Cannot proceed without auth token")
            return

        # 2. Billing Plans
        self.log("\n📋", "TEST SUITE 2: Billing Plans")
        success, resp = self.test(
            "GET /billing/plans returns 3 tiers",
            "GET",
            "billing/plans",
            200
        )
        if success:
            plans = resp.get("data", {}).get("plans", [])
            if len(plans) == 3:
                self.log("✅", f"Found 3 plans: {[p.get('tier') for p in plans]}")
                # Check pricing
                for plan in plans:
                    tier = plan.get("tier")
                    price = plan.get("price")
                    price_label = plan.get("price_label")
                    self.log("💰", f"{tier}: {price_label} ({price} paise)")
            else:
                self.log("⚠️", f"Expected 3 plans, got {len(plans)}")

        # 3. Billing Me - Check FREE tier
        self.log("\n📋", "TEST SUITE 3: Current Plan (FREE tier)")
        success, resp = self.test(
            "GET /billing/me returns FREE tier details",
            "GET",
            "billing/me",
            200
        )
        if success:
            data = resp.get("data", {})
            plan = data.get("plan")
            status = data.get("status")
            usage = data.get("usage", {})
            config = data.get("config", {})
            
            self.log("📊", f"Plan: {plan}, Status: {status}")
            self.log("📊", f"Checks limit: {usage.get('checks_limit')}")
            self.log("📊", f"Checks used: {usage.get('checks_used')}")
            self.log("📊", f"Corridor access: {config.get('corridor')}")
            
            if plan == "free" and status == "active" and usage.get("checks_limit") == 5 and config.get("corridor") == "hidden":
                self.log("✅", "FREE tier configuration correct")
            else:
                self.log("⚠️", "FREE tier configuration mismatch")

        # 4. Subscribe to Growth (Razorpay order creation)
        self.log("\n📋", "TEST SUITE 4: Subscription Order Creation")
        success, resp = self.test(
            "POST /billing/subscribe {tier:'growth'} creates Razorpay order",
            "POST",
            "billing/subscribe",
            200,
            data={"tier": "growth"}
        )
        if success:
            data = resp.get("data", {})
            order_id = data.get("order_id")
            key_id = data.get("key_id")
            amount = data.get("amount")
            
            self.log("💳", f"Order ID: {order_id}")
            self.log("💳", f"Key ID: {key_id}")
            self.log("💳", f"Amount: {amount} paise (expected 199900)")
            
            if amount == 199900:
                self.log("✅", "Razorpay order amount correct for Growth tier")
            else:
                self.log("⚠️", f"Expected amount 199900, got {amount}")

        # 5. Server-side Gating Tests
        self.log("\n📋", "TEST SUITE 5: Server-side Feature Gating")
        
        # 5a. Report Sharing - should be blocked on FREE
        self.log("\n🔒", "Testing Report Sharing Gating (FREE tier)")
        # First, create a trip to test sharing
        success, resp = self.test(
            "Create a test trip",
            "POST",
            "trips",
            201,
            data={
                "origin": "Surat",
                "destination": "Indore",
                "travel_date": "2025-09-01",
                "goods_description": "Electronics",
                "invoice_value": 500000,
                "declared_distance_km": 520,
                "vehicle_number": "GJ05AB1234",
                "vehicle_type": "truck"
            }
        )
        
        trip_id = None
        if success:
            trip_id = resp.get("data", {}).get("id")
            self.log("🚛", f"Test trip created: {trip_id}")
            
            # Try to share - should fail with UPGRADE_REQUIRED
            success, resp = self.test(
                "POST /trips/{id}/share returns 400 UPGRADE_REQUIRED on FREE",
                "POST",
                f"trips/{trip_id}/share",
                400
            )
            if success:
                error_code = resp.get("error", {}).get("code")
                if error_code == "UPGRADE_REQUIRED":
                    self.log("✅", "Report sharing correctly blocked on FREE tier")
                else:
                    self.log("⚠️", f"Expected UPGRADE_REQUIRED, got {error_code}")

        # 5b. Corridor Drill-down - should be blocked on FREE
        self.log("\n🔒", "Testing Corridor Drill-down Gating (FREE tier)")
        success, resp = self.test(
            "GET /analytics/corridors/detail returns 400 UPGRADE_REQUIRED on FREE",
            "GET",
            "analytics/corridors/detail?origin=Surat&destination=Indore",
            400
        )
        if success:
            error_code = resp.get("error", {}).get("code")
            if error_code == "UPGRADE_REQUIRED":
                self.log("✅", "Corridor drill-down correctly blocked on FREE tier")
            else:
                self.log("⚠️", f"Expected UPGRADE_REQUIRED, got {error_code}")

        # 5c. API Key Creation - should be blocked on FREE
        self.log("\n🔒", "Testing API Key Creation Gating (FREE tier)")
        success, resp = self.test(
            "POST /billing/api-keys returns 400 UPGRADE_REQUIRED on FREE",
            "POST",
            "billing/api-keys",
            400,
            data={"label": "Test API Key"}
        )
        if success:
            error_code = resp.get("error", {}).get("code")
            if error_code == "UPGRADE_REQUIRED":
                self.log("✅", "API key creation correctly blocked on FREE tier")
            else:
                self.log("⚠️", f"Expected UPGRADE_REQUIRED, got {error_code}")

        # 5d. Check Limit - analyze trips until hitting the 5/month limit
        self.log("\n🔒", "Testing Monthly Check Limit (5 checks on FREE tier)")
        
        # Get current usage
        success, resp = self.test(
            "Check current usage",
            "GET",
            "billing/me",
            200
        )
        if success:
            current_usage = resp.get("data", {}).get("usage", {}).get("checks_used", 0)
            limit = resp.get("data", {}).get("usage", {}).get("checks_limit", 5)
            remaining = limit - current_usage
            self.log("📊", f"Current usage: {current_usage}/{limit} (remaining: {remaining})")
            
            # Create and analyze trips until we hit the limit
            trips_to_create = remaining + 1  # One more to trigger the limit
            
            for i in range(trips_to_create):
                # Create trip
                success, resp = self.test(
                    f"Create trip {i+1} for limit test",
                    "POST",
                    "trips",
                    201,
                    data={
                        "origin": "Delhi",
                        "destination": "Jaipur",
                        "travel_date": "2025-09-01",
                        "goods_description": f"Test goods {i+1}",
                        "invoice_value": 100000,
                        "declared_distance_km": 280,
                        "vehicle_number": f"DL01AB{1000+i}",
                        "vehicle_type": "truck"
                    }
                )
                
                if success:
                    test_trip_id = resp.get("data", {}).get("id")
                    
                    # Try to analyze
                    if i < remaining:
                        # Should succeed
                        expected_status = 200
                        test_name = f"Analyze trip {i+1} (should succeed)"
                    else:
                        # Should fail with 402 LIMIT_REACHED
                        expected_status = 402
                        test_name = f"Analyze trip {i+1} (should hit limit)"
                    
                    success, resp = self.test(
                        test_name,
                        "POST",
                        f"trips/{test_trip_id}/analyze",
                        expected_status
                    )
                    
                    if expected_status == 402 and success:
                        error_code = resp.get("error", {}).get("code")
                        if error_code == "LIMIT_REACHED":
                            self.log("✅", "Monthly check limit correctly enforced")
                        else:
                            self.log("⚠️", f"Expected LIMIT_REACHED, got {error_code}")
                        break

        # 6. Field Correction
        self.log("\n📋", "TEST SUITE 6: Field Correction")
        
        # Upload a document first
        self.log("📄", "Creating a document for field correction test")
        
        # Create a trip for the document
        success, resp = self.test(
            "Create trip for document",
            "POST",
            "trips",
            201,
            data={
                "origin": "Mumbai",
                "destination": "Pune",
                "travel_date": "2025-09-01",
                "goods_description": "Test goods",
                "invoice_value": 200000,
                "declared_distance_km": 150,
                "vehicle_number": "MH01AB1234",
                "vehicle_type": "truck"
            }
        )
        
        if success:
            doc_trip_id = resp.get("data", {}).get("id")
            
            # Upload a document (we'll use a minimal test - the OCR might fail but that's ok)
            # For now, let's just test the field correction endpoint with an existing document
            # We'll need to list documents and pick one
            
            success, resp = self.test(
                "List documents",
                "GET",
                "documents",
                200
            )
            
            if success:
                docs = resp.get("data", [])
                if docs:
                    doc_id = docs[0].get("id")
                    self.log("📄", f"Using document: {doc_id}")
                    
                    # Test field correction
                    success, resp = self.test(
                        "PUT /documents/{id}/fields corrects fields",
                        "PUT",
                        f"documents/{doc_id}/fields",
                        200,
                        data={"fields": {"vehicle_number": "GJ05AB1234"}}
                    )
                    
                    if success:
                        data = resp.get("data", {})
                        extracted = data.get("extracted_data", {})
                        fields = extracted.get("fields", {})
                        vehicle_field = fields.get("vehicle_number", {})
                        
                        if vehicle_field.get("corrected") and vehicle_field.get("confidence") == 1.0:
                            self.log("✅", "Field correction working correctly")
                        else:
                            self.log("⚠️", "Field correction may not be working as expected")
                else:
                    self.log("⚠️", "No documents found to test field correction")

        # 7. Distance Tiering
        self.log("\n📋", "TEST SUITE 7: Distance Tiering (FREE = demo)")
        
        # Analyze a trip and check distance_is_demo
        success, resp = self.test(
            "Create trip for distance test",
            "POST",
            "trips",
            201,
            data={
                "origin": "Chennai",
                "destination": "Bengaluru",
                "travel_date": "2025-09-01",
                "goods_description": "Test goods",
                "invoice_value": 300000,
                "declared_distance_km": 350,
                "vehicle_number": "TN01AB1234",
                "vehicle_type": "truck"
            }
        )
        
        if success:
            distance_trip_id = resp.get("data", {}).get("id")
            
            # Note: We might have hit the limit already, so this might return 402
            # Let's try anyway
            success, resp = self.test(
                "Analyze trip to check distance provider",
                "POST",
                f"trips/{distance_trip_id}/analyze",
                200  # or 402 if limit reached
            )
            
            if success:
                data = resp.get("data", {})
                distance_source = data.get("distance_source")
                distance_is_demo = data.get("distance_is_demo")
                
                self.log("🗺️", f"Distance source: {distance_source}")
                self.log("🗺️", f"Is demo: {distance_is_demo}")
                
                if distance_is_demo and distance_source and distance_source.startswith("demo"):
                    self.log("✅", "FREE tier correctly using demo distance provider")
                else:
                    self.log("⚠️", "Distance provider may not be correct for FREE tier")
            else:
                # Might have hit limit
                error_code = resp.get("error", {}).get("code")
                if error_code == "LIMIT_REACHED":
                    self.log("ℹ️", "Cannot test distance (limit reached, which is expected)")

        # Print summary
        self.log("\n" + "=" * 60, "")
        self.log("📊", f"TESTS COMPLETED: {self.tests_passed}/{self.tests_run} passed")
        
        if self.failed_tests:
            self.log("\n❌", "FAILED TESTS:")
            for test in self.failed_tests:
                self.log("  ", f"- {test}")
        
        if self.passed_tests:
            self.log("\n✅", "PASSED TESTS:")
            for test in self.passed_tests[:10]:  # Show first 10
                self.log("  ", f"- {test}")
            if len(self.passed_tests) > 10:
                self.log("  ", f"... and {len(self.passed_tests) - 10} more")

        return 0 if self.tests_passed == self.tests_run else 1


if __name__ == "__main__":
    tester = TruckShieldTester()
    sys.exit(tester.run_all_tests())
