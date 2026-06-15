-- Banco de Dados: AAA Bank (Infinity Bank)
-- Data: 15/06/2026
-- Descrição: Schema completo do banco digital para PostgreSQL/NEON

-- Criação do banco de dados (no NEON, você usa o banco padrão)
-- CREATE DATABASE aaa_bank; -- Não necessário no NEON, use o banco padrão

-- Tabela: Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome_completo VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) NOT NULL UNIQUE,
    data_nascimento DATE NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    telefone VARCHAR(20) NOT NULL,
    endereco TEXT NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    foto_perfil VARCHAR(255) DEFAULT NULL,
    twofa_enabled BOOLEAN DEFAULT FALSE,
    twofa_secret VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela: Contas
CREATE TABLE IF NOT EXISTS contas (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    numero_conta VARCHAR(20) NOT NULL UNIQUE,
    agencia VARCHAR(10) NOT NULL,
    tipo_conta VARCHAR(20) NOT NULL DEFAULT 'corrente',
    saldo NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'ativa',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabela: Cartoes
CREATE TABLE IF NOT EXISTS cartoes (
    id SERIAL PRIMARY KEY,
    conta_id INTEGER NOT NULL,
    numero_cartao VARCHAR(20) NOT NULL UNIQUE,
    nome_impresso VARCHAR(255) NOT NULL,
    validade VARCHAR(7) NOT NULL,
    cvv VARCHAR(4) NOT NULL,
    tipo VARCHAR(20) NOT NULL,
    limite NUMERIC(15,2) NOT NULL DEFAULT 5000.00,
    limite_disponivel NUMERIC(15,2) NOT NULL DEFAULT 5000.00,
    status VARCHAR(20) NOT NULL DEFAULT 'ativo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conta_id) REFERENCES contas(id) ON DELETE CASCADE
);

-- Tabela: Transacoes
CREATE TABLE IF NOT EXISTS transacoes (
    id SERIAL PRIMARY KEY,
    conta_id INTEGER NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    valor NUMERIC(15,2) NOT NULL,
    descricao TEXT,
    data_transacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conta_id) REFERENCES contas(id)
);

-- Tabela: PIX
CREATE TABLE IF NOT EXISTS pix (
    id SERIAL PRIMARY KEY,
    transacao_id INTEGER NOT NULL,
    chave_pix VARCHAR(255) NOT NULL,
    tipo_chave VARCHAR(20) NOT NULL,
    beneficiario_nome VARCHAR(255) NOT NULL,
    comprovante_path VARCHAR(255),
    FOREIGN KEY (transacao_id) REFERENCES transacoes(id)
);

-- Tabela: Transferencias
CREATE TABLE IF NOT EXISTS transferencias (
    id SERIAL PRIMARY KEY,
    transacao_id INTEGER NOT NULL,
    tipo_transferencia VARCHAR(20) NOT NULL,
    agencia_destino VARCHAR(10) NOT NULL,
    conta_destino VARCHAR(20) NOT NULL,
    banco_destino VARCHAR(100),
    nome_beneficiario VARCHAR(255) NOT NULL,
    agendado BOOLEAN DEFAULT FALSE,
    data_agendada DATE,
    FOREIGN KEY (transacao_id) REFERENCES transacoes(id)
);

-- Tabela: Pagamentos
CREATE TABLE IF NOT EXISTS pagamentos (
    id SERIAL PRIMARY KEY,
    transacao_id INTEGER NOT NULL,
    codigo_barras VARCHAR(44) NOT NULL,
    data_vencimento DATE NOT NULL,
    beneficiario VARCHAR(255) NOT NULL,
    FOREIGN KEY (transacao_id) REFERENCES transacoes(id)
);

-- Tabela: Emprestimos
CREATE TABLE IF NOT EXISTS emprestimos (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    valor_solicitado NUMERIC(15,2) NOT NULL,
    taxa_juros NUMERIC(5,2) NOT NULL,
    numero_parcelas INTEGER NOT NULL,
    valor_parcela NUMERIC(15,2) NOT NULL,
    valor_total NUMERIC(15,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'solicitado',
    data_solicitacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Tabela: Investimentos
CREATE TABLE IF NOT EXISTS investimentos (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    tipo_investimento VARCHAR(50) NOT NULL,
    valor_investido NUMERIC(15,2) NOT NULL,
    taxa_rendimento NUMERIC(5,2) NOT NULL,
    data_aplicacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_vencimento DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'ativo',
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Tabela: Logs de Acesso
CREATE TABLE IF NOT EXISTS logs_acesso (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    data_acesso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sucesso BOOLEAN NOT NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Tabela: Configuracoes
CREATE TABLE IF NOT EXISTS configuracoes (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    notificacoes_email BOOLEAN DEFAULT TRUE,
    notificacoes_sms BOOLEAN DEFAULT TRUE,
    tema VARCHAR(20) DEFAULT 'claro',
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Inserir dados de exemplo
-- Usuário demo
INSERT INTO usuarios (nome_completo, cpf, data_nascimento, email, telefone, endereco, senha_hash)
VALUES ('João da Silva', '123.456.789-00', '1990-01-01', 'joao@exemplo.com', '(11) 98765-4321', 'Rua das Flores, 123 - São Paulo/SP', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy');

-- Conta demo
INSERT INTO contas (usuario_id, numero_conta, agencia, saldo)
VALUES (1, '12345-6', '0001', 10000.00);

-- Cartão demo
INSERT INTO cartoes (conta_id, numero_cartao, nome_impresso, validade, cvv, tipo)
VALUES (1, '5155 3210 9876 5432', 'JOÃO DA SILVA', '12/28', '123', 'fisico');
