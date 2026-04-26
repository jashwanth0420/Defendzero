import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { config } from '../config/env.config';

interface CustomErrorResponse {
  success: boolean;
  message: string;
  errors?: any;
  stack?: string;
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let response: CustomErrorResponse = {
    success: false,
    message: err.message || 'Internal Server Error',
  };

  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    statusCode = 400;
    response.message = 'Validation Failed';
    response.errors = err.issues.map(issue => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
  }
  // Handle Authentication Errors
  else if (err.name === 'UnauthorizedError' || err.message.includes('Unauthorized')) {
    statusCode = 401;
  }
  // Handle JWT Errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    response.message = 'Invalid or malformed token';
  }
  else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    response.message = 'Token has expired';
  }
  // Handle Prisma Unique Constraint Violations
  else if (err.message.includes('Unique constraint failed')) {
    statusCode = 409;
    response.message = 'Resource already exists';
  }
  // Handle Prisma Record Not Found
  else if (err.message.includes('Record to delete does not exist')) {
    statusCode = 404;
    response.message = 'Resource not found';
  }
  // Handle Database Connection Errors
  else if (err.message.includes('connection') || err.message.includes('ECONNREFUSED')) {
    statusCode = 503;
    response.message = 'Database connection error - Service unavailable';
  }

  // Hide stack trace in production
  if (config.NODE_ENV !== 'production' && !(err instanceof ZodError)) {
    response.stack = err.stack;
  }

  // Log errors appropriately
  if (statusCode >= 500) {
    console.error(`[${statusCode} ERROR] ${err.message}`, {
      path: req.path,
      method: req.method,
      stack: err.stack
    });
  } else if (statusCode >= 400) {
    console.warn(`[${statusCode} WARNING] ${err.message}`, {
      path: req.path,
      method: req.method
    });
  }

  res.status(statusCode).json(response);
};
