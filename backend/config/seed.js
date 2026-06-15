const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const { loadData, saveData } = require('./store');

function gerarChavePixAleatoria() {
    const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < 32; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

async function seedDatabase() {
    console.log('Inicializando banco de dados...');

    const chaveJoao = gerarChavePixAleatoria();
    const chaveMaria = gerarChavePixAleatoria();

    const users = [
        {
            id: 1,
            nome_completo: 'João da Silva',
            cpf: '123.456.789-00',
            data_nascimento: '1990-01-01',
            email: 'joao@exemplo.com',
            telefone: '(11) 98765-4321',
            endereco: 'Rua das Flores, 123 - São Paulo/SP',
            senha_hash: await bcrypt.hash('123456', 10),
            foto_perfil: null,
            twofa_enabled: false,
            twofa_secret: null,
            chave_pix_aleatoria: chaveJoao,
            chaves_pix_historico: [
                { chave: chaveJoao, data_geracao: new Date().toISOString() }
            ],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        },
        {
            id: 2,
            nome_completo: 'Maria Souza',
            cpf: '987.654.321-00',
            data_nascimento: '1995-05-15',
            email: 'maria@exemplo.com',
            telefone: '(11) 91234-5678',
            endereco: 'Av. Paulista, 456 - São Paulo/SP',
            senha_hash: await bcrypt.hash('123456', 10),
            foto_perfil: null,
            twofa_enabled: false,
            twofa_secret: null,
            chave_pix_aleatoria: chaveMaria,
            chaves_pix_historico: [
                { chave: chaveMaria, data_geracao: new Date().toISOString() }
            ],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }
    ];

    const accounts = [
        {
            id: 1,
            usuario_id: 1,
            numero_conta: '12345-6',
            agencia: '0001',
            tipo_conta: 'corrente',
            saldo: 200.00,
            status: 'ativa',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        },
        {
            id: 2,
            usuario_id: 2,
            numero_conta: '65432-1',
            agencia: '0001',
            tipo_conta: 'corrente',
            saldo: 200.00,
            status: 'ativa',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }
    ];

    const cards = [
        {
            id: 1,
            conta_id: 1,
            numero_cartao: '5155 3210 9876 5432',
            nome_impresso: 'JOÃO DA SILVA',
            validade: '12/28',
            cvv: '123',
            tipo: 'fisico',
            limite: 5000.00,
            limite_disponivel: 5000.00,
            status: 'ativo',
            created_at: new Date().toISOString()
        }
    ];

    const configs = [
        {
            id: 1,
            usuario_id: 1,
            notificacoes_email: true,
            notificacoes_sms: true,
            tema: 'claro'
        },
        {
            id: 2,
            usuario_id: 2,
            notificacoes_email: true,
            notificacoes_sms: true,
            tema: 'claro'
        }
    ];

    saveData('usuarios', users);
    saveData('contas', accounts);
    saveData('cartoes', cards);
    saveData('configuracoes', configs);
    saveData('transacoes', []);
    saveData('pix', []);
    saveData('transferencias', []);
    saveData('pagamentos', []);
    saveData('emprestimos', []);
    saveData('investimentos', []);
    saveData('logs_acesso', []);

    console.log('✅ Banco de dados inicializado com sucesso!');
    console.log('Usuários demo:');
    console.log('  E-mail: joao@exemplo.com | Senha: 123456');
    console.log('  E-mail: maria@exemplo.com | Senha: 123456');
}

const users = loadData('usuarios');
if (users.length === 0) {
    seedDatabase();
} else {
    console.log('ℹ️  Banco de dados já inicializado.');
}
