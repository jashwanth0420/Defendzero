import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import v1Routes from './routes/v1';
import safetyCheckRouter from './routes/safety-check.routes';
import medicineSearchRouter from './routes/medicine-search.routes';
import { errorHandler } from './middlewares/error.middleware';

const app: Application = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Health Check Status
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ 
    success: true, 
    status: 'DefendZero App Framework is alive.', 
    timestamp: new Date().toISOString() 
  });
});

// Load aggregated v1 API routes
app.use('/api/v1', v1Routes);

// Public medicine safety endpoint
app.use('/api', safetyCheckRouter);

// Public medicine search endpoint for frontend autocomplete
app.use('/api/medicine', medicineSearchRouter);

// 404 Handler - Must be before error handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path,
    method: req.method,
    availableEndpoints: '/api/v1 (see documentation)'
  });
});

// Centralized error middleware - Must be last
app.use(errorHandler);

export default app;
