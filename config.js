require('dotenv').config();

module.exports = {
  token: process.env.BOT_TOKEN,
  adminId: parseInt(process.env.ADMIN_ID),
  dataFile: 'botData.json'
};