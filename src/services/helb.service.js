const API_URL = 'http://localhost:3002/api/helb';  

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

const helbService = {
    async saveAmount(amount) {
        try {
            const response = await fetch(`${API_URL}/amount`, {
                method: 'POST',
                headers: getAuthHeader(),
                body: JSON.stringify({ amount })
            });
            
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to save amount');
            }
            return data;
        } catch (error) {
            console.error('Error saving HELB amount:', error);
            throw error;
        }
    },

    async confirmBudget(totalAmount, categories) {
        try {
            const response = await fetch(`${API_URL}/confirm-budget`, {
                method: 'POST',
                headers: getAuthHeader(),
                body: JSON.stringify({ totalAmount, categories })
            });
            
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to confirm budget');
            }
            return data;
        } catch (error) {
            console.error('Error confirming budget:', error);
            throw error;
        }
    },

    async getStatus() {
        try {
            const response = await fetch(`${API_URL}/status`, {
                method: 'GET',
                headers: getAuthHeader()
            });
            
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to get status');
            }
            return data;
        } catch (error) {
            console.error('Error getting status:', error);
            throw error;
        }
    },

    async getTransactions() {
        try {
            const response = await fetch(`${API_URL}/transactions`, {
                method: 'GET',
                headers: getAuthHeader()
            });
            
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to get transactions');
            }
            return data;
        } catch (error) {
            console.error('Error getting transactions:', error);
            throw error;
        }
    }
};

export default helbService;