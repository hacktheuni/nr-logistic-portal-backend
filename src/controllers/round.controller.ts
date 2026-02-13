import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";
import { asyncHandler } from "@/utils/asyncHandler";
import * as roundService from "@/services/database/round.services";

/**
 * Get all accepted rounds (COMPLETED status)
 * GET /get-all-accepted-rounds
 */
const getAllAcceptedRounds = asyncHandler(async (_req, res) => {
    const rounds = await roundService.findAcceptedRounds();

    return res.status(200).json(
        new ApiResponse(
            200,
            { rounds, count: rounds.length },
            "Accepted rounds fetched successfully"
        )
    );
});

/**
 * Get round detail with manifests and assignments
 * GET /get-round-detail?roundId=xxx
 */
const getRoundDetail = asyncHandler(async (req, res) => {
    const { roundId } = req.query as { roundId: string };

    if (!roundId) {
        throw new ApiError(400, "roundId query parameter is required");
    }

    const round = await roundService.findRoundDetail(roundId);

    if (!round) {
        throw new ApiError(404, "Round not found");
    }

    return res.status(200).json(
        new ApiResponse(200, { round }, "Round detail fetched successfully")
    );
});

/**
 * Get all accepted rounds by specific date
 * GET /get-all-accepted-rounds/:date
 */
const getAllAcceptedRoundsByDate = asyncHandler(async (req, res) => {
    const { date } = req.params as { date: string };

    // Parse date and create start/end of day
    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
        throw new ApiError(400, "Invalid date format. Use YYYY-MM-DD");
    }

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const rounds = await roundService.findAcceptedRoundsByDate(startOfDay, endOfDay);

    return res.status(200).json(
        new ApiResponse(
            200,
            { rounds, count: rounds.length, date: targetDate.toISOString() },
            `Accepted rounds for ${date} fetched successfully`
        )
    );
});

export default {
    getAllAcceptedRounds,
    getRoundDetail,
    getAllAcceptedRoundsByDate,
};
