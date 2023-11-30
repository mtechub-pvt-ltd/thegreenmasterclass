CREATE TABLE IF NOT EXISTS public.users (
    id SERIAL PRIMARY KEY,
    fullname VARCHAR(255) ,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_no BIGINT,
    isBlocked BOOLEAN DEFAULT FALSE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    code VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- CREATE TABLE IF NOT EXISTS public.billing (
--     id SERIAL PRIMARY KEY,
--     user_id INTEGER,
--     address TEXT NOT NULL,
--     city VARCHAR(255) NOT NULL,
--     zip_code INTEGER NOT NULL,
--     created_at TIMESTAMPTZ DEFAULT NOW(),
--     updated_at TIMESTAMPTZ DEFAULT NOW(),
--     FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE
-- );
CREATE TABLE IF NOT EXISTS public.payment (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    payment_details JSON NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS public.videos (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    video_link VARCHAR(255) NOT NULL,
    thumbnail VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);