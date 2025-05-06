const BASE_URL = 'https://medbud.onrender.com';

export const api = {
  // Symptoms
  async createSymptom(symptomData, user_id) {
    if (!user_id) {
      console.error('Missing user_id in createSymptom call');
      throw new Error('User ID is required to create a symptom');
    }

    console.log(`Calling API: POST ${BASE_URL}/api/symptoms/?user_id=${user_id}`);
    console.log('Request body:', JSON.stringify(symptomData));
    
    try {
      const response = await fetch(`${BASE_URL}/api/symptoms/?user_id=${user_id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(symptomData),
      });
      
      // For non-200 responses, attempt to parse error details from JSON
      if (!response.ok) {
        let errorMsg = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.detail || errorData.message || errorMsg;
        } catch (e) {
          // If parsing JSON fails, use the default error message
          console.error('Failed to parse error response:', e);
        }
        console.error('API Error:', errorMsg);
        throw new Error(errorMsg);
      }
      
      const data = await response.json();
      console.log('API Response:', data);
      return data;
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  },

  async getSymptoms(userId, skip = 0, limit = 100) {
    if (!userId) {
      console.error('Missing userId in getSymptoms call');
      return []; // Return empty array if no userId
    }
    
    console.log(`Calling API: GET ${BASE_URL}/api/symptoms/${userId}?skip=${skip}&limit=${limit}`);
    
    try {
      const response = await fetch(`${BASE_URL}/api/symptoms/${userId}?skip=${skip}&limit=${limit}`);
      
      // For non-200 responses, attempt to parse error details from JSON
      if (!response.ok) {
        let errorMsg = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.detail || errorData.message || errorMsg;
        } catch (e) {
          // If parsing JSON fails, use the default error message
          console.error('Failed to parse error response:', e);
        }
        console.error('API Error:', errorMsg);
        throw new Error(errorMsg);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  },

  // Medications
  async createMedication(medicationData) {
    const response = await fetch(`${BASE_URL}/api/medications/?user_id=${medicationData.user_id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(medicationData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    
    return data;
  },

  async getMedications(userId) {
    if (!userId) {
      console.error('Missing userId in getMedications call');
      return []; // Return empty array if no userId
    }
    
    const response = await fetch(`${BASE_URL}/api/medications/${userId}`);
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    
    return data;
  },

  async updateMedication(medicationId, medicationData, userId) {
    const response = await fetch(`${BASE_URL}/api/medications/${medicationId}?user_id=${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(medicationData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    
    return data;
  },

  async deleteMedication(medicationId, userId) {
    const response = await fetch(`${BASE_URL}/api/medications/${medicationId}?user_id=${userId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    
    return true;
  },

  // Reports
  async generateReport(userId, startDate = null, endDate = null, format = 'summary') {
    let url = `${BASE_URL}/api/reports/${userId}`;
    
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    params.append('report_format', format);
  
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
  
    const response = await fetch(url);
  
    if (!response.ok) {
      let message = `HTTP error! status: ${response.status}`;
      try {
        const data = await response.json();
        message = data.detail || data.message || message;
      } catch (_) {
        // response body might not be JSON
      }
  
      const error = new Error(message);
      error.status = response.status;
      throw error;
    }
  
    // return text (not JSON) for summary report
    if (format === 'pdf') {
      return await response.blob();
    }
    return await response.text();
  },

  async generatePdfReport(userId, startDate = null, endDate = null) {
    let url = `${BASE_URL}/api/reports/${userId}`;
    
    // Add date range parameters if provided
    const params = new URLSearchParams();
    if (startDate) {
      params.append('start_date', startDate);
    }
    if (endDate) {
      params.append('end_date', endDate);
    }
    
    // Append parameters to URL if any exist
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await fetch(url);
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    
    // The API returns a string with the report content
    const data = await response.text();
    return data;
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