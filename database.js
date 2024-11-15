const fs = require('fs').promises;
const config = require('./config');

class Database {
  constructor() {
    this.data = {
      admins: new Set(),
      files: {},
      tempFileId: null
    };
    this.load();
  }

  async load() {
    try {
      const fileData = await fs.readFile(config.dataFile, 'utf8');
      const parsed = JSON.parse(fileData);
      this.data.admins = new Set(parsed.admins);
      this.data.files = parsed.files;
    } catch (err) {
      this.data.admins = new Set([config.adminId]);
      this.save();
    }
  }

  async save() {
    const saveData = {
      admins: Array.from(this.data.admins),
      files: this.data.files
    };
    await fs.writeFile(config.dataFile, JSON.stringify(saveData, null, 2));
  }

  isAdmin(userId) {
    return this.data.admins.has(userId.toString());
  }

  async addAdmin(adminId) {
    this.data.admins.add(adminId.toString());
    await this.save();
  }

  async removeAdmin(adminId) {
    const removed = this.data.admins.delete(adminId.toString());
    if (removed) {
      await this.save();
    }
    return removed;
  }

  listAdmins() {
    return Array.from(this.data.admins);
  }

  async addFile(key, fileId) {
    this.data.files[key] = fileId;
    await this.save();
  }

  getFile(key) {
    return this.data.files[key];
  }

  listFiles() {
    return Object.keys(this.data.files);
  }
}

module.exports = new Database();