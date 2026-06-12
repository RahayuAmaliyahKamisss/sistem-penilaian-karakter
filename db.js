const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'srv1864.hstgr.io',
  user: 'u743507397_sistemuser',
  password: 'PASSWORD_DATABASE_KAMU',
  database: 'u743507397_sistemnilai'
});

db.connect((err) => {
  if (err) {
    console.log('Database error ❌', err);
  } else {
    console.log('Database connected ✅');
  }
});

module.exports = db;