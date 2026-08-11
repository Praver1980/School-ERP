const botToken = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

if (!botToken || !chatId) {
  console.log("No token or chat ID");
  process.exit(1);
}

const msg = "✅ *System Test Passed!*\n\nChat ID has been updated to your correct user ID. Telegram notifications are now working properly.";

fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: "Markdown" })
}).then(res => res.json()).then(data => {
  console.log(data);
}).catch(err => {
  console.error(err);
});
