import { Request, Response, NextFunction } from 'express';
import { ApiError } from '@/utils/ApiError';
import { verifyAccessToken } from '@/utils/auth';
import { asyncHandler } from '@/utils/asyncHandler';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
    };
}

export const verifyJWT = asyncHandler(async (req: AuthRequest, _res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
        throw new ApiError(401, 'Unauthorized: No token provided');
    }

    try {
        const decoded = verifyAccessToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        throw new ApiError(401, 'Unauthorized: Invalid or expired token');
    }
});

export const authorizeRoles = (...roles: string[]) => {
    return (req: AuthRequest, _res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            throw new ApiError(403, 'Forbidden: You do not have permission to perform this action');
        }
        next();
    };
};
