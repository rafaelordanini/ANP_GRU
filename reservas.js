// =============================================
// MÓDULO DE CONTROLE DE SUBSTITUIÇÃO DE VIATURAS
// =============================================
(function() {
    'use strict';

    // Configuração do módulo
    const CONFIG = {
        storageKey: 'controle_reservas_viaturas',
        buttonId: 'btn-reservas',
        modalId: 'modal-reservas',
        motivos: [
            'Pane mecânica',
            'Acidente',
            'Manutenção preventiva',
            'Pneu furado',
            'Problema elétrico',
            'Revisão',
            'Outro'
        ]
    };

    // Estado da aplicação
    let estado = {
        ativas: [],
        historico: []
    };

    // ==========================================
    // FUNÇÕES DE ARMAZENAMENTO
    // ==========================================
    function carregarDados() {
        try {
            const dados = localStorage.getItem(CONFIG.storageKey);
            if (dados) {
                estado = JSON.parse(dados);
                // Garantir estrutura correta
                if (!estado.ativas) estado.ativas = [];
                if (!estado.historico) estado.historico = [];
            }
        } catch (e) {
            console.error('Erro ao carregar dados de reservas:', e);
            estado = { ativas: [], historico: [] };
        }
    }

    function salvarDados() {
        try {
            localStorage.setItem(CONFIG.storageKey, JSON.stringify(estado));
        } catch (e) {
            console.error('Erro ao salvar dados de reservas:', e);
        }
    }

    // ==========================================
    // FUNÇÕES AUXILIARES
    // ==========================================
    function formatarData(dataStr) {
        if (!dataStr) return '-';
        const [ano, mes, dia] = dataStr.split('-');
        return `${dia}/${mes}/${ano}`;
    }

    function calcularDias(dataInicio, dataFim) {
        const inicio = new Date(dataInicio);
        const fim = new Date(dataFim);
        const diffTime = Math.abs(fim - inicio);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }

    function gerarId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // ==========================================
    // FUNÇÕES DE UI - ESTILOS
    // ==========================================
    function criarEstilos() {
        if (document.getElementById('reservas-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'reservas-styles';
        styles.textContent = `
            /* Modal Overlay */
            .reservas-modal-overlay {
                display: flex;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.6);
                z-index: 10001;
                justify-content: center;
                align-items: center;
                padding: 20px;
                box-sizing: border-box;
            }

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

            /* Modal Principal */
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
                max-width: 900px;
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

            .reservas-modal-close,
            .reservas-close-btn {
                background: rgba(255, 255, 255, 0.2);
                border: none;
                color: white;
                width: 36px;
                height: 36px;
                border-radius: 50%;
                font-size: 20px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background 0.3s;
            }

            .reservas-modal-close:hover,
            .reservas-close-btn:hover {
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
                flex-wrap: wrap;
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
                display: flex;
                align-items: center;
                gap: 8px;
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

            .reservas-form-row {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 16px;
                margin-bottom: 16px;
            }

            .reservas-form-group {
                display: flex;
                flex-direction: column;
                gap: 6px;
            }

            .reservas-form-group.full-width {
                grid-column: 1 / -1;
            }

            .reservas-form-group label,
            .reservas-label {
                font-weight: 600;
                color: #333;
                font-size: 13px;
                display: flex;
                align-items: center;
                gap: 6px;
            }

            .reservas-form-group input,
            .reservas-form-group select,
            .reservas-form-group textarea,
            .reservas-input,
            .reservas-select,
            .reservas-textarea {
                padding: 10px 12px;
                border: 2px solid #e0e0e0;
                border-radius: 8px;
                font-size: 14px;
                transition: border-color 0.3s;
                width: 100%;
                box-sizing: border-box;
            }

            .reservas-form-group input:focus,
            .reservas-form-group select:focus,
            .reservas-form-group textarea:focus,
            .reservas-input:focus,
            .reservas-select:focus,
            .reservas-textarea:focus {
                outline: none;
                border-color: #e74c3c;
            }

            .reservas-form-group textarea,
            .reservas-textarea {
                resize: vertical;
                min-height: 60px;
            }

            /* Botões */
            .reservas-btn {
                padding: 10px 20px;
                border: none;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                gap: 8px;
                transition: all 0.3s;
                font-size: 14px;
            }

            .reservas-btn-primary {
                background: linear-gradient(135deg, #3498db, #2980b9);
                color: white;
            }

            .reservas-btn-primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
            }

            .reservas-btn-success {
                background: linear-gradient(135deg, #27ae60, #219a52);
                color: white;
            }

            .reservas-btn-success:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 15px rgba(39, 174, 96, 0.3);
            }

            .reservas-btn-secondary {
                background: #95a5a6;
                color: white;
            }

            .reservas-btn-secondary:hover {
                background: #7f8c8d;
            }

            .reservas-btn-danger {
                background: #e74c3c;
                color: white;
            }

            .reservas-btn-danger:hover {
                background: #c0392b;
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

            /* Botões de ícone */
            .reservas-btn-icon {
                width: 36px;
                height: 36px;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s;
                background: #f0f0f0;
                color: #666;
            }

            .reservas-btn-icon:hover {
                background: #e0e0e0;
            }

            .reservas-btn-icon.reservas-btn-success {
                background: #d4edda;
                color: #27ae60;
            }

            .reservas-btn-icon.reservas-btn-success:hover {
                background: #27ae60;
                color: white;
            }

            .reservas-btn-icon.reservas-btn-danger {
                background: #f8d7da;
                color: #e74c3c;
            }

            .reservas-btn-icon.reservas-btn-danger:hover {
                background: #e74c3c;
                color: white;
            }

            /* Cards */
            .reservas-lista {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }

            .reservas-card {
                background: white;
                border: 2px solid #e0e0e0;
                border-radius: 12px;
                overflow: hidden;
                transition: all 0.3s;
            }

            .reservas-card:hover {
                border-color: #e74c3c;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }

            .reservas-card-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 16px;
                background: #f8f9fa;
                border-bottom: 1px solid #eee;
            }

            .reservas-card-actions {
                display: flex;
                gap: 8px;
            }

            .reservas-card-body {
                padding: 16px;
            }

            .reservas-card-historico {
                opacity: 0.85;
            }

            /* Badges */
            .reservas-badge {
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                display: inline-flex;
                align-items: center;
                gap: 6px;
            }

            .reservas-badge-warning {
                background: #fff3cd;
                color: #856404;
            }

            .reservas-badge-success {
                background: #d4edda;
                color: #155724;
            }

            /* Info Row */
            .reservas-info-row {
                display: flex;
                align-items: center;
                gap: 16px;
                margin-bottom: 12px;
                flex-wrap: wrap;
            }

            .reservas-info-item {
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .reservas-info-item i {
                font-size: 24px;
            }

            .reservas-info-item small {
                display: block;
                color: #999;
                font-size: 11px;
            }

            .reservas-info-item strong {
                display: block;
                font-size: 16px;
                font-family: monospace;
            }

            .reservas-info-arrow {
                color: #999;
                font-size: 20px;
            }

            .reservas-info-details {
                display: flex;
                flex-wrap: wrap;
                gap: 16px;
                font-size: 13px;
                color: #666;
            }

            .reservas-info-details span {
                display: flex;
                align-items: center;
                gap: 6px;
            }

            .reservas-obs {
                margin-top: 12px;
                padding: 10px;
                background: #f8f9fa;
                border-radius: 8px;
                font-size: 13px;
                color: #666;
                display: flex;
                align-items: flex-start;
                gap: 8px;
            }

            /* Cores de texto */
            .text-danger {
                color: #e74c3c;
            }

            .text-success {
                color: #27ae60;
            }

            /* Estado vazio */
            .reservas-empty {
                text-align: center;
                padding: 40px;
                color: #999;
            }

            .reservas-empty i {
                font-size: 48px;
                margin-bottom: 12px;
                display: block;
            }

            /* Modal interno */
            .reservas-modal {
                background: white;
                border-radius: 16px;
                width: 100%;
                max-width: 500px;
                max-height: 90vh;
                overflow: hidden;
                display: flex;
                flex-direction: column;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            }

            .reservas-modal .reservas-modal-header {
                padding: 16px 20px;
            }

            .reservas-modal .reservas-modal-header h2 {
                font-size: 18px;
            }

            .reservas-modal .reservas-modal-body {
                padding: 20px;
            }

            /* Responsivo */
            @media (max-width: 600px) {
                .reservas-modal-content {
                    max-height: 95vh;
                }

                .reservas-info-row {
                    flex-direction: column;
                    align-items: flex-start;
                }

                .reservas-info-arrow {
                    transform: rotate(90deg);
                }

                .reservas-card-header {
                    flex-direction: column;
                    gap: 12px;
                    align-items: flex-start;
                }

                .reservas-tabs {
                    flex-direction: column;
                }

                .reservas-tab {
                    width: 100%;
                    justify-content: center;
                }
            }
        `;
        document.head.appendChild(styles);
    }

    // ==========================================
    // FUNÇÕES DE UI - MODAL
    // ==========================================
    function criarModal() {
        if (document.getElementById(CONFIG.modalId)) return;

        const modal = document.createElement('div');
        modal.id = CONFIG.modalId;
        modal.innerHTML = `
            <div class="reservas-modal-content">
                <div class="reservas-modal-header">
                    <h2><i class="fas fa-wrench"></i> Controle de Viaturas Reserva</h2>
                    <button class="reservas-modal-close" onclick="ReservasViaturas.fecharModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="reservas-modal-body">
                    <div class="reservas-tabs">
                        <button class="reservas-tab ativo" data-tab="ativas">
                            <i class="fas fa-car"></i> Ativas <span id="reservas-count-ativas">(0)</span>
                        </button>
                        <button class="reservas-tab" data-tab="nova">
                            <i class="fas fa-plus"></i> Nova Substituição
                        </button>
                        <button class="reservas-tab" data-tab="historico">
                            <i class="fas fa-history"></i> Histórico
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
                                    <label><i class="fas fa-car"></i> Viatura Oficial (quebrada)</label>
                                    <input type="text" id="reserva-viatura-oficial" placeholder="Ex: VTR-001" maxlength="20">
                                </div>
                                <div class="reservas-form-group">
                                    <label><i class="fas fa-car-side"></i> Viatura Reserva</label>
                                    <input type="text" id="reserva-viatura-reserva" placeholder="Ex: RES-001" maxlength="20">
                                </div>
                                <div class="reservas-form-group">
                                    <label><i class="fas fa-calendar"></i> Data Início</label>
                                    <input type="date" id="reserva-data-inicio">
                                </div>
                                <div class="reservas-form-group">
                                    <label><i class="fas fa-exclamation-triangle"></i> Motivo</label>
                                    <select id="reserva-motivo">
                                        <option value="">Selecione...</option>
                                        ${CONFIG.motivos.map(m => `<option value="${m}">${m}</option>`).join('')}
                                    </select>
                                </div>
                                <div class="reservas-form-group full-width">
                                    <label><i class="fas fa-sticky-note"></i> Observações</label>
                                    <textarea id="reserva-observacoes" placeholder="Detalhes adicionais..."></textarea>
                                </div>
                            </div>
                            <button class="reservas-btn-adicionar" onclick="ReservasViaturas.adicionar()">
                                <i class="fas fa-check"></i> Registrar Substituição
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
        renderizarAtivas();
        renderizarHistorico();
        atualizarContador();
    }

    function fecharModal() {
        document.getElementById(CONFIG.modalId).classList.remove('ativo');
    }

    // ==========================================
    // FUNÇÕES DE RENDERIZAÇÃO
    // ==========================================
    function renderizarAtivas() {
        const container = document.getElementById('lista-ativas');
        if (!container) return;

        if (estado.ativas.length === 0) {
            container.innerHTML = `
                <div class="reservas-empty">
                    <i class="fas fa-check-circle"></i>
                    <p>Nenhuma viatura em reserva no momento</p>
                </div>
            `;
            return;
        }

        container.innerHTML = estado.ativas.map(item => `
            <div class="reservas-card">
                <div class="reservas-card-header">
                    <span class="reservas-badge reservas-badge-warning">
                        <i class="fas fa-clock"></i> Em andamento
                    </span>
                    <div class="reservas-card-actions">
                        <button class="reservas-btn-icon" title="Editar" onclick="ReservasViaturas.editarRegistro('${item.id}', 'ativa')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="reservas-btn-icon reservas-btn-success" title="Finalizar" onclick="ReservasViaturas.finalizar('${item.id}')">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="reservas-btn-icon reservas-btn-danger" title="Excluir" onclick="ReservasViaturas.excluir('${item.id}', 'ativa')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="reservas-card-body">
                    <div class="reservas-info-row">
                        <div class="reservas-info-item">
                            <i class="fas fa-car text-danger"></i>
                            <div>
                                <small>Viatura Oficial</small>
                                <strong>${item.viaturaOficial}</strong>
                            </div>
                        </div>
                        <div class="reservas-info-arrow">
                            <i class="fas fa-arrow-right"></i>
                        </div>
                        <div class="reservas-info-item">
                            <i class="fas fa-car-side text-success"></i>
                            <div>
                                <small>Viatura Reserva</small>
                                <strong>${item.viaturaReserva}</strong>
                            </div>
                        </div>
                    </div>
                    <div class="reservas-info-details">
                        <span><i class="fas fa-calendar"></i> ${formatarData(item.dataInicio)}</span>
                        <span><i class="fas fa-tag"></i> ${item.motivo || 'Não informado'}</span>
                    </div>
                    ${item.observacoes ? `<p class="reservas-obs"><i class="fas fa-sticky-note"></i> ${item.observacoes}</p>` : ''}
                </div>
            </div>
        `).join('');
    }

    function renderizarHistorico() {
        const container = document.getElementById('lista-historico');
        if (!container) return;

        if (estado.historico.length === 0) {
            container.innerHTML = `
                <div class="reservas-empty">
                    <i class="fas fa-history"></i>
                    <p>Nenhum registro no histórico</p>
                </div>
            `;
            return;
        }

        // Ordena por data mais recente
        const historicoOrdenado = [...estado.historico].sort((a, b) => 
            new Date(b.dataFim) - new Date(a.dataFim)
        );

        container.innerHTML = historicoOrdenado.map(item => `
            <div class="reservas-card reservas-card-historico">
                <div class="reservas-card-header">
                    <span class="reservas-badge reservas-badge-success">
                        <i class="fas fa-check-circle"></i> Finalizado
                    </span>
                    <div class="reservas-card-actions">
                        <button class="reservas-btn-icon" title="Editar" onclick="ReservasViaturas.editarRegistro('${item.id}', 'historico')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="reservas-btn-icon reservas-btn-danger" title="Excluir" onclick="ReservasViaturas.excluir('${item.id}', 'historico')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="reservas-card-body">
                    <div class="reservas-info-row">
                        <div class="reservas-info-item">
                            <i class="fas fa-car"></i>
                            <div>
                                <small>Viatura Oficial</small>
                                <strong>${item.viaturaOficial}</strong>
                            </div>
                        </div>
                        <div class="reservas-info-arrow">
                            <i class="fas fa-arrow-right"></i>
                        </div>
                        <div class="reservas-info-item">
                            <i class="fas fa-car-side"></i>
                            <div>
                                <small>Viatura Reserva</small>
                                <strong>${item.viaturaReserva}</strong>
                            </div>
                        </div>
                    </div>
                    <div class="reservas-info-details">
                        <span><i class="fas fa-calendar"></i> ${formatarData(item.dataInicio)} → ${formatarData(item.dataFim)}</span>
                        <span><i class="fas fa-clock"></i> ${calcularDias(item.dataInicio, item.dataFim)} dias</span>
                        <span><i class="fas fa-tag"></i> ${item.motivo || 'Não informado'}</span>
                    </div>
                    ${item.observacoes ? `<p class="reservas-obs"><i class="fas fa-sticky-note"></i> ${item.observacoes}</p>` : ''}
                </div>
            </div>
        `).join('');
    }

    function atualizarContador() {
        const contador = document.getElementById('reservas-count-ativas');
        if (contador) {
            contador.textContent = `(${estado.ativas.length})`;
        }
    }

    function atualizarBadge() {
        const btn = document.getElementById(CONFIG.buttonId);
        if (!btn) return;

        const count = estado.ativas.length;
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
    // FUNÇÕES CRUD
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

        if (!motivo) {
            alert('Por favor, selecione o motivo.');
            return;
        }

        const novaSubstituicao = {
            id: gerarId(),
            viaturaOficial: viaturaOficial.toUpperCase(),
            viaturaReserva: viaturaReserva.toUpperCase(),
            dataInicio: dataInicio,
            dataFim: null,
            motivo: motivo,
            observacoes: observacoes
        };

        estado.ativas.unshift(novaSubstituicao);
        salvarDados();

        // Limpar formulário
        document.getElementById('reserva-viatura-oficial').value = '';
        document.getElementById('reserva-viatura-reserva').value = '';
        document.getElementById('reserva-data-inicio').value = new Date().toISOString().split('T')[0];
        document.getElementById('reserva-motivo').value = '';
        document.getElementById('reserva-observacoes').value = '';

        // Voltar para aba de ativas
        document.querySelector('.reservas-tab[data-tab="ativas"]').click();
        
        renderizarAtivas();
        atualizarContador();
        atualizarBadge();
    }

    function finalizar(id) {
        const item = estado.ativas.find(i => i.id === id);
        if (!item) return;

        // Cria modal para solicitar data de finalização
        const modalData = document.createElement('div');
        modalData.className = 'reservas-modal-overlay';
        modalData.innerHTML = `
            <div class="reservas-modal" style="max-width: 400px;">
                <div class="reservas-modal-header">
                    <h2><i class="fas fa-calendar-check"></i> Finalizar Substituição</h2>
                    <button class="reservas-close-btn" onclick="this.closest('.reservas-modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="reservas-modal-body">
                    <p style="margin-bottom: 15px;">
                        <strong>${item.viaturaOficial}</strong> → <strong>${item.viaturaReserva}</strong>
                    </p>
                    <div class="reservas-form-group">
                        <label class="reservas-label">
                            <i class="fas fa-calendar"></i> Data de Devolução
                        </label>
                        <input type="date" id="data-finalizacao" class="reservas-input" 
                               value="${new Date().toISOString().split('T')[0]}" 
                               min="${item.dataInicio}">
                    </div>
                </div>
                <div style="display: flex; gap: 10px; justify-content: flex-end; padding: 15px 20px; border-top: 1px solid #eee;">
                    <button class="reservas-btn reservas-btn-secondary" onclick="this.closest('.reservas-modal-overlay').remove()">
                        Cancelar
                    </button>
                    <button class="reservas-btn reservas-btn-success" id="confirmar-finalizacao">
                        <i class="fas fa-check"></i> Confirmar
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modalData);

        // Evento de confirmação
        document.getElementById('confirmar-finalizacao').onclick = () => {
            const dataFim = document.getElementById('data-finalizacao').value;
            
            if (!dataFim) {
                alert('Por favor, informe a data de devolução.');
                return;
            }

            if (dataFim < item.dataInicio) {
                alert('A data de devolução não pode ser anterior à data de início.');
                return;
            }

            item.dataFim = dataFim;
            estado.historico.unshift(item);
            estado.ativas = estado.ativas.filter(i => i.id !== id);
            
            salvarDados();
            renderizarAtivas();
            renderizarHistorico();
            atualizarContador();
            atualizarBadge();
            modalData.remove();
        };
    }

    function excluir(id, tipo) {
        if (!confirm('Tem certeza que deseja excluir este registro?')) return;

        if (tipo === 'ativa') {
            estado.ativas = estado.ativas.filter(i => i.id !== id);
        } else {
            estado.historico = estado.historico.filter(i => i.id !== id);
        }

        salvarDados();
        renderizarAtivas();
        renderizarHistorico();
        atualizarContador();
        atualizarBadge();
    }

    function editarRegistro(id, tipo) {
        const lista = tipo === 'ativa' ? estado.ativas : estado.historico;
        const item = lista.find(i => i.id === id);
        if (!item) return;

        const isHistorico = tipo === 'historico';

        const modalEdicao = document.createElement('div');
        modalEdicao.className = 'reservas-modal-overlay';
        modalEdicao.innerHTML = `
            <div class="reservas-modal" style="max-width: 500px;">
                <div class="reservas-modal-header">
                    <h2><i class="fas fa-edit"></i> Editar Registro</h2>
                    <button class="reservas-close-btn" onclick="this.closest('.reservas-modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="reservas-modal-body">
                    <div class="reservas-form-row">
                        <div class="reservas-form-group">
                            <label class="reservas-label">
                                <i class="fas fa-car"></i> Viatura Oficial
                            </label>
                            <input type="text" id="edit-viatura-oficial" class="reservas-input" 
                                   value="${item.viaturaOficial}">
                        </div>
                        <div class="reservas-form-group">
                            <label class="reservas-label">
                                <i class="fas fa-car-side"></i> Viatura Reserva
                            </label>
                            <input type="text" id="edit-viatura-reserva" class="reservas-input" 
                                   value="${item.viaturaReserva}">
                        </div>
                    </div>
                    
                    <div class="reservas-form-row">
                        <div class="reservas-form-group">
                            <label class="reservas-label">
                                <i class="fas fa-calendar"></i> Data Início
                            </label>
                            <input type="date" id="edit-data-inicio" class="reservas-input" 
                                   value="${item.dataInicio}">
                        </div>
                        ${isHistorico ? `
                        <div class="reservas-form-group">
                            <label class="reservas-label">
                                <i class="fas fa-calendar-check"></i> Data Devolução
                            </label>
                            <input type="date" id="edit-data-fim" class="reservas-input" 
                                   value="${item.dataFim || ''}">
                        </div>
                        ` : ''}
                    </div>

                    <div class="reservas-form-group">
                        <label class="reservas-label">
                            <i class="fas fa-exclamation-triangle"></i> Motivo
                        </label>
                        <select id="edit-motivo" class="reservas-select">
                            <option value="">Selecione...</option>
                            ${CONFIG.motivos.map(m => `
                                <option value="${m}" ${item.motivo === m ? 'selected' : ''}>${m}</option>
                            `).join('')}
                        </select>
                    </div>

                    <div class="reservas-form-group">
                        <label class="reservas-label">
                            <i class="fas fa-sticky-note"></i> Observações
                        </label>
                        <textarea id="edit-observacoes" class="reservas-textarea" rows="3">${item.observacoes || ''}</textarea>
                    </div>
                </div>
                <div style="display: flex; gap: 10px; justify-content: flex-end; padding: 15px 20px; border-top: 1px solid #eee;">
                    <button class="reservas-btn reservas-btn-secondary" onclick="this.closest('.reservas-modal-overlay').remove()">
                        Cancelar
                    </button>
                    <button class="reservas-btn reservas-btn-primary" id="confirmar-edicao">
                        <i class="fas fa-save"></i> Salvar Alterações
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modalEdicao);

        // Evento de confirmação
        document.getElementById('confirmar-edicao').onclick = () => {
            const viaturaOficial = document.getElementById('edit-viatura-oficial').value.trim();
            const viaturaReserva = document.getElementById('edit-viatura-reserva').value.trim();
            const dataInicio = document.getElementById('edit-data-inicio').value;
            const motivo = document.getElementById('edit-motivo').value;
            const observacoes = document.getElementById('edit-observacoes').value.trim();
            const dataFim = isHistorico ? document.getElementById('edit-data-fim')?.value : null;

            // Validações
            if (!viaturaOficial || !viaturaReserva || !dataInicio || !motivo) {
                alert('Por favor, preencha todos os campos obrigatórios.');
                return;
            }

            if (isHistorico && dataFim && dataFim < dataInicio) {
                alert('A data de devolução não pode ser anterior à data de início.');
                return;
            }

            // Atualiza o registro
            item.viaturaOficial = viaturaOficial.toUpperCase();
            item.viaturaReserva = viaturaReserva.toUpperCase();
            item.dataInicio = dataInicio;
            item.motivo = motivo;
            item.observacoes = observacoes;
            
            if (isHistorico && dataFim) {
                item.dataFim = dataFim;
            }

            salvarDados();
            renderizarAtivas();
            renderizarHistorico();
            modalEdicao.remove();
        };
    }

    // ==========================================
    // INICIALIZAÇÃO
    // ==========================================
    function criarBotao(container) {
        if (container === null) {
            // Botão será criado externamente
            atualizarBadge();
            return;
        }

        const btn = document.createElement('button');
        btn.id = CONFIG.buttonId;
        btn.innerHTML = '<i class="fas fa-wrench"></i> Viaturas Reserva';
        btn.onclick = abrirModal;

        if (typeof container === 'string') {
            container = document.querySelector(container);
        }

        if (container) {
            container.appendChild(btn);
        } else {
            console.warn('Container não encontrado para o botão de reservas.');
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
        editarRegistro: editarRegistro,
        getAtivas: () => estado.ativas,
        getHistorico: () => estado.historico
    };

})();
