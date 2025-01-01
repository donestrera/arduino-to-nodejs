// static/js/login.js

// This function handles the login form submission
async function handleLogin(event) {
    event.preventDefault();  // Prevent form from submitting normally
    
    // Get the login button and form elements
    const loginButton = document.querySelector('#loginButton');
    const usernameInput = document.querySelector('#username');
    const passwordInput = document.querySelector('#password');
    
    // Disable the login button while processing
    loginButton.disabled = true;
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: usernameInput.value,
                password: passwordInput.value
            })
        });
        
        const data = await response.json();
        
        if (data.message === 'Login successful') {
            window.location.href = data.redirect_url;
        } else {
            const errorMessage = data.error || data.message || 'Login failed';
            alert(errorMessage);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred during login');
    } finally {
        // Re-enable the login button
        loginButton.disabled = false;
    }
}

// Add event listener to the form
document.getElementById('loginForm').addEventListener('submit', handleLogin);