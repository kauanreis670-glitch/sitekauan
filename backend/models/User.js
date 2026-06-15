const { loadData, saveData, generateId } = require('../config/store');
const bcrypt = require('bcrypt');

function gerarChavePixAleatoria() {
    const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < 32; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

class User {
    static async create(userData) {
        const { nome_completo, cpf, data_nascimento, email, telefone, endereco, senha } = userData;
        const users = loadData('usuarios');
        const accounts = loadData('contas');
        const configs = loadData('configuracoes');
        
        const senha_hash = await bcrypt.hash(senha, 10);
        const chavePix = gerarChavePixAleatoria();
        
        const newUser = {
            id: generateId(users),
            nome_completo,
            cpf,
            data_nascimento,
            email,
            telefone,
            endereco,
            senha_hash,
            foto_perfil: null,
            twofa_enabled: false,
            twofa_secret: null,
            chave_pix_aleatoria: chavePix,
            chaves_pix_historico: [
                { chave: chavePix, data_geracao: new Date().toISOString() }
            ],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        users.push(newUser);
        saveData('usuarios', users);
        
        const conta_numero = Math.floor(10000 + Math.random() * 90000) + '-' + Math.floor(Math.random() * 10);
        const newAccount = {
            id: generateId(accounts),
            usuario_id: newUser.id,
            numero_conta: conta_numero,
            agencia: '0001',
            tipo_conta: 'corrente',
            saldo: 200.00,
            status: 'ativa',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        accounts.push(newAccount);
        saveData('contas', accounts);
        
        const newConfig = {
            id: generateId(configs),
            usuario_id: newUser.id,
            notificacoes_email: true,
            notificacoes_sms: true,
            tema: 'claro'
        };
        
        configs.push(newConfig);
        saveData('configuracoes', configs);
        
        return newUser.id;
    }
    
    static findByEmail(email) {
        const users = loadData('usuarios');
        return users.find(u => u.email === email);
    }
    
    static findByCpf(cpf) {
        const users = loadData('usuarios');
        return users.find(u => u.cpf === cpf);
    }
    
    static findById(id) {
        const users = loadData('usuarios');
        return users.find(u => u.id === id);
    }
    
    static findByPixKey(chave, tipo) {
        const users = loadData('usuarios');
        if (tipo === 'cpf') return users.find(u => u.cpf === chave);
        if (tipo === 'email') return users.find(u => u.email === chave);
        if (tipo === 'telefone') return users.find(u => u.telefone === chave);
        if (tipo === 'aleatoria') return users.find(u => u.chave_pix_aleatoria === chave || u.chaves_pix_historico?.some(k => k.chave === chave));
        return null;
    }
    
    static update(id, userData) {
        const users = loadData('usuarios');
        const userIndex = users.findIndex(u => u.id === id);
        
        if (userIndex !== -1) {
            users[userIndex] = {
                ...users[userIndex],
                ...userData,
                updated_at: new Date().toISOString()
            };
            saveData('usuarios', users);
        }
    }
    
    static gerarNovaChavePix(id) {
        const users = loadData('usuarios');
        const userIndex = users.findIndex(u => u.id === id);
        
        if (userIndex !== -1) {
            const novaChave = gerarChavePixAleatoria();
            users[userIndex].chave_pix_aleatoria = novaChave;
            
            if (!users[userIndex].chaves_pix_historico) {
                users[userIndex].chaves_pix_historico = [];
            }
            
            users[userIndex].chaves_pix_historico.push({
                chave: novaChave,
                data_geracao: new Date().toISOString()
            });
            
            users[userIndex].updated_at = new Date().toISOString();
            saveData('usuarios', users);
            return novaChave;
        }
        return null;
    }
    
    static async updatePassword(id, novaSenha) {
        const users = loadData('usuarios');
        const userIndex = users.findIndex(u => u.id === id);
        
        if (userIndex !== -1) {
            const senha_hash = await bcrypt.hash(novaSenha, 10);
            users[userIndex] = {
                ...users[userIndex],
                senha_hash,
                updated_at: new Date().toISOString()
            };
            saveData('usuarios', users);
        }
    }
}

module.exports = User;