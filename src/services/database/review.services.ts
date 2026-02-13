import { prisma } from "@/db/prisma";

export const findReviewsPaginated = async (skip: number, limit: number) => {
    const [reviews, total] = await Promise.all([
        prisma.review.findMany({
            skip,
            take: limit,
            orderBy: {
                createdAt: 'desc'
            },
            select: {
                id: true,
                rating: true,
                comment: true,
                hasBadges: true,
                createdAt: true,
            }
        }),
        prisma.review.count()
    ]);
    return { reviews, total };
};

export const findReviewById = async (id: string) => {
    return await prisma.review.findUnique({
        where: { id },
        select: {
            id: true,
            rating: true,
            comment: true,
            hasBadges: true,
            createdAt: true,
        }
    });
};

export const getReviewAggregateData = async () => {
    const result = await prisma.review.aggregate({
        _avg: {
            rating: true
        },
        _count: {
            rating: true
        }
    });

    const ratingDistribution = await prisma.review.groupBy({
        by: ['rating'],
        _count: {
            rating: true
        },
        orderBy: {
            rating: 'desc'
        }
    });

    return { result, ratingDistribution };
};
