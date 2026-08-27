import './config/env';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRouter from './routes/auth.routes';
import noteRouter from './routes/note.routes';
import { errorHandler } from './middleware/error.middleware';
import { requestLogger } from './middleware/logging.middleware';

const app = express();

// Middlewares
app.use(requestLogger);
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRouter);
app.use('/api/notes', noteRouter);

app.use(errorHandler);

export default app;

