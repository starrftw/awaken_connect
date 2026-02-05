import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

// Reddit-style username generation
const ADJECTIVES = [
    'Happy', 'Clever', 'Bright', 'Swift', 'Brave', 'Calm', 'Kind', 'Wise',
    'Lucky', 'Proud', 'Bold', 'Cool', 'Fine', 'Gentle', 'Keen', 'Lucky',
    'Merry', 'Noble', 'Quick', 'Warm', 'Eager', 'Fancy', 'Grand', 'Jolly',
    'Lazy', 'Mild', 'Nice', 'Proud', 'Rural', 'Sharp', 'Trusty', 'Valiant',
    'Witty', 'Youthful', 'Zesty', 'Ample', 'Breezy', 'Cosy', 'Dazzling',
    'Epic', 'Fresh', 'Glad', 'Heroic', 'Jazzy', 'Kinetic', 'Luminous', 'Magic',
]

const NOUNS = [
    'Llama', 'Fox', 'Bear', 'Wolf', 'Eagle', 'Hawk', 'Lion', 'Tiger',
    'Panda', 'Koala', 'Otter', 'Seal', 'Whale', 'Dolphin', 'Shark', 'Whale',
    'Falcon', 'Raven', 'Owl', 'Phoenix', 'Dragon', 'Tiger', 'Leopard',
    'Cheetah', 'Panther', 'Jaguar', 'Lynx', 'Bobcat', 'Cougar', 'Mountain',
    'River', 'Lake', 'Ocean', 'Mountain', 'Forest', 'Desert', 'Valley',
    'Canyon', 'Glacier', 'Volcano', 'Island', 'Reef', 'Coral', 'Meadow',
]

/**
 * Generate a random Reddit-style username (Adjective + Noun)
 */
export function generateUsername(): string {
    const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)]
    return `${adjective}${noun}`
}

/**
 * Get display name from profile data
 * Returns username if available, otherwise formats Privy ID
 */
export function getDisplayName(
    username: string | null,
    privyId: string | undefined
): string {
    if (username && username.trim()) {
        // Strip "User " prefix if present
        const cleanUsername = username.replace(/^User\s+/i, '')
        return cleanUsername
    }
    if (privyId) {
        // Extract just the ID part from did:privy:xxx
        const idPart = privyId.replace('did:privy:', '')
        // Show first 8 characters
        return idPart.slice(0, 8)
    }
    return 'Anonymous'
}

/**
 * Truncate address for display
 */
export function truncateAddress(address: string, chars = 4): string {
    if (!address || address.length <= chars * 2) return address
    return `${address.slice(0, chars)}...${address.slice(-chars)}`
}
