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

function filterEventsByMonth(eventsArray, date) {
    return eventsArray.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.getMonth() === date.getMonth() && 
               eventDate.getFullYear() === date.getFullYear();
    });
}

function updateEventList(showAllEvents = false) {
    const eventList = document.getElementById('eventList');
    if (!eventList) return;
    
    eventList.innerHTML = '';
    let eventsToShow = showAllEvents ? events : filterEventsByMonth(events, currentDate);
    const sortedEvents = [...eventsToShow].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Add toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.textContent = showAllEvents ? 'Show Current Month' : 'Show All Events';
    toggleBtn.onclick = () => updateEventList(!showAllEvents);
    eventList.appendChild(toggleBtn);
    
    sortedEvents.forEach(event => {
        const eventDate = new Date(event.date);
        const li = document.createElement('li');
        li.textContent = `${eventDate.toLocaleDateString()} ${eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${event.title}`;
        if (event.repeat) {
            li.textContent += ` (Repeats ${event.repeat})`;
        }
        li.addEventListener('click', () => openModal(eventDate));
        eventList.appendChild(li);
    });
}
async function createRepeatingEvents(eventData, repeatType) {
    const events = [];
    const baseDate = new Date(eventData.date);
    
    switch(repeatType) {
        case 'weekly':
            for(let i = 0; i < 52; i++) { // Create events for one year
                const newDate = new Date(baseDate);
                newDate.setDate(newDate.getDate() + (i * 7));
                events.push({...eventData, date: newDate, repeat: 'weekly'});
            }
            break;
            
        case 'monthly':
            for(let i = 0; i < 12; i++) { // Create events for one year
                const newDate = new Date(baseDate);
                newDate.setMonth(newDate.getMonth() + i);
                events.push({...eventData, date: newDate, repeat: 'monthly'});
            }
            break;
            
        case 'yearly':
            for(let i = 0; i < 5; i++) { // Create events for 5 years
                const newDate = new Date(baseDate);
                newDate.setFullYear(newDate.getFullYear() + i);
                events.push({...eventData, date: newDate, repeat: 'yearly'});
            }
            break;
            
        default:
            events.push(eventData);
    }
    
    return events;
}
document.addEventListener('DOMContentLoaded', () => {
    if (userToken) {
        // Si hay un token en el almacenamiento local, cargar los eventos automáticamente
        fetchEvents().then(() => {
            renderCalendar();  // Renderizar después de que los eventos hayan sido cargados
        });
    }
});
//Se movio eventFormModal desde app.js
eventFormModal.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = modalEventTitle.value;
    const description = modalEventDescription.value;
    const date = eventFormModal.dataset.date;
    const time = document.getElementById('modalEventTime').value;
    const repeat = document.getElementById('eventRepeat').value;
    let dateObject = new Date(date);

    if (time) {
        const [hours, minutes] = time.split(':');
        dateObject.setHours(hours, minutes);
    }

    const conflictingEvent = await checkTimeConflicts(dateObject);
    
    if (conflictingEvent) {
        const proceed = confirm(`There is already an event "${conflictingEvent.title}" scheduled at this time. Do you want to add this event anyway?`);
        if (!proceed) {
            return;
        }
    }

    const editId = eventFormModal.dataset.editId;
    const url = editId ? `${BASE_URL}/events/${editId}` : `${BASE_URL}/events`;
    const method = editId ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                token: userToken,
            },
            body: JSON.stringify({
                title: title.trim(),
                description: description.trim(),
                date: dateObject.toISOString(),
                repeat: repeat !== 'none' ? repeat : null
            }),
        });

        if (response.ok) {
            alert(editId ? 'Evento actualizado con éxito!' : 'Evento añadido con éxito!');
            resetForm();
            fetchEvents();
        } else {
            const data = await response.json();
            alert(`Fallo al ${editId ? 'actualizar' : 'añadir'} el evento: ${data.error}`);
        }
    } catch (err) {
        console.error('Error:', err);
        alert(`Error al ${editId ? 'actualizar' : 'añadir'} el evento.`);
    }
    await fetchEvents();
    renderCalendar();
    eventModal.style.display = 'none';
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
    // Add repeat select if it doesn't exist
    let repeatSelect = document.getElementById('eventRepeat');
    if (!repeatSelect) {
        repeatSelect = document.createElement('select');
        repeatSelect.id = 'eventRepeat';
        repeatSelect.innerHTML = `
            <option value="none">No repeat</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
        `;
        eventFormModal.insertBefore(repeatSelect, eventFormModal.querySelector('button'));
    }

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
            if (event.repeat) {
                eventDiv.textContent += ` (Repeats ${event.repeat})`;
            }
            
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
    const eventList = document.getElementById('eventList');
    if (!eventList) return;
    
    eventList.innerHTML = '';
    
    // Filter events for current month
    const currentMonthEvents = events.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.getMonth() === currentDate.getMonth() && 
               eventDate.getFullYear() === currentDate.getFullYear();
    });
    
    const sortedEvents = [...currentMonthEvents].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    sortedEvents.forEach(event => {
        const eventDate = new Date(event.date);
        const li = document.createElement('li');
        const repeatInfo = event.repeat ? ` (Repeats ${event.repeat})` : '';
        li.textContent = `${eventDate.toLocaleDateString()} ${eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${event.title}${repeatInfo}`;
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

