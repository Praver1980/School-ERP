const botToken = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

if (!botToken || !chatId) {
  console.log("No token or chat ID");
  process.exit(1);
}

const msg = "🤖 *School ERP System Update*\n\nTelegram integration is successfully configured! \n\nTo see the current status of all payments, please log in as an Admin and click the **Send Telegram Report** button on the Payments page.";

fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: "Markdown" })
}).then(res => res.json()).then(data => {
  console.log(data);
}).catch(err => {
  console.error(err);
});
