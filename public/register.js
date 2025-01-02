async function handleRegister(event) {
    event.preventDefault();
    
    const errorMessage = document.getElementById('errorMessage');
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        console.log('Registration response:', data); // Debug logging
        
        if (data.success) {
            alert('Registration successful! Please log in.');
            window.location.href = '/login';
        } else {
            errorMessage.textContent = data.message || 'Registration failed';
            errorMessage.style.display = 'block';
        }
    } catch (error) {
        console.error('Registration error:', error);
        errorMessage.textContent = 'An error occurred during registration';
        errorMessage.style.display = 'block';
    }
}

// Add event listener to the form
document.getElementById('registerForm').addEventListener('submit', handleRegister); 