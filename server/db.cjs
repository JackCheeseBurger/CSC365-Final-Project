const fs = require('fs');
const path = require('path');
const DB_FILE = path.join(__dirname, '..', 'db.json');
/*Database*/
function loadDB() {
  if (!fs.existsSync(DB_FILE)) return { users: {}, tournaments: {} };
  try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); }
  catch { return { users: {}, tournaments: {} }; }
}
function saveDB() {
  fs.writeFileSync(
    DB_FILE,
    JSON.stringify({ users: db.users, tournaments: db.tournaments }, null, 2)
  );
}
const db = loadDB();
db.tokens = {};
module.exports = { db, saveDB, DB_FILE };
