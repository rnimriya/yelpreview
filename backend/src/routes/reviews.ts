import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticateAdmin, AdminRequest } from '../middleware/auth';
import { sanitizeReviewInput } from '../middleware/sanitize';
import { reviewSubmitLimiter } from '../middleware/rateLimiter';

const router = Router();
const prisma = new PrismaClient();

// -------------------------------------------------------------
// PUBLIC ENDPOINTS
// -------------------------------------------------------------

// POST /api/reviews: Submit a new review
// Defaults 'status' to 'pending'
router.post(
  '/',
  reviewSubmitLimiter,
  sanitizeReviewInput,
  async (req: Request, res: Response) => {
    const { reviewerName, reviewerEmail, rating, recommendationText } = req.body;

    if (!reviewerName || !reviewerEmail || !rating || !recommendationText) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    try {
      const review = await prisma.review.create({
        data: {
          reviewerName,
          reviewerEmail,
          rating,
          recommendationText,
          status: 'pending', // Explicit default
        },
      });

      return res.status(201).json({
        message: 'Thank you, your review is pending moderation.',
        review: {
          id: review.id,
          reviewerName: review.reviewerName,
          rating: review.rating,
          createdAt: review.createdAt,
        },
      });
    } catch (error) {
      console.error('Error creating review:', error);
      return res.status(500).json({ error: 'Failed to submit review due to a server error.' });
    }
  }
);

// GET /api/reviews/approved: Fetch only approved reviews
router.get('/approved', async (req: Request, res: Response) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { status: 'approved' },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(reviews);
  } catch (error) {
    console.error('Error fetching approved reviews:', error);
    return res.status(500).json({ error: 'Failed to fetch reviews.' });
  }
});

// -------------------------------------------------------------
// ADMIN AUTHENTICATION
// -------------------------------------------------------------

// POST /api/admin/login: Authenticate admin and return JWT
router.post('/admin/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  // Get the configured credentials
  const expectedUsername = 'admin';
  const expectedPasswordHash = process.env.ADMIN_PASSWORD_HASH;

  if (!expectedPasswordHash) {
    console.error('ADMIN_PASSWORD_HASH environment variable is not configured.');
    return res.status(500).json({ error: 'Server authentication misconfigured.' });
  }

  if (username !== expectedUsername) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  try {
    const isPasswordValid = await bcrypt.compare(password, expectedPasswordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { username },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    return res.json({ token, username });
  } catch (error) {
    console.error('Error during admin login:', error);
    return res.status(500).json({ error: 'Login process failed.' });
  }
});

// -------------------------------------------------------------
// PROTECTED ADMIN ENDPOINTS
// -------------------------------------------------------------

// GET /api/reviews/admin: Fetch all reviews, optionally filtered by status
router.get('/admin', authenticateAdmin, async (req: AdminRequest, res: Response) => {
  const { status } = req.query;

  try {
    const queryConditions: any = {};
    if (status && ['pending', 'approved', 'rejected'].includes(status as string)) {
      queryConditions.status = status as string;
    }

    const reviews = await prisma.review.findMany({
      where: queryConditions,
      orderBy: { createdAt: 'desc' },
    });

    return res.json(reviews);
  } catch (error) {
    console.error('Error fetching admin reviews:', error);
    return res.status(500).json({ error: 'Failed to fetch reviews database.' });
  }
});

// PATCH /api/reviews/:id/status: Update review status to 'approved' or 'rejected'
router.patch('/:id/status', authenticateAdmin, async (req: AdminRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status. Must be "approved" or "rejected".' });
  }

  try {
    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      return res.status(404).json({ error: 'Review not found.' });
    }

    const updatedReview = await prisma.review.update({
      where: { id },
      data: { status },
    });

    return res.json({
      message: `Review status updated to ${status}.`,
      review: updatedReview,
    });
  } catch (error) {
    console.error('Error updating review status:', error);
    return res.status(500).json({ error: 'Failed to update review status.' });
  }
});

export default router;
