// Constants

const BASE_URL = 'https://servidoragendas.abymint.com';

// Agregar esto al inicio del archivo app.js
document.addEventListener('DOMContentLoaded', () => {
    const showLoginBtn = document.getElementById('showLogin');
    const showSignupBtn = document.getElementById('showSignup');
    const initialButtons = document.getElementById('initialButtons');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const backButtons = document.querySelectorAll('.backButton');
    const infoSection = document.getElementById('infoSection');

    showLoginBtn.addEventListener('click', () => {
        initialButtons.style.display = 'none';
        infoSection.style.display = 'none';
        loginForm.style.display = 'block';
    });
    
    showSignupBtn.addEventListener('click', () => {
        initialButtons.style.display = 'none';
        infoSection.style.display = 'none';
        signupForm.style.display = 'block';
    });
    
    backButtons.forEach(button => {
        button.addEventListener('click', () => {
            loginForm.style.display = 'none';
            signupForm.style.display = 'none';
            initialButtons.style.display = 'block';
            infoSection.style.display = 'block';
        });
    });
});
function handleSuccessfulLogin(token) {
    localStorage.setItem('token', token);
    document.getElementById('auth').style.display = 'none';
    infoSection.style.display = 'none';
    document.getElementById('calendar').style.display = 'block';
}
let userData = null;

function updateUserButton(username) {
    const userButton = document.getElementById('userButton');
    const userMenuBtn = document.getElementById('userMenuBtn');
    userButton.style.display = 'block';
    userMenuBtn.textContent = username;
}

function setupUserMenu() {
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userDropdown = document.getElementById('userDropdown');
    const logoutBtn = document.getElementById('logoutBtn');
    const userInfo = document.getElementById('userInfo');

    userMenuBtn.addEventListener('click', async () => {
        userDropdown.classList.toggle('show');
        try {
            const response = await fetch(`${BASE_URL}/user`, {
                headers: { token: userToken }
            });
            const userData = await response.json();
            userInfo.innerHTML = `
                <p><strong>Usuario:</strong> <span id="usernameDisplay">${userData.username}</span>
                <button id="editUsername">Editar</button></p>
                <p><strong>Email:</strong> ${userData.email}</p>
            `;

            document.getElementById('editUsername').addEventListener('click', () => {
                const currentUsername = document.getElementById('usernameDisplay').textContent;
                const newUsername = prompt('Ingresa tu nuevo nombre de usuario:', currentUsername);
                
                if (newUsername && newUsername !== currentUsername) {
                    updateUsername(newUsername);
                }
            });
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    });

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('userToken');
        userToken = null;
        toggleSections(false);
        userButton.style.display = 'none';
        userDropdown.classList.remove('show');
    });
}
async function updateUsername(newUsername) {
    try {
        const response = await fetch(`${BASE_URL}/user/update`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                token: userToken
            },
            body: JSON.stringify({ username: newUsername })
        });

        if (response.ok) {
            const updatedUser = await response.json();
            document.getElementById('usernameDisplay').textContent = updatedUser.username;
            document.getElementById('userMenuBtn').textContent = updatedUser.username;
            alert('Nombre de usuario actualizado exitosamente');
        } else {
            alert('Error al actualizar el nombre de usuario');
        }
    } catch (error) {
        console.error('Error updating username:', error);
        alert('Error al actualizar el nombre de usuario');
    }
}


// Create toggleSections in the global scope
const toggleSections = (showCalendar) => {
    const authSection = document.getElementById('auth');
    const calendarSection = document.getElementById('calendar');
    if (authSection && calendarSection) {
        authSection.style.display = showCalendar ? 'none' : 'block';
        calendarSection.style.display = showCalendar ? 'block' : 'none';
    }
}


document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const signupForm = document.getElementById('signupForm');
    const loginForm = document.getElementById('loginForm');
    const eventFormModal = document.getElementById('eventFormModal');
    const downloadEventsBtn = document.getElementById('downloadEvents');
    
    // Calendar and Auth sections
    const authSection = document.getElementById('auth');
    const calendarSection = document.getElementById('calendar');

    toggleSections(false); // Asegúrate de ocultar el calendario al inicio


    // Set initial state to display only the auth section
    authSection.style.display = 'block';
    calendarSection.style.display = 'none';

    // Rest of your event listeners and code...
});

// Signup Logic
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('signupUsername').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;

    try {
        const response = await fetch(`${BASE_URL}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password }),
        });
        const data = await response.json();

        if (response.ok) {
            alert('Signup successful! Please log in.');
            signupForm.reset();
        } else {
            alert(`Signup failed: ${data.error}`);
        }
    } catch (error) {
        alert('Error signing up. Please try again.');
    }
});

// Login Logic
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`${BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        console.log('Respuesta del servidor:', data); // Para debug

        if (response.ok && data.user && data.token) {
            userToken = data.token;
            userData = data.user;
            localStorage.setItem('userToken', userToken);
            alert('Login successful!');
            updateUserButton(data.user.username);
            toggleSections(true);
            loadEvents();
            setupUserMenu();
        } else {
            alert(`Login failed: ${data.error || 'Error en los datos del usuario'}`);
        }
    } catch (error) {
        alert('Error logging in. Please try again.');
        console.log(error);
    }
});




// Load Events
async function loadEvents() {
    try {
        const response = await fetch(`${BASE_URL}/events`, {
            method: 'GET',
            headers: { token: userToken },
        });
        const events = await response.json();

        const eventList = document.getElementById('eventList');
        if (!eventList) {
            console.error('Event list element not found');
            return;
        }

        eventList.innerHTML = '';
        events.forEach((event) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <strong>${event.title}</strong> (${new Date(event.date).toLocaleDateString()})<br>
                ${event.description || 'No description'}
                <button onclick="deleteEvent('${event._id}')">Borrar</button>
            `;
            eventList.appendChild(li);
        });
    } catch (error) {
        alert('Error loading events.');
        console.log(error);
    }
}


// Add this function to check for time conflicts
async function checkTimeConflicts(newDate) {
    try {
        const response = await fetch(`${BASE_URL}/events`, {
            method: 'GET',
            headers: { token: userToken },
        });
        const events = await response.json();
        
        return events.find(event => {
            const existingDate = new Date(event.date);
            return existingDate.getTime() === newDate.getTime();
        });
    } catch (error) {
        console.error('Error checking time conflicts:', error);
        return null;
    }
}


// Add Event



// Delete Event
async function deleteEvent(eventId) {
    try {
        const response = await fetch(`${BASE_URL}/events/${eventId}`, {
            method: 'DELETE',
            headers: { token: userToken },
        });

        if (response.ok) {
            alert('Event deleted successfully!');
            loadEvents();
        } else {
            alert('Failed to delete event.');
        }
    } catch (error) {
        alert('Error deleting event.');
    }
}
function resetForm() {
    modalEventTitle.value = '';
    modalEventDescription.value = '';
    document.getElementById('modalEventTime').value = '';
    eventModal.style.display = 'none';
    eventFormModal.dataset.editId = ''; // Eliminar el ID de edición
    const submitBtn = eventFormModal.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Añadir Evento';
}

// Download Events
downloadEventsBtn.addEventListener('click', async () => {
    try {
        const response = await fetch(`${BASE_URL}/download`, {
            method: 'GET',
            headers: { token: userToken },
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'events.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } else {
            alert('Failed to download events.');
        }
    } catch (error) {
        alert('Error downloading events.');
    }
});

// Initial State
toggleSections(false);
