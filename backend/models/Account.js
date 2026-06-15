const { loadData, saveData } = require('../config/store');

class Account {
  static findByUserId(usuario_id) {
    const accounts = loadData('contas');
    return accounts.find(a => a.usuario_id === usuario_id);
  }
  
  static findByNumero(numero_conta) {
    const accounts = loadData('contas');
    return accounts.find(a => a.numero_conta === numero_conta);
  }
  
  static getSaldo(usuario_id) {
    const account = this.findByUserId(usuario_id);
    return account ? account.saldo : 0;
  }
  
  static updateSaldo(conta_id, valor) {
    const accounts = loadData('contas');
    const accountIndex = accounts.findIndex(a => a.id === conta_id);
    
    if (accountIndex !== -1) {
      accounts[accountIndex] = {
        ...accounts[accountIndex],
        saldo: accounts[accountIndex].saldo + valor,
        updated_at: new Date().toISOString()
      };
      saveData('contas', accounts);
    }
  }
  
  static getHistorico(conta_id, limit = 10) {
    const transactions = loadData('transacoes');
    const accountTransactions = transactions.filter(t => t.conta_id === conta_id);
    // Ordena por data (mais recente primeiro)
    accountTransactions.sort((a, b) => new Date(b.data_transacao) - new Date(a.data_transacao));
    return accountTransactions.slice(0, limit);
  }
}

module.exports = Account;
