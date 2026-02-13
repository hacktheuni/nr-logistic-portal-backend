import { prisma } from "@/db/prisma";
import hermesAuthService from "@/services/hermesAuth.service";
import hermesDataService from "@/services/hermesData.service";
import { decrypt } from "@/utils/auth";

/**
 * Sync delivery data for all users with connected apps
 */
export const syncDeliveryData = async () => {
    const syncStartTime = new Date();

    // Get all users with connected apps
    const users = await prisma.user.findMany({
        where: {
            appEmail: { not: null },
            appPassword: { not: null },
            appCourierId: { not: null },
        },
        select: {
            id: true,
            appEmail: true,
            appPassword: true,
            appCourierId: true,
        },
    });

    console.log(`📦 Found ${users.length} users with connected apps`);

    for (const user of users) {
        let syncLog;
        try {
            // Create sync log entry
            syncLog = await prisma.syncLog.create({
                data: {
                    userId: user.id,
                    syncType: "deliveries",
                    status: "in_progress",
                },
            });

            // Authenticate user
            const decryptedPassword = decrypt(user.appPassword!);
            const accessToken = await hermesAuthService.authenticateUser(
                user.appCourierId!,
                decryptedPassword
            );

            // Fetch delivery data
            const deliveries = await hermesDataService.fetchDeliveries(accessToken, {
                startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Last 7 days
                endDate: new Date().toISOString(),
            });

            console.log(`📦 Fetched ${deliveries.length} deliveries for user ${user.id}`);

            // TODO: Transform and persist delivery data to database
            // This will depend on your actual API response structure
            // For now, we're just logging the count

            // Update sync log as successful
            await prisma.syncLog.update({
                where: { id: syncLog.id },
                data: {
                    status: "success",
                    recordCount: deliveries.length,
                    completedAt: new Date(),
                },
            });

            console.log(`✅ Delivery sync completed for user ${user.id}`);
        } catch (error: any) {
            console.error(`❌ Delivery sync failed for user ${user.id}:`, error);

            // Update sync log as failed
            if (syncLog) {
                await prisma.syncLog.update({
                    where: { id: syncLog.id },
                    data: {
                        status: "failed",
                        errorMessage: error.message || "Unknown error",
                        completedAt: new Date(),
                    },
                });
            }
        }
    }

    const syncEndTime = new Date();
    const duration = (syncEndTime.getTime() - syncStartTime.getTime()) / 1000;
    console.log(`⏱️  Total sync duration: ${duration}s`);
};
