//Connect to the socket server
const socket = io();

//Select chat elements
const chatBox = document.getElementById('chat-box');
const msgInput = document.getElementById('msgInput');
//Retrieve username and token from localStorage
const token = localStorage.getItem('token');
if (!token) {
    alert('Session expired. Please log in again.');
    window.location.href = "login.html";
}
//Fetch and display previous chat history after token validation
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
            // Display username on the chat page
            document.getElementById('usernameDisplay').innerText = `Welcome, ${userData.username}`;

            //Store username in localStorage for easy access
            localStorage.setItem('username', userData.username);
            //Request chat history after authentication
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
//Render chat history
socket.on('chatHistory', (messages) => {
    chatBox.innerHTML = '';  // Clear existing messages
    messages.forEach((data) => {
        renderMessage(data.username, data.message);
    });
});
//Listen for new messages
socket.on('chatMessage', (data) => {
    renderMessage(data.username, data.msg);
});
//Function to render chat messages
function renderMessage(username, msg) {
    const messageElement = document.createElement('div');
    messageElement.innerHTML = `<strong>${username}:</strong> ${msg}`;
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
}
//Function to send messages with username and token
function sendMessage() {
    const msg = msgInput.value.trim();
    const username = localStorage.getItem('username');  // Retrieve username

    if (msg && username) {
        // ✅ Include both `username` and `token`
        socket.emit('chatMessage', { msg, username, token });
        msgInput.value = '';
    }
}
//Handle socket errors and disconnections
socket.on('connect_error', (error) => {
    console.error('Connection Error:', error);
    alert('Failed to connect to the server. Please try again.');
    window.location.href = "login.html";
});
socket.on('disconnect', () => {
    console.warn('Disconnected from server.');
});
//Load chat history on page load
loadChatHistory();
