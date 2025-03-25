const socket = io();
const chatBox = document.getElementById('chat-box');
const msgInput = document.getElementById('msgInput');
const token = localStorage.getItem('token');
if (!token) {
    alert('Session expired. Please log in again.');
    window.location.href = "login.html";
}
async function loadChatHistory() {
    try {
        const response = await fetch('http://localhost:3000/verify-token', {
            method: 'GET',
            headers: {
                'Authorization': token
            }
        });
        if (response.ok) {
            const userData = await response.json(); 
            document.getElementById('usernameDisplay').innerText = `Welcome, ${userData.username}`;
            localStorage.setItem('username', userData.username);
            socket.emit('requestChatHistory');
        } else {
            alert('Session expired. Please log in again.');
            localStorage.removeItem('token');
            window.location.href = "login.html";
        }
    } catch (error) {
        console.error('Failed to verify token:', error);
        alert('Session expired. Please log in again.');
        localStorage.removeItem('token');
        window.location.href = "login.html";
    }
}
socket.on('chatHistory', (messages) => {
    chatBox.innerHTML = '';
    messages.forEach((data) => {
        renderMessage(data.username, data.message);
    });
});
socket.on('chatMessage', (data) => {
    renderMessage(data.username, data.msg);
});
function renderMessage(username, msg) {
    const messageElement = document.createElement('div');
    messageElement.innerHTML = `<strong>${username}:</strong> ${msg}`;
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
}
function sendMessage() {
    const msg = msgInput.value.trim();
    const username = localStorage.getItem('username');
    if (msg && username) {
        socket.emit('chatMessage', { msg, username, token });
        msgInput.value = '';
    }
}
socket.on('connect_error', (error) => {
    console.error('Connection Error:', error);
    alert('Failed to connect to the server. Please try again.');
    window.location.href = "login.html";
});
socket.on('disconnect', () => {
    console.warn('Disconnected from server.');
});
loadChatHistory();
function logout(){
    window.location.href="login.html";
}