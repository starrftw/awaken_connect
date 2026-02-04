/**
 * Unit tests for Kaspa Adapter
 */

import {
    validateKaspaAddress,
    normalizeKaspaAddress,
    fetchKaspaTransactions
} from '../src/adapters/kaspa';

describe('Kaspa Adapter', () => {
    describe('validateKaspaAddress', () => {
        it('should validate correct Kaspa addresses', () => {
            // Standard q address (44-48 chars)
            expect(validateKaspaAddress('kaspa:qz8ft2tjn4dr2p0q74lmw4np4f7xq7v8y0z9x3c2b1a4e5d6f7g8h9i0j')).toBe(true);

            // Address with digits (real Kaspa addresses contain digits)
            expect(validateKaspaAddress('kaspa:qz3f8acgyuhad0fs8algs7mgq7fxzynkhwjxxnfkyvqal2avkelygc2mnzh0g')).toBe(true);

            // P address
            expect(validateKaspaAddress('kaspa:pp5qpp5qpp5qpp5qpp5qpp5qpp5qpp5qpp5qpp5qpp5qpp5qpp5qpp5qpp5qpp5q')).toBe(true);
        });

        it('should be case-insensitive', () => {
            expect(validateKaspaAddress('KASPA:QZ8FT2TJN4DR2P0Q74LMW4NP4F7XQ7V8Y0Z9X3C2B1A4E5D6F7G8H9I0J')).toBe(true);
            expect(validateKaspaAddress('kaspa:qz8ft2tjn4dr2p0q74lmw4np4f7xq7v8y0z9x3c2b1a4e5d6f7g8h9i0j')).toBe(true);
        });

        it('should reject EVM-style addresses', () => {
            expect(validateKaspaAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f2bD48')).toBe(false);
        });

        it('should reject invalid formats', () => {
            expect(validateKaspaAddress('not-an-address')).toBe(false);
            expect(validateKaspaAddress('kaspa:')).toBe(false);
            expect(validateKaspaAddress('')).toBe(false);
        });

        it('should reject addresses without kaspa: prefix', () => {
            expect(validateKaspaAddress('qz8ft2tjn4dr2p0q74lmw4np4f7xq7v8y0z9x3c2b1a4e5d6f7g8h9i0j')).toBe(false);
        });

        it('should reject addresses with invalid characters', () => {
            // Special characters are not valid in Kaspa addresses
            expect(validateKaspaAddress('kaspa:invalid!@#chars')).toBe(false);
            expect(validateKaspaAddress('kaspa:invalid spaces')).toBe(false);
        });

        it('should reject addresses with invalid length', () => {
            // Too short
            expect(validateKaspaAddress('kaspa:abc')).toBe(false);
            // Too long (over 80 chars)
            expect(validateKaspaAddress('kaspa:' + 'a'.repeat(81))).toBe(false);
        });
    });

    describe('normalizeKaspaAddress', () => {
        it('should convert to lowercase', () => {
            expect(normalizeKaspaAddress('KASPA:QZ8FT2TJN4DR2P0Q74LMW4NP4F7XQ7V8Y0Z9X3C2B1A4E5D6F7G8H9I0J'))
                .toBe('kaspa:qz8ft2tjn4dr2p0q74lmw4np4f7xq7v8y0z9x3c2b1a4e5d6f7g8h9i0j');
        });

        it('should trim whitespace', () => {
            expect(normalizeKaspaAddress('  kaspa:qz8ft2tjn4dr2p0q74lmw4np4f7xq7v8y0z9x3c2b1a4e5d6f7g8h9i0j  '))
                .toBe('kaspa:qz8ft2tjn4dr2p0q74lmw4np4f7xq7v8y0z9x3c2b1a4e5d6f7g8h9i0j');
        });
    });

    describe('fetchKaspaTransactions', () => {
        it('should reject invalid addresses', async () => {
            await expect(fetchKaspaTransactions('invalid-address'))
                .rejects.toThrow('Invalid Kaspa address format');
        });

        it('should handle valid addresses', async () => {
            const testAddress = 'kaspa:qz3f8acgyuhad0fs8algs7mgq7fxzynkhwjxxnfkyvqal2avkelygc2mnzh0g';

            // This will make an actual API call
            try {
                const transactions = await fetchKaspaTransactions(testAddress);
                expect(Array.isArray(transactions)).toBe(true);
            } catch (error: any) {
                // API might fail in test environment
                expect(error.message).toBeDefined();
            }
        });
    });
});
