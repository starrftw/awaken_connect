import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables are not set')
}

export const supabase = createClient(
    supabaseUrl || '',
    supabaseAnonKey || ''
)

// Types for Supabase tables
export interface Profile {
    id: string
    email: string | null
    username: string | null
    created_at: string
    updated_at: string
}

export interface ConnectedWallet {
    id: string
    profile_id: string
    wallet_address: string
    wallet_type: 'creditcoin' | 'kaspa' | 'other'
    connected_at: string
}

export interface RequestHistory {
    id: string
    profile_id: string
    request_type: string
    details: Record<string, unknown>
    created_at: string
}

export interface ExportHistory {
    id: string
    user_id: string
    timestamp: string
    blockchain: string
    wallet_address: string
    transaction_count: number
    is_signed: boolean
    transaction_hash: string | null
    signed_at: string | null
    created_at: string
}

// Database helper functions
export const db = {
    // Profiles
    async getProfile(userId: string) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()

        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching profile:', error)
        }
        return data as Profile | null
    },

    async createProfile(userId: string, email?: string) {
        const { data, error } = await supabase
            .from('profiles')
            .insert({ id: userId, email })
            .select()
            .single()

        if (error) {
            console.error('Error creating profile:', error)
        }
        return data as Profile | null
    },

    async updateProfile(userId: string, updates: Partial<Profile>) {
        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId)
            .select()
            .single()

        if (error) {
            console.error('Error updating profile:', error)
        }
        return data as Profile | null
    },

    // Connected Wallets
    async getConnectedWallets(profileId: string) {
        const { data, error } = await supabase
            .from('connected_wallets')
            .select('*')
            .eq('profile_id', profileId)
            .order('connected_at', { ascending: false })

        if (error) {
            console.error('Error fetching connected wallets:', error)
        }
        return data as ConnectedWallet[] | null
    },

    async addConnectedWallet(
        profileId: string,
        walletAddress: string,
        walletType: 'creditcoin' | 'kaspa' | 'other'
    ) {
        const { data, error } = await supabase
            .from('connected_wallets')
            .insert({
                profile_id: profileId,
                wallet_address: walletAddress,
                wallet_type: walletType,
            })
            .select()
            .single()

        if (error) {
            console.error('Error adding connected wallet:', error)
        }
        return data as ConnectedWallet | null
    },

    async removeConnectedWallet(walletId: string) {
        const { error } = await supabase
            .from('connected_wallets')
            .delete()
            .eq('id', walletId)

        if (error) {
            console.error('Error removing connected wallet:', error)
        }
        return !error
    },

    // Request History
    async getRequestHistory(profileId: string, limit = 50) {
        const { data, error } = await supabase
            .from('requests_history')
            .select('*')
            .eq('profile_id', profileId)
            .order('created_at', { ascending: false })
            .limit(limit)

        if (error) {
            console.error('Error fetching request history:', error)
        }
        return data as RequestHistory[] | null
    },

    async addRequestHistory(
        profileId: string,
        requestType: string,
        details: Record<string, unknown>
    ) {
        const { data, error } = await supabase
            .from('requests_history')
            .insert({
                profile_id: profileId,
                request_type: requestType,
                details,
            })
            .select()
            .single()

        if (error) {
            console.error('Error adding request history:', error)
        }
        return data as RequestHistory | null
    },

    // Export History
    async getExportHistory(userId: string, limit = 50) {
        const { data, error } = await supabase
            .from('export_history')
            .select('*')
            .eq('user_id', userId)
            .order('timestamp', { ascending: false })
            .limit(limit)

        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching export history:', error)
        }
        return data as ExportHistory[] | null
    },

    async addExportHistory(
        userId: string,
        blockchain: string,
        walletAddress: string,
        transactionCount: number,
        isSigned: boolean = false,
        transactionHash: string | null = null,
        signedAt: string | null = null
    ) {
        const { data, error } = await supabase
            .from('export_history')
            .insert({
                user_id: userId,
                blockchain,
                wallet_address: walletAddress,
                transaction_count: transactionCount,
                is_signed: isSigned,
                transaction_hash: transactionHash,
                signed_at: signedAt,
            })
            .select()
            .single()

        if (error) {
            console.error('Error adding export history:', error)
        }
        return data as ExportHistory | null
    },
}
