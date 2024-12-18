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
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'toggle-events-btn';
    toggleBtn.textContent = showAllEvents ? 'Mostrar Solo Este Mes' : 'Mostrar Todos los Eventos';
    toggleBtn.onclick = () => updateEventList(!showAllEvents);
    eventList.appendChild(toggleBtn);
    
    const currentMonthEvents = events.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.getMonth() === currentDate.getMonth() && 
               eventDate.getFullYear() === currentDate.getFullYear();
    });
    const sortedEvents = currentMonthEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
    

    if (sortedEvents.length === 0) {
        const noEvents = document.createElement('li');
        noEvents.textContent = 'No hay eventos este mes';
        eventList.appendChild(noEvents);
        return;
    }
    
    sortedEvents.forEach(event => {
        const eventDate = new Date(event.date);
        const li = document.createElement('li');
        li.innerHTML = `
            <strong>${eventDate.toLocaleDateString()}</strong> 
            ${eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
            ${event.title}
            ${event.repeat ? `<em>(Se repite ${event.repeat})</em>` : ''}
        `;
        li.addEventListener('click', () => openModal(eventDate));
        eventList.appendChild(li);
    });
}
async function createRepeatingEvents(eventData, repeatType) {
    const events = [];
    const baseDate = new Date(eventData.date);
    
    // Marcar el evento original
    const originalEvent = {
        ...eventData,
        title: `${eventData.title} (ORIGINAL)`,
        isOriginal: true,
        repeatType: repeatType
    };
    events.push(originalEvent);
    
    switch(repeatType) {
        case 'weekly':
            for(let i = 1; i < 52; i++) { // Empezamos desde 1 porque el original ya está
                const newDate = new Date(baseDate);
                newDate.setDate(newDate.getDate() + (i * 7));
                events.push({
                    ...eventData,
                    date: newDate,
                    repeat: 'weekly',
                    originalEventId: originalEvent._id
                });
            }
            break;
            
        case 'monthly':
            for(let i = 1; i < 12; i++) {
                const newDate = new Date(baseDate);
                newDate.setMonth(newDate.getMonth() + i);
                events.push({
                    ...eventData,
                    date: newDate,
                    repeat: 'monthly',
                    originalEventId: originalEvent._id
                });
            }
            break;
            
        case 'yearly':
            for(let i = 1; i < 5; i++) {
                const newDate = new Date(baseDate);
                newDate.setFullYear(newDate.getFullYear() + i);
                events.push({
                    ...eventData,
                    date: newDate,
                    repeat: 'yearly',
                    originalEventId: originalEvent._id
                });
            }
            break;
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
//Se movio eventFormModal.addEventListener desde app.js
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

    const eventData = {
        title: title.trim(),
        description: description.trim(),
        date: dateObject.toISOString(),
        repeat: repeat !== 'none' ? repeat : null
    };

    try {
        if (repeat !== 'none') {
            // Crear múltiples eventos si hay repetición
            const repeatingEvents = await createRepeatingEvents(eventData, repeat);
            
            // Guardar cada evento repetido
            for (const event of repeatingEvents) {
                await fetch(`${BASE_URL}/events`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        token: userToken,
                    },
                    body: JSON.stringify(event),
                });
            }
            alert('Eventos repetidos creados con éxito!');
        } else {
            // Crear un solo evento si no hay repetición
            const response = await fetch(`${BASE_URL}/events`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    token: userToken,
                },
                body: JSON.stringify(eventData),
            });

            if (!response.ok) {
                throw new Error('Error al crear el evento');
            }
            alert('Evento creado con éxito!');
        }

        resetForm();
        await fetchEvents();
        renderCalendar();
        eventModal.style.display = 'none';
    } catch (err) {
        console.error('Error:', err);
        alert('Error al crear el evento.');
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
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '🗑️';
            deleteBtn.classList.add('delete-btn');
            deleteBtn.onclick = async () => {
                if (event.title.includes('(ORIGINAL)')) {
                    if (confirm('¿Estás seguro de que quieres eliminar este evento y todas sus repeticiones?')) {
                        try {
                            const response = await fetch(`${BASE_URL}/events/deleteRepeating/${event._id}`, {
                                method: 'DELETE',
                                headers: {
                                    'Content-Type': 'application/json',
                                    token: userToken
                                }
                            });
                    
                            if (response.ok) {
                                alert('Evento y sus repeticiones eliminados con éxito');
                                await fetchEvents();
                                renderCalendar();
                                openModal(date);
                            } else {
                                alert('Error al eliminar los eventos');
                            }
                        } catch (err) {
                            console.error('Error:', err);
                            alert('Error al eliminar los eventos');
                        }
                    }
                } else {
                    // Código existente para eliminar un solo evento
                    if (confirm('¿Estás seguro de que quieres eliminar este evento?')) {
                        // ... resto del código actual de eliminación ...
                    }
                }
            };                        
            li.appendChild(eventDiv);
            li.appendChild(editBtn);
            li.appendChild(deleteBtn); // Agregar después de li.appendChild(editBtn);

            eventListModal.appendChild(li);
        });
    } else {
        const li = document.createElement('li');
        li.textContent = 'No events for this day.';
        eventListModal.appendChild(li);
    }

    eventFormModal.dataset.date = date.toISOString();
}

function updateEventList(showAllEvents = false) {
    const eventList = document.getElementById('eventList');
    if (!eventList) return;
    
    eventList.innerHTML = '';
    
    // Botón para alternar entre todos los eventos y eventos del mes actual
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'toggle-events-btn';
    toggleBtn.textContent = showAllEvents ? 'Mostrar Solo Este Mes' : 'Mostrar Todos los Eventos';
    toggleBtn.onclick = () => updateEventList(!showAllEvents);
    eventList.appendChild(toggleBtn);

    // Filtrar eventos según la selección
    const filteredEvents = showAllEvents ? events : events.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.getMonth() === currentDate.getMonth() && 
               eventDate.getFullYear() === currentDate.getFullYear();
    });
    
    // Ordenar eventos por fecha
    const sortedEvents = filteredEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    if (sortedEvents.length === 0) {
        const noEvents = document.createElement('li');
        noEvents.textContent = showAllEvents ? 'No hay eventos registrados' : 'No hay eventos este mes';
        eventList.appendChild(noEvents);
        return;
    }
    
    sortedEvents.forEach(event => {
        const eventDate = new Date(event.date);
        const li = document.createElement('li');
        li.innerHTML = `
            <strong>${eventDate.toLocaleDateString()}</strong> 
            ${eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
            ${event.title}
            ${event.repeat ? `<em>(Se repite ${event.repeat})</em>` : ''}
        `;
        li.addEventListener('click', () => openModal(eventDate));
        eventList.appendChild(li);
    });
}
// Navegación entre meses
prevMonthBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
    updateEventList();
});

nextMonthBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
    updateEventList();
});

