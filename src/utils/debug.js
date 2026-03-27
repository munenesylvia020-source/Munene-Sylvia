// src/utils/debug.js
export const checkAuthStatus = () => {
    console.log('=== AUTH STATUS CHECK ===');
    console.log('Token:', localStorage.getItem('token') ? 'Present' : 'Missing');
    console.log('User:', localStorage.getItem('user'));
    console.log('Budget:', localStorage.getItem('budget'));
    
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        console.log('Parsed User:', user);
    } catch (e) {
        console.log('No valid user in localStorage');
    }
    
    try {
        const budget = JSON.parse(localStorage.getItem('budget'));
        console.log('Parsed Budget:', budget);
    } catch (e) {
        console.log('No valid budget in localStorage');
    }
    console.log('========================\n');
};

// Call this in your browser console to debug
window.checkAuth = checkAuthStatus;