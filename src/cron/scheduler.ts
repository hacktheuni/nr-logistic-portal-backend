import * as cron from "node-cron";
import { syncDeliveryData } from "./jobs/syncDeliveryData.job";
import { syncRoundData } from "./jobs/syncRoundData.job";

let scheduledJobs: any[] = [];

/**
 * Initialize all cron jobs
 */
export const initializeCronJobs = () => {
    console.log("🕐 Initializing cron jobs...");

    // Sync delivery data every day at 2 AM
    const deliveryJob = cron.schedule("0 2 * * *", async () => {
        console.log("⏰ Running delivery data sync job...");
        try {
            await syncDeliveryData();
            console.log("✅ Delivery data sync completed");
        } catch (error) {
            console.error("❌ Delivery data sync failed:", error);
        }
    }, {
        timezone: "Europe/London" // Adjust to your timezone
    });

    // Sync round data every day at 3 AM
    const roundJob = cron.schedule("0 3 * * *", async () => {
        console.log("⏰ Running round data sync job...");
        try {
            await syncRoundData();
            console.log("✅ Round data sync completed");
        } catch (error) {
            console.error("❌ Round data sync failed:", error);
        }
    }, {
        timezone: "Europe/London" // Adjust to your timezone
    });

    scheduledJobs = [deliveryJob, roundJob];

    console.log("✅ Cron jobs initialized successfully");
    console.log("📅 Delivery sync: Daily at 2:00 AM");
    console.log("📅 Round sync: Daily at 3:00 AM");
};

/**
 * Stop all cron jobs gracefully
 */
export const stopCronJobs = () => {
    console.log("🛑 Stopping all cron jobs...");
    scheduledJobs.forEach(job => job.stop());
    console.log("✅ All cron jobs stopped");
};

/**
 * Manually trigger a specific job (useful for testing)
 */
export const triggerJob = async (jobName: "delivery" | "round") => {
    console.log(`🔧 Manually triggering ${jobName} sync job...`);

    try {
        if (jobName === "delivery") {
            await syncDeliveryData();
        } else if (jobName === "round") {
            await syncRoundData();
        }
        console.log(`✅ ${jobName} sync completed`);
    } catch (error) {
        console.error(`❌ ${jobName} sync failed:`, error);
        throw error;
    }
};
