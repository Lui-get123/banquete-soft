import { supabase } from './src/lib/supabase.js';

async function migrate() {
  const { error } = await supabase.rpc('exec_sql', { sql: `
    ALTER TABLE users ADD COLUMN IF NOT EXISTS email_user TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS email_pass TEXT;
  `});
  console.log("Migration result via RPC:", error);
}

migrate();
