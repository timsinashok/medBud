import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), ".")))
import pytest
from fastapi.testclient import TestClient
from pymongo import MongoClient
from unittest.mock import patch
from main import app
from datetime import datetime, timedelta
import dotenv

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
   med_res = client.post(f"/api/medications/?user_id={user_id}", json={
       "name": "Ibuprofen",
       "dosage": "200mg",
       "frequency": "2x daily"
   })
   assert med_res.status_code == 200
   data = med_res.json()
   assert "name" in data and data["name"] == "Ibuprofen"

def test_update_medication():
   print("\n[TEST] Update Medication")
   user_res = client.post("/api/users/", json={
       "username": "up_user",
       "email": "up_user@example.com",
       "unique_id_from_auth": "up_user_auth"
   })
   user_id = user_res.json()["_id"]
   med_res = client.post(f"/api/medications/?user_id={user_id}", json={
       "name": "Paracetamol",
       "dosage": "500mg",
       "frequency": "1x daily"
   })
   med_id = med_res.json()["_id"]
   update = client.put(f"/api/medications/{med_id}?user_id={user_id}", json={
       "dosage": "1000mg"
   })
   assert update.status_code == 200
   assert update.json()["dosage"] == "1000mg"

def test_delete_medication():
   print("\n[TEST] Delete Medication")
   user_res = client.post("/api/users/", json={
       "username": "del_user",
       "email": "del_user@example.com",
       "unique_id_from_auth": "del_user_auth"
   })
   user_id = user_res.json()["_id"]
   med_res = client.post(f"/api/medications/?user_id={user_id}", json={
       "name": "Amoxicillin",
       "dosage": "250mg",
       "frequency": "3x daily"
   })
   med_id = med_res.json()["_id"]
   delete = client.delete(f"/api/medications/{med_id}?user_id={user_id}")
   assert delete.status_code == 200
   assert "deleted" in delete.json()["message"]

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
