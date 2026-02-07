import axios from "axios";
import {
    CognitoUserPool,
    CognitoUser,
    AuthenticationDetails,
} from "amazon-cognito-identity-js";
import { createHermesClient, createCognitoClient } from "@/lib/axios/appClient";
import { config } from "@/config/env";
import { ApiError } from "@/utils/ApiError";

import { prisma } from "@/db/prisma";
import { decrypt } from "@/utils/auth";
import redis from "@/lib/redis/redisClient";

const hermesClient = createHermesClient();

/**
 * Define a fetch polyfill to inject exact headers into Cognito library requests
 */
const injectCognitoHeaders = () => {
    // @ts-ignore
    global.fetch = async (url: string, options: any) => {
        if (url.includes("cognito-idp")) {
            const headers = {
                ...options.headers,
                'authority': 'cognito-idp.eu-west-1.amazonaws.com',
                'accept': '*/*',
                'accept-language': 'en-US,en;q=0.9',
                'origin': 'https://localhost',
                'referer': 'https://localhost/',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'cross-site',
                'user-agent': 'Mozilla/5.0 (Linux; Android 14; sdk_gphone64_x86_64 Build/UE1A.230829.050; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/113.0.5672.136 Mobile Safari/537.36',
                'x-amz-user-agent': 'aws-amplify/5.0.4 js',
                'x-requested-with': 'com.hermescourier.app',
            };

            // Merge with existing headers (like X-Amz-Target)
            options.headers = headers;
        }

        try {
            const axiosConfig = {
                method: options.method,
                url: url,
                data: options.body ? JSON.parse(options.body) : undefined,
                headers: options.headers,
            };

            const response = await axios(axiosConfig);

            return {
                ok: response.status >= 200 && response.status < 300,
                status: response.status,
                json: async () => response.data,
                headers: {
                    get: (name: string) => response.headers[name.toLowerCase()],
                },
            };
        } catch (error: any) {
            if (error.response) {
                return {
                    ok: false,
                    status: error.response.status,
                    json: async () => error.response.data,
                    headers: {
                        get: (name: string) => error.response.headers[name.toLowerCase()],
                    },
                };
            }
            throw error;
        }
    };
};

// Initialize the fetch polyfill
injectCognitoHeaders();

/**
 * Get uniqueId (courierId) from Hermes API
 */
const checkUser = async (email: string): Promise<string> => {
    try {
        const response = await hermesClient.post("/auth-api/v1/user", {
            signUpSource: "ANDROID",
            email: email,
            courierId: "",
            isOnboarding: true,
        });

        const uniqueId = response.data.uniqueId || response.data.id;
        if (!uniqueId) {
            throw new Error("UniqueId not found in Hermes response");
        }
        return uniqueId;
    } catch (error: any) {
        throw new ApiError(
            error.response?.status || 500,
            "Failed to verify account with Hermes API",
            [error.response?.data || error.message]
        );
    }
};

/**
 * Get User Data from Cognito using AccessToken (Step 3 in pattern)
 */
const getUserData = async (accessToken: string): Promise<any> => {
    const cognitoClient = createCognitoClient("GetUser");
    try {
        const response = await cognitoClient.post("/", {
            AccessToken: accessToken,
        });
        return response.data;
    } catch (error: any) {
        throw new ApiError(
            error.response?.status || 401,
            "Failed to fetch user data from Cognito",
            [error.response?.data || error.message]
        );
    }
};

/**
 * Authenticate with AWS Cognito SRP
 */
const authenticateWithCognito = async (uniqueId: string, password: string): Promise<any> => {
    if (!config.cognitoUserPoolId || !config.cognitoClientId) {
        return null;
    }

    const poolData = {
        UserPoolId: config.cognitoUserPoolId,
        ClientId: config.cognitoClientId,
    };
    const userPool = new CognitoUserPool(poolData);

    const authenticationData = {
        Username: uniqueId,
        Password: password,
    };
    const authenticationDetails = new AuthenticationDetails(authenticationData);

    const cognitoUserData = {
        Username: uniqueId,
        Pool: userPool,
    };
    const cognitoUser = new CognitoUser(cognitoUserData);

    const authResult: any = await new Promise((resolve, reject) => {
        cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: (result) => resolve(result),
            onFailure: (err) => reject(new ApiError(401, "Hermes authentication failed", [err.message])),
            mfaRequired: () => reject(new ApiError(403, "MFA Required for Hermes account")),
            newPasswordRequired: () => reject(new ApiError(403, "New Password Required for Hermes account")),
        });
    });

    // Step 3: Call GetUser to finalize the flow as per pattern
    const accessToken = authResult.getAccessToken().getJwtToken();
    const userData = await getUserData(accessToken);

    return {
        AuthenticationResult: {
            AccessToken: accessToken,
            IdToken: authResult.getIdToken().getJwtToken(),
            RefreshToken: authResult.getRefreshToken().getToken(),
            ExpiresIn: 900,
            TokenType: "Bearer"
        },
        UserData: userData
    };
};

/**
 * Specifically handles calling Cognito's REFRESH_TOKEN_AUTH
 */
const refreshAppSession = async (userId: string, refreshToken: string): Promise<any> => {
    if (!config.cognitoUserPoolId || !config.cognitoClientId) {
        return null;
    }

    const poolData = {
        UserPoolId: config.cognitoUserPoolId,
        ClientId: config.cognitoClientId,
    };
    const userPool = new CognitoUserPool(poolData);

    // @ts-ignore
    const { CognitoRefreshToken } = await import("amazon-cognito-identity-js");

    const userData = {
        Username: "dummy",
        Pool: userPool,
    };
    const cognitoUser = new CognitoUser(userData);

    const refreshResult: any = await new Promise((resolve, reject) => {
        const token = new CognitoRefreshToken({ RefreshToken: refreshToken });

        cognitoUser.refreshSession(token, (err, session) => {
            if (err) reject(new ApiError(401, "Failed to refresh Hermes session", [err.message]));
            else resolve(session);
        });
    });

    const accessToken = refreshResult.getAccessToken().getJwtToken();
    const idToken = refreshResult.getIdToken().getJwtToken();
    const newRefreshToken = refreshResult.getRefreshToken().getToken();
    const expiryDate = new Date(Date.now() + 900 * 1000);

    // Update Redis Cache (High performance retrieval) - NO MORE DB UPDATE
    const cacheData = {
        accessToken,
        idToken,
        refreshToken: newRefreshToken,
        expiry: expiryDate.toISOString(),
    };
    await redis.set(`app_tokens:${userId}`, JSON.stringify(cacheData), 'EX', 900); // 15 min TTL

    return accessToken;
};

/**
 * A helper that checks Redis, refreshes if needed, and returns a working token
 */
const getValidAppToken = async (userId: string): Promise<string> => {
    // 1. Try Redis Cache first
    const cachedTokens = await redis.get(`app_tokens:${userId}`);
    if (cachedTokens) {
        const tokens = JSON.parse(cachedTokens);
        const now = new Date();
        const buffer = 5 * 60 * 1000;
        if (new Date(new Date(tokens.expiry).getTime() - buffer) > now) {
            return tokens.accessToken;
        }

        // 2. If cached but expired, try refresh using cached refresh token
        if (tokens.refreshToken) {
            try {
                return await refreshAppSession(userId, tokens.refreshToken);
            } catch (error) {
                console.error("Token refresh failed, falling back to SRP login:", error);
            }
        }
    }

    // 3. Fallback: Silence re-login via SRP (Need email/password from DB)
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            appEmail: true,
            appPassword: true,
        },
    });

    if (!user || !user.appEmail || !user.appPassword) {
        throw new ApiError(400, "App not connected for this user");
    }

    try {
        const decryptedPassword = decrypt(user.appPassword);
        const uniqueId = await checkUser(user.appEmail);
        const authResult = await authenticateWithCognito(uniqueId, decryptedPassword);

        const accessToken = authResult.AuthenticationResult.AccessToken;
        const expiryDate = new Date(Date.now() + 900 * 1000);

        // Save to Redis Cache (High performance retrieval) - NO MORE DB UPDATE
        const cacheData = {
            accessToken,
            idToken: authResult.AuthenticationResult.IdToken,
            refreshToken: authResult.AuthenticationResult.RefreshToken,
            expiry: expiryDate.toISOString(),
        };
        await redis.set(`app_tokens:${userId}`, JSON.stringify(cacheData), 'EX', 900); // 15 min TTL

        return accessToken;
    } catch (error: any) {
        throw new ApiError(401, "Failed to authenticate with Hermes after token expiry. Please reconnect.", [error.message]);
    }
};

export default {
    checkUser,
    authenticateWithCognito,
    getUserData,
    refreshAppSession,
    getValidAppToken,
};
