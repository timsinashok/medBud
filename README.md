# MedBud – Your Personal Health Companion

## Overview

**MedBud** is a health-tracking platform designed to empower individuals—especially those managing chronic conditions—to take control of their health journey. By providing tools for structured symptom tracking, medication management, and automated report generation, MedBud helps users communicate more effectively with their healthcare providers.

---

## Vision

We envision a future where every patient walks into a doctor’s office equipped with accurate, well-organized health data. MedBud reduces the burden of remembering and explaining complex medical histories and enables better, faster, and more personalized care.

---

## Features

### Symptom Tracking

* Log daily symptoms with severity levels and detailed notes
* Track patterns and trends over time
* Filter and search symptom history

### Medication Management

* Set and manage medication schedules
* Track adherence and side effects
* Get reminders for medication times

### Health Reports

* Generate structured health summaries
* AI-powered insights and natural language summaries
* Export reports as PDF and share with providers

---

## Tech Stack

### Frontend (React Native)

* **React Native** for cross-platform mobile development
* **Expo** for simplified build and deployment
* **React Navigation** for screen management
* **AsyncStorage** for local state persistence
* **React Native Paper** for UI components

### Backend (FastAPI)

* **FastAPI** for fast, modern RESTful API development
* **MongoDB** as the primary data store
* **JWT** for secure user authentication
* **CORS middleware** for cross-origin request handling
* **Groq API** for AI-powered report generation

---

## Getting Started

### Prerequisites

* Node.js (v14+)
* Python (v3.8+)
* MongoDB
* Expo CLI
* npm or yarn

---

### Clone the Repository

```bash
git clone https://github.com/decipher6/medBud.git
cd medBud
```

---

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

---

### Frontend Setup

```bash
cd medBud  # this is the frontend directory
npm install
# or
yarn install
```

---

### Environment Configuration

Create a `.env` file in both the **root** and **backend** directories with the following variables:

#### Backend `.env`

```env
MONGODB_URI=your_mongodb_uri
DATABASE_NAME=medbud_db
PORT=8000
GROQ_API_KEY=your_groq_api_key
```

#### Frontend `.env`

```env
REACT_APP_BACKEND_URL=http://localhost:8000
```

---

## Running the Application

### Start the Backend

You can skip this as we already have deployed version of the backend on medbud.onrender.com 
FYI, the backend is deployed on serverless platform on free tier so it might take some time to start on first run.

```bash
cd backend
uvicorn main:app --reload
```

### On a new terminal, start the Frontend

To run this using your backend running on http://localhost:8000, you should install `react-dotenv` using `npm install react-dotenv` and run, however, since we faced issues with recent expo update we have hardcorded our deployed backend url in the frontend. 

```bash
cd medBud # fyi this is the root of the project
npx expo start
```

Note: after logging in, you may need to reload the page for the Backend data to be loaded correctly on your profile.

---

## API Documentation

Once the backend is running, visit:

```
http://localhost:8000/docs
```

This provides interactive documentation powered by FastAPI's built-in Swagger UI.

---

## Testing

### Run Backend Tests and Coverage Report

```bash
cd backend
pytest tests.py --cov=routes --cov-report=term-missing 
```

This will generate coverage report on terminal which can be viewed and the missing statements are also outlined.

---

## Contributing

We welcome contributions! Here's how to get started:

1. Fork the repository
2. Create a new branch:
   `git checkout -b feature/YourFeature`
3. Commit your changes:
   `git commit -m "Add YourFeature"`
4. Push to your fork:
   `git push origin feature/YourFeature`
5. Open a Pull Request

---

## Security

* JWT-based authentication
* Secure password hashing
* CORS protection
* Input validation
* Rate limiting

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

* Groq API for enabling AI-powered report generation
* MongoDB for flexible and scalable data storage
* FastAPI for the powerful backend framework
* React Native and Expo for modern mobile development

