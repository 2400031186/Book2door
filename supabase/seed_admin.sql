-- Admin: sadhwikchowdary9@gmail.com
-- Clerk user ID: user_3GjDtJKwvAToV4exxgx1I3VXqzR
-- Already applied via server script. Re-run if needed:

UPDATE profiles
SET role = 'admin', email = 'sadhwikchowdary9@gmail.com'
WHERE id = 'user_3GjDtJKwvAToV4exxgx1I3VXqzR';

-- Or upsert if the row is missing:
-- INSERT INTO profiles (id, full_name, email, role)
-- VALUES ('user_3GjDtJKwvAToV4exxgx1I3VXqzR', 'SADHWIK LANKALAPALLI', 'sadhwikchowdary9@gmail.com', 'admin')
-- ON CONFLICT (id) DO UPDATE SET role = 'admin', email = EXCLUDED.email;
