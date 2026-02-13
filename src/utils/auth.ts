import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import CryptoJS from 'crypto-js';
import { config } from '@/config/env';

// Validate that JWT secrets are defined
if (!config.jwtAccessTokenSecret) {
    throw new Error('JWT_ACCESS_TOKEN_SECRET is not defined in environment variables');
}
if (!config.jwtRefreshTokenSecret) {
    throw new Error('JWT_REFRESH_TOKEN_SECRET is not defined in environment variables');
}

const access_token_secret: string = config.jwtAccessTokenSecret;
const refresh_token_secret: string = config.jwtRefreshTokenSecret;
const access_token_expiresIn = config.jwtAccessTokenExpiresIn || '15m';
const refresh_token_expiresIn = config.jwtRefreshTokenExpiresIn || '7d';

const generateTokens = (admin: { id: string; email: string }) => {
    const accessToken = jwt.sign(
        { id: admin.id, email: admin.email },
        access_token_secret,
        {
            expiresIn: access_token_expiresIn as NonNullable<jwt.SignOptions['expiresIn']>
        }
    );

    const refreshToken = jwt.sign(
        { id: admin.id },
        refresh_token_secret,
        {
            expiresIn: refresh_token_expiresIn as NonNullable<jwt.SignOptions['expiresIn']>
        }
    );

    return { accessToken, refreshToken };
};

const verifyRefreshToken = (token: string): { id: string } => {
    return jwt.verify(token, refresh_token_secret) as { id: string };
};

const verifyAccessToken = (token: string): { id: string; email: string } => {
    return jwt.verify(token, access_token_secret) as { id: string; email: string };
};

const comparePassword = async (password: string, hash: string): Promise<boolean> => {
    return await bcrypt.compare(password, hash);
}

const hashPassword = async (password: string): Promise<string> => {
    return await bcrypt.hash(password, 10);
}

const ENCRYPTION_KEY = config.encryptionKey || 'default-secret-key';

const encrypt = (text: string): string => {
    return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
}

const decrypt = (ciphertext: string): string => {
    const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
}

export { generateTokens, verifyRefreshToken, verifyAccessToken, comparePassword, hashPassword, encrypt, decrypt };