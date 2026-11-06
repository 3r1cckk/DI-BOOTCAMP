import express from 'express';
import {
  approveLoan,
  initializeDatabase,
  loadDatabaseData,
  recordContribution,
  recordMpesaPayment,
  rejectLoan,
  saveLoan,
  saveMember,
} from './database.js';

export function createApiRouter(db) {
  const router = express.Router();
  router.use(express.json({ limit: '100kb' }));

  router.get('/health', (_request, response) => response.json({ connected: true, database: 'sqlite' }));
  router.get('/data', (_request, response) => response.json(loadDatabaseData(db)));

  router.post('/initialize', (request, response, next) => {
    try {
      const { members, loans, transactions } = request.body;
      if (![members, loans, transactions].every(Array.isArray)) {
        response.status(400).json({ error: 'Initial data must include members, loans, and transactions arrays.' });
        return;
      }
      response.json({ initialized: initializeDatabase(db, { members, loans, transactions }) });
    } catch (error) {
      next(error);
    }
  });

  router.post('/members', (request, response, next) => {
    try {
      saveMember(db, request.body);
      response.status(201).json({ saved: true });
    } catch (error) {
      next(error);
    }
  });

  router.post('/loans', (request, response, next) => {
    try {
      saveLoan(db, request.body);
      response.status(201).json({ saved: true });
    } catch (error) {
      next(error);
    }
  });

  router.post('/transactions/contribution', (request, response, next) => {
    try {
      recordContribution(db, request.body);
      response.status(201).json({ saved: true });
    } catch (error) {
      next(error);
    }
  });

  router.post('/transactions/mpesa', (request, response, next) => {
    try {
      recordMpesaPayment(db, request.body);
      response.status(201).json({ saved: true });
    } catch (error) {
      next(error);
    }
  });

  router.post('/loans/:id/approve', (request, response, next) => {
    try {
      approveLoan(db, request.params.id, request.body);
      response.json({ saved: true });
    } catch (error) {
      next(error);
    }
  });

  router.post('/loans/:id/reject', (request, response, next) => {
    try {
      rejectLoan(db, request.params.id);
      response.json({ saved: true });
    } catch (error) {
      next(error);
    }
  });

  router.use((error, _request, response, _next) => {
    console.error('SQLite API request failed:', error);
    const message = error instanceof Error ? error.message : 'Database request failed.';
    response.status(message.includes('constraint') ? 409 : 500).json({ error: message });
  });

  return router;
}
