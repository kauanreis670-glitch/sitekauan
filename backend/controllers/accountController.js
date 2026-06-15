const User = require('../models/User');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const { loadData, saveData, generateId } = require('../config/store');
const bcrypt = require('bcrypt');

exports.getDashboard = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const account = await Account.findByUserId(req.user.id);
        const saldo = await Account.getSaldo(req.user.id);
        const historico = await Account.getHistorico(account.id);
        
        res.json({
            user: {
                nome_completo: user.nome_completo,
                email: user.email
            },
            account: {
                numero_conta: account.numero_conta,
                agencia: account.agencia
            },
            saldo,
            historico
        });
    } catch (error) {
        console.error('Erro no dashboard:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

exports.buscarBeneficiarioPIX = async (req, res) => {
    try {
        const { chave, tipo } = req.body;
        const user = User.findByPixKey(chave, tipo);
        
        if (!user) {
            return res.status(404).json({ error: 'Beneficiário não encontrado' });
        }
        
        res.json({
            nome_completo: user.nome_completo
        });
    } catch (error) {
        console.error('Erro ao buscar beneficiário:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

exports.realizarPIX = async (req, res) => {
    try {
        const { chave_pix, tipo_chave, valor } = req.body;
        
        const beneficiario = User.findByPixKey(chave_pix, tipo_chave);
        if (!beneficiario) {
            return res.status(404).json({ error: 'Beneficiário não encontrado' });
        }
        
        const account = await Account.findByUserId(req.user.id);
        
        if (account.saldo < valor) {
            return res.status(400).json({ error: 'Saldo insuficiente' });
        }
        
        await Account.updateSaldo(account.id, -valor);
        
        const contaBeneficiario = await Account.findByUserId(beneficiario.id);
        await Account.updateSaldo(contaBeneficiario.id, valor);
        
        const transacao_id = await Transaction.create(account.id, 'pix', -valor, `PIX para ${beneficiario.nome_completo}`);
        await Transaction.createPIX({ transacao_id, chave_pix, tipo_chave, beneficiario_nome: beneficiario.nome_completo });
        
        await Transaction.create(contaBeneficiario.id, 'pix', valor, `PIX de ${(await User.findById(req.user.id)).nome_completo}`);
        
        res.json({ message: 'PIX realizado com sucesso', transacao_id, beneficiario_nome: beneficiario.nome_completo });
    } catch (error) {
        console.error('Erro no PIX:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

exports.getMinhaChavePix = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.json({ 
            chave_pix: user.chave_pix_aleatoria,
            chaves_historico: user.chaves_pix_historico || []
        });
    } catch (error) {
        console.error('Erro ao obter chave PIX:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

exports.gerarNovaChavePix = async (req, res) => {
    try {
        const novaChave = User.gerarNovaChavePix(req.user.id);
        res.json({ chave_pix: novaChave });
    } catch (error) {
        console.error('Erro ao gerar nova chave PIX:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

exports.getPIXHistorico = async (req, res) => {
    try {
        const account = await Account.findByUserId(req.user.id);
        const historico = await Transaction.getPIXHistorico(account.id);
        res.json(historico);
    } catch (error) {
        console.error('Erro no histórico PIX:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

exports.realizarTransferencia = async (req, res) => {
    try {
        const { tipo, banco, agencia, conta, valor, beneficiario_nome } = req.body;
        
        const accounts = loadData('contas');
        const contaDestino = accounts.find(a => a.agencia === agencia && a.numero_conta === conta);
        
        if (!contaDestino) {
            return res.status(404).json({ error: 'Conta não encontrada' });
        }
        
        const account = await Account.findByUserId(req.user.id);
        
        if (account.saldo < valor) {
            return res.status(400).json({ error: 'Saldo insuficiente' });
        }
        
        await Account.updateSaldo(account.id, -valor);
        await Account.updateSaldo(contaDestino.id, valor);
        
        const transacao_id = await Transaction.create(account.id, 'transferencia', -valor, `Transferência para ${beneficiario_nome}`);
        await Transaction.create(contaDestino.id, 'transferencia', valor, `Transferência de ${(await User.findById(req.user.id)).nome_completo}`);
        
        const transferencias = loadData('transferencias');
        transferencias.push({
            id: generateId(transferencias),
            transacao_id,
            tipo_transferencia: tipo,
            banco_destino: banco,
            agencia_destino: agencia,
            conta_destino: conta,
            nome_beneficiario: beneficiario_nome,
            data_transacao: new Date().toISOString()
        });
        saveData('transferencias', transferencias);
        
        res.json({ message: 'Transferência realizada com sucesso', transacao_id, beneficiario_nome });
    } catch (error) {
        console.error('Erro na transferência:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

exports.getTransferenciasHistorico = async (req, res) => {
    try {
        const account = await Account.findByUserId(req.user.id);
        const transacoes = Transaction.findByContaId(account.id);
        const transferencias = loadData('transferencias');
        
        const historico = transacoes.filter(t => t.tipo === 'transferencia').map(t => {
            const detalhe = transferencias.find(tf => tf.transacao_id === t.id);
            return { ...t, ...detalhe };
        });
        
        res.json(historico);
    } catch (error) {
        console.error('Erro no histórico de transferências:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

exports.getEmprestimos = async (req, res) => {
    try {
        const emprestimos = loadData('emprestimos');
        const userEmprestimos = emprestimos.filter(e => e.usuario_id === req.user.id);
        res.json(userEmprestimos);
    } catch (error) {
        console.error('Erro ao obter empréstimos:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

exports.solicitarEmprestimo = async (req, res) => {
    try {
        const { valor, parcelas } = req.body;
        const account = await Account.findByUserId(req.user.id);
        const emprestimos = loadData('emprestimos');
        
        const taxaJuros = 0.015;
        const valorTotal = valor * Math.pow(1 + taxaJuros, parcelas);
        const valorParcela = valorTotal / parcelas;
        
        const novoEmprestimo = {
            id: generateId(emprestimos),
            usuario_id: req.user.id,
            conta_id: account.id,
            valor,
            parcelas,
            valor_parcela: valorParcela,
            valor_total: valorTotal,
            taxa_juros: taxaJuros,
            data_solicitacao: new Date().toISOString(),
            parcela_atual: 0,
            status: 'ativo',
            parcelas_pagas: []
        };
        
        emprestimos.push(novoEmprestimo);
        saveData('emprestimos', emprestimos);
        
        await Account.updateSaldo(account.id, valor);
        await Transaction.create(account.id, 'emprestimo', valor, 'Empréstimo recebido');
        
        res.json({ message: 'Empréstimo solicitado com sucesso', emprestimo: novoEmprestimo });
    } catch (error) {
        console.error('Erro ao solicitar empréstimo:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

exports.pagarParcelaEmprestimo = async (req, res) => {
    try {
        const { emprestimoId } = req.params;
        const emprestimos = loadData('emprestimos');
        const emprestimo = emprestimos.find(e => e.id === parseInt(emprestimoId));
        
        if (!emprestimo) {
            return res.status(404).json({ error: 'Empréstimo não encontrado' });
        }
        
        if (emprestimo.usuario_id !== req.user.id) {
            return res.status(403).json({ error: 'Acesso negado' });
        }
        
        if (emprestimo.parcela_atual >= emprestimo.parcelas) {
            return res.status(400).json({ error: 'Empréstimo já quitado' });
        }
        
        const account = await Account.findByUserId(req.user.id);
        
        if (account.saldo < emprestimo.valor_parcela) {
            return res.status(400).json({ error: 'Saldo insuficiente' });
        }
        
        await Account.updateSaldo(account.id, -emprestimo.valor_parcela);
        await Transaction.create(account.id, 'pagamento_emprestimo', -emprestimo.valor_parcela, `Parcela ${emprestimo.parcela_atual + 1} de empréstimo`);
        
        emprestimo.parcela_atual += 1;
        emprestimo.parcelas_pagas.push({
            data_pagamento: new Date().toISOString(),
            valor_pago: emprestimo.valor_parcela
        });
        
        if (emprestimo.parcela_atual >= emprestimo.parcelas) {
            emprestimo.status = 'quitado';
        }
        
        saveData('emprestimos', emprestimos);
        
        res.json({ message: 'Parcela paga com sucesso', emprestimo });
    } catch (error) {
        console.error('Erro ao pagar parcela:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

exports.getPerfil = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const account = await Account.findByUserId(req.user.id);
        
        res.json({
            nome_completo: user.nome_completo,
            cpf: user.cpf,
            data_nascimento: user.data_nascimento,
            email: user.email,
            telefone: user.telefone,
            endereco: user.endereco,
            numero_conta: account.numero_conta,
            agencia: account.agencia
        });
    } catch (error) {
        console.error('Erro no perfil:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

exports.atualizarPerfil = async (req, res) => {
    try {
        await User.update(req.user.id, req.body);
        res.json({ message: 'Perfil atualizado com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

exports.alterarSenha = async (req, res) => {
    try {
        const { senha_atual, nova_senha, confirmar_nova_senha } = req.body;
        
        if (nova_senha !== confirmar_nova_senha) {
            return res.status(400).json({ error: 'Senhas não conferem' });
        }
        
        const user = await User.findById(req.user.id);
        const passwordMatch = await bcrypt.compare(senha_atual, user.senha_hash);
        
        if (!passwordMatch) {
            return res.status(400).json({ error: 'Senha atual incorreta' });
        }
        
        await User.updatePassword(req.user.id, nova_senha);
        res.json({ message: 'Senha alterada com sucesso' });
    } catch (error) {
        console.error('Erro ao alterar senha:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};