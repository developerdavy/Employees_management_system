const form = document.getElementById('login-form');
const errorMessage = document.getElementById('error-message');

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // TO DO: implement login logic here
    // For demonstration purposes, we'll just check if the username and password are not empty
    if (username && password) {
        console.log('Login successful!');
    } else {
        errorMessage.textContent = 'Please enter a valid username and password.';
    }
});

