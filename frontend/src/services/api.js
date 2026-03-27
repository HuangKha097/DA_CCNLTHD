import axios from 'axios';

// Replace with your actual backend URL or read from environment variable
const API_BASE_URL = 'http://localhost:5001/api'; 

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor to attach the auth token to every request automatically
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        const shopOrUserId = localStorage.getItem('user_id') || localStorage.getItem('client_id');

        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        
        if (shopOrUserId) {
            config.headers['x-client-id'] = shopOrUserId;
            config.headers['x-shop-id'] = shopOrUserId;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor to handle authentication failures and session expiration
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        // If the backend returns 401 (Unauthorized) or 403 (Forbidden)
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            const isExpired = error.response.status === 403;
            console.warn(isExpired ? "Session expired." : "Unauthorized access. Redirecting to login...");
            
            // Notification for the user
            if (!window.location.pathname.includes('/login')) {
                alert(isExpired ? "Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại." : "Vui lòng đăng nhập để tiếp tục.");
            }

            // Clear all user-related data
            localStorage.removeItem('access_token');
            localStorage.removeItem('user_id');
            localStorage.removeItem('client_id');
            localStorage.removeItem('user_name');
            localStorage.removeItem('user_role');
            localStorage.removeItem('user_info');
            
            // Force redirect to login page if we aren't already there
            if (!window.location.pathname.includes('/login')) {
                window.location.href = `/login?${isExpired ? 'expired=true' : 'auth_required=true'}`;
            }
        }
        return Promise.reject(error);
    }
);

export default Object.assign(apiClient, { API_BASE_URL });
