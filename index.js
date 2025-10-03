// ===== Import library =====
const express = require('express');
const jwt = require('jsonwebtoken');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
app.use(express.json());

// ===== Logger dengan masking data =====
morgan.token('body', (req) => {
  if (req.body && Object.keys(req.body).length > 0) {
    const maskedBody = { ...req.body };
    if (maskedBody.password) maskedBody.password = '****'; // masking password
    return JSON.stringify(maskedBody);
  }
  return '{}'; // kalau body kosong
});

app.use(morgan(':method :url :status :res[content-length] - :response-time ms :body'));

// ===== Middleware autentikasi =====
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401); // Unauthorized

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403); // Forbidden
    req.user = user;
    next();
  });
}

// ===== Routes =====

// Login untuk mendapatkan token
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  // Contoh cek sederhana
  if (username === 'admin' && password === '1234') {
    const user = { name: username };
    const accessToken = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '1h' });
    return res.json({ accessToken });
  }
  res.status(401).json({ message: 'Username atau password salah' });
});

// Endpoint yang butuh autentikasi
app.get('/protected', authenticateToken, (req, res) => {
  res.json({ message: `Hello ${req.user.name}, ini data sensitif!` });
});

// Public endpoint
app.get('/', (req, res) => {
  res.send('Server berjalan tanpa autentikasi');
});

// ===== Menjalankan server =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server berjalan di http://localhost:${PORT}`));