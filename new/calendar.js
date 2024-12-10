// calendar.js
//const BASE_URL = 'https://southampton-monthly-scotland-attend.trycloudflare.com';
let userToken = localStorage.getItem('userToken');
let currentDate = new Date();
let events = [];

// DOM Elements
const eventModal = document.getElementById('eventModal');
const modalDate = document.getElementById('modalDate');
const eventListModal = document.getElementById('eventListModal');
const eventFormModal = document.getElementById('eventFormModal');
const modalEventTitle = document.getElementById('modalEventTitle');
const modalEventDescription = document.getElementById('modalEventDescription');
const closeModal = document.querySelector('.close');
const daysContainer = document.getElementById('calendar-grid');
const monthYearHeader = document.getElementById('monthDisplay');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');

// Cargar eventos después de iniciar sesión exitoso
async function fetchEvents() {
    try {
        const response = await fetch(`${BASE_URL}/events`, {
            headers: { 
                'token': userToken,
                'Content-Type': 'application/json'
            }
        });
        events = await response.json();
        renderCalendar(); // Renderizar el calendario después de cargar los eventos
        updateEventList(); // Actualizar la lista de eventos en la UI
    } catch (err) {
        console.error('Error fetching events:', err);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (userToken) {
        // Si hay un token en el almacenamiento local, cargar los eventos automáticamente
        fetchEvents().then(() => {
            renderCalendar();  // Renderizar después de que los eventos hayan sido cargados
        });
    }
});


// Renderizar el calendario con los días
function renderCalendar() {
    if (!daysContainer) {
        console.error('Calendar grid container not found.');
        return;
    }

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    monthYearHeader.textContent = `${currentDate.toLocaleString('default', { month: 'long' })} ${year}`;

    // Limpiar el contenedor antes de renderizar los nuevos días
    daysContainer.innerHTML = '';

    // Obtener el primer y último día del mes
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayIndex = firstDay.getDay();

    // Añadir celdas vacías para los días antes del inicio del mes
    for (let i = 0; i < startDayIndex; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.classList.add('day', 'empty');
        daysContainer.appendChild(emptyDay);
    }

    // Añadir los días reales
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const dayDiv = document.createElement('div');
        dayDiv.classList.add('day');
        dayDiv.textContent = day;

        // Verificar si es hoy
        const currentDay = new Date(year, month, day).toDateString();
        const today = new Date().toDateString();
        if (currentDay === today) {
            dayDiv.classList.add('today');
        }

        // Verificar si hay eventos para este día
        const dayEvents = events.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate.toDateString() === new Date(year, month, day).toDateString();
        });

        if (dayEvents.length > 0) {
            dayDiv.classList.add('has-event');
        }

        // Añadir evento de clic para abrir el modal
        dayDiv.addEventListener('click', () => {
            openModal(new Date(year, month, day));
        });

        daysContainer.appendChild(dayDiv);
    }
}
// Función para abrir el modal de creación de evento
function setupEventEdit(event) {
    modalEventTitle.value = event.title;
    modalEventDescription.value = event.description || '';
    const eventDate = new Date(event.date);
    document.getElementById('modalEventTime').value = 
        `${String(eventDate.getHours()).padStart(2, '0')}:${String(eventDate.getMinutes()).padStart(2, '0')}`;
    
    // Change form submission to update instead of create
    eventFormModal.dataset.editId = event._id;
    
    // Change submit button text
    const submitBtn = eventFormModal.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Update Event';
}

//opennModal
function openModal(date) {
    modalDate.textContent = date.toDateString();
    eventModal.style.display = 'flex';
    eventListModal.innerHTML = '';

    const dateEvents = events.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.toDateString() === date.toDateString();
    });

    if (dateEvents.length > 0) {
        const sortedEvents = dateEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
        sortedEvents.forEach(event => {
            const eventDate = new Date(event.date);
            const li = document.createElement('li');
            const eventDiv = document.createElement('div');
            eventDiv.textContent = `${eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${event.title}${event.description ? `: ${event.description}` : ''}`;
            
            const editBtn = document.createElement('button');
            editBtn.textContent = '✏️';
            editBtn.classList.add('edit-btn');
            editBtn.onclick = () => setupEventEdit(event);

            li.appendChild(eventDiv);
            li.appendChild(editBtn);
            eventListModal.appendChild(li);
        });
    } else {
        const li = document.createElement('li');
        li.textContent = 'No events for this day.';
        eventListModal.appendChild(li);
    }

    eventFormModal.dataset.date = date.toISOString();
}

function updateEventList() {
    const eventList = document.getElementById('eventList'); // Make sure you have this element in your HTML
    if (!eventList) return;
    
    eventList.innerHTML = '';
    const sortedEvents = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    sortedEvents.forEach(event => {
        const eventDate = new Date(event.date);
        const li = document.createElement('li');
        li.textContent = `${eventDate.toLocaleDateString()} ${eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${event.title}`;
        li.addEventListener('click', () => openModal(eventDate));
        eventList.appendChild(li);
    });
}


// Navegación entre meses
prevMonthBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
});

nextMonthBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
});

