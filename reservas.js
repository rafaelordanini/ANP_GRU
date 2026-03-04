// =============================================
// MÓDULO DE CONTROLE DE SUBSTITUIÇÃO DE VIATURAS
// =============================================
(function() {
    'use strict';

    // Configuração do módulo
    const CONFIG = {
        storageKey: 'controle_reservas_viaturas',
        buttonId: 'btn-reservas',
        modalId: 'modal-reservas'
    };

    // Dados em memória
    let substituicoes = [];

    // ==========================================
    // FUNÇÕES DE ARMAZENAMENTO
    // ==========================================
    function carregarDados() {
        try {
            const dados = localStorage.getItem(CONFIG.storageKey);
            substituicoes = dados ? JSON.parse(dados) : [];
        } catch (e) {
            console.error('Erro ao carregar dados de reservas:', e);
            substituicoes = [];
        }
    }

    function salvarDados() {
        try {
            localStorage.setItem(CONFIG.storageKey, JSON.stringify(substituicoes));
        } catch (e) {
            console.error('Erro ao salvar dados de reservas:', e);
        }
    }

    // ==========================================
    // FUNÇÕES DE CRUD
    // ==========================================
    function adicionarSubstituicao(dados) {
        const novaSubstituicao = {
            id: Date.now(),
            viaturaOficial: dados.viaturaOficial.toUpperCase(),
            viaturaReserva: dados.viaturaReserva.toUpperCase(),
            motivo: dados.motivo,
            dataInicio: dados.dataInicio,
            dataFim: null,
            observacoes: dados.observacoes,
            ativa: true
        };
        substituicoes.unshift(novaSubstituicao);
        salvarDados();
        return novaSubstituicao;
    }

    function finalizarSubstituicao(id) {
        const item = substituicoes.find(s => s.id === id);
        if (item) {
            item.ativa = false;
            item.dataFim = new Date().toISOString().split('T')[0];
            salvarDados();
        }
        return item;
    }

    function excluirSubstituicao(id) {
        const index = substituicoes.findIndex(s => s.id === id);
        if (index > -1) {
            substituicoes.splice(index, 1);
            salvarDados();
            return true;
        }
        return false;
    }

    function getSubstituicoesAtivas() {
        return substituicoes.filter(s => s.ativa);
    }

    function getHistorico() {
        return substituicoes.filter(s => !s.ativa);
    }

    // ==========================================
    // FUNÇÕES DE UI
    // ==========================================
    function criarEstilos() {
        if (document.getElementById('reservas-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'reservas-styles';
        styles.textContent = `
            /* Botão principal */
            #${CONFIG.buttonId} {
                background: linear-gradient(135deg, #e74c3c, #c0392b);
                color: white;
                border: none;
                padding: 12px 20px;
                border-radius: 10px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                gap: 8px;
                transition: all 0.3s ease;
                box-shadow: 0 4px 15px rgba(231, 76, 60, 0.3);
            }

            #${CONFIG.buttonId}:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(231, 76, 60, 0.4);
            }

            #${CONFIG.buttonId} .badge-count {
                background: white;
                color: #e74c3c;
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 700;
            }

            /* Modal */
            #${CONFIG.modalId} {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.6);
                z-index: 10000;
                justify-content: center;
                align-items: center;
                padding: 20px;
                box-sizing: border-box;
            }

            #${CONFIG.modalId}.ativo {
                display: flex;
            }

            .reservas-modal-content {
                background: white;
                border-radius: 16px;
                width: 100%;
                max-width: 800px;
                max-height: 90vh;
                overflow: hidden;
                display: flex;
                flex-direction: column;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            }

            .reservas-modal-header {
                background: linear-gradient(135deg, #e74c3c, #c0392b);
                color: white;
                padding: 20px 24px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .reservas-modal-header h2 {
                margin: 0;
                font-size: 20px;
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .reservas-modal-close {
                background: rgba(255, 255, 255, 0.2);
                border: none;
                color: white;
                width: 36px;
                height: 36px;
                border-radius: 50%;
                font-size: 24px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background 0.3s;
            }

            .reservas-modal-close:hover {
                background: rgba(255, 255, 255, 0.3);
            }

            .reservas-modal-body {
                padding: 24px;
                overflow-y: auto;
                flex: 1;
            }

            /* Tabs */
            .reservas-tabs {
                display: flex;
                gap: 8px;
                margin-bottom: 20px;
                border-bottom: 2px solid #eee;
                padding-bottom: 12px;
            }

            .reservas-tab {
                padding: 10px 20px;
                border: none;
                background: #f5f5f5;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 600;
                color: #666;
                transition: all 0.3s;
            }

            .reservas-tab:hover {
                background: #e0e0e0;
            }

            .reservas-tab.ativo {
                background: #e74c3c;
                color: white;
            }

            /* Formulário */
            .reservas-form {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 12px;
                margin-bottom: 20px;
            }

            .reservas-form-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 16px;
            }

            .reservas-form-group {
                display: flex;
                flex-direction: column;
                gap: 6px;
            }

            .reservas-form-group.full-width {
                grid-column: 1 / -1;
            }

            .reservas-form-group label {
                font-weight: 600;
                color: #333;
                font-size: 13px;
            }

            .reservas-form-group input,
            .reservas-form-group select,
            .reservas-form-group textarea {
                padding: 10px 12px;
                border: 2px solid #e0e0e0;
                border-radius: 8px;
                font-size: 14px;
                transition: border-color 0.3s;
            }

            .reservas-form-group input:focus,
            .reservas-form-group select:focus,
            .reservas-form-group textarea:focus {
                outline: none;
                border-color: #e74c3c;
            }

            .reservas-form-group textarea {
                resize: vertical;
                min-height: 60px;
            }

            .reservas-btn-adicionar {
                background: linear-gradient(135deg, #27ae60, #219a52);
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
                margin-top: 16px;
                display: inline-flex;
                align-items: center;
                gap: 8px;
                transition: all 0.3s;
            }

            .reservas-btn-adicionar:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 15px rgba(39, 174, 96, 0.3);
            }

            /* Lista de substituições */
            .reservas-lista {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }

            .reservas-item {
                background: white;
                border: 2px solid #e0e0e0;
                border-radius: 12px;
                padding: 16px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 16px;
                transition: all 0.3s;
            }

            .reservas-item:hover {
                border-color: #e74c3c;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }

            .reservas-item.ativa {
                border-left: 4px solid #e74c3c;
            }

            .reservas-item.finalizada {
                border-left: 4px solid #95a5a6;
                opacity: 0.8;
            }

            .reservas-item-info {
                flex: 1;
            }

            .reservas-item-viaturas {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 8px;
            }

            .reservas-viatura {
                background: #f0f0f0;
                padding: 6px 12px;
                border-radius: 6px;
                font-weight: 700;
                font-family: monospace;
                font-size: 14px;
            }

            .reservas-viatura.oficial {
                background: #ffebee;
                color: #c0392b;
            }

            .reservas-viatura.reserva {
                background: #e8f5e9;
                color: #27ae60;
            }

            .reservas-seta {
                color: #999;
                font-size: 18px;
            }

            .reservas-item-detalhes {
                font-size: 13px;
                color: #666;
                display: flex;
                flex-wrap: wrap;
                gap: 16px;
            }

            .reservas-item-detalhe {
                display: flex;
                align-items: center;
                gap: 4px;
            }

            .reservas-item-acoes {
                display: flex;
                gap: 8px;
            }

            .reservas-btn-acao {
                padding: 8px 12px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 12px;
                font-weight: 600;
                transition: all 0.3s;
            }

            .reservas-btn-finalizar {
                background: #3498db;
                color: white;
            }

            .reservas-btn-finalizar:hover {
                background: #2980b9;
            }

            .reservas-btn-excluir {
                background: #e74c3c;
                color: white;
            }

            .reservas-btn-excluir:hover {
                background: #c0392b;
            }

            .reservas-vazio {
                text-align: center;
                padding: 40px;
                color: #999;
            }

            .reservas-vazio-icon {
                font-size: 48px;
                margin-bottom: 12px;
            }

            /* Responsivo */
            @media (max-width: 600px) {
                .reservas-modal-content {
                    max-height: 95vh;
                }

                .reservas-item {
                    flex-direction: column;
                    align-items: stretch;
                }

                .reservas-item-acoes {
                    justify-content: flex-end;
                }

                .reservas-tabs {
                    flex-wrap: wrap;
                }
            }
        `;
        document.head.appendChild(styles);
    }

    function criarModal() {
        if (document.getElementById(CONFIG.modalId)) return;

        const modal = document.createElement('div');
        modal.id = CONFIG.modalId;
        modal.innerHTML = `
            <div class="reservas-modal-content">
                <div class="reservas-modal-header">
                    <h2>🔧 Controle de Viaturas Reserva</h2>
                    <button class="reservas-modal-close" onclick="ReservasViaturas.fecharModal()">&times;</button>
                </div>
                <div class="reservas-modal-body">
                    <div class="reservas-tabs">
                        <button class="reservas-tab ativo" data-tab="ativas">
                            🚗 Ativas <span id="reservas-count-ativas">(0)</span>
                        </button>
                        <button class="reservas-tab" data-tab="nova">
                            ➕ Nova Substituição
                        </button>
                        <button class="reservas-tab" data-tab="historico">
                            📋 Histórico
                        </button>
                    </div>

                    <!-- Tab Ativas -->
                    <div class="reservas-tab-content" id="tab-ativas">
                        <div class="reservas-lista" id="lista-ativas"></div>
                    </div>

                    <!-- Tab Nova -->
                    <div class="reservas-tab-content" id="tab-nova" style="display: none;">
                        <div class="reservas-form">
                            <div class="reservas-form-grid">
                                <div class="reservas-form-group">
                                    <label>🚗 Viatura Oficial (quebrada)</label>
                                    <input type="text" id="reserva-viatura-oficial" placeholder="Ex: VTR-001" maxlength="20">
                                </div>
                                <div class="reservas-form-group">
                                    <label>🔄 Viatura Reserva</label>
                                    <input type="text" id="reserva-viatura-reserva" placeholder="Ex: RES-001" maxlength="20">
                                </div>
                                <div class="reservas-form-group">
                                    <label>📅 Data Início</label>
                                    <input type="date" id="reserva-data-inicio">
                                </div>
                                <div class="reservas-form-group">
                                    <label>⚠️ Motivo</label>
                                    <select id="reserva-motivo">
                                        <option value="">Selecione...</option>
                                        <option value="Pane mecânica">Pane mecânica</option>
                                        <option value="Acidente">Acidente</option>
                                        <option value="Manutenção preventiva">Manutenção preventiva</option>
                                        <option value="Pneu furado">Pneu furado</option>
                                        <option value="Problema elétrico">Problema elétrico</option>
                                        <option value="Revisão">Revisão</option>
                                        <option value="Outro">Outro</option>
                                    </select>
                                </div>
                                <div class="reservas-form-group full-width">
                                    <label>📝 Observações</label>
                                    <textarea id="reserva-observacoes" placeholder="Detalhes adicionais..."></textarea>
                                </div>
                            </div>
                            <button class="reservas-btn-adicionar" onclick="ReservasViaturas.adicionar()">
                                ✅ Registrar Substituição
                            </button>
                        </div>
                    </div>

                    <!-- Tab Histórico -->
                    <div class="reservas-tab-content" id="tab-historico" style="display: none;">
                        <div class="reservas-lista" id="lista-historico"></div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners para tabs
        modal.querySelectorAll('.reservas-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                modal.querySelectorAll('.reservas-tab').forEach(t => t.classList.remove('ativo'));
                modal.querySelectorAll('.reservas-tab-content').forEach(c => c.style.display = 'none');
                tab.classList.add('ativo');
                document.getElementById('tab-' + tab.dataset.tab).style.display = 'block';
            });
        });

        // Fechar ao clicar fora
        modal.addEventListener('click', (e) => {
            if (e.target === modal) fecharModal();
        });

        // Definir data atual como padrão
        document.getElementById('reserva-data-inicio').value = new Date().toISOString().split('T')[0];
    }

    function abrirModal() {
        document.getElementById(CONFIG.modalId).classList.add('ativo');
        atualizarListas();
    }

    function fecharModal() {
        document.getElementById(CONFIG.modalId).classList.remove('ativo');
    }

    function atualizarListas() {
        const ativas = getSubstituicoesAtivas();
        const historico = getHistorico();

        // Atualizar contador
        document.getElementById('reservas-count-ativas').textContent = `(${ativas.length})`;
        atualizarBadge();

        // Lista de ativas
        const listaAtivas = document.getElementById('lista-ativas');
        if (ativas.length === 0) {
            listaAtivas.innerHTML = `
                <div class="reservas-vazio">
                    <div class="reservas-vazio-icon">✅</div>
                    <p>Nenhuma substituição ativa no momento.</p>
                </div>
            `;
        } else {
            listaAtivas.innerHTML = ativas.map(item => criarItemHTML(item, true)).join('');
        }

        // Lista de histórico
        const listaHistorico = document.getElementById('lista-historico');
        if (historico.length === 0) {
            listaHistorico.innerHTML = `
                <div class="reservas-vazio">
                    <div class="reservas-vazio-icon">📋</div>
                    <p>Nenhum registro no histórico.</p>
                </div>
            `;
        } else {
            listaHistorico.innerHTML = historico.map(item => criarItemHTML(item, false)).join('');
        }
    }

    function criarItemHTML(item, ativa) {
        const dataInicio = formatarData(item.dataInicio);
        const dataFim = item.dataFim ? formatarData(item.dataFim) : '-';

        return `
            <div class="reservas-item ${ativa ? 'ativa' : 'finalizada'}">
                <div class="reservas-item-info">
                    <div class="reservas-item-viaturas">
                        <span class="reservas-viatura oficial">${item.viaturaOficial}</span>
                        <span class="reservas-seta">➜</span>
                        <span class="reservas-viatura reserva">${item.viaturaReserva}</span>
                    </div>
                    <div class="reservas-item-detalhes">
                        <span class="reservas-item-detalhe">⚠️ ${item.motivo || 'Não informado'}</span>
                        <span class="reservas-item-detalhe">📅 ${dataInicio}${!ativa ? ' até ' + dataFim : ''}</span>
                        ${item.observacoes ? `<span class="reservas-item-detalhe">📝 ${item.observacoes}</span>` : ''}
                    </div>
                </div>
                <div class="reservas-item-acoes">
                    ${ativa ? `<button class="reservas-btn-acao reservas-btn-finalizar" onclick="ReservasViaturas.finalizar(${item.id})">✅ Finalizar</button>` : ''}
                    <button class="reservas-btn-acao reservas-btn-excluir" onclick="ReservasViaturas.excluir(${item.id})">🗑️</button>
                </div>
            </div>
        `;
    }

    function formatarData(dataStr) {
        if (!dataStr) return '-';
        const [ano, mes, dia] = dataStr.split('-');
        return `${dia}/${mes}/${ano}`;
    }

    function atualizarBadge() {
        const btn = document.getElementById(CONFIG.buttonId);
        if (!btn) return;

        const count = getSubstituicoesAtivas().length;
        let badge = btn.querySelector('.badge-count');

        if (count > 0) {
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'badge-count';
                btn.appendChild(badge);
            }
            badge.textContent = count;
        } else if (badge) {
            badge.remove();
        }
    }

    // ==========================================
    // FUNÇÕES PÚBLICAS
    // ==========================================
    function adicionar() {
        const viaturaOficial = document.getElementById('reserva-viatura-oficial').value.trim();
        const viaturaReserva = document.getElementById('reserva-viatura-reserva').value.trim();
        const dataInicio = document.getElementById('reserva-data-inicio').value;
        const motivo = document.getElementById('reserva-motivo').value;
        const observacoes = document.getElementById('reserva-observacoes').value.trim();

        // Validação
        if (!viaturaOficial || !viaturaReserva) {
            alert('Por favor, preencha as viaturas oficial e reserva.');
            return;
        }

        if (!dataInicio) {
            alert('Por favor, informe a data de início.');
            return;
        }

        adicionarSubstituicao({
            viaturaOficial,
            viaturaReserva,
            dataInicio,
            motivo,
            observacoes
        });

        // Limpar formulário
        document.getElementById('reserva-viatura-oficial').value = '';
        document.getElementById('reserva-viatura-reserva').value = '';
        document.getElementById('reserva-data-inicio').value = new Date().toISOString().split('T')[0];
        document.getElementById('reserva-motivo').value = '';
        document.getElementById('reserva-observacoes').value = '';

        // Voltar para aba de ativas
        document.querySelector('.reservas-tab[data-tab="ativas"]').click();
        atualizarListas();
    }

    function finalizar(id) {
        if (confirm('Confirma a finalização desta substituição?')) {
            finalizarSubstituicao(id);
            atualizarListas();
        }
    }

    function excluir(id) {
        if (confirm('Tem certeza que deseja excluir este registro?')) {
            excluirSubstituicao(id);
            atualizarListas();
        }
    }

    // ==========================================
    // INICIALIZAÇÃO
    // ==========================================
    function criarBotao(container) {
        const btn = document.createElement('button');
        btn.id = CONFIG.buttonId;
        btn.innerHTML = '🔧 Viaturas Reserva';
        btn.onclick = abrirModal;

        if (typeof container === 'string') {
            container = document.querySelector(container);
        }

        if (container) {
            container.appendChild(btn);
        } else {
            console.warn('Container não encontrado. Adicionando botão ao body.');
            document.body.insertBefore(btn, document.body.firstChild);
        }

        return btn;
    }

    function init(containerSelector) {
        carregarDados();
        criarEstilos();
        criarModal();
        criarBotao(containerSelector);
        atualizarBadge();
    }

    // ==========================================
    // EXPORTAR API PÚBLICA
    // ==========================================
    window.ReservasViaturas = {
        init: init,
        abrirModal: abrirModal,
        fecharModal: fecharModal,
        adicionar: adicionar,
        finalizar: finalizar,
        excluir: excluir,
        getAtivas: getSubstituicoesAtivas,
        getHistorico: getHistorico
    };

})();
