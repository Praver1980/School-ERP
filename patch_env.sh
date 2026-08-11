sed -i 's/VITE_SUPABASE_ANON_KEY/VITE_SUPABASE_PUBLISHABLE_KEY/g' .env.example
echo "VITE_SUPABASE_URL=https://hlvsgpziwufgatbyaqcd.supabase.co" > .env
echo "VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_ETIBK3EAuaW2u3pRYZLbpg_o5bH0NrK" >> .env
sed -i 's/VITE_SUPABASE_ANON_KEY/VITE_SUPABASE_PUBLISHABLE_KEY/g' services/supabase.ts
sed -i 's/VITE_SUPABASE_ANON_KEY/VITE_SUPABASE_PUBLISHABLE_KEY/g' env.d.ts
