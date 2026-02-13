import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";
import { asyncHandler } from "@/utils/asyncHandler";
import * as driverService from "@/services/database/driver.services";

/**
 * Create a new driver
 * POST /create-driver
 */
const createDriver = asyncHandler(async (req, res) => {
    const { name, email, appDriverID, rate } = req.body;

    // Validate required fields
    if (!name || !email || !rate) {
        throw new ApiError(400, "Name, email, and rate are required");
    }

    // Check if driver already exists
    const existingDriver = await driverService.findDriverByEmailOrAppId(email, appDriverID);

    if (existingDriver) {
        throw new ApiError(409, "Driver with this email or app driver ID already exists");
    }

    const driver = await driverService.createDriver({
        name,
        email,
        appDriverID: appDriverID || null,
        rate: parseFloat(rate),
    });

    return res.status(201).json(
        new ApiResponse(201, { driver }, "Driver created successfully")
    );
});

/**
 * Update an existing driver
 * PUT /update-driver/:id
 */
const updateDriver = asyncHandler(async (req, res) => {
    const { id } = req.params as { id: string };
    const { name, email, appDriverID, rate } = req.body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (appDriverID !== undefined) updateData.appDriverID = appDriverID || null;
    if (rate) updateData.rate = parseFloat(rate);

    if (Object.keys(updateData).length === 0) {
        throw new ApiError(400, "At least one field must be provided for update");
    }

    const driver = await driverService.updateDriver(id, updateData);

    return res.status(200).json(
        new ApiResponse(200, { driver }, "Driver updated successfully")
    );
});

/**
 * Delete a driver
 * DELETE /deactivate-driver/:id
 */
const deactivateDriver = asyncHandler(async (req, res) => {
    const { id } = req.params as { id: string };

    // Check if driver has any assignments or manifest items
    const driver = await driverService.findDriverById(id, true);

    if (!driver) {
        throw new ApiError(404, "Driver not found");
    }

    // If driver has related records, you might want to prevent deletion
    // or handle it differently based on your business logic
    const counts = (driver as any)._count;
    if (counts.assignments > 0 || counts.manifestItems > 0) {
        throw new ApiError(400, "Cannot delete driver with existing assignments or manifest items");
    }

    await driverService.deleteDriver(id);

    return res.status(200).json(
        new ApiResponse(200, { driver: { id: driver.id, name: driver.name } }, "Driver deleted successfully")
    );
});

/**
 * Get a single driver by ID
 * GET /get-driver/:id
 */
const getDriver = asyncHandler(async (req, res) => {
    const { id } = req.params as { id: string };

    const driver = await driverService.findDriverById(id, true);

    if (!driver) {
        throw new ApiError(404, "Driver not found");
    }

    return res.status(200).json(
        new ApiResponse(200, { driver }, "Driver fetched successfully")
    );
});

/**
 * Get all drivers
 * GET /get-all-drivers
 */
const getAllDrivers = asyncHandler(async (_req, res) => {
    const drivers = await driverService.findAllDrivers();

    return res.status(200).json(
        new ApiResponse(200, { drivers, count: drivers.length }, "Drivers fetched successfully")
    );
});

export default {
    createDriver,
    updateDriver,
    deactivateDriver,
    getDriver,
    getAllDrivers,
};
