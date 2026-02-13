import { prisma } from "@/db/prisma";

export const findManifestsByRoundId = async (roundId: string) => {
    return await prisma.manifest.findMany({
        where: { roundId },
        select: {
            id: true,
            manifestNumber: true,
            totalManifestItems: true,
            totalDelivered: true,
            totalCarryForward: true,
            round: {
                select: {
                    roundNumber: true,
                    roundDate: true,
                    status: true,
                }
            }
        },
        orderBy: {
            manifestNumber: 'asc'
        }
    });
};

export const findManifestDetail = async (manifestId: string) => {
    return await prisma.manifest.findUnique({
        where: { id: manifestId },
        include: {
            round: {
                select: {
                    roundNumber: true,
                    roundDate: true,
                    status: true,
                    deliveryUnitLocation: true,
                    postCodes: true,
                }
            },
            items: {
                select: {
                    id: true,
                    barcode: true,
                    type: true,
                    address: true,
                    status: true,
                    scannedAt: true,
                    driver: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        }
                    }
                },
                orderBy: {
                    scannedAt: 'desc'
                }
            }
        }
    });
};
