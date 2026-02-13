import { Router } from 'express';
import reviewController from '@/controllers/review.controller';

const reviewRouter = Router();

reviewRouter.get('/get-all-reviews', reviewController.getAllReviews)
reviewRouter.get('/get-review-detail/:reviewId', reviewController.getReviewDetail)
reviewRouter.get('/get-avg-rating', reviewController.getAvgRating)

export default reviewRouter;
