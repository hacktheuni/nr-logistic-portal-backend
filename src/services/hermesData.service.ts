import { createHermesClient } from "@/lib/axios/appClient";
import { ApiError } from "@/utils/ApiError";

const hermesClient = createHermesClient();

/**
 * Fetch delivery data from Hermes API
 * This will be called by cron jobs with a valid access token
 */
export const fetchDeliveries = async (accessToken: string, params?: {
    startDate?: string;
    endDate?: string;
    status?: string;
}): Promise<any[]> => {
    try {
        const response = await hermesClient.get("/delivery-api/v1/deliveries", {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
            params: params || {},
        });

        return response.data.deliveries || response.data || [];
    } catch (error: any) {
        throw new ApiError(
            error.response?.status || 500,
            "Failed to fetch deliveries from Hermes API",
            [error.response?.data || error.message]
        );
    }
};

/**
 * Fetch round/route data from Hermes API
 * This will be called by cron jobs with a valid access token
 */
export const fetchRounds = async (accessToken: string, params?: {
    startDate?: string;
    endDate?: string;
}): Promise<any[]> => {
    try {
        const response = await hermesClient.get("/round-api/v1/rounds", {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
            params: params || {},
        });

        return response.data.rounds || response.data || [];
    } catch (error: any) {
        throw new ApiError(
            error.response?.status || 500,
            "Failed to fetch rounds from Hermes API",
            [error.response?.data || error.message]
        );
    }
};

/**
 * Fetch delivery details by ID
 */
export const fetchDeliveryById = async (accessToken: string, deliveryId: string): Promise<any> => {
    try {
        const response = await hermesClient.get(`/delivery-api/v1/deliveries/${deliveryId}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        return response.data;
    } catch (error: any) {
        throw new ApiError(
            error.response?.status || 500,
            "Failed to fetch delivery details from Hermes API",
            [error.response?.data || error.message]
        );
    }
};

export default {
    fetchDeliveries,
    fetchRounds,
    fetchDeliveryById,
};
