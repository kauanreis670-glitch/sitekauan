const { loadData, saveData, generateId } = require('../config/store');

class Transaction {
  static create(conta_id, tipo, valor, descricao) {
    const transactions = loadData('transacoes');
    
    const newTransaction = {
      id: generateId(transactions),
      conta_id,
      tipo,
      valor,
      descricao,
      data_transacao: new Date().toISOString()
    };
    
    transactions.push(newTransaction);
    saveData('transacoes', transactions);
    
    return newTransaction.id;
  }
  
  static findByContaId(conta_id) {
    const transactions = loadData('transacoes');
    return transactions.filter(t => t.conta_id === conta_id);
  }
  
  static createPIX(data) {
    const pixList = loadData('pix');
    const { transacao_id, chave_pix, tipo_chave, beneficiario_nome } = data;
    
    const newPIX = {
      id: generateId(pixList),
      transacao_id,
      chave_pix,
      tipo_chave,
      beneficiario_nome,
      comprovante_path: null
    };
    
    pixList.push(newPIX);
    saveData('pix', pixList);
  }
  
  static getPIXHistorico(conta_id) {
    const transactions = loadData('transacoes');
    const pixList = loadData('pix');
    
    const pixTransactions = transactions.filter(t => t.conta_id === conta_id && t.tipo === 'pix');
    
    // Combina as transações com os dados do PIX
    const historico = pixTransactions.map(transacao => {
      const pixData = pixList.find(p => p.transacao_id === transacao.id);
      return {
        ...transacao,
        ...pixData
      };
    });
    
    // Ordena por data
    historico.sort((a, b) => new Date(b.data_transacao) - new Date(a.data_transacao));
    
    return historico;
  }
}

module.exports = Transaction;
