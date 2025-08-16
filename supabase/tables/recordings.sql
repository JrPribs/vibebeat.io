CREATE TABLE recordings (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    filename VARCHAR(255) NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    public_url VARCHAR(500) NOT NULL,
    signed_url VARCHAR(500),
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    duration_sec DECIMAL(10,3),
    sample_rate INTEGER,
    bpm DECIMAL(6,2),
    detected_key VARCHAR(10),
    bar_count INTEGER,
    recording_type VARCHAR(50) DEFAULT 'microphone',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);