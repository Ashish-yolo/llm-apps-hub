import { Request, Response, NextFunction } from 'express';
import { body, validationResult, ValidationChain } from 'express-validator';
import { logger } from '../server';

export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    logger.warn('Validation errors:', errors.array());
    res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(error => ({
        field: error.type === 'field' ? error.path : 'unknown',
        message: error.msg,
        value: error.type === 'field' ? error.value : undefined
      }))
    });
    return;
  }
  
  next();
};

// Common validation rules
export const validateAIQuery = [
  body('query')
    .isString()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Query must be a string between 1 and 1000 characters'),
  body('context')
    .optional()
    .isObject()
    .withMessage('Context must be an object'),
  body('customer_id')
    .optional()
    .isUUID()
    .withMessage('Customer ID must be a valid UUID'),
  handleValidationErrors
];

export const validateCustomerCreate = [
  body('name')
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be a string between 1 and 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Valid phone number is required'),
  body('company')
    .optional()
    .isString()
    .isLength({ max: 100 })
    .withMessage('Company name must not exceed 100 characters'),
  handleValidationErrors
];

export const validateInteractionCreate = [
  body('customer_id')
    .isUUID()
    .withMessage('Customer ID must be a valid UUID'),
  body('type')
    .isIn(['email', 'phone', 'chat', 'meeting', 'other'])
    .withMessage('Type must be one of: email, phone, chat, meeting, other'),
  body('content')
    .isString()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Content must be a string between 1 and 5000 characters'),
  body('sentiment')
    .optional()
    .isIn(['positive', 'neutral', 'negative'])
    .withMessage('Sentiment must be one of: positive, neutral, negative'),
  handleValidationErrors
];

export const validateAnalyticsQuery = [
  body('start_date')
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  body('end_date')
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
  body('metrics')
    .optional()
    .isArray()
    .withMessage('Metrics must be an array'),
  body('filters')
    .optional()
    .isObject()
    .withMessage('Filters must be an object'),
  handleValidationErrors
];

// PII detection middleware
export const detectAndRedactPII = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!process.env.PII_DETECTION_ENABLED || process.env.PII_DETECTION_ENABLED !== 'true') {
    next();
    return;
  }

  // Simple PII detection patterns
  const piiPatterns = [
    { pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, replacement: '[CARD_NUMBER]' },
    { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: '[SSN]' },
    { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: '[EMAIL]' }
  ];

  const redactText = (text: string): string => {
    let redacted = text;
    piiPatterns.forEach(({ pattern, replacement }) => {
      redacted = redacted.replace(pattern, replacement);
    });
    return redacted;
  };

  // Redact PII from request body
  if (req.body && typeof req.body === 'object') {
    const redactObject = (obj: any): any => {
      if (typeof obj === 'string') {
        return redactText(obj);
      } else if (Array.isArray(obj)) {
        return obj.map(redactObject);
      } else if (obj && typeof obj === 'object') {
        const redacted: any = {};
        for (const [key, value] of Object.entries(obj)) {
          redacted[key] = redactObject(value);
        }
        return redacted;
      }
      return obj;
    };

    req.body = redactObject(req.body);
  }

  next();
};