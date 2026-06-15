const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');

// Cria o diretório de dados se não existir
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Função para carregar dados de um arquivo JSON
function loadData(filename) {
  const filePath = path.join(DATA_DIR, `${filename}.json`);
  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Erro ao carregar ${filename}:`, error);
    return [];
  }
}

// Função para salvar dados em um arquivo JSON
function saveData(filename, data) {
  const filePath = path.join(DATA_DIR, `${filename}.json`);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`Erro ao salvar ${filename}:`, error);
    return false;
  }
}

// Função para gerar IDs únicos
function generateId(data) {
  if (data.length === 0) return 1;
  const maxId = Math.max(...data.map(item => item.id));
  return maxId + 1;
}

module.exports = {
  loadData,
  saveData,
  generateId
};
