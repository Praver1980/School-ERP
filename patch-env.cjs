const fs = require('fs');
let env = fs.readFileSync('.env', 'utf8');

if (!env.includes('MASTER_WIPE_PASSWORD')) {
    env += "\nMASTER_WIPE_PASSWORD=nexus_secure_reset_2026\n";
    fs.writeFileSync('.env', env);
}
if (!env.includes('EMAIL_USER')) {
    env += "\nEMAIL_USER=test@example.com\nEMAIL_PASS=testpass\n";
    fs.writeFileSync('.env', env);
}
