const BASE_URL = 'http://10.228.241.103:8000';

export const api = {
  // Symptoms
  async createSymptom(symptomData, user_id) {
    const response = await fetch(`${BASE_URL}/api/symptoms?user_id=${user_id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(symptomData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    
    return data;
  },

  async getSymptoms(userId, skip = 0, limit = 100) {
    const response = await fetch(`${BASE_URL}/api/symptoms/${userId}?skip=${skip}&limit=${limit}`);
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    
    return data;
  },

  // Medications
  async createMedication(medicationData) {
    const response = await fetch(`${BASE_URL}/api/medications/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(medicationData),
    });
    return response.json();
  },

  async getMedications(userId) {
    const response = await fetch(`${BASE_URL}/api/medications/${userId}`);
    return response.json();
  },

  async updateMedication(medicationId, medicationData) {
    const response = await fetch(`${BASE_URL}/api/medications/${medicationId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(medicationData),
    });
    return response.json();
  },

  async deleteMedication(medicationId) {
    const response = await fetch(`${BASE_URL}/api/medications/${medicationId}`, {
      method: 'DELETE',
    });
    return response.json();
  },

  // Reports
  async generateReport(userId) {
    const response = await fetch(`${BASE_URL}/api/reports/${userId}`);
    return response.json();
  },

  async generatePdfReport(userId) {
    const response = await fetch(`${BASE_URL}/api/reports/${userId}/pdf`);
    return response.json();
  },

  // Users
  async createUser(userData) {
    const response = await fetch(`${BASE_URL}/api/users/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    return response.json();
  },

  async getUsers() {
    const response = await fetch(`${BASE_URL}/api/users/`);
    return response.json();
  },

  async getUser(userId) {
    const response = await fetch(`${BASE_URL}/api/users/${userId}`);
    return response.json();
  },
}; 