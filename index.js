const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const CloudConvert = require('cloudconvert');
const fs = require('fs');
const fetch = require('node-fetch');
const path = require('path');

const bot = new TelegramBot(process.env['TELEGRAM_TOKEN'], {webHook: true});
const app = express();
const PORT = process.env.PORT || 3000;

const webhookPath = `/webhook/${process.env['TELEGRAM_TOKEN']}`;
const webhookUrl = `${process.env['WEBHOOK_URL']}${webhookPath}`;

bot.setWebHook(webhookUrl)
    .then(() => console.log('webhook set:', webhookUrl))
    .catch(err => console.error('FAILED:', err));

// Middleware to handle Telegram updates
app.use(express.json());
app.post(webhookPath, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Basic /start handler
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, '👋 Hello from Render! Bot is working!');
});

// Health check route
app.get('/', (req, res) => {
  res.send('🤖 Bot is alive!');
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});



















// const cloudConvert = new CloudConvert(process.env['CLOUD-CONVERT-TOKEN']);

// const app = express();
// const PORT = process.env.PORT || 3000;
// app.use(express.json());

// // Create temp directory if it doesn't exist
// if (!fs.existsSync('./temp')) {
//   fs.mkdirSync('./temp');
// }

// // Handle start command
// bot.onText(/\/start/, (msg) => {
//   const chatId = msg.chat.id;
//   bot.sendMessage(chatId, '📚 Welcome! Send me an EPUB file and I\'ll convert it to PDF for you!');
// });

// // Handle document uploads
// bot.on('document', async (msg) => {
//   const chatId = msg.chat.id;
//   const fileId = msg.document.file_id;
//   const fileName = msg.document.file_name;

//   // Check if file is EPUB
//   if (path.extname(fileName).toLowerCase() !== '.epub') {
//     return bot.sendMessage(chatId, '❌ Please upload a valid .epub file');
//   }

//   bot.sendMessage(chatId, '📖 EPUB received! Converting to PDF...');

//   try {
//     // Get file from Telegram servers
//     const file = await bot.getFile(fileId);
//     const fileUrl = `https://api.telegram.org/file/bot${process.env['TELEGRAM-TOKEN']}/${file.file_path}`;
    
//     // Convert using CloudConvert
//     await convertEpubToPdf(fileUrl, fileName, chatId);
    
//   } catch (error) {
//     console.error('Error processing EPUB:', error);
//     bot.sendMessage(chatId, '❌ Error processing EPUB file. Please try again.');
//   }
// });

// // CloudConvert conversion function
// async function convertEpubToPdf(fileUrl, fileName, chatId) {
//   try {
//     // Create CloudConvert job
//     let job = await cloudConvert.jobs.create({
//       tasks: {
//         'import-file': {
//           operation: 'import/url',
//           url: fileUrl
//         },
//         'convert-file': {
//           operation: 'convert',
//           input: 'import-file',
//           input_format: 'epub',
//           output_format: 'pdf',
//           options: {
//             page_size: 'A4',
//             margin_top: 20,
//             margin_bottom: 20,
//             margin_left: 20,
//             margin_right: 20,
//           }
//         },
//         'export-file': {
//           operation: 'export/url',
//           input: 'convert-file'
//         }
//       }
//     });

//     // Wait for job completion
//     job = await cloudConvert.jobs.wait(job.id);
    
//     // Get download URL
//     const exportTask = job.tasks.filter(task => task.name === 'export-file')[0];
//     const downloadUrl = exportTask.result.files[0].url;
    
//     // Download converted PDF
//     const response = await fetch(downloadUrl);
//     const buffer = await response.buffer();
    
//     // Save temporarily
//     const pdfFileName = fileName.replace('.epub', '.pdf');
//     const tempPdfPath = `./temp/${Date.now()}_${pdfFileName}`;
//     fs.writeFileSync(tempPdfPath, buffer);
    
//     // Send PDF to user
//     await bot.sendDocument(chatId, tempPdfPath, {
//       caption: '✅ Your PDF is ready!'
//     });
    
//     // Clean up temporary file
//     fs.unlinkSync(tempPdfPath);
    
//     console.log(`Successfully converted ${fileName} for chat ${chatId}`);
    
//   } catch (error) {
//     console.error('CloudConvert error:', error);
//     bot.sendMessage(chatId, '❌ Failed to convert EPUB to PDF. Please try again later.');
//   }
// }

// // Handle other messages
// bot.on('message', (msg) => {
//   const chatId = msg.chat.id;
  
//   // Skip if it's a document or command
//   if (msg.document || msg.text?.startsWith('/')) return;
  
//   bot.sendMessage(chatId, '📚 Please send me an EPUB file to convert to PDF!');
// });

// // Webhook endpoint
// app.post(`/webhook/${process.env['TELEGRAM-TOKEN']}`, (req, res) => {
//   bot.processUpdate(req.body);
//   res.sendStatus(200);
// });

// // Health check endpoint
// app.get('/', (req, res) => {
//   res.send('🤖 EPUB to PDF Bot is running!');
// });

// // Set webhook
// const setWebHook = async () => {
//   const webhookUrl1 = `https://epub-to-pdf.onrender.com/webhook/${process.env['TELEGRAM-TOKEN']}`;
  
//   try {
//     await bot.setWebHook(webhookUrl1);
//     console.log('✅ Webhook set successfully:', webhookUrl1);
//   } catch (error) {
//     console.error('❌ Error setting webhook:', error.message);
//   }
// };

// // Start server
// app.listen(PORT, () => {
//   console.log(`🚀 Server running on port ${PORT}`);
//   setWebHook();
// });