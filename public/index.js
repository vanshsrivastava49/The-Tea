const token = localStorage.getItem('token');
if (!token) {
    window.location.href = "login.html";
}
async function getUserInfo() {
    try {
        const response = await fetch('/verify-token', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (response.ok) {
            const data = await response.json();
            document.getElementById('usernameDisplay').innerText = `Welcome, ${data.username}`;
        } else {
            alert('Session expired. Please log in again.');
            localStorage.removeItem('token');
            window.location.href = "login.html";
        }
    } catch (error) {
        console.error('Error fetching user info:', error);
        alert('Authentication failed.');
        localStorage.removeItem('token');
        window.location.href = "login.html";
    }
}
getUserInfo();