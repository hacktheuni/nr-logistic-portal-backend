import axios from "axios";
import {
    CognitoUserPool,
    CognitoUser,
    AuthenticationDetails,
} from "amazon-cognito-identity-js";
import { createHermesClient, createCognitoClient } from "@/lib/axios/appClient";
import { config } from "@/config/env";
import { ApiError } from "@/utils/ApiError";

const hermesClient = createHermesClient();

/**
 * Inject exact headers into Cognito library requests to mimic mobile app
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
 * Check if user exists in Hermes and get their uniqueId (courierId)
 */
export const checkUser = async (email: string): Promise<string> => {
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
 * Get User Data from Cognito using AccessToken
 */
export const getUserData = async (accessToken: string): Promise<any> => {
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
 * Authenticate with AWS Cognito SRP and return access token
 * This is used for both validation (connect-app) and cron jobs
 */
export const authenticateUser = async (uniqueId: string, password: string): Promise<string> => {
    if (!config.cognitoUserPoolId || !config.cognitoClientId) {
        throw new ApiError(500, "Cognito configuration missing");
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

    // Get access token
    const accessToken = authResult.getAccessToken().getJwtToken();

    // Call GetUser to finalize the flow as per pattern
    await getUserData(accessToken);

    return accessToken;
};

export default {
    checkUser,
    getUserData,
    authenticateUser,
};
