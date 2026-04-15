import * as SecureStore from 'expo-secure-store';
import CryptoJS from 'crypto-js';

/**
 * Journal Service
 * 
 * Provides end-to-end encryption for sensitive journal entries.
 * Uses AES-256 encryption with a device-specific key stored in SecureStore.
 */

const ENCRYPTION_KEY_ID = 'ease_journal_key';

export const journalService = {
    /**
     * Initializes the encryption key if it doesn't exist
     */
    async initializeKey(): Promise<string> {
        let key = await SecureStore.getItemAsync(ENCRYPTION_KEY_ID);
        if (!key) {
            // Generate a random 32-character key for AES-256
            key = CryptoJS.lib.WordArray.random(32).toString();
            await SecureStore.setItemAsync(ENCRYPTION_KEY_ID, key);
        }
        return key;
    },

    /**
     * Encrypts a string using the stored key
     */
    async encrypt(text: string): Promise<string> {
        if (!text) return '';
        const key = await this.initializeKey();
        const encrypted = CryptoJS.AES.encrypt(text, key).toString();
        return encrypted;
    },

    /**
     * Decrypts a string using the stored key
     */
    async decrypt(encryptedText: string): Promise<string> {
        if (!encryptedText) return '';
        const key = await this.initializeKey();
        
        try {
            const bytes = CryptoJS.AES.decrypt(encryptedText, key);
            const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
            
            if (!decryptedData) {
                // Return original if decryption results in empty string (could be legacy data)
                return "[ENCRYPTION MISMATCH]";
            }
            
            return decryptedData;
        } catch (e) {
            console.error("Decryption failed", e);
            return "[DECRYPTION ERROR]";
        }
    }
};
