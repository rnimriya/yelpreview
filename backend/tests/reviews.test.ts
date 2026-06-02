import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../src/server';

const prisma = new PrismaClient();
let adminToken = '';

beforeAll(async () => {
  // Clean database before starting
  await prisma.review.deleteMany({});

  // Seed one admin token
  const response = await request(app)
    .post('/api/reviews/admin/login')
    .send({
      username: 'admin',
      password: 'admin123',
    });
  adminToken = response.body.token;
});

afterAll(async () => {
  // Disconnect prisma
  await prisma.$disconnect();
});

describe('Reviews API Integration Tests', () => {
  describe('POST /api/reviews', () => {
    it('should submit a review successfully and default to pending status', async () => {
      const response = await request(app)
        .post('/api/reviews')
        .send({
          reviewerName: 'John Doe',
          reviewerEmail: 'john@example.com',
          rating: 5,
          recommendationText: 'Great service and friendly staff!',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message');
      expect(response.body.review).toHaveProperty('id');
      expect(response.body.review.reviewerName).toBe('John Doe');
      expect(response.body.review.rating).toBe(5);

      // Verify in DB that it is pending
      const dbReview = await prisma.review.findUnique({
        where: { id: response.body.review.id },
      });
      expect(dbReview).toBeDefined();
      expect(dbReview?.status).toBe('pending');
    });

    it('should sanitize HTML tags from the fields to prevent XSS', async () => {
      const response = await request(app)
        .post('/api/reviews')
        .send({
          reviewerName: 'Jane <script>alert("hack")</script> Doe',
          reviewerEmail: 'jane@example.com',
          rating: 4,
          recommendationText: '<img src=x onerror=alert(1)> Awesome!',
        });

      expect(response.status).toBe(201);

      const dbReview = await prisma.review.findUnique({
        where: { id: response.body.review.id },
      });

      // The tags should be sanitized/stripped
      expect(dbReview?.reviewerName).not.toContain('<script>');
      expect(dbReview?.recommendationText).not.toContain('<img');
    });

    it('should fail if fields are missing or invalid', async () => {
      const response = await request(app)
        .post('/api/reviews')
        .send({
          reviewerName: 'John',
          rating: 10, // Invalid rating (>5)
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/reviews/approved', () => {
    it('should only return approved reviews', async () => {
      // Create an approved review
      const approvedReview = await prisma.review.create({
        data: {
          reviewerName: 'Approved User',
          reviewerEmail: 'approved@example.com',
          rating: 4,
          recommendationText: 'I am approved!',
          status: 'approved',
        },
      });

      // Create a pending review
      await prisma.review.create({
        data: {
          reviewerName: 'Pending User',
          reviewerEmail: 'pending@example.com',
          rating: 3,
          recommendationText: 'I am pending!',
          status: 'pending',
        },
      });

      const response = await request(app).get('/api/reviews/approved');
      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThanOrEqual(1);

      // Verify no pending or rejected reviews are returned
      const anyPending = response.body.some((r: any) => r.status !== 'approved');
      expect(anyPending).toBe(false);

      // Verify the approved review is in the response
      const found = response.body.some((r: any) => r.id === approvedReview.id);
      expect(found).toBe(true);
    });
  });

  describe('Admin Auth and Operations', () => {
    it('should block admin endpoints without a token', async () => {
      const responseAdmin = await request(app).get('/api/reviews/admin');
      expect(responseAdmin.status).toBe(401);

      const responsePatch = await request(app)
        .patch('/api/reviews/some-id/status')
        .send({ status: 'approved' });
      expect(responsePatch.status).toBe(401);
    });

    it('should allow fetching all reviews for admin with a valid token', async () => {
      const response = await request(app)
        .get('/api/reviews/admin')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
    });

    it('should update review status to approved/rejected and notify', async () => {
      // Create pending review to update
      const targetReview = await prisma.review.create({
        data: {
          reviewerName: 'Target Reviewer',
          reviewerEmail: 'target@example.com',
          rating: 4,
          recommendationText: 'Update me!',
          status: 'pending',
        },
      });

      const response = await request(app)
        .patch(`/api/reviews/${targetReview.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'approved' });

      expect(response.status).toBe(200);
      expect(response.body.review.status).toBe('approved');

      // Verify in DB
      const dbReview = await prisma.review.findUnique({
        where: { id: targetReview.id },
      });
      expect(dbReview?.status).toBe('approved');
    });
  });
});
