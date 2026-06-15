# AAA Bank - Sistema de Banco Digital

Um sistema completo de banco digital desenvolvido para demonstração acadêmica.

## Informações da Empresa

- **Nome**: AAA Bank
- **Slogan**: Seu dinheiro, sua liberdade
- **Cores**: Roxo escuro (#5B21B6), Roxo claro (#8B5CF6), Branco (#FFFFFF), Cinza claro (#F3F4F6)

## Estrutura do Projeto

```
site/
├── backend/
│   ├── config/
│   │   └── store.js        # Sistema de armazenamento em JSON
│   │   └── seed.js         # Inicialização do banco de dados
│   ├── controllers/
│   │   ├── authController.js
│   │   └── accountController.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Account.js
│   │   └── Transaction.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── account.js
│   ├── data/               # Dados em JSON (gerado automaticamente)
│   ├── .env
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── app.js
│   └── index.html
└── README.md
```

## Funcionalidades

### Sistema de Cadastro e Autenticação
- Cadastro completo de usuário (nome, CPF, data de nascimento, e-mail, telefone, endereço, senha)
- Login por CPF ou e-mail
- Logout seguro
- Recuperação de senha (interface)
- Lembrar acesso

### Dashboard Principal
- Visualização de saldo disponível
- Histórico de transações
- Informações da conta

### PIX
- Transferência PIX por CPF/e-mail/telefone/chave aleatória
- Histórico de PIX

### Cartões
- Visualização de cartão virtual e físico
- Bloquear/desbloquear cartão
- Alterar limite
- Visualizar fatura

### Empréstimos
- Simulação de empréstimo
- Solicitação de empréstimo
- Parcelamento

### Investimentos
- Poupança
- CDB
- Tesouro Direto
- Fundos de investimento

### Perfil
- Alterar dados pessoais
- Alterar senha
- Configurações

### Segurança
- Autenticação JWT
- Criptografia de senhas (bcrypt)
- Proteção contra XSS
- Rate limiting
- Logs de acesso

## Tecnologias Utilizadas

### Frontend
- HTML5
- CSS3
- JavaScript (ES6+)
- Bootstrap 5.3.2

### Backend
- Node.js
- Express.js
- Armazenamento em arquivos JSON
- JWT (jsonwebtoken)
- bcrypt (criptografia de senhas)
- helmet (segurança)
- xss-clean (proteção XSS)
- express-rate-limit (limitação de requisições)
- cors

## Instalação e Execução

### Pré-requisitos
- Node.js (versão 16+)

### Passos de Instalação

1. Clone este repositório
2. Instale as dependências do backend:
   ```bash
   cd backend
   npm install
   ```
3. Inicie o servidor:
   ```bash
   npm start
   ```
4. Acesse o sistema em http://localhost:3000

O banco de dados em JSON é criado automaticamente na pasta `backend/data` com dados de exemplo!

## Usuário Demo

Para testar o sistema, use a conta demo:
- **E-mail**: `joao@exemplo.com`
- **Senha**: `123456`

## Configuração do Ambiente

Edite o arquivo `backend/.env` com suas configurações:

```env
PORT=3000
JWT_SECRET=sua_chave_secreta_super_segura
SESSION_SECRET=outra_chave_secreta
```

## Armazenamento de Dados

Os dados são armazenados em arquivos JSON na pasta `backend/data`. Os arquivos são:
- `usuarios.json`
- `contas.json`
- `cartoes.json`
- `transacoes.json`
- `pix.json`
- `transferencias.json`
- `pagamentos.json`
- `emprestimos.json`
- `investimentos.json`
- `logs_acesso.json`
- `configuracoes.json`

## Endpoints da API

### Autenticação
- `POST /api/auth/register` - Cadastrar usuário
- `POST /api/auth/login` - Login

### Conta
- `GET /api/account/dashboard` - Obter dados do dashboard
- `POST /api/account/pix` - Realizar PIX
- `GET /api/account/pix/historico` - Histórico de PIX
- `GET /api/account/perfil` - Dados do perfil
- `PUT /api/account/perfil` - Atualizar perfil
- `PUT /api/account/senha` - Alterar senha

## Manual do Usuário

### 1. Cadastro
1. Acesse a página inicial
2. Clique em "Não tem conta? Cadastre-se"
3. Preencha todos os campos
4. Clique em "Cadastrar"

### 2. Login
1. Digite seu CPF ou e-mail
2. Digite sua senha
3. (Opcional) Marque "Lembrar acesso"
4. Clique em "Entrar"

### 3. Realizar PIX
1. No menu lateral, clique em "PIX"
2. Selecione o tipo de chave
3. Digite a chave PIX
4. Informe o nome do beneficiário
5. Digite o valor
6. Clique em "Enviar PIX"

### 4. Visualizar Cartões
1. No menu lateral, clique em "Cartões"
2. Visualize seus cartões virtual e físico
3. Gerencie limites e bloqueios

## Licença

Este projeto é para fins educacionais.
