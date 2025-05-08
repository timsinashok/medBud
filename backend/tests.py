import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), ".")))
import pytest
from fastapi.testclient import TestClient
from pymongo import MongoClient
from unittest.mock import patch
from main import app
from datetime import datetime, timedelta, timezone
import dotenv
from unittest.mock import patch, MagicMock

# Load environment variables from .env file
dotenv.load_dotenv()

# ---- Setup database connection manually ----
MONGODB_URI = os.getenv("MONGODB_URI")
DATABASE_NAME = os.getenv("DATABASE_NAME")

print(f"\n[TEST] Using MongoDB URI: {MONGODB_URI}")

client_db = MongoClient(MONGODB_URI)
test_db = client_db[DATABASE_NAME]
app.database = test_db
# --------------------------------------------

client = TestClient(app)

# Optional DB cleanup before each test
@pytest.fixture(autouse=True)
def clear_test_data():
   app.database["users"].delete_many({})
   app.database["symptoms"].delete_many({})
   app.database["medications"].delete_many({})

def test_root_endpoint():
   print("\n[TEST] Root Endpoint")
   response = client.get("/")
   assert response.status_code == 200
   assert response.json() == {"message": "Welcome to the Symptom Tracker API"}

def test_create_user():
   print("\n[TEST] Create User")
   response = client.post("/api/users/", json={
       "username": "test_user",
       "email": "test_user@example.com",
       "unique_id_from_auth": "auth_test_001"
   })
   assert response.status_code in [200, 400]

def test_create_symptom():
   print("\n[TEST] Create Symptom")
   user_res = client.post("/api/users/", json={
       "username": "symptom_user",
       "email": "symptom_user@example.com",
       "unique_id_from_auth": "symptom_user_001"
   })
   user_id = user_res.json()["_id"]

   response = client.post(f"/api/symptoms/?user_id={user_id}", json={
       "name": "Fatigue",
       "details": "Extreme tiredness",
       "severity": 7
   })
   assert response.status_code == 200
   data = response.json()
   assert "details" in data and data["severity"] == 7

def test_create_symptom_invalid_user_id():
    print("\n[TEST] Create Symptom - Invalid User ID")
    response = client.post("/api/symptoms/?user_id=invalid_id", json={
        "name": "Test Symptom",
        "details": "Test Details",
        "severity": 5
    })
    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid user ID"

def test_create_symptom_invalid_severity():
    print("\n[TEST] Create Symptom - Invalid Severity")
    user_res = client.post("/api/users/", json={
        "username": "invalid_severity_user",
        "email": "invalid_severity_user@example.com",
        "unique_id_from_auth": "invalid_severity_user_auth"
    })
    user_id = user_res.json()["_id"]
    
    response = client.post(f"/api/symptoms/?user_id={user_id}", json={
        "name": "Test Symptom",
        "details": "Test Details",
        "severity": 11  # Invalid severity (should be 1-10)
    })
    assert response.status_code == 422

def test_list_symptoms():
   print("\n[TEST] List Symptoms")
   user_res = client.post("/api/users/", json={
       "username": "list_user",
       "email": "list_user@example.com",
       "unique_id_from_auth": "list_user_001"
   })
   user_id = user_res.json()["_id"]

   client.post(f"/api/symptoms/?user_id={user_id}", json={
       "name": "Fatigue",
       "details": "Recurring",
       "severity": 4
   })

   response = client.get(f"/api/symptoms/{user_id}")
   assert response.status_code == 200
   assert isinstance(response.json(), list)

def test_list_symptoms_invalid_user_id():
    print("\n[TEST] List Symptoms - Invalid User ID")
    response = client.get("/api/symptoms/invalid_id")
    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid user ID"

def test_list_symptoms_with_filters():
    print("\n[TEST] List Symptoms - With Filters")
    user_res = client.post("/api/users/", json={
        "username": "filter_user",
        "email": "filter_user@example.com",
        "unique_id_from_auth": "filter_user_auth"
    })
    user_id = user_res.json()["_id"]

    # Create symptoms with different timestamps
    current_time = datetime.now(timezone.utc)
    for i in range(3):
        client.post(f"/api/symptoms/?user_id={user_id}", json={
            "name": f"Test Symptom {i}",
            "details": f"Test Details {i}",
            "severity": 5
        })

    # Test date range filter - use datetime objects directly
    start_date = current_time - timedelta(days=1)
    end_date = current_time + timedelta(days=1)
    
    # Format dates as ISO format strings with timezone
    start_date_str = start_date.isoformat()
    end_date_str = end_date.isoformat()
    
    response = client.get(
        f"/api/symptoms/{user_id}",
        params={
            "start_date": start_date_str,
            "end_date": end_date_str
        }
    )
    assert response.status_code == 200
    symptoms = response.json()
    assert len(symptoms) > 0

    # Test pagination
    response = client.get(
        f"/api/symptoms/{user_id}",
        params={"skip": 1, "limit": 1}
    )
    assert response.status_code == 200
    symptoms = response.json()
    assert len(symptoms) == 1

    # Test invalid date format
    response = client.get(
        f"/api/symptoms/{user_id}",
        params={"start_date": "invalid-date"}
    )
    assert response.status_code == 422

def test_list_symptoms_pagination():
    print("\n[TEST] List Symptoms - Pagination")
    user_res = client.post("/api/users/", json={
        "username": "pagination_user",
        "email": "pagination_user@example.com",
        "unique_id_from_auth": "pagination_user_auth"
    })
    user_id = user_res.json()["_id"]

    # Create multiple symptoms
    for i in range(15):
        client.post(f"/api/symptoms/?user_id={user_id}", json={
            "name": f"Test Symptom {i}",
            "details": f"Test Details {i}",
            "severity": 5
        })

    # Test default pagination (limit=100)
    response = client.get(f"/api/symptoms/{user_id}")
    assert response.status_code == 200
    assert len(response.json()) == 15

    # Test custom pagination
    response = client.get(f"/api/symptoms/{user_id}?skip=5&limit=5")
    assert response.status_code == 200
    assert len(response.json()) == 5

def test_list_symptoms_invalid_date_format():
    print("\n[TEST] List Symptoms - Invalid Date Format")
    user_res = client.post("/api/users/", json={
        "username": "date_format_user",
        "email": "date_format_user@example.com",
        "unique_id_from_auth": "date_format_user_auth"
    })
    user_id = user_res.json()["_id"]

    # Test with invalid date format
    response = client.get(f"/api/symptoms/{user_id}?start_date=invalid-date")
    assert response.status_code == 422

@patch("routes.reports.Groq")
def test_generate_report(mock_groq):
   print("\n[TEST] Generate AI Report (Mocked)")
   # Setup fake Groq response
   mock_client = mock_groq.return_value
   mock_client.chat.completions.create.return_value.choices = [
       type("Choice", (object,), {
           "message": type("Message", (object,), {
               "content": "This is a mocked health report."
           })()
       })()
   ]

   user_res = client.post("/api/users/", json={
       "username": "report_user",
       "email": "report_user@example.com",
       "unique_id_from_auth": "report_user_001"
   })
   user_id = user_res.json()["_id"]

   client.post(f"/api/symptoms/?user_id={user_id}", json={
       "name": "Headache",
       "details": "Mild tension headache",
       "severity": 5
   })

   start_date = (datetime.now() - timedelta(days=30)).isoformat()
   end_date = datetime.now().isoformat()

   response = client.get(f"/api/reports/{user_id}?start_date={start_date}&end_date={end_date}")
   assert response.status_code == 200
   data = response.json()
   assert "generated_report" in data
   assert data["generated_report"] == "This is a mocked health report."


def test_list_users():
   print("\n[TEST] List Users")
   client.post("/api/users/", json={
       "username": "user1",
       "email": "user1@example.com",
       "unique_id_from_auth": "user1_auth"
   })
   client.post("/api/users/", json={
       "username": "user2",
       "email": "user2@example.com",
       "unique_id_from_auth": "user2_auth"
   })
   response = client.get("/api/users/")
   assert response.status_code == 200
   users = response.json()
   assert isinstance(users, list)
   assert len(users) >= 2

def test_get_user_by_id():
   print("\n[TEST] Get User by ID")
   response = client.post("/api/users/", json={
       "username": "unique_user",
       "email": "unique_user@example.com",
       "unique_id_from_auth": "unique_user_auth"
   })
   assert response.status_code == 200
   user_id = response.json()["_id"]
   get_response = client.get(f"/api/users/{user_id}")
   assert get_response.status_code == 200
   assert get_response.json()["email"] == "unique_user@example.com"


def test_create_medication():
   print("\n[TEST] Create Medication")
   user_res = client.post("/api/users/", json={
       "username": "med_user",
       "email": "med_user@example.com",
       "unique_id_from_auth": "med_user_auth"
   })
   user_id = user_res.json()["_id"]
   
   # Create medication with required fields according to MedicationCreate model
   med_res = client.post(f"/api/medications/?user_id={user_id}", json={
       "name": "Ibuprofen",
       "frequency": 2,
       "times": ["09:00", "21:00"]
   })
   assert med_res.status_code == 200
   data = med_res.json()
   assert data["name"] == "Ibuprofen"
   assert data["frequency"] == 2
   assert data["times"] == ["09:00", "21:00"]
   assert data["user_id"] == user_id
   assert data["adherence"] == 0
   assert "_id" in data
   assert "created_at" in data
   assert "updated_at" in data

def test_list_medications():
   print("\n[TEST] List Medications")
   # Create user
   user_res = client.post("/api/users/", json={
       "username": "list_med_user",
       "email": "list_med_user@example.com",
       "unique_id_from_auth": "list_med_user_auth"
   })
   user_id = user_res.json()["_id"]
   
   # Create multiple medications
   for i in range(3):
       client.post(f"/api/medications/?user_id={user_id}", json={
           "name": f"Medication {i}",
           "frequency": 2,
           "times": ["09:00", "21:00"]
       })
   
   # Test listing with pagination
   response = client.get(f"/api/medications/{user_id}?skip=1&limit=2")
   assert response.status_code == 200
   medications = response.json()
   assert isinstance(medications, list)
   assert len(medications) <= 2

def test_update_medication():
   print("\n[TEST] Update Medication")
   # Create user
   user_res = client.post("/api/users/", json={
       "username": "up_user",
       "email": "up_user@example.com",
       "unique_id_from_auth": "up_user_auth"
   })
   user_id = user_res.json()["_id"]
   
   # Create medication
   med_res = client.post(f"/api/medications/?user_id={user_id}", json={
       "name": "Paracetamol",
       "frequency": 2,
       "times": ["09:00", "21:00"]
   })
   med_id = med_res.json()["_id"]
   
   # Update medication
   update = client.put(f"/api/medications/{med_id}?user_id={user_id}", json={
       "frequency": 3,
       "times": ["08:00", "14:00", "20:00"]
   })
   assert update.status_code == 200
   updated_data = update.json()
   assert updated_data["frequency"] == 3
   assert updated_data["times"] == ["08:00", "14:00", "20:00"]
   assert "updated_at" in updated_data

def test_delete_medication():
   print("\n[TEST] Delete Medication")
   # Create user
   user_res = client.post("/api/users/", json={
       "username": "del_user",
       "email": "del_user@example.com",
       "unique_id_from_auth": "del_user_auth"
   })
   user_id = user_res.json()["_id"]
   
   # Create medication
   med_res = client.post(f"/api/medications/?user_id={user_id}", json={
       "name": "Amoxicillin",
       "frequency": 3,
       "times": ["08:00", "14:00", "20:00"]
   })
   med_id = med_res.json()["_id"]
   
   # Delete medication
   delete = client.delete(f"/api/medications/{med_id}?user_id={user_id}")
   assert delete.status_code == 200
   assert delete.json()["message"] == "Medication deleted successfully"
   
   # Verify medication is deleted
   get_response = client.get(f"/api/medications/{user_id}")
   assert get_response.status_code == 200
   medications = get_response.json()
   assert not any(med["_id"] == med_id for med in medications)

def test_increment_medication_adherence():
   print("\n[TEST] Increment Medication Adherence")
   # Create user
   user_res = client.post("/api/users/", json={
       "username": "adherence_user",
       "email": "adherence_user@example.com",
       "unique_id_from_auth": "adherence_user_auth"
   })
   user_id = user_res.json()["_id"]
   
   # Create medication
   med_res = client.post(f"/api/medications/?user_id={user_id}", json={
       "name": "Test Medication",
       "frequency": 2,
       "times": ["09:00", "21:00"]
   })
   med_id = med_res.json()["_id"]
   
   # Increment adherence
   response = client.post(f"/api/medications/increment-adherence?medication_id={med_id}&user_id={user_id}")
   assert response.status_code == 200
   data = response.json()
   assert data["adherence"] == 1
   
   # Increment again
   response = client.post(f"/api/medications/increment-adherence?medication_id={med_id}&user_id={user_id}")
   assert response.status_code == 200
   data = response.json()
   assert data["adherence"] == 2

def test_medication_invalid_user_id():
   print("\n[TEST] Medication - Invalid User ID")
   response = client.post("/api/medications/?user_id=invalid_id", json={
       "name": "Test Medication",
       "frequency": 2,
       "times": ["09:00", "21:00"]
   })
   assert response.status_code == 400
   assert response.json()["detail"] == "Invalid user ID"

def test_medication_not_found():
   print("\n[TEST] Medication - Not Found")
   user_res = client.post("/api/users/", json={
       "username": "notfound_user",
       "email": "notfound_user@example.com",
       "unique_id_from_auth": "notfound_user_auth"
   })
   user_id = user_res.json()["_id"]
   non_existent_id = "507f1f77bcf86cd799439011"  # Valid ObjectId format but non-existent
   
   # Test with update endpoint since it checks for medication existence
   response = client.put(f"/api/medications/{non_existent_id}?user_id={user_id}", json={
       "frequency": 2,
       "times": ["09:00", "21:00"]
   })
   assert response.status_code == 404
   assert response.json()["detail"] == "Medication not found or does not belong to user"

@patch("routes.reports.Groq")
def test_generate_pdf_report(mock_groq):
   print("\n[TEST] Generate PDF Report (Mocked)")
   # Setup fake Groq response
   mock_client = mock_groq.return_value
   mock_client.chat.completions.create.return_value.choices = [
       type("Choice", (object,), {
           "message": type("Message", (object,), {
               "content": "Mocked PDF Report"
           })()
       })()
   ]

   user_res = client.post("/api/users/", json={
       "username": "pdf_user",
       "email": "pdf_user@example.com",
       "unique_id_from_auth": "pdf_user_auth"
   })
   user_id = user_res.json()["_id"]

   client.post(f"/api/symptoms/?user_id={user_id}", json={
       "name": "Fever",
       "details": "Mild fever",
       "severity": 6
   })

   start_date = (datetime.now() - timedelta(days=7)).isoformat()
   end_date = datetime.now().isoformat()

   response = client.get(f"/api/reports/{user_id}/pdf?start_date={start_date}&end_date={end_date}")
   assert response.status_code == 200
   assert response.headers["Content-Type"] == "application/pdf"


@patch("routes.reports.Groq")
def test_generate_report_no_data(mock_groq):
   print("\n[TEST] Generate Report - No Data (Expect 404)")
   user_res = client.post("/api/users/", json={
       "username": "empty_user",
       "email": "empty_user@example.com",
       "unique_id_from_auth": "empty_user_auth"
   })
   user_id = user_res.json()["_id"]

   start_date = (datetime.now() - timedelta(days=30)).isoformat()
   end_date = datetime.now().isoformat()

   response = client.get(f"/api/reports/{user_id}?start_date={start_date}&end_date={end_date}")
   assert response.status_code == 404


@patch("routes.reports.os.environ.get", return_value=None)
def test_generate_report_missing_api_key(mock_env_get):
   print("\n[TEST] Generate Report - Missing API Key (Expect 500)")
   user_res = client.post("/api/users/", json={
       "username": "nokey_user",
       "email": "nokey_user@example.com",
       "unique_id_from_auth": "nokey_user_auth"
   })
   user_id = user_res.json()["_id"]

   client.post(f"/api/symptoms/?user_id={user_id}", json={
       "name": "Nausea",
       "details": "Felt uneasy",
       "severity": 3
   })

   start_date = (datetime.now() - timedelta(days=10)).isoformat()
   end_date = datetime.now().isoformat()

   response = client.get(f"/api/reports/{user_id}?start_date={start_date}&end_date={end_date}")
   assert response.status_code == 500
   assert "GROQ_API_KEY not found" in response.json()["detail"]

# Auth Tests
def test_register_user():
    print("\n[TEST] Register User")
    response = client.post("/api/auth/register", json={
        "username": "test_register_user",
        "email": "test_register@example.com",
        "hashed_password": "testpassword123"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "test_register_user"
    assert data["email"] == "test_register@example.com"
    assert "disabled" in data
    assert data["disabled"] is False

def test_register_duplicate_username():
    print("\n[TEST] Register - Duplicate Username")
    # First registration
    client.post("/api/auth/register", json={
        "username": "duplicate_user",
        "email": "duplicate1@example.com",
        "hashed_password": "testpassword123"
    })
    
    # Try to register again with same username
    response = client.post("/api/auth/register", json={
        "username": "duplicate_user",
        "email": "duplicate2@example.com",
        "hashed_password": "testpassword123"
    })
    assert response.status_code == 400
    assert response.json()["detail"] == "Username already registered"

def test_login_success():
    print("\n[TEST] Login - Success")
    # First register a user
    client.post("/api/auth/register", json={
        "username": "login_test_user",
        "email": "login_test@example.com",
        "hashed_password": "testpassword123"
    })
    
    # Try to login
    response = client.post("/api/auth/login", data={
        "username": "login_test_user",
        "password": "testpassword123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_invalid_credentials():
    print("\n[TEST] Login - Invalid Credentials")
    response = client.post("/api/auth/login", data={
        "username": "nonexistent_user",
        "password": "wrong_password"
    })
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect username or password"

def test_login_missing_credentials():
    print("\n[TEST] Login - Missing Credentials")
    response = client.post("/api/auth/login", data={})
    assert response.status_code == 422

def test_get_current_user_success():
    print("\n[TEST] Get Current User - Success")
    # First register and login
    client.post("/api/auth/register", json={
        "username": "current_user_test",
        "email": "current_user_test@example.com",
        "hashed_password": "testpassword123"
    })
    
    login_response = client.post("/api/auth/login", data={
        "username": "current_user_test",
        "password": "testpassword123"
    })
    token = login_response.json()["access_token"]
    
    # Get current user
    response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "current_user_test"
    assert data["email"] == "current_user_test@example.com"
    assert "_id" in data

def test_get_current_user_invalid_token():
    print("\n[TEST] Get Current User - Invalid Token")
    response = client.get("/api/auth/me", headers={"Authorization": "Bearer invalid_token"})
    assert response.status_code == 401
    assert response.json()["detail"] == "Could not validate credentials"

def test_get_current_user_missing_token():
    print("\n[TEST] Get Current User - Missing Token")
    response = client.get("/api/auth/me")
    assert response.status_code == 401
    assert response.json()["detail"] == "Not authenticated"

def test_get_current_user_expired_token():
    print("\n[TEST] Get Current User - Expired Token")
    # Create a user first
    client.post("/api/auth/register", json={
        "username": "expired_token_user",
        "email": "expired_token_user@example.com",
        "hashed_password": "testpassword123"
    })
    
    # Create an expired token
    expired_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJleHBpcmVkX3Rva2VuX3VzZXIiLCJleHAiOjEwMDAwMDAwMDB9.invalid_signature"
    response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {expired_token}"})
    assert response.status_code == 401
    assert response.json()["detail"] == "Could not validate credentials"

def test_update_medication_no_fields():
    print("\n[TEST] Update Medication - No Fields")
    user_res = client.post("/api/users/", json={
        "username": "no_fields_user",
        "email": "no_fields_user@example.com",
        "unique_id_from_auth": "no_fields_user_auth"
    })
    user_id = user_res.json()["_id"]
    
    med_res = client.post(f"/api/medications/?user_id={user_id}", json={
        "name": "Test Medication",
        "frequency": 2,
        "times": ["09:00", "21:00"]
    })
    med_id = med_res.json()["_id"]
    
    response = client.put(f"/api/medications/{med_id}?user_id={user_id}", json={})
    assert response.status_code == 400
    assert response.json()["detail"] == "No fields to update"

def test_update_medication_invalid_id():
    print("\n[TEST] Update Medication - Invalid ID")
    user_res = client.post("/api/users/", json={
        "username": "invalid_id_user",
        "email": "invalid_id_user@example.com",
        "unique_id_from_auth": "invalid_id_user_auth"
    })
    user_id = user_res.json()["_id"]
    
    response = client.put(f"/api/medications/invalid_id?user_id={user_id}", json={
        "frequency": 2
    })
    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid ID format"

def test_delete_medication_invalid_id():
    print("\n[TEST] Delete Medication - Invalid ID")
    user_res = client.post("/api/users/", json={
        "username": "delete_invalid_user",
        "email": "delete_invalid_user@example.com",
        "unique_id_from_auth": "delete_invalid_user_auth"
    })
    user_id = user_res.json()["_id"]
    
    response = client.delete(f"/api/medications/invalid_id?user_id={user_id}")
    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid ID format"

def test_increment_adherence_invalid_id():
    print("\n[TEST] Increment Adherence - Invalid ID")
    user_res = client.post("/api/users/", json={
        "username": "increment_invalid_user",
        "email": "increment_invalid_user@example.com",
        "unique_id_from_auth": "increment_invalid_user_auth"
    })
    user_id = user_res.json()["_id"]
    
    response = client.post(f"/api/medications/increment-adherence?medication_id=invalid_id&user_id={user_id}")
    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid ID format"

def test_increment_adherence_not_found():
    print("\n[TEST] Increment Adherence - Not Found")
    user_res = client.post("/api/users/", json={
        "username": "increment_notfound_user",
        "email": "increment_notfound_user@example.com",
        "unique_id_from_auth": "increment_notfound_user_auth"
    })
    user_id = user_res.json()["_id"]
    non_existent_id = "507f1f77bcf86cd799439011"
    
    response = client.post(f"/api/medications/increment-adherence?medication_id={non_existent_id}&user_id={user_id}")
    assert response.status_code == 404
    assert response.json()["detail"] == "Medication not found or does not belong to user"

@patch("routes.reports.Groq")
def test_generate_report_invalid_date_format(mock_groq):
    print("\n[TEST] Generate Report - Invalid Date Format")
    user_res = client.post("/api/users/", json={
        "username": "invalid_date_user",
        "email": "invalid_date_user@example.com",
        "unique_id_from_auth": "invalid_date_user_auth"
    })
    user_id = user_res.json()["_id"]
    
    response = client.get(f"/api/reports/{user_id}?start_date=invalid_date&end_date=invalid_date")
    assert response.status_code == 422

@patch("routes.reports.Groq")
def test_generate_report_groq_error(mock_groq):
    print("\n[TEST] Generate Report - Groq API Error")
    mock_client = mock_groq.return_value
    mock_client.chat.completions.create.side_effect = Exception("Groq API Error")
    
    user_res = client.post("/api/users/", json={
        "username": "groq_error_user",
        "email": "groq_error_user@example.com",
        "unique_id_from_auth": "groq_error_user_auth"
    })
    user_id = user_res.json()["_id"]
    
    client.post(f"/api/symptoms/?user_id={user_id}", json={
        "name": "Test Symptom",
        "details": "Test Details",
        "severity": 5
    })
    
    start_date = (datetime.now() - timedelta(days=30)).isoformat()
    end_date = datetime.now().isoformat()
    
    response = client.get(f"/api/reports/{user_id}?start_date={start_date}&end_date={end_date}")
    assert response.status_code == 500
    assert "Error generating report" in response.json()["detail"]

@patch("routes.reports.Groq")
def test_generate_pdf_report_fpdf_error(mock_groq):
    print("\n[TEST] Generate PDF Report - FPDF Error")
    mock_client = mock_groq.return_value
    mock_client.chat.completions.create.return_value.choices = [
        type("Choice", (object,), {
            "message": type("Message", (object,), {
                "content": "Test Report Content"
            })()
        })()
    ]
    
    user_res = client.post("/api/users/", json={
        "username": "pdf_error_user",
        "email": "pdf_error_user@example.com",
        "unique_id_from_auth": "pdf_error_user_auth"
    })
    user_id = user_res.json()["_id"]
    
    # Create some test data
    client.post(f"/api/symptoms/?user_id={user_id}", json={
        "name": "Test Symptom",
        "details": "Test Details",
        "severity": 5
    })
    
    start_date = (datetime.now() - timedelta(days=30)).isoformat()
    end_date = datetime.now().isoformat()
    
    # Mock the FPDF import
    with patch("fpdf.FPDF") as mock_fpdf:
        mock_fpdf.side_effect = Exception("FPDF Error")
        
        response = client.get(f"/api/reports/{user_id}/pdf?start_date={start_date}&end_date={end_date}")
        assert response.status_code == 500
        assert "Error generating PDF" in response.json()["detail"]

@patch('main.MongoClient')
def test_startup_db_connection_success(mock_mongo_client):
    print("\n[TEST] Startup DB Connection - Success")
    # Configure the mock MongoClient to return a mock client instance
    mock_client_instance = MagicMock()
    mock_mongo_client.return_value = mock_client_instance
    
    # Use TestClient in a 'with' block to trigger startup and shutdown events
    with TestClient(app):
        # Check that MongoClient was called with the correct URI
        expected_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
        mock_mongo_client.assert_called_once_with(expected_uri)
        
        # Check that the database was accessed
        expected_db_name = os.getenv("DATABASE_NAME", "medbud_db")
        mock_client_instance.__getitem__.assert_called_once_with(expected_db_name)


@patch('main.MongoClient')
def test_startup_db_connection_failure(mock_mongo_client):
    print("\n[TEST] Startup DB Connection - Failure")
    # Configure the mock MongoClient to raise an exception on instantiation
    mock_mongo_client.side_effect = Exception("Simulated DB Connection Error")
    
    # Using TestClient in a 'with' block should raise the startup exception
    with pytest.raises(Exception) as excinfo:
        with TestClient(app):
            pass # The exception is expected during client initialization
    
    # Check that the exception message contains the expected error
    assert "Simulated DB Connection Error" in str(excinfo.value)
    
    # Ensure the mock was called attempting to connect
    expected_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    mock_mongo_client.assert_called_once_with(expected_uri)


@patch('main.MongoClient')
def test_shutdown_db_connection(mock_mongo_client):
    print("\n[TEST] Shutdown DB Connection")
    # Configure the mock MongoClient to return a mock client instance
    mock_client_instance = MagicMock()
    mock_mongo_client.return_value = mock_client_instance
    
    # Use TestClient in a 'with' block. Startup is called on entry,
    # shutdown is called on exit.
    with TestClient(app) as tc:
        # Make a request to ensure the app is running and startup completed
        # This also implicitly ensures app.mongodb_client is not None when shutdown runs
        response = tc.get("/")
        assert response.status_code == 200
    
    # After the 'with' block exits, the shutdown event should have been triggered
    # Verify that the close method on the mock client instance was called
    mock_client_instance.close.assert_called_once()



