import { prisma } from "@/db/prisma";
import hermesAuthService from "@/services/hermesAuth.service";
import hermesDataService from "@/services/hermesData.service";
import { decrypt } from "@/utils/auth";

/**
 * Sync round data for all users with connected apps
 */
export const syncRoundData = async () => {
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

    console.log(`🚚 Found ${users.length} users with connected apps`);

    for (const user of users) {
        let syncLog;
        try {
            // Create sync log entry
            syncLog = await prisma.syncLog.create({
                data: {
                    userId: user.id,
                    syncType: "rounds",
                    status: "in_progress",
                },
            });

            // Authenticate user
            const decryptedPassword = decrypt(user.appPassword!);
            const accessToken = await hermesAuthService.authenticateUser(
                user.appCourierId!,
                decryptedPassword
            );

            // Fetch round data
            const rounds = await hermesDataService.fetchRounds(accessToken, {
                startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Last 30 days
                endDate: new Date().toISOString(),
            });

            console.log(`🚚 Fetched ${rounds.length} rounds for user ${user.id}`);

            // TODO: Transform and persist round data to database
            // This will depend on your actual API response structure
            // For now, we're just logging the count

            // Update sync log as successful
            await prisma.syncLog.update({
                where: { id: syncLog.id },
                data: {
                    status: "success",
                    recordCount: rounds.length,
                    completedAt: new Date(),
                },
            });

            console.log(`✅ Round sync completed for user ${user.id}`);
        } catch (error: any) {
            console.error(`❌ Round sync failed for user ${user.id}:`, error);

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
