const API_BASE = '/api';

let token = localStorage.getItem('token');
let currentPage = 'login';
let emprestimoSimulado = null;
let cartaoFisicoBloqueado = false;
let cartaoVirtualBloqueado = false;

function setAuthToken(newToken) {
    token = newToken;
    if (newToken) {
        localStorage.setItem('token', newToken);
    } else {
        localStorage.removeItem('token');
    }
}

async function apiRequest(endpoint, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers
    });
    
    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.error || 'Erro na requisição');
    }
    
    return data;
}

function showPage(page) {
    console.log('Mostrando página:', page);
    
    // 1. Esconde todas as páginas iniciais (login, cadastro, esqueci-senha)
    document.querySelectorAll('.page').forEach(p => {
        p.style.display = 'none';
    });
    
    // 2. Esconde o main-container (o dashboard todo)
    document.getElementById('main-container').style.display = 'none';
    
    // 3. Se for uma das páginas iniciais (login, cadastro, esqueci-senha), mostra apenas essa
    if (page === 'login' || page === 'cadastro' || page === 'esqueci-senha') {
        document.getElementById(page + '-page').style.display = 'block';
    } else {
        // 4. Se for uma página do dashboard: mostra o main-container, e a página correta dentro dele
        document.getElementById('main-container').style.display = 'flex';
        
        // Esconde todas as páginas dentro do main-container
        document.getElementById('main-container').querySelectorAll('.main-content > div').forEach(section => {
            section.style.display = 'none';
        });
        
        // Mostra a página correta (ex: page='pix' → 'pix-page')
        const targetSection = document.getElementById(page + '-page');
        if (targetSection) {
            targetSection.style.display = 'block';
        }
        
        // Atualiza o menu ativo
        document.querySelectorAll('.sidebar .nav-link').forEach(link => {
            link.classList.remove('active');
        });
        const activeLink = document.getElementById('nav-' + page);
        if (activeLink) {
            activeLink.classList.add('active');
        }
        
        // Carrega os dados específicos da página
        loadDashboard();
        if (page === 'perfil') {
            loadPerfil();
        }
        if (page === 'pix') {
            loadMinhaChavePix();
            loadPIXHistorico();
        }
        if (page === 'transferencias') {
            loadTransferenciasHistorico();
        }
        if (page === 'emprestimos') {
            loadEmprestimos();
        }
    }
    
    currentPage = page;
}

function showToast(message, type = 'info') {
    const toastDiv = document.createElement('div');
    toastDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 20px 25px;
        border-radius: 10px;
        color: white;
        font-size: 16px;
        font-weight: 600;
        z-index: 99999;
        max-width: 350px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.3);
        animation: slideIn 0.3s ease;
    `;
    
    if (type === 'success') {
        toastDiv.style.backgroundColor = '#10B981';
    } else if (type === 'danger') {
        toastDiv.style.backgroundColor = '#EF4444';
    } else if (type === 'warning') {
        toastDiv.style.backgroundColor = '#F59E0B';
    } else {
        toastDiv.style.backgroundColor = '#5B21B6';
    }
    
    toastDiv.textContent = message;
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(toastDiv);
    
    setTimeout(() => {
        toastDiv.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => {
            toastDiv.remove();
        }, 300);
    }, 4000);
}

function formatCurrency(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

async function handleLogin(e) {
    e.preventDefault();
    try {
        console.log('Tentando logar...');
        showToast('Entrando...', 'info');
        const data = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({
                identificador: document.getElementById('login-identificador').value,
                senha: document.getElementById('login-senha').value,
                lembrar: document.getElementById('login-lembrar').checked
            })
        });
        console.log('Login sucesso!', data);
        setAuthToken(data.token);
        showToast('Login realizado com sucesso!', 'success');
        alert('Login realizado com sucesso!'); // Backup pra garantir
        showPage('dashboard');
    } catch (error) {
        console.error('Erro login:', error);
        showToast(error.message, 'danger');
        alert(error.message); // Backup pra garantir
    }
}

async function handleCadastro(e) {
    e.preventDefault();
    try {
        console.log('Tentando cadastrar...');
        showToast('Cadastrando...', 'info');
        const data = await apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify({
                nome_completo: document.getElementById('cadastro-nome').value,
                cpf: document.getElementById('cadastro-cpf').value,
                data_nascimento: document.getElementById('cadastro-nascimento').value,
                email: document.getElementById('cadastro-email').value,
                telefone: document.getElementById('cadastro-telefone').value,
                endereco: document.getElementById('cadastro-endereco').value,
                senha: document.getElementById('cadastro-senha').value,
                confirmar_senha: document.getElementById('cadastro-confirmar-senha').value
            })
        });
        console.log('Cadastro sucesso!', data);
        setAuthToken(data.token);
        showToast('Cadastro realizado com sucesso!', 'success');
        alert('Cadastro realizado com sucesso!'); // Backup pra garantir
        showPage('dashboard');
    } catch (error) {
        console.error('Erro cadastro:', error);
        showToast(error.message, 'danger');
        alert(error.message); // Backup pra garantir
    }
}

async function loadDashboard() {
    try {
        const data = await apiRequest('/account/dashboard');
        document.getElementById('user-nome').textContent = data.user.nome_completo;
        document.getElementById('saldo-valor').textContent = formatCurrency(data.saldo);
        document.getElementById('conta-numero').textContent = `${data.account.agencia} / ${data.account.numero_conta}`;
        
        const historicoDiv = document.getElementById('historico-transacoes');
        if (data.historico.length === 0) {
            historicoDiv.innerHTML = '<p class="text-muted">Nenhuma transação realizada ainda.</p>';
            return;
        }
        
        historicoDiv.innerHTML = data.historico.map(t => `
            <div class="list-group-item">
                <div class="d-flex justify-content-between">
                    <div>
                        <h6 class="mb-1">${t.descricao || t.tipo}</h6>
                        <small class="text-muted">${new Date(t.data_transacao).toLocaleDateString('pt-BR')}</small>
                    </div>
                    <span class="${t.valor < 0 ? 'text-danger' : 'text-success'}">
                        ${t.valor < 0 ? '' : '+'}${formatCurrency(t.valor)}
                    </span>
                </div>
            </div>
        `).join('');
        
        const cartaoNome = data.user.nome_completo.toUpperCase();
        document.getElementById('cartao-fisico-nome').textContent = cartaoNome;
        document.getElementById('cartao-virtual-nome').textContent = cartaoNome;
        
    } catch (error) {
        console.error(error);
        showToast(error.message, 'danger');
    }
}

async function buscarBeneficiarioPIX() {
    const chave = document.getElementById('pix-chave').value;
    
    if (!chave) {
        document.getElementById('pix-beneficiario').value = '';
        return;
    }
    
    try {
        const data = await apiRequest('/account/pix/buscar-beneficiario', {
            method: 'POST',
            body: JSON.stringify({ chave, tipo: 'aleatoria' })
        });
        document.getElementById('pix-beneficiario').value = data.nome_completo;
    } catch (error) {
        document.getElementById('pix-beneficiario').value = '';
        showToast('Beneficiário não encontrado', 'danger');
    }
}

async function handlePIX(e) {
    e.preventDefault();
    try {
        showToast('Enviando PIX...', 'info');
        const data = await apiRequest('/account/pix', {
            method: 'POST',
            body: JSON.stringify({
                chave_pix: document.getElementById('pix-chave').value,
                tipo_chave: 'aleatoria',
                valor: parseFloat(document.getElementById('pix-valor').value)
            })
        });
        showToast(`PIX ENVIADO PARA: ${data.beneficiario_nome}`, 'success');
        loadDashboard();
        loadPIXHistorico();
        document.getElementById('pix-form').reset();
        document.getElementById('pix-beneficiario').value = '';
    } catch (error) {
        showToast(error.message, 'danger');
    }
}

async function loadMinhaChavePix() {
    try {
        const data = await apiRequest('/account/pix/minha-chave');
        document.getElementById('minha-chave-pix').textContent = data.chave_pix;
        
        const historicoChavesDiv = document.getElementById('historico-chaves-pix');
        if (data.chaves_historico.length === 0) {
            historicoChavesDiv.innerHTML = '<p class="text-muted">Nenhuma chave gerada ainda.</p>';
            return;
        }
        
        historicoChavesDiv.innerHTML = data.chaves_historico.slice().reverse().map(chaveData => `
            <div class="list-group-item">
                <div class="d-flex justify-content-between align-items-center">
                    <div class="text-break small">${chaveData.chave}</div>
                    <small class="text-muted">${new Date(chaveData.data_geracao).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</small>
                </div>
            </div>
        `).join('');
    } catch (error) {
        showToast(error.message, 'danger');
    }
}

function handleCopiarChavePix() {
    const chave = document.getElementById('minha-chave-pix').textContent;
    navigator.clipboard.writeText(chave).then(() => {
        showToast('Chave PIX copiada para a área de transferência!', 'success');
    }).catch(err => {
        showToast('Erro ao copiar chave PIX.', 'danger');
    });
}

async function handleGerarNovaChavePix() {
    try {
        showToast('Gerando nova chave...', 'info');
        const data = await apiRequest('/account/pix/gerar-nova-chave', {
            method: 'POST'
        });
        document.getElementById('minha-chave-pix').textContent = data.chave_pix;
        loadMinhaChavePix();
        showToast('Nova chave PIX gerada com sucesso!', 'success');
    } catch (error) {
        showToast(error.message, 'danger');
    }
}

async function loadPIXHistorico() {
    try {
        const historico = await apiRequest('/account/pix/historico');
        const divHistorico = document.getElementById('pix-historico');
        
        if (historico.length === 0) {
            divHistorico.innerHTML = '<p class="text-muted">Nenhuma transação PIX realizada.</p>';
            return;
        }
        
        divHistorico.innerHTML = historico.map(t => `
            <div class="list-group-item">
                <div class="d-flex justify-content-between">
                    <div>
                        <h6 class="mb-1">${t.descricao || t.tipo}</h6>
                        <small class="text-muted">${new Date(t.data_transacao).toLocaleDateString('pt-BR')}</small>
                    </div>
                    <span class="${t.valor < 0 ? 'text-danger' : 'text-success'}">
                        ${t.valor < 0 ? '' : '+'}${formatCurrency(t.valor)}
                    </span>
                </div>
            </div>
        `).join('');
    } catch (error) {
        showToast(error.message, 'danger');
    }
}

async function handleTransferencia(e) {
    e.preventDefault();
    try {
        showToast('Realizando transferência...', 'info');
        const data = await apiRequest('/account/transferencias', {
            method: 'POST',
            body: JSON.stringify({
                tipo: document.getElementById('transferencia-tipo').value,
                banco: document.getElementById('transferencia-banco').value,
                agencia: document.getElementById('transferencia-agencia').value,
                conta: document.getElementById('transferencia-conta').value,
                valor: parseFloat(document.getElementById('transferencia-valor').value),
                beneficiario_nome: document.getElementById('transferencia-beneficiario').value
            })
        });
        showToast(`TRANSFERÊNCIA DE ${formatCurrency(parseFloat(document.getElementById('transferencia-valor').value))} PARA ${data.beneficiario_nome} REALIZADA!`, 'success');
        loadDashboard();
        loadTransferenciasHistorico();
        document.getElementById('transferencia-form').reset();
    } catch (error) {
        showToast(error.message, 'danger');
    }
}

async function loadTransferenciasHistorico() {
    try {
        const historico = await apiRequest('/account/transferencias/historico');
        const divHistorico = document.getElementById('transferencias-historico');
        
        if (historico.length === 0) {
            divHistorico.innerHTML = '<p class="text-muted">Nenhuma transferência realizada.</p>';
            return;
        }
        
        divHistorico.innerHTML = historico.map(t => `
            <div class="list-group-item">
                <div class="d-flex justify-content-between">
                    <div>
                        <h6 class="mb-1">${t.descricao || t.tipo}</h6>
                        <small class="text-muted">${new Date(t.data_transacao).toLocaleDateString('pt-BR')} - ${t.tipo_transferencia?.toUpperCase()}</small>
                    </div>
                    <span class="${t.valor < 0 ? 'text-danger' : 'text-success'}">
                        ${t.valor < 0 ? '' : '+'}${formatCurrency(t.valor)}
                    </span>
                </div>
            </div>
        `).join('');
    } catch (error) {
        showToast(error.message, 'danger');
    }
}

function handleSimularEmprestimo(e) {
    e.preventDefault();
    const valor = parseFloat(document.getElementById('emprestimo-valor').value);
    const parcelas = parseInt(document.getElementById('emprestimo-parcelas').value);
    const taxaJuros = 0.015;
    const valorTotal = valor * Math.pow(1 + taxaJuros, parcelas);
    const valorParcela = valorTotal / parcelas;
    
    emprestimoSimulado = { valor, parcelas, valorTotal, valorParcela };
    
    const resultadoDiv = document.getElementById('emprestimo-simulacao-resultado');
    resultadoDiv.innerHTML = `
        <h6>Resultado da Simulação</h6>
        <p class="mb-1"><strong>Valor do empréstimo:</strong> ${formatCurrency(valor)}</p>
        <p class="mb-1"><strong>Número de parcelas:</strong> ${parcelas}x</p>
        <p class="mb-1"><strong>Taxa de juros:</strong> 1.5% ao mês</p>
        <p class="mb-1"><strong>Valor da parcela:</strong> ${formatCurrency(valorParcela)}</p>
        <p><strong>Valor total a pagar:</strong> ${formatCurrency(valorTotal)}</p>
    `;
    
    document.getElementById('btn-solicitar-emprestimo').disabled = false;
    showToast('Simulação realizada com sucesso!', 'success');
}

async function handleSolicitarEmprestimo(e) {
    e.preventDefault();
    try {
        showToast('Solicitando empréstimo...', 'info');
        await apiRequest('/account/emprestimos', {
            method: 'POST',
            body: JSON.stringify({
                valor: emprestimoSimulado.valor,
                parcelas: emprestimoSimulado.parcelas
            })
        });
        showToast('EMPRÉSTIMO SOLICITADO! VALOR DEPOSITADO NA CONTA!', 'success');
        loadDashboard();
        loadEmprestimos();
        document.getElementById('emprestimo-simular-form').reset();
        document.getElementById('emprestimo-simulacao-resultado').innerHTML = '<p class="text-muted mb-0">Preencha os campos para simular.</p>';
        document.getElementById('btn-solicitar-emprestimo').disabled = true;
        emprestimoSimulado = null;
    } catch (error) {
        showToast(error.message, 'danger');
    }
}

async function handlePagarParcela(emprestimoId) {
    try {
        showToast('Pagando parcela...', 'info');
        await apiRequest(`/account/emprestimos/${emprestimoId}/pagar-parcela`, {
            method: 'POST'
        });
        showToast('PARCELA PAGA COM SUCESSO!', 'success');
        loadDashboard();
        loadEmprestimos();
    } catch (error) {
        showToast(error.message, 'danger');
    }
}

async function loadEmprestimos() {
    try {
        const emprestimos = await apiRequest('/account/emprestimos');
        const divHistorico = document.getElementById('emprestimos-historico');
        
        if (emprestimos.length === 0) {
            divHistorico.innerHTML = '<p class="text-muted">Nenhum empréstimo solicitado.</p>';
            return;
        }
        
        divHistorico.innerHTML = emprestimos.map(emp => `
            <div class="list-group-item">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h6 class="mb-1">Empréstimo de ${formatCurrency(emp.valor)}</h6>
                        <p class="mb-1 small"><strong>Parcelas:</strong> ${emp.parcela_atual}/${emp.parcelas}</p>
                        <p class="mb-1 small"><strong>Parcela mensal:</strong> ${formatCurrency(emp.valor_parcela)}</p>
                        <p class="mb-0 small"><strong>Valor total:</strong> ${formatCurrency(emp.valor_total)}</p>
                        <p class="mb-0 small"><strong>Status:</strong> <span class="badge ${emp.status === 'quitado' ? 'bg-success' : 'bg-primary'}">${emp.status === 'quitado' ? 'Quitado' : 'Ativo'}</span></p>
                    </div>
                    ${emp.status !== 'quitado' ? `
                        <button class="btn btn-sm btn-success rounded-pill" onclick="handlePagarParcela(${emp.id})">Pagar Parcela</button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    } catch (error) {
        showToast(error.message, 'danger');
    }
}

async function loadPerfil() {
    try {
        const data = await apiRequest('/account/perfil');
        document.getElementById('perfil-nome').value = data.nome_completo;
        document.getElementById('perfil-cpf').value = data.cpf;
        document.getElementById('perfil-nascimento').value = data.data_nascimento.split('T')[0];
        document.getElementById('perfil-email').value = data.email;
        document.getElementById('perfil-telefone').value = data.telefone;
        document.getElementById('perfil-endereco').value = data.endereco;
    } catch (error) {
        showToast(error.message, 'danger');
    }
}

async function handleAtualizarPerfil(e) {
    e.preventDefault();
    try {
        showToast('Atualizando perfil...', 'info');
        await apiRequest('/account/perfil', {
            method: 'PUT',
            body: JSON.stringify({
                nome_completo: document.getElementById('perfil-nome').value,
                telefone: document.getElementById('perfil-telefone').value,
                endereco: document.getElementById('perfil-endereco').value
            })
        });
        showToast('PERFIL ATUALIZADO COM SUCESSO!', 'success');
        loadDashboard();
    } catch (error) {
        showToast(error.message, 'danger');
    }
}

async function handleAlterarSenha(e) {
    e.preventDefault();
    try {
        showToast('Alterando senha...', 'info');
        await apiRequest('/account/senha', {
            method: 'PUT',
            body: JSON.stringify({
                senha_atual: document.getElementById('senha-atual').value,
                nova_senha: document.getElementById('senha-nova').value,
                confirmar_nova_senha: document.getElementById('senha-confirmar').value
            })
        });
        showToast('SENHA ALTERADA COM SUCESSO!', 'success');
        document.getElementById('senha-form').reset();
    } catch (error) {
        showToast(error.message, 'danger');
    }
}

function handleLogout() {
    setAuthToken(null);
    showPage('login');
    showToast('Logout realizado com sucesso!', 'info');
}

function handleCartaoFisico() {
    cartaoFisicoBloqueado = !cartaoFisicoBloqueado;
    const statusSpan = document.getElementById('cartao-fisico-status');
    const btn = document.getElementById('btn-cartao-fisico');
    
    if (cartaoFisicoBloqueado) {
        statusSpan.textContent = 'Bloqueado';
        statusSpan.className = 'text-danger';
        btn.textContent = 'Desbloquear';
        btn.className = 'btn btn-outline-success rounded-pill w-100';
        showToast('CARTÃO FÍSICO BLOQUEADO!', 'success');
    } else {
        statusSpan.textContent = 'Ativo';
        statusSpan.className = 'text-success';
        btn.textContent = 'Bloquear';
        btn.className = 'btn btn-outline-danger rounded-pill w-100';
        showToast('CARTÃO FÍSICO DESBLOQUEADO!', 'success');
    }
}

function handleCartaoVirtual() {
    cartaoVirtualBloqueado = !cartaoVirtualBloqueado;
    const statusSpan = document.getElementById('cartao-virtual-status');
    const btn = document.getElementById('btn-cartao-virtual');
    
    if (cartaoVirtualBloqueado) {
        statusSpan.textContent = 'Bloqueado';
        statusSpan.className = 'text-danger';
        btn.textContent = 'Desbloquear';
        btn.className = 'btn btn-outline-success rounded-pill w-100';
        showToast('CARTÃO VIRTUAL BLOQUEADO!', 'success');
    } else {
        statusSpan.textContent = 'Ativo';
        statusSpan.className = 'text-success';
        btn.textContent = 'Bloquear';
        btn.className = 'btn btn-outline-danger rounded-pill w-100';
        showToast('CARTÃO VIRTUAL DESBLOQUEADO!', 'success');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('cadastro-form').addEventListener('submit', handleCadastro);
    document.getElementById('pix-form').addEventListener('submit', handlePIX);
    document.getElementById('transferencia-form').addEventListener('submit', handleTransferencia);
    document.getElementById('perfil-form').addEventListener('submit', handleAtualizarPerfil);
    document.getElementById('senha-form').addEventListener('submit', handleAlterarSenha);
    document.getElementById('emprestimo-simular-form').addEventListener('submit', handleSimularEmprestimo);
    document.getElementById('emprestimo-solicitar-form').addEventListener('submit', handleSolicitarEmprestimo);
    
    document.getElementById('btn-logout').addEventListener('click', handleLogout);
    document.getElementById('btn-copiar-chave-pix').addEventListener('click', handleCopiarChavePix);
    document.getElementById('btn-gerar-chave-pix').addEventListener('click', handleGerarNovaChavePix);
    document.getElementById('btn-dashboard-pix').addEventListener('click', () => { showPage('pix'); showToast('Área de PIX!', 'info'); });
    document.getElementById('btn-dashboard-transferir').addEventListener('click', () => { showPage('transferencias'); showToast('Área de Transferências!', 'info'); });
    document.getElementById('btn-cartao-fisico').addEventListener('click', handleCartaoFisico);
    document.getElementById('btn-cartao-virtual').addEventListener('click', handleCartaoVirtual);
    
    document.getElementById('pix-chave').addEventListener('input', buscarBeneficiarioPIX);
    
    document.getElementById('link-cadastro').addEventListener('click', () => {
        showPage('cadastro');
        showToast('Página de cadastro aberta!', 'info');
    });
    document.getElementById('link-login').addEventListener('click', () => {
        showPage('login');
        showToast('Página de login aberta!', 'info');
    });
    document.getElementById('link-esqueci-senha').addEventListener('click', () => {
        showPage('esqueci-senha');
        showToast('Página de recuperação de senha!', 'info');
    });
    document.getElementById('link-login-2').addEventListener('click', () => {
        showPage('login');
        showToast('Página de login aberta!', 'info');
    });
    
    document.getElementById('esqueci-senha-form').addEventListener('submit', (e) => {
        e.preventDefault();
        showToast('Link de recuperação enviado para o seu e-mail! (Demo)', 'success');
        document.getElementById('esqueci-senha-form').reset();
        setTimeout(() => showPage('login'), 2000);
    });
    
    document.getElementById('nav-dashboard').addEventListener('click', () => {
        showPage('dashboard');
        showToast('Dashboard!', 'info');
    });
    document.getElementById('nav-pix').addEventListener('click', () => {
        showPage('pix');
        showToast('Área de PIX!', 'info');
    });
    document.getElementById('nav-transferencias').addEventListener('click', () => {
        showPage('transferencias');
        showToast('Área de Transferências!', 'info');
    });
    document.getElementById('nav-cartoes').addEventListener('click', () => {
        showPage('cartoes');
        showToast('Área de Cartões!', 'info');
    });
    document.getElementById('nav-emprestimos').addEventListener('click', () => {
        showPage('emprestimos');
        showToast('Área de Empréstimos!', 'info');
    });
    document.getElementById('nav-perfil').addEventListener('click', () => {
        loadPerfil();
        showPage('perfil');
        showToast('Perfil!', 'info');
    });
    
    if (token) {
        showPage('dashboard');
    }
});