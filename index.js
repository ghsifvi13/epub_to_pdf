const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const CloudConvert = require('cloudconvert');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const {convertEpubToPdf} = require('./cloud_converter');

const bot = new TelegramBot(process.env['TELEGRAM_TOKEN'], {webHook: true});
exports.bot = bot;

const cloudConvert = new CloudConvert(process.env['CLOUD_TOKEN']);
exports.cloudConvert = cloudConvert;

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());

// Create temp directory if it doesn't exist
if (!fs.existsSync('./temp')) {
  fs.mkdirSync('./temp');
}

// Handle start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, '📚 Welcome! Send me an EPUB file and I\'ll convert it to PDF for you!');
});

// Handle document uploads
bot.on('document', async (msg) => {
  const chatId = msg.chat.id;
  const fileId = msg.document.file_id;
  const fileName = msg.document.file_name;

  // Check if file is EPUB
  if (path.extname(fileName).toLowerCase() !== '.epub') {
    return bot.sendMessage(chatId, '❌ Please upload a valid .epub file');
  }

  bot.sendMessage(chatId, '📖 EPUB received! Converting to PDF...');

  try {
    // Get file from Telegram servers
    const file = await bot.getFile(fileId);
    const fileUrl = `https://api.telegram.org/file/bot${process.env['TELEGRAM_TOKEN']}/${file.file_path}`;
    
    // Convert using CloudConvert
    await convertEpubToPdf(fileUrl, fileName, chatId);
    
  } catch (error) {
    console.error('Error processing EPUB:', error);
    bot.sendMessage(chatId, '❌ Error processing EPUB file. Please try again.');
  }
});

// Handle other messages
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  
  // Skip if it's a document or command
  if (msg.document || msg.text?.startsWith('/')) return;
  
  bot.sendMessage(chatId, '📚 Please send me an EPUB file to convert to PDF!');
});

// Webhook endpoint
app.post(`/webhook/${process.env['TELEGRAM_TOKEN']}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Health check endpoint
app.get('/', (req, res) => {
  res.send('🤖 EPUB to PDF Bot is running!');
});

// Set webhook
const setWebHook = async () => {
  const webhookUrl1 = `https://epub-to-pdf.onrender.com/webhook/${process.env['TELEGRAM_TOKEN']}`;
  
  try {
    await bot.setWebHook(webhookUrl1);
    console.log('✅ Webhook set successfully:', webhookUrl1);
  } catch (error) {
    console.error('❌ Error setting webhook:', error.message);
  }
};

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  setWebHook();
});