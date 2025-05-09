# MedBud - Your Personal Health Companion

## Project Vision & Mission

### Our Vision
MedBud envisions a smoother, more effective doctor-patient interaction by giving users the tools to track their health and bring clear, structured information to every appointment.

### Our Mission
We really build tools that help people - especially those with chronic conditions, log their symptoms, track medications, and generate comprehensive health reports. By doing so, MedBud reduces the burden of having to explain everything from scratch and helps doctors get a clearer picture, faster.

## Features

### Symptom Tracking
- Log daily symptoms with severity levels
- Add detailed notes and observations
- Track symptom patterns over time
- Filter and search symptom history

### Medication Management
- Set up medication schedules
- Track adherence to medication plans
- Receive reminders for medication times
- Log medication side effects

### Health Reports
- Generate comprehensive health reports
- AI-powered insights and analysis
- Export reports in PDF format
- Share reports with healthcare providers

## Tech Stack

### Frontend (React Native)
- React Native for cross-platform mobile development
- Expo for simplified development and deployment
- React Navigation for screen management
- AsyncStorage for local data persistence
- React Native Paper for UI components

### Backend (FastAPI)
- FastAPI for high-performance API development
- MongoDB for flexible data storage
- JWT for secure authentication
- CORS middleware for cross-origin requests
- Groq API integration for AI-powered reports

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- Python (v3.8 or higher)
- MongoDB
- Expo CLI
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/decipher6/medBud.git
cd medBud
```

2. Backend Setup:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. Frontend Setup:

FYI frontend is medBud/
```bash
npm install
# or
yarn install
```

4. Environment Configuration:
   - Create `.env` files in both frontend and backend directories
   - Configure necessary environment variables (see Configuration section)

### Running the Application

1. Start the Backend:
```bash
cd backend
uvicorn main:app --reload
```

2. Start the Frontend:
```bash
cd frontend
expo start
```

## Configuration

### Backend Environment Variables
```env
MONGODB_URI=your_mongodb_uri
DATABASE_NAME=medbud_db
PORT=8000
GROQ_API_KEY=your_groq_api_key
```

### Frontend Environment Variables
```env
REACT_APP_BACKEND_URL=http://localhost:8000
```

## API Documentation

The API documentation is available at `http://localhost:8000/docs` when running the backend server. It provides detailed information about all available endpoints, request/response formats, and authentication requirements.

## Testing

### Backend Tests
```bash
cd backend
pytest tests.py --cov=main --cov-report=term-missing
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Security

- JWT-based authentication
- Secure password hashing
- CORS protection
- Input validation
- Rate limiting

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Groq API for AI-powered report generation
- MongoDB for database services
- FastAPI for the backend framework
- React Native community for the frontend framework
