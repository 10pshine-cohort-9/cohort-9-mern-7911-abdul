import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRouter from './routes/auth.routes';
import { errorHandler } from './middleware/error.middleware';
import { requestLogger } from './middleware/logging.middleware';

const app = express();

// Middlewares
app.use(requestLogger);
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRouter);

app.use(errorHandler);

export default app;

