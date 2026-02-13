import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";
import { asyncHandler } from "@/utils/asyncHandler";
import * as manifestService from "@/services/database/manifest.services";

/**
 * Get all manifests by round ID
 * GET /get-all-manifests/:roundId
 */
const getAllManifestsByRoundId = asyncHandler(async (req, res) => {
    const { roundId } = req.params as { roundId: string };

    const manifests = await manifestService.findManifestsByRoundId(roundId);

    return res.status(200).json(
        new ApiResponse(200, { manifests, count: manifests.length }, "Manifests fetched successfully")
    );
});

/**
 * Get manifest detail with all items
 * GET /get-manifest-detail/:manifestId
 */
const getManifestDetail = asyncHandler(async (req, res) => {
    const { manifestId } = req.params as { manifestId: string };

    const manifest = await manifestService.findManifestDetail(manifestId);

    if (!manifest) {
        throw new ApiError(404, "Manifest not found");
    }

    return res.status(200).json(
        new ApiResponse(200, { manifest }, "Manifest detail fetched successfully")
    );
});

export default {
    getAllManifestsByRoundId,
    getManifestDetail,
};
