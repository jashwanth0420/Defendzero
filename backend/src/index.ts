import * as dotenv from 'dotenv';
dotenv.config();
import { startAdherenceWorker } from './workers/adherence.worker';

let app: any;
try {
  app = require('./app').default;
} catch (err: any) {
  console.error('[DefendZero] Failed to load app:', err.message);
  // Create minimal app
  const express = require('express');
  const cors = require('cors');
  const helmet = require('helmet');
  app = express();
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.get('/health', (req: any, res: any) => {
    res.json({ success: true, status: 'DefendZero running (partial)', timestamp: new Date().toISOString() });
  });
}

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    if (process.env.NODE_ENV !== 'test') {
      startAdherenceWorker();
    }

    app.listen(PORT, () => {
      console.log(`[DefendZero] Server running on port ${PORT}`);
    });
  } catch (error: any) {
    console.error(`[DefendZero] Failed to start server:`, error.message);
    process.exit(1);
  }
};

startServer();
