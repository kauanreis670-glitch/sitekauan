const User = require('../models/User');
const Account = require('../models/Account');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { loadData, saveData, generateId } = require('../config/store');

exports.register = async (req, res) => {
    try {
        const { nome_completo, cpf, data_nascimento, email, telefone, endereco, senha, confirmar_senha } = req.body;
        
        if (senha !== confirmar_senha) {
            return res.status(400).json({ error: 'Senhas não conferem' });
        }
        
        const existingEmail = User.findByEmail(email);
        if (existingEmail) {
            return res.status(400).json({ error: 'E-mail já cadastrado' });
        }
        
        const existingCpf = User.findByCpf(cpf);
        if (existingCpf) {
            return res.status(400).json({ error: 'CPF já cadastrado' });
        }
        
        const userId = await User.create({ nome_completo, cpf, data_nascimento, email, telefone, endereco, senha });
        
        const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '24h' });
        
        // Registra log de acesso
        const logs = loadData('logs_acesso');
        logs.push({
            id: generateId(logs),
            usuario_id: userId,
            ip_address: req.ip,
            user_agent: req.get('User-Agent'),
            data_acesso: new Date().toISOString(),
            sucesso: true
        });
        saveData('logs_acesso', logs);
        
        res.status(201).json({ message: 'Cadastro realizado com sucesso', token });
    } catch (error) {
        console.error('Erro no cadastro:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

exports.login = async (req, res) => {
    try {
        const { identificador, senha, lembrar } = req.body;
        
        let user = User.findByEmail(identificador);
        if (!user) {
            user = User.findByCpf(identificador);
        }
        
        // Registra log de acesso (mesmo se falhar)
        const logs = loadData('logs_acesso');
        
        if (!user) {
            logs.push({
                id: generateId(logs),
                usuario_id: 0,
                ip_address: req.ip,
                user_agent: req.get('User-Agent'),
                data_acesso: new Date().toISOString(),
                sucesso: false
            });
            saveData('logs_acesso', logs);
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }
        
        const passwordMatch = await bcrypt.compare(senha, user.senha_hash);
        
        if (!passwordMatch) {
            logs.push({
                id: generateId(logs),
                usuario_id: user.id,
                ip_address: req.ip,
                user_agent: req.get('User-Agent'),
                data_acesso: new Date().toISOString(),
                sucesso: false
            });
            saveData('logs_acesso', logs);
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }
        
        const expiresIn = lembrar ? '7d' : '24h';
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn });
        
        // Registra log de sucesso
        logs.push({
            id: generateId(logs),
            usuario_id: user.id,
            ip_address: req.ip,
            user_agent: req.get('User-Agent'),
            data_acesso: new Date().toISOString(),
            sucesso: true
        });
        saveData('logs_acesso', logs);
        
        res.json({ 
            message: 'Login realizado com sucesso', 
            token,
            user: {
                id: user.id,
                nome_completo: user.nome_completo,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};
