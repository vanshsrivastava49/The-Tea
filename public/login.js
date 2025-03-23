const loginForm = document.getElementById('loginForm');

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();  // Prevent page reload

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('http://localhost:3000/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                if (response.ok) {
                    const data = await response.json();
                    
                    // ✅ Store token and username in localStorage
                    localStorage.setItem('token', `Bearer ${data.token}`);
                    localStorage.setItem('username', data.username);

                    // ✅ Redirect to chat page
                    window.location.href = "index.html";
                } else {
                    const errorMsg = document.getElementById('errorMsg');
                    errorMsg.style.display = 'block';
                    errorMsg.textContent = 'Invalid credentials. Please try again.';
                }
            } catch (error) {
                console.error('Error during login:', error);
                alert('Failed to log in. Please try again.');
            }
        });