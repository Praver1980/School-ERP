const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  "await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {\n        method: \"POST\",\n        headers: { \"Content-Type\": \"application/json\" },\n        body: JSON.stringify({ chat_id: chatId, text: message })\n      });\n      res.json({ success: true });",
  "const telegramRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {\n        method: \"POST\",\n        headers: { \"Content-Type\": \"application/json\" },\n        body: JSON.stringify({ chat_id: chatId, text: message })\n      });\n      const telegramData = await telegramRes.json();\n      if (!telegramRes.ok) {\n        console.error('Telegram Error:', telegramData);\n        return res.status(500).json({ error: 'Failed to send Telegram message: ' + (telegramData.description || 'Unknown error') });\n      }\n      res.json({ success: true });"
);

fs.writeFileSync('server.ts', code);
