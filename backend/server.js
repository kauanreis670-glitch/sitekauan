const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Inicializa o banco de dados
require('./config/seed');

const authRoutes = require('./routes/auth');
const accountRoutes = require('./routes/account');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(xss());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: 'Muitas requisições, tente novamente mais tarde'
});
app.use('/api', limiter);

app.use('/api/auth', authRoutes);
app.use('/api/account', accountRoutes);

app.use(express.static('../frontend'));

app.get('/', (req, res) => {
    res.sendFile('index.html', { root: '../frontend' });
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📱 Acesse: http://localhost:${PORT}`);
});
