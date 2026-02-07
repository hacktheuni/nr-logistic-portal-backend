import { prisma } from "@/db/prisma";
import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";
import { asyncHandler } from "@/utils/asyncHandler";
import { hashPassword } from "@/utils/auth";
import { createUserSchema, updateUserSchema } from "@/validations/user.validation";

const createUser = asyncHandler(async (req, res) => {
    const validation = createUserSchema.safeParse(req);
    if (!validation.success) {
        throw new ApiError(400, "Validation Error", [validation.error.format()]);
    }

    const { userId, name, email, password, role, appEmail, appPassword, appCourierId } = validation.data.body;

    const existingUser = await prisma.user.findFirst({
        where: {
            OR: [{ email }, { userId }]
        }
    });

    if (existingUser) {
        throw new ApiError(409, "User with this email or userId already exists");
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
        data: {
            userId,
            name,
            email,
            password: hashedPassword,
            role,
            appEmail,
            appPassword,
            appCourierId,
        },
        select: {
            id: true,
            userId: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            createdAt: true,
        }
    });

    return res.status(201).json(new ApiResponse(201, { user }, "User created successfully"));
});

const updateUser = asyncHandler(async (req, res) => {
    const validation = updateUserSchema.safeParse(req);
    if (!validation.success) {
        throw new ApiError(400, "Validation Error", [validation.error.format()]);
    }

    const { id } = validation.data.params;
    const updateData: any = { ...validation.data.body };

    if (updateData.password) {
        updateData.password = await hashPassword(updateData.password);
    }

    const user = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
            id: true,
            userId: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
        }
    });

    return res.status(200).json(new ApiResponse(200, { user }, "User updated successfully"));
});

const deactivateUser = asyncHandler(async (req, res) => {
    const { id } = req.params as { id: string };

    const user = await prisma.user.update({
        where: { id },
        data: { isActive: false },
        select: { id: true, isActive: true }
    });

    return res.status(200).json(new ApiResponse(200, { user }, "User deactivated successfully"));
});

const getUser = asyncHandler(async (req, res) => {
    const { id } = req.params as { id: string };

    const user = await prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            userId: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            createdAt: true,
            appEmail: true,
            appCourierId: true,
        }
    });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    return res.status(200).json(new ApiResponse(200, { user }, "User fetched successfully"));
});

const getAllUsers = asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({
        select: { id: true, userId: true, name: true, email: true, role: true, isActive: true }
    });

    return res.status(200).json(new ApiResponse(200, { users }, "Users fetched successfully"));
});

const getAllActiveUsers = asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({
        where: { isActive: true },
        select: { id: true, userId: true, name: true, email: true, role: true }
    });

    return res.status(200).json(new ApiResponse(200, { users }, "Active users fetched successfully"));
});

const getAllDeactiveUsers = asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({
        where: { isActive: false },
        select: { id: true, userId: true, name: true, email: true, role: true }
    });

    return res.status(200).json(new ApiResponse(200, { users }, "Deactivated users fetched successfully"));
});

export default {
    createUser,
    updateUser,
    deactivateUser,
    getUser,
    getAllUsers,
    getAllActiveUsers,
    getAllDeactiveUsers,
};
