import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";
import { asyncHandler } from "@/utils/asyncHandler";
import * as reviewService from "@/services/database/review.services";

/**
 * Get all reviews with pagination
 * GET /get-all-reviews?page=1&limit=10
 */
const getAllReviews = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const { reviews, total } = await reviewService.findReviewsPaginated(skip, limit);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                reviews,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            },
            "Reviews fetched successfully"
        )
    );
});

/**
 * Get review detail by ID
 * GET /get-review-detail/:reviewId
 */
const getReviewDetail = asyncHandler(async (req, res) => {
    const { reviewId } = req.params as { reviewId: string };

    const review = await reviewService.findReviewById(reviewId);

    if (!review) {
        throw new ApiError(404, "Review not found");
    }

    return res.status(200).json(
        new ApiResponse(200, { review }, "Review detail fetched successfully")
    );
});

/**
 * Get average rating across all reviews
 * GET /get-avg-rating
 */
const getAvgRating = asyncHandler(async (_req, res) => {
    const { result, ratingDistribution } = await reviewService.getReviewAggregateData();

    const avgRating = result._avg.rating || 0;
    const totalReviews = result._count.rating || 0;

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                avgRating: parseFloat(avgRating.toFixed(2)),
                totalReviews,
                ratingDistribution: ratingDistribution.map(r => ({
                    rating: r.rating,
                    count: r._count.rating
                }))
            },
            "Average rating fetched successfully"
        )
    );
});

export default {
    getAllReviews,
    getReviewDetail,
    getAvgRating,
};
