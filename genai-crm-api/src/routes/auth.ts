import { Router, Request, Response } from 'express';
import { supabase, logger } from '../server';
import { body } from 'express-validator';
import { handleValidationErrors } from '../middleware/validation';
import { APIResponse } from '../types';

const router = Router();

// Sign up endpoint
router.post(
  '/signup',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('name').isString().isLength({ min: 1 }).withMessage('Name is required'),
    handleValidationErrors
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, name } = req.body;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role: 'user'
          }
        }
      });

      if (error) {
        logger.error('Signup error:', error);
        res.status(400).json({
          success: false,
          error: 'Signup failed',
          message: error.message,
          timestamp: new Date().toISOString()
        } as APIResponse);
        return;
      }

      res.status(201).json({
        success: true,
        data: {
          user: data.user,
          session: data.session
        },
        message: 'Account created successfully',
        timestamp: new Date().toISOString()
      } as APIResponse);
    } catch (error) {
      logger.error('Signup error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      } as APIResponse);
    }
  }
);

// Sign in endpoint
router.post(
  '/signin',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
    handleValidationErrors
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        logger.warn('Signin failed:', { email, error: error.message });
        res.status(401).json({
          success: false,
          error: 'Authentication failed',
          message: error.message,
          timestamp: new Date().toISOString()
        } as APIResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          user: data.user,
          session: data.session
        },
        message: 'Signed in successfully',
        timestamp: new Date().toISOString()
      } as APIResponse);
    } catch (error) {
      logger.error('Signin error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      } as APIResponse);
    }
  }
);

// Sign out endpoint
router.post('/signout', async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const { error } = await supabase.auth.admin.signOut(token);
      if (error) {
        logger.warn('Signout error:', error);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Signed out successfully',
      timestamp: new Date().toISOString()
    } as APIResponse);
  } catch (error) {
    logger.error('Signout error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    } as APIResponse);
  }
});

// Refresh token endpoint
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      res.status(400).json({
        success: false,
        error: 'Refresh token required',
        timestamp: new Date().toISOString()
      } as APIResponse);
      return;
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token
    });

    if (error) {
      logger.warn('Token refresh failed:', error);
      res.status(401).json({
        success: false,
        error: 'Token refresh failed',
        message: error.message,
        timestamp: new Date().toISOString()
      } as APIResponse);
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        session: data.session
      },
      message: 'Token refreshed successfully',
      timestamp: new Date().toISOString()
    } as APIResponse);
  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    } as APIResponse);
  }
});

export default router;