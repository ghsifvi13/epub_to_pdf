const axios = require('axios');
const fs = require("fs");
const { cloudConvert, bot } = require(".");

async function convertEpubToPdf(fileUrl, fileName, chatId) {
  try {
    // Create CloudConvert job
    let job = await cloudConvert.jobs.create({
      tasks: {
        'import-file': {
          operation: 'import/url',
          url: fileUrl
        },
        'convert-file': {
          operation: 'convert',
          input: 'import-file',
          input_format: 'epub',
          output_format: 'pdf',
          options: {
            page_size: 'A4',
            margin_top: 20,
            margin_bottom: 20,
            margin_left: 20,
            margin_right: 20,
          }
        },
        'export-file': {
          operation: 'export/url',
          input: 'convert-file'
        }
      }
    });

    // Wait for job completion
    job = await cloudConvert.jobs.wait(job.id);
    
    // Get download URL
    const exportTask = job.tasks.filter(task => task.name === 'export-file')[0];
    const downloadUrl = exportTask.result.files[0].url;
    
    // // Download converted PDF
    // const response = await fetch(downloadUrl);
    // const buffer = await response.buffer();
    const response = await axios.get(downloadUrl, { responseType: 'arraybuffer'});
    const buffer = Buffer.from(response.data);

    // Save temporarily
    const pdfFileName = fileName.replace('.epub', '.pdf');
    const tempPdfPath = `./temp/${Date.now()}_${pdfFileName}`;
    fs.writeFileSync(tempPdfPath, buffer);
    
    // Send PDF to user
    await bot.sendDocument(chatId, tempPdfPath, {
      caption: '✅ Your PDF is ready!'
    });
    
    // Clean up temporary file
    fs.unlinkSync(tempPdfPath);
    
    console.log(`Successfully converted ${fileName} for chat ${chatId}`);
    
  } catch (error) {
    console.error('CloudConvert error:', error);
    bot.sendMessage(chatId, '❌ Failed to convert EPUB to PDF. Please try again later.');
  }
}

module.exports = {
  convertEpubToPdf,
}