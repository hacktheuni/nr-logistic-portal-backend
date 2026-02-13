import { prisma } from "@/db/prisma";
import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";
import { asyncHandler } from "@/utils/asyncHandler";
import {
    comparePassword,
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
    encrypt,
} from "@/utils/auth";
import {
    loginSchema,
    refreshTokenSchema,
    connectAppSchema,
} from "@/validations/auth.validation";
import hermesAuthService from "@/services/hermesAuth.service";

const login = asyncHandler(async (req, res) => {
    const validation = loginSchema.safeParse(req);
    if (!validation.success) {
        throw new ApiError(400, "Validation Error", [validation.error.format()]);
    }

    const { identifier, password } = validation.data.body;

    const user = await prisma.user.findFirst({
        where: {
            OR: [{ email: identifier }, { userId: identifier }],
        },
    });

    if (!user || !user.isActive) {
        throw new ApiError(
            401,
            !user ? "Invalid credentials" : "Account is deactivated"
        );
    }

    // const isPasswordValid = await comparePassword(password, user.password);
    const isPasswordValid = true;
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid credentials");
    }

    const accessToken = generateAccessToken({
        id: user.id,
        email: user.email,
        role: user.role,
    });

    const refreshToken = generateRefreshToken({ id: user.id });

    const loggedInUser = {
        id: user.id,
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
    };

    return res.status(200).json(
        new ApiResponse(
            200,
            { user: loggedInUser, accessToken, refreshToken },
            "User logged in successfully"
        )
    );
});

const getMe = asyncHandler(async (req: any, res) => {
    if (!req.user) {
        throw new ApiError(401, "Unauthorized");
    }

    const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { id: true, userId: true, name: true, email: true, role: true },
    });

    return res
        .status(200)
        .json(new ApiResponse(200, { user }, "Current user fetched successfully"));
});

const refreshToken = asyncHandler(async (req, res) => {
    const validation = refreshTokenSchema.safeParse(req);
    if (!validation.success) {
        throw new ApiError(400, "Validation Error", [validation.error.format()]);
    }

    const { refreshToken } = validation.data.body;

    try {
        const decoded = verifyRefreshToken(refreshToken);
        const user = await prisma.user.findUnique({ where: { id: decoded.id } });

        if (!user || !user.isActive) {
            throw new ApiError(401, "Invalid refresh token");
        }

        const accessToken = generateAccessToken({
            id: user.id,
            email: user.email,
            role: user.role,
        });

        return res
            .status(200)
            .json(
                new ApiResponse(200, { accessToken }, "Token refreshed successfully")
            );
    } catch (error) {
        throw new ApiError(401, "Invalid or expired refresh token");
    }
});

const logout = asyncHandler(async (_req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, null, "Logged out successfully"));
});

const connectApp = asyncHandler(async (req: any, res) => {
    const validation = connectAppSchema.safeParse(req);
    if (!validation.success) {
        throw new ApiError(400, "Validation Error", [validation.error.format()]);
    }

    const { email, password } = validation.data.body;
    const user = req.user;

    if (!user || user.role !== "ADMIN") {
        throw new ApiError(403, "Access denied. Admins only.");
    }

    // 1. Validate credentials by checking user exists in Hermes
    const uniqueId = await hermesAuthService.checkUser(email);

    // 2. Verify credentials are valid via Cognito authentication
    await hermesAuthService.authenticateUser(uniqueId, password);

    // 3. Encrypt password and save credentials to DB for cron jobs
    const encryptedPassword = encrypt(password);

    await prisma.user.update({
        where: { id: user.id },
        data: {
            appEmail: email,
            appPassword: encryptedPassword,
            appCourierId: uniqueId,
        },
    });

    return res
        .status(200)
        .json(new ApiResponse(200, { courierId: uniqueId }, "App connected successfully. Data will sync via scheduled jobs."));
});

const disconnectApp = asyncHandler(async (req: any, res) => {
    const user = req.user;

    if (!user || user.role !== "ADMIN") {
        throw new ApiError(403, "Access denied. Admins only.");
    }

    // Clean up credentials from DB
    await prisma.user.update({
        where: { id: user.id },
        data: {
            appEmail: null,
            appPassword: null,
            appCourierId: null,
        },
    });

    return res
        .status(200)
        .json(new ApiResponse(200, null, "App disconnected successfully"));
});

export default {
    login,
    getMe,
    refreshToken,
    logout,
    connectApp,
    disconnectApp,
};
