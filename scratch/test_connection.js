const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Helper to parse .env.local variables
function parseEnv() {
  const envPath = path.join(__dirname, '../.env.local');
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      env[key] = value.trim();
    }
  });
  return env;
}

const env = parseEnv();
const url = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
let key = env.SUPABASE_SERVICE_ROLE_KEY;

if (!key || key.includes("your-supabase-service-role-key")) {
  key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}
if (!key || key.includes("your-supabase-anon-key")) {
  key = "";
}

if (!url || url.includes("your-supabase-project")) {
  console.log("❌ Supabase URL is not configured in .env.local. Please paste your actual URL and try again.");
  process.exit(1);
}

console.log(`Connecting to: ${url}`);
const supabase = createClient(url, key);

async function testConnection() {
  console.log("\n--- Testing Database Tables Connection ---");

  // Test users table
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .limit(1);

  if (userError) {
    console.log(`❌ users table check failed: ${userError.message}`);
  } else {
    console.log(`✅ users table connected successfully! Found ${userData.length} row(s).`);
  }

  // Test projects table
  const { data: projectData, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .limit(1);

  if (projectError) {
    console.log(`❌ projects table check failed: ${projectError.message}`);
  } else {
    console.log(`✅ projects table connected successfully! Found ${projectData.length} row(s).`);
  }
}

testConnection();
