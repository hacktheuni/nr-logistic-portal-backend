import { prisma } from "@/db/prisma";

export const findAdminByIdentifier = async (identifier: string) => {
    return await prisma.admin.findFirst({
        where: {
            email: identifier,
        },
    });
};

export const findAdminById = async (id: string, selectFields?: any) => {
    return await prisma.admin.findUnique({
        where: { id },
        select: selectFields || { id: true, name: true, email: true, appCourierId: true },
    });
};

export const updateAdminAppCredentials = async (id: string, data: { appEmail: string; appPassword: string; appCourierId: string }) => {
    return await prisma.admin.update({
        where: { id },
        data,
    });
};
