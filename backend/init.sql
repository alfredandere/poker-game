-- Create hands table
CREATE TABLE IF NOT EXISTS hands (
    id UUID PRIMARY KEY,
    stacks JSONB NOT NULL,
    dealer_position INTEGER NOT NULL,
    small_blind_position INTEGER NOT NULL,
    big_blind_position INTEGER NOT NULL,
    hole_cards JSONB NOT NULL,
    actions TEXT NOT NULL,
    board_cards TEXT,
    payoffs JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_hands_created_at ON hands(created_at DESC);