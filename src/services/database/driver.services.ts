import { prisma } from "@/db/prisma";

export const findDriverByEmailOrAppId = async (email: string, appDriverID?: string) => {
    return await prisma.driver.findFirst({
        where: {
            OR: [
                { email },
                ...(appDriverID ? [{ appDriverID }] : [])
            ]
        }
    });
};

export const createDriver = async (data: { name: string; email: string; appDriverID?: string | null; rate: number }) => {
    return await prisma.driver.create({
        data,
        select: {
            id: true,
            name: true,
            email: true,
            appDriverID: true,
            rate: true,
        }
    });
};

export const updateDriver = async (id: string, data: any) => {
    return await prisma.driver.update({
        where: { id },
        data,
        select: {
            id: true,
            name: true,
            email: true,
            appDriverID: true,
            rate: true,
        }
    });
};

export const findDriverById = async (id: string, includeCounts: boolean = false) => {
    return await prisma.driver.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            email: true,
            appDriverID: true,
            rate: true,
            ...(includeCounts ? {
                _count: {
                    select: {
                        assignments: true,
                        manifestItems: true,
                        earnings: true,
                    }
                }
            } : {})
        }
    });
};

export const deleteDriver = async (id: string) => {
    return await prisma.driver.delete({
        where: { id }
    });
};

export const findAllDrivers = async () => {
    return await prisma.driver.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            appDriverID: true,
            rate: true,
            _count: {
                select: {
                    assignments: true,
                    manifestItems: true,
                }
            }
        },
        orderBy: {
            name: 'asc'
        }
    });
};
