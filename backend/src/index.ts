import express from 'express';
import cors from 'cors';
import eventsRouter from './routes/events.js';

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration for production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [/\.onrender\.com$/, /localhost/]
    : '*',
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

app.use('/api/events', eventsRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
