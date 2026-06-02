import { Request, Response, NextFunction } from 'express';
import xss from 'xss';

export const sanitizeReviewInput = (req: Request, res: Response, next: NextFunction) => {
  if (req.body) {
    if (typeof req.body.reviewerName === 'string') {
      req.body.reviewerName = xss(req.body.reviewerName.trim(), { whiteList: {} });
    }
    if (typeof req.body.reviewerEmail === 'string') {
      req.body.reviewerEmail = xss(req.body.reviewerEmail.trim(), { whiteList: {} });
    }
    if (typeof req.body.recommendationText === 'string') {
      req.body.recommendationText = xss(req.body.recommendationText.trim(), { whiteList: {} });
    }
    if (req.body.rating !== undefined) {
      const ratingVal = parseInt(req.body.rating, 10);
      if (isNaN(ratingVal) || ratingVal < 1 || ratingVal > 5) {
        return res.status(400).json({ error: 'Rating must be an integer between 1 and 5.' });
      }
      req.body.rating = ratingVal;
    }
  }
  next();
};
