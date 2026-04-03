import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const api = axios.create({ baseURL: API_BASE_URL });

// Add token to requests
api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

const helpService = {
    /**
     * Send a help request to nearby medics
     */
    sendHelpRequest: async (location) => {
        try {
            const response = await api.post('/help/send-request', { location });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

   
    acceptHelpRequest: async (helpRequestId, currentLocation) => {
        try {
            const response = await api.post('/help/accept', {
                helpRequestId,
                location: currentLocation
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

  
    cancelHelpAcceptance: async (helpRequestId) => {
        try {
            const response = await api.post('/help/cancel-acceptance', { helpRequestId });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    /**
     * Mark medic as arrived
     */
    markMedicArrived: async (helpRequestId) => {
        try {
            const response = await api.post('/help/mark-arrived', { helpRequestId });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    /**
     * Complete a help request
     */
    completeHelpRequest: async (helpRequestId) => {
        try {
            const response = await api.post('/help/complete-request', { helpRequestId });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    /**
     * Cancel a help request (User)
     */
    cancelHelpRequest: async (helpRequestId, reason) => {
        try {
            const response = await api.post('/help/cancel-request', {
                helpRequestId,
                reason
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    /**
     * Get help request status
     */
    getHelpRequestStatus: async (helpRequestId) => {
        try {
            const response = await api.get(`/help/request/${helpRequestId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    /**
     * Register user device token for push notifications
     */
    registerUserDeviceToken: async (deviceToken) => {
        try {
            const response = await api.post('/help/register-user-device', { deviceToken });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    }
};

export default helpService;
