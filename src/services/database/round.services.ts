import { prisma } from "@/db/prisma";

export const findAcceptedRounds = async () => {
    return await prisma.round.findMany({
        where: {
            status: 'COMPLETED'
        },
        select: {
            id: true,
            roundNumber: true,
            roundDate: true,
            deliveryUnitLocation: true,
            dropNumber: true,
            status: true,
            postCodes: true,
            _count: {
                select: {
                    manifests: true,
                    assignments: true
                }
            }
        },
        orderBy: {
            roundDate: 'desc'
        }
    });
};

export const findRoundDetail = async (roundId: string) => {
    return await prisma.round.findUnique({
        where: { id: roundId },
        include: {
            manifests: {
                select: {
                    id: true,
                    manifestNumber: true,
                    totalManifestItems: true,
                    totalDelivered: true,
                    totalCarryForward: true,
                }
            },
            assignments: {
                select: {
                    id: true,
                    assignedAt: true,
                    unassignedAt: true,
                    driver: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            rate: true,
                        }
                    }
                },
                orderBy: {
                    assignedAt: 'desc'
                }
            },
            earnings: {
                select: {
                    id: true,
                    totalDelivered: true,
                    totalAmount: true,
                    calculatedAt: true,
                    driver: {
                        select: {
                            id: true,
                            name: true,
                        }
                    }
                }
            }
        }
    });
};

export const findAcceptedRoundsByDate = async (startOfDay: Date, endOfDay: Date) => {
    return await prisma.round.findMany({
        where: {
            status: 'COMPLETED',
            roundDate: {
                gte: startOfDay,
                lte: endOfDay
            }
        },
        select: {
            id: true,
            roundNumber: true,
            roundDate: true,
            deliveryUnitLocation: true,
            dropNumber: true,
            status: true,
            postCodes: true,
            _count: {
                select: {
                    manifests: true,
                    assignments: true
                }
            }
        },
        orderBy: {
            roundNumber: 'asc'
        }
    });
};
