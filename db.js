const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '', // default XAMPP kosong
  database: 'database'
});

db.connect((err) => {
  if (err) {
    console.log('Database error ❌', err);
  } else {
    console.log('Database connected ✅');
  }
});

module.exports = db;