-- Migration script for Awaken Connect - Export History with Creditcoin Signing Support
-- Run this in your Supabase SQL Editor

-- 1. Add username column to profiles table (if not exists)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT;

-- 2. Create export_history table for tracking CSV exports with signing support
CREATE TABLE IF NOT EXISTS export_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    blockchain TEXT NOT NULL,
    wallet_address TEXT NOT NULL,
    transaction_count INTEGER NOT NULL,
    is_signed BOOLEAN DEFAULT FALSE,
    transaction_hash TEXT,
    signed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create index for faster queries on export_history
CREATE INDEX IF NOT EXISTS idx_export_history_user_id ON export_history(user_id);
CREATE INDEX IF NOT EXISTS idx_export_history_timestamp ON export_history(timestamp DESC);

-- 4. Enable Row Level Security (RLS) for export_history
ALTER TABLE export_history ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for export_history
-- Users can only view their own export history
CREATE POLICY IF NOT EXISTS "Users can view own export history" 
ON export_history FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own export history
CREATE POLICY IF NOT EXISTS "Users can insert own export history" 
ON export_history FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 6. Update profiles table to allow NULL username
ALTER TABLE profiles ALTER COLUMN username DROP NOT NULL;

-- 7. Create a trigger to automatically update the updated_at timestamp on profiles
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 8. (Optional) Create a view for user dashboard stats
CREATE OR REPLACE VIEW user_dashboard_stats AS
SELECT 
    p.id as user_id,
    p.username,
    p.email,
    COUNT(DISTINCT cw.id) as connected_wallet_count,
    COUNT(DISTINCT eh.id) as total_exports,
    COALESCE(SUM(eh.transaction_count), 0) as total_transactions_exported,
    MAX(eh.timestamp) as last_export_date,
    COUNT(CASE WHEN eh.is_signed = TRUE THEN 1 END) as signed_exports
FROM profiles p
LEFT JOIN connected_wallets cw ON p.id = cw.profile_id
LEFT JOIN export_history eh ON p.id = eh.user_id
GROUP BY p.id, p.username, p.email;

-- 9. Add comments describing the new schema
COMMENT ON TABLE export_history IS 'Tracks CSV export history for user tax reporting';
COMMENT ON COLUMN export_history.timestamp IS 'When the export was performed';
COMMENT ON COLUMN export_history.blockchain IS 'Blockchain network (creditcoin, kaspa, celo, etc.)';
COMMENT ON COLUMN export_history.wallet_address IS 'Wallet address used for the export';
COMMENT ON COLUMN export_history.transaction_count IS 'Number of transactions in the export';
COMMENT ON COLUMN export_history.is_signed IS 'Whether the export was signed on the Creditcoin blockchain';
COMMENT ON COLUMN export_history.transaction_hash IS 'Transaction hash from Creditcoin signing (if signed)';
COMMENT ON COLUMN export_history.signed_at IS 'Timestamp when the export was signed (if signed)';

-- 10. Creditcoin Contract Configuration (update with actual contract address)
-- Run this to set the contract address for signing:
-- INSERT INTO system_settings (key, value) VALUES ('creditcoin_contract_address', '0x...');
-- INSERT INTO system_settings (key, value) VALUES ('creditcoin_chain_id', '333777');
