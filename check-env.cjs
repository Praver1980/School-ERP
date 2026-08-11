require('dotenv').config();
console.log("Token:", process.env.TELEGRAM_BOT_TOKEN ? process.env.TELEGRAM_BOT_TOKEN.substring(0, 10) + "..." : "Not Set");
console.log("Chat:", process.env.TELEGRAM_CHAT_ID);
