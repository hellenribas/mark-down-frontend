const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const connectDB = require('./config/db');
const documentRoutes = require('./routes/documentRoute');
const userRoutes = require('./routes/userRoute');
const protectedRoutes = require('./routes/protectedRoute');
const { handleSocket } = require('./utils/socketHandler');
const errorHandler = require('./middleware/errorHandler');
const cors = require('cors');
require('dotenv').config();

connectDB();

const app = express();
const allowedOrigins = 'https://mark-down-app-d86v.vercel.app'
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'Ocorreu um erro CORS';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }, 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type'],
  credentials: true,
}));

const io = new Server(http.createServer(app), {
  cors: {
     origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = 'Ocorreu um erro CORS';
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type'],
    credentials: true
  },
});

app.use(express.json());
app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, 
});
app.use(limiter);

app.use('/api/auth', userRoutes);
app.use('/api', protectedRoutes);
app.use('/api/documents', documentRoutes);

io.on('connection', (socket) => handleSocket(socket, io));

app.use(errorHandler);

// server.listen(4000, () => {
//   console.log('Servidor rodando na porta 4000');
// });

module.exports = (req, res) => {
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  app(req, res); 
};
