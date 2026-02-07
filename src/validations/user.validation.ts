import { z } from 'zod';

const Role = z.enum(['USER', 'ADMIN']);

export const createUserSchema = z.object({
    body: z.object({
        userId: z.string().min(1, 'User ID is required'),
        name: z.string().min(1, 'Name is required'),
        email: z.string().email('Invalid email address'),
        password: z.string().min(6, 'Password must be at least 6 characters'),
        role: Role.optional(),
        appEmail: z.string().email('Invalid App email address').optional().nullable(),
        appPassword: z.string().optional().nullable(),
        appCourierId: z.string().optional().nullable(),
    }),
});

export const updateUserSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid user ID'),
    }),
    body: z.object({
        userId: z.string().optional(),
        name: z.string().optional(),
        email: z.string().email('Invalid email address').optional(),
        password: z.string().min(6, 'Password must be at least 6 characters').optional(),
        role: Role.optional(),
        appEmail: z.string().email('Invalid App email address').optional().nullable(),
        appPassword: z.string().optional().nullable(),
        appCourierId: z.string().optional().nullable(),
        isActive: z.boolean().optional(),
    }),
});

export const getUserSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid user ID'),
    }),
});

export type CreateUserInput = z.infer<typeof createUserSchema>['body'];
export type UpdateUserInput = z.infer<typeof updateUserSchema>['body'];
