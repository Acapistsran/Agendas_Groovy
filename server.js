const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = 3000;
const SECRET = 'your_jwt_secret'; // Replace with a secure key

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/onlineCalendar', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error(err));

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Models
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});
const User = mongoose.model('User', UserSchema);

const EventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    date: { type: Date, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});
const Event = mongoose.model('Event', EventSchema);

// Routes
app.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, email, password: hashedPassword });
        await user.save();
        res.status(201).json({ message: 'User created successfully' });
    } catch (err) {
        res.status(400).json({ error: 'Error creating user' });
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jwt.sign({ userId: user._id }, SECRET, { expiresIn: '1h' });
        res.json({ 
            token,
            user: {
                username: user.username,
                email: user.email,
                id: user._id
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'Error logging in' });
    }
});


app.post('/events', async (req, res) => {
    const { title, description, date } = req.body;
    const { token } = req.headers;
    console.log(req.headers);
    try {
        const decoded = jwt.verify(token, SECRET);
        const event = new Event({ title, description, date, user: decoded.userId });
        await event.save();
        res.status(201).json({ message: 'Event created' });
    } catch (err) {
        console.log(err);
        res.status(400).json({ error: 'Error creating event' });
    }
});

app.get('/events', async (req, res) => {
    const { token } = req.headers;
    try {
        const decoded = jwt.verify(token, SECRET);
        const events = await Event.find({ user: decoded.userId });
        res.json(events);
    } catch (err) {
        res.status(400).json({ error: 'Error fetching events' });
    }
});

app.delete('/events/:id', async (req, res) => {
    const { token } = req.headers;
    const { id } = req.params;
    try {
        const decoded = jwt.verify(token, SECRET);
        const event = await Event.findOneAndDelete({ _id: id, user: decoded.userId });
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        res.json({ message: 'Event deleted' });
    } catch (err) {
        res.status(400).json({ error: 'Error deleting event' });
    }
});
//Unused function, will get deleted
app.get('/download', async (req, res) => {
    const { token } = req.headers;
    try {
        const decoded = jwt.verify(token, SECRET);
        const events = await Event.find({ user: decoded.userId });
        const jsonData = JSON.stringify(events, null, 2);
        const filePath = './user_events.json';
        fs.writeFileSync(filePath, jsonData);
        res.download(filePath, 'events.json');
    } catch (err) {
        res.status(500).json({ error: 'Error downloading events' });
    }
});
app.put('/events/:id', async (req, res) => {
    try {
        const { title, description, date } = req.body;
        const token = req.headers.token;
        const decoded = jwt.verify(token, SECRET);
        
        const updatedEvent = await Event.findOneAndUpdate(
            { _id: req.params.id, user: decoded.userId },
            { title, description, date },
            { new: true }
        );
        
        if (!updatedEvent) {
            return res.status(404).json({ error: 'Event not found' });
        }
        
        res.json(updatedEvent);
    } catch (err) {
        res.status(400).json({ error: 'Error updating event' });
    }
});
// Agregar esta nueva ruta después de las rutas existentes
app.delete('/events/deleteRepeating/:id', async (req, res) => {
    const { token } = req.headers;
    const { id } = req.params;
    
    try {
        const decoded = jwt.verify(token, SECRET);
        
        // Primero encontramos el evento original
        const originalEvent = await Event.findOne({ 
            _id: id, 
            user: decoded.userId 
        });

        if (!originalEvent) {
            return res.status(404).json({ error: 'Evento original no encontrado' });
        }

        // Encontramos y eliminamos todos los eventos relacionados
        const eventsToDelete = await Event.find({
            user: decoded.userId,
            date: {
                $gte: originalEvent.date // eventos desde la fecha del original
            },
            title: originalEvent.title.replace(' (ORIGINAL)', ''),
            repeat: originalEvent.repeat
        });

        // Eliminamos todos los eventos encontrados
        await Event.deleteMany({
            _id: { $in: eventsToDelete.map(e => e._id) }
        });

        res.json({ message: 'Eventos eliminados correctamente' });
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: 'Error eliminando eventos repetidos' });
    }
});
// Ruta para obtener información del usuario
app.get('/user', async (req, res) => {
    const { token } = req.headers;
    try {
        const decoded = jwt.verify(token, SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        res.json(user);
    } catch (err) {
        res.status(400).json({ error: 'Error fetching user data' });
    }
});

// Ruta para actualizar el nombre de usuario
app.put('/user/update', async (req, res) => {
    const { token } = req.headers;
    const { username } = req.body;
    try {
        const decoded = jwt.verify(token, SECRET);
        const user = await User.findByIdAndUpdate(
            decoded.userId,
            { username },
            { new: true }
        ).select('-password');
        res.json(user);
    } catch (err) {
        res.status(400).json({ error: 'Error updating user data' });
    }
});

// Modificar la ruta de login para incluir los datos del usuario
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jwt.sign({ userId: user._id }, SECRET, { expiresIn: '1h' });
        res.json({ 
            token,
            user: {
                username: user.username,
                email: user.email,
                id: user._id
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'Error logging in' });
    }
});


// Start server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
