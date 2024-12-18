// Constants

const BASE_URL = 'https://servidoragendas.abymint.com';



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

        if (response.ok) {
            userToken = data.token;
            localStorage.setItem('userToken', userToken);
            alert('Login successful!');
            toggleSections(true); // Solo aquí debe ir la llamada.
            loadEvents();
            
        } else {
            alert(`Login failed: ${data.error}`);
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
