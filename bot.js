const TelegramBot = require('node-telegram-bot-api');
const config = require('./config');
const keyboards = require('./keyboards');
const db = require('./database');

// Create bot instance with polling
const bot = new TelegramBot(config.token, { 
  polling: true,
  webHook: false
});

// Log when bot starts
console.log('🤖 Bot is starting...');

// Error handling
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

bot.on('error', (error) => {
  console.error('Bot error:', error);
});

// Start command handler
bot.onText(/\/start/, async (msg) => {
  try {
    const welcomeMessage = 'Welcome to Pass Paper Bot! 📚\nSelect an option:';
    await bot.sendMessage(msg.chat.id, welcomeMessage, keyboards.mainKeyboard);
    console.log(`Start command received from user ${msg.from.id}`);
  } catch (error) {
    console.error('Error in start command:', error);
  }
});

// Add admin command
bot.onText(/\/addadmin (.+)/, async (msg, match) => {
  try {
    if (!db.isAdmin(msg.from.id)) {
      await bot.sendMessage(msg.chat.id, '❌ Only existing admins can add new admins.');
      return;
    }

    const newAdminId = match[1].trim();
    await db.addAdmin(newAdminId);
    await bot.sendMessage(msg.chat.id, `✅ Admin added successfully: ${newAdminId}`);
    console.log(`New admin added: ${newAdminId} by ${msg.from.id}`);
  } catch (error) {
    console.error('Error adding admin:', error);
    await bot.sendMessage(msg.chat.id, '❌ Failed to add admin. Please try again.');
  }
});

// List admins command
bot.onText(/\/listadmins/, async (msg) => {
  try {
    if (!db.isAdmin(msg.from.id)) {
      await bot.sendMessage(msg.chat.id, '❌ Only admins can view admin list.');
      return;
    }

    const admins = db.listAdmins();
    const adminList = admins.join('\n');
    await bot.sendMessage(msg.chat.id, `*Current Admins:*\n${adminList}`, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error listing admins:', error);
    await bot.sendMessage(msg.chat.id, '❌ Failed to list admins. Please try again.');
  }
});

// Remove admin command
bot.onText(/\/removeadmin (.+)/, async (msg, match) => {
  try {
    if (!db.isAdmin(msg.from.id)) {
      await bot.sendMessage(msg.chat.id, '❌ Only admins can remove admins.');
      return;
    }

    const adminToRemove = match[1].trim();
    if (adminToRemove === config.adminId.toString()) {
      await bot.sendMessage(msg.chat.id, '❌ Cannot remove the main admin.');
      return;
    }

    const removed = await db.removeAdmin(adminToRemove);
    if (removed) {
      await bot.sendMessage(msg.chat.id, `✅ Admin removed successfully: ${adminToRemove}`);
    } else {
      await bot.sendMessage(msg.chat.id, '❌ Admin not found.');
    }
  } catch (error) {
    console.error('Error removing admin:', error);
    await bot.sendMessage(msg.chat.id, '❌ Failed to remove admin. Please try again.');
  }
});

// Main message handler
bot.on('message', async (msg) => {
  try {
    if (!msg.text) return;
    console.log(`Received message: ${msg.text} from user ${msg.from.id}`);

    switch (msg.text) {
      case 'Grade 11':
        await bot.sendMessage(msg.chat.id, 'Select Medium:', keyboards.mediumKeyboard);
        break;
      case 'Contact Admin':
        await bot.sendMessage(msg.chat.id, '✍️ Please write your message. It will be forwarded to all admins.');
        break;
      default:
        if (!msg.text.startsWith('/') && !db.isAdmin(msg.from.id)) {
          // Forward message to all admins
          const admins = db.listAdmins();
          const userInfo = `From: ${msg.from.first_name} ${msg.from.last_name || ''}\nUsername: @${msg.from.username || 'N/A'}\nUser ID: ${msg.from.id}\n\nMessage:`;
          
          for (const adminId of admins) {
            try {
              await bot.sendMessage(adminId, userInfo);
              await bot.forwardMessage(adminId, msg.chat.id, msg.message_id);
            } catch (err) {
              console.error(`Failed to forward message to admin ${adminId}:`, err);
            }
          }
          await bot.sendMessage(msg.chat.id, '✅ Your message has been forwarded to admins.');
        }
    }
  } catch (error) {
    console.error('Error in message handler:', error);
    await bot.sendMessage(msg.chat.id, '❌ An error occurred. Please try again.');
  }
});

// Callback query handler
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  
  try {
    const data = query.data;
    console.log(`Callback query received: ${data} from user ${query.from.id}`);

    // Handle medium selection
    if (data === 'sinhala_medium' || data === 'english_medium') {
      const mediumText = data === 'sinhala_medium' ? 'Sinhala' : 'English';
      await bot.editMessageText(`Selected Medium: ${mediumText}\n\nSelect Subject:`, {
        chat_id: chatId,
        message_id: query.message.message_id,
        ...keyboards.generateSubjectButtons(data)
      });
    }
    // Handle subject selection
    else if (data.includes('_medium_') && !data.includes('_20')) {
      const [medium, _, subject] = data.split('_');
      const mediumText = medium === 'sinhala' ? 'Sinhala' : 'English';
      const subjectList = keyboards.subjects[medium];
      const subjectText = subjectList.find(s => s.code === subject)?.text || subject;
      
      await bot.editMessageText(`Selected: ${mediumText} Medium - ${subjectText}\n\nSelect Year:`, {
        chat_id: chatId,
        message_id: query.message.message_id,
        ...keyboards.generateYearButtons(`${medium}_medium`, subject)
      });
    }
    // Handle year selection
    else if (data.includes('_20')) {
      console.log('Looking for file with key:', data);
      const fileId = db.getFile(data);
      
      if (fileId) {
        await bot.sendDocument(chatId, fileId);
        console.log('File sent successfully:', data);
      } else {
        await bot.sendMessage(chatId, '❌ No file available for this selection yet. Please try another year or subject.');
        console.log('File not found for key:', data);
      }
    }

    await bot.answerCallbackQuery(query.id);
  } catch (error) {
    console.error('Error in callback query handler:', error);
    await bot.sendMessage(chatId, '❌ An error occurred. Please try again.');
  }
});

// Help command
bot.onText(/\/help/, async (msg) => {
  const helpText = `
*Available Commands*
/start - Start the bot and show main menu
/help - Show this help message
/upload - Upload new past papers (admin only)
/files - List all available files (admin only)
/addadmin - Add new admin (admin only)
/removeadmin - Remove an admin (admin only)
/listadmins - List all admins (admin only)

*How to Use*
1. Click Grade 11 to start
2. Select Medium (Sinhala/English)
3. Choose Subject
4. Select Year
5. Download the paper

*Contact Admin*
Use the Contact Admin button to send messages to admin.
`;

  await bot.sendMessage(msg.chat.id, helpText, { parse_mode: 'Markdown' });
});

// List files command for admins
bot.onText(/\/files/, async (msg) => {
  if (!db.isAdmin(msg.from.id)) {
    await bot.sendMessage(msg.chat.id, '❌ Only admins can view file list.');
    return;
  }

  const files = db.listFiles();
  if (files.length === 0) {
    await bot.sendMessage(msg.chat.id, '📂 No files uploaded yet.');
    return;
  }

  const fileList = files.map(f => `- ${f}`).join('\n');
  await bot.sendMessage(msg.chat.id, `*Available Files:*\n${fileList}`, { parse_mode: 'Markdown' });
});

// File upload handler for admins
bot.onText(/\/upload/, async (msg) => {
  if (!db.isAdmin(msg.from.id)) {
    await bot.sendMessage(msg.chat.id, '❌ Only admins can upload files.');
    return;
  }

  const instructions = `
📤 *File Upload Instructions*

1. Send the PDF file you want to upload
2. Reply to the file with details in format:
\`medium_subject_year\`

Example: 
- \`sinhala_medium_maths_2023\`
- \`english_medium_science_2022\`

*Available Subjects:*
${keyboards.getSubjectList()}`;

  await bot.sendMessage(msg.chat.id, instructions, { parse_mode: 'Markdown' });
});

// Handle document uploads
bot.on('document', async (msg) => {
  try {
    if (!db.isAdmin(msg.from.id)) return;

    const fileId = msg.document.file_id;
    await bot.sendMessage(msg.chat.id, 'File received! Please reply with the file details (medium_subject_year)');
    
    // Store temporary file ID
    db.data.tempFileId = fileId;
  } catch (error) {
    console.error('Error handling document:', error);
  }
});

// Handle file detail replies
bot.on('message', async (msg) => {
  try {
    if (!db.isAdmin(msg.from.id) || !msg.reply_to_message || !msg.reply_to_message.document) return;

    const fileDetails = msg.text.toLowerCase();
    const fileId = msg.reply_to_message.document.file_id;

    // Validate file details format
    if (!keyboards.isValidFileKey(fileDetails)) {
      await bot.sendMessage(msg.chat.id, '❌ Invalid format. Use: medium_subject_year\nExample: sinhala_medium_maths_2023');
      return;
    }

    await db.addFile(fileDetails, fileId);
    await bot.sendMessage(msg.chat.id, '✅ File uploaded and mapped successfully!');
  } catch (error) {
    console.error('Error handling file details:', error);
  }
});

console.log('🤖 Pass Paper Bot is running...');