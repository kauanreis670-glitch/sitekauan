const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController');
const { authenticateToken } = require('../middleware/auth');

router.get('/dashboard', authenticateToken, accountController.getDashboard);
router.post('/pix/buscar-beneficiario', authenticateToken, accountController.buscarBeneficiarioPIX);
router.post('/pix', authenticateToken, accountController.realizarPIX);
router.get('/pix/minha-chave', authenticateToken, accountController.getMinhaChavePix);
router.post('/pix/gerar-nova-chave', authenticateToken, accountController.gerarNovaChavePix);
router.get('/pix/historico', authenticateToken, accountController.getPIXHistorico);
router.post('/transferencias', authenticateToken, accountController.realizarTransferencia);
router.get('/transferencias/historico', authenticateToken, accountController.getTransferenciasHistorico);
router.get('/emprestimos', authenticateToken, accountController.getEmprestimos);
router.post('/emprestimos', authenticateToken, accountController.solicitarEmprestimo);
router.post('/emprestimos/:emprestimoId/pagar-parcela', authenticateToken, accountController.pagarParcelaEmprestimo);
router.get('/perfil', authenticateToken, accountController.getPerfil);
router.put('/perfil', authenticateToken, accountController.atualizarPerfil);
router.put('/senha', authenticateToken, accountController.alterarSenha);

module.exports = router;