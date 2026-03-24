const express = require('express');
const cors = require('cors');

const roomTypeRoutes = require('./routes/roomTypeRoutes');

const app = express(); 

app.use(cors());
app.use(express.json());

app.use('/api/room-types', roomTypeRoutes);

module.exports = app;