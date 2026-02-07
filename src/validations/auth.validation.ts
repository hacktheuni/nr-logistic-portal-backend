import { z } from 'zod';

export const loginSchema = z.object({
    body: z.object({
        identifier: z.string().min(1, 'Email or User ID is required'),
        password: z.string().min(1, 'Password is required'),
    }),
});

export const refreshTokenSchema = z.object({
    body: z.object({
        refreshToken: z.string().min(1, 'Refresh token is required'),
    }),
});

export const connectAppSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid App email address'),
        password: z.string().min(1, 'App password is required'),
    }),
});

export type LoginInput = z.infer<typeof loginSchema>['body'];
export type ConnectAppInput = z.infer<typeof connectAppSchema>['body'];
