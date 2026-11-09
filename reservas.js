const ReservasViaturas = (function() {
    // Configuração JSONBin.io
    const JSONBIN_BIN_ID = '69a87f2bae596e708f5f5724';
    const JSONBIN_API_KEY = '$2a$10$tKDKMvle7OMcl19R73SlMuM/VjJpZOxQfE5FgxwIQwzzkpImPyOoa';
    const JSONBIN_URL = `/api/jsonbin/${JSONBIN_BIN_ID}`;

    let reservas = [];
    let modalAberto = false;
    let abaAtiva = 'ativas';

    // ==================== FUNÇÕES DE API ====================

   async function carregarDados() {
    try {
        const response = await fetch(JSONBIN_URL + '/latest', {
            method: 'GET',
            headers: {
                'X-Master-Key': JSONBIN_API_KEY
            }
        });
        const data = await response.json();
        reservas = data.record.reservas || [];
        if (!Array.isArray(reservas)) reservas = [];
        console.log('Reservas carregadas:', reservas);
    } catch (error) {
        console.error('Erro ao carregar reservas:', error);
        reservas = [];
    }
}

   async function salvarDados() {
    try {
        const response = await fetch(JSONBIN_URL, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_API_KEY
            },
            body: JSON.stringify({ reservas: reservas })
        });
        const data = await response.json();
        console.log('Reservas salvas:', data);
        return true;
    } catch (error) {
        console.error('Erro ao salvar reservas:', error);
        alert('Erro ao salvar dados. Tente novamente.');
        return false;
    }
}

    // ==================== CRUD RESERVAS ====================

    async function adicionarReserva(viatura, viaturaReserva, motivo, dataInicio) {
        const novaReserva = {
            id: Date.now(),
            viatura: viatura.toUpperCase(),
            viaturaReserva: viaturaReserva.toUpperCase(),
            motivo: motivo,
            dataInicio: dataInicio,
            dataRetorno: null,
            ativa: true
        };
        reservas.unshift(novaReserva);
        await salvarDados();
        renderizarConteudo();
    }

    async function finalizarReserva(id) {
        const reserva = reservas.find(r => r.id === id);
        if (!reserva) return;

        const dataRetorno = prompt('Digite a data de retorno (DD/MM/AAAA):');
        if (!dataRetorno) return;

        const partes = dataRetorno.split('/');
        if (partes.length !== 3) {
            alert('Formato inválido! Use DD/MM/AAAA');
            return;
        }

        const [dia, mes, ano] = partes;
        const dataFormatada = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;

        const dataObj = new Date(dataFormatada);
        if (isNaN(dataObj.getTime())) {
            alert('Data inválida!');
            return;
        }

        reserva.dataRetorno = dataFormatada;
        reserva.ativa = false;

        await salvarDados();
        renderizarConteudo();
    }

    async function reativarReserva(id) {
        const reserva = reservas.find(r => r.id === id);
        if (!reserva) return;

        if (confirm('Deseja reativar esta reserva?')) {
            reserva.dataRetorno = null;
            reserva.ativa = true;
            await salvarDados();
            renderizarConteudo();
        }
    }

    async function editarReserva(id) {
        const reserva = reservas.find(r => r.id === id);
        if (!reserva) return;

        const modalEdicao = document.createElement('div');
        modalEdicao.className = 'modal-edicao-overlay';
        modalEdicao.innerHTML = `
            <div class="modal-edicao-content">
                <h3><i class="fas fa-edit"></i> Editar Reserva</h3>
                <div class="form-group">
                    <label>Viatura (Vereador)</label>
                    <input type="text" id="edit-viatura" value="${escapeHtml(reserva.viatura)}" maxlength="50">
                </div>
                <div class="form-group">
                    <label>Viatura Reserva</label>
                    <input type="text" id="edit-viatura-reserva" value="${escapeHtml(reserva.viaturaReserva || '')}" maxlength="50">
                </div>
                <div class="form-group">
                    <label>Motivo</label>
                    <textarea id="edit-motivo" maxlength="500">${escapeHtml(reserva.motivo)}</textarea>
                </div>
                <div class="form-group">
                    <label>Data de Início</label>
                    <input type="date" id="edit-data-inicio" value="${reserva.dataInicio}">
                </div>
                <div class="form-group">
                    <label>Data de Retorno ${reserva.ativa ? '(deixe vazio se ainda ativa)' : ''}</label>
                    <input type="date" id="edit-data-retorno" value="${reserva.dataRetorno || ''}">
                </div>
                <div class="modal-edicao-buttons">
                    <button class="btn-cancelar" onclick="this.closest('.modal-edicao-overlay').remove()">
                        Cancelar
                    </button>
                    <button class="btn-salvar" onclick="ReservasViaturas.salvarEdicao(${id})">
                        <i class="fas fa-save"></i> Salvar
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modalEdicao);
    }

    async function salvarEdicao(id) {
        const reserva = reservas.find(r => r.id === id);
        if (!reserva) return;

        const viatura = document.getElementById('edit-viatura').value.trim();
        const viaturaReserva = document.getElementById('edit-viatura-reserva').value.trim();
        const motivo = document.getElementById('edit-motivo').value.trim();
        const dataInicio = document.getElementById('edit-data-inicio').value;
        const dataRetorno = document.getElementById('edit-data-retorno').value;

        if (!viatura || !viaturaReserva || !motivo || !dataInicio) {
            alert('Preencha todos os campos obrigatórios!');
            return;
        }

        reserva.viatura = viatura.toUpperCase();
        reserva.viaturaReserva = viaturaReserva.toUpperCase();
        reserva.motivo = motivo;
        reserva.dataInicio = dataInicio;
        reserva.dataRetorno = dataRetorno || null;
        reserva.ativa = !dataRetorno;

        await salvarDados();
        document.querySelector('.modal-edicao-overlay')?.remove();
        renderizarConteudo();
    }

    async function excluirReserva(id) {
        if (confirm('Tem certeza que deseja EXCLUIR permanentemente esta reserva?')) {
            reservas = reservas.filter(r => r.id !== id);
            await salvarDados();
            renderizarConteudo();
        }
    }

    // ==================== INTERFACE ====================

    function criarModal() {
        if (document.getElementById('modal-reservas')) return;

        const estilos = `
            <style id="estilos-reservas">
                .modal-reservas {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .modal-reservas-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.5);
                }
                .modal-reservas-content {
                    position: relative;
                    background: white;
                    border-radius: 16px;
                    width: 95%;
                    max-width: 900px;
                    max-height: 90vh;
                    overflow: hidden;
                    box-shadow: 0 25px 80px rgba(0,0,0,0.3);
                    animation: modalEntrada 0.3s ease;
                }
                @keyframes modalEntrada {
                    from { opacity: 0; transform: scale(0.9) translateY(-20px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                .modal-reservas-header {
                    background: linear-gradient(135deg, #27ae60, #219a52);
                    color: white;
                    padding: 20px 24px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .modal-reservas-header h2 {
                    margin: 0;
                    font-size: 1.4rem;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .modal-reservas-close {
                    background: rgba(255,255,255,0.2);
                    border: none;
                    color: white;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    cursor: pointer;
                    font-size: 1.2rem;
                    transition: background 0.2s;
                }
                .modal-reservas-close:hover {
                    background: rgba(255,255,255,0.3);
                }
                .modal-reservas-body {
                    max-height: calc(90vh - 70px);
                    overflow-y: auto;
                }
                .reservas-tabs {
                    display: flex;
                    background: #f5f5f5;
                    border-bottom: 1px solid #ddd;
                }
                .reservas-tab {
                    flex: 1;
                    padding: 14px 20px;
                    background: none;
                    border: none;
                    font-size: 1rem;
                    font-weight: 600;
                    color: #666;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }
                .reservas-tab:hover {
                    background: #eee;
                }
                .reservas-tab.active {
                    background: white;
                    color: #27ae60;
                    border-bottom: 3px solid #27ae60;
                }
                .reservas-tab .badge {
                    background: #27ae60;
                    color: white;
                    padding: 2px 8px;
                    border-radius: 10px;
                    font-size: 0.85rem;
                }
                .tab-panel {
                    display: none;
                    padding: 20px;
                }
                .tab-panel.active {
                    display: block;
                }
                .form-nova-reserva {
                    background: linear-gradient(135deg, #f8f9fa, #e9ecef);
                    padding: 20px;
                    border-radius: 12px;
                    margin-bottom: 20px;
                    border: 1px solid #dee2e6;
                }
                .form-nova-reserva h3 {
                    margin: 0 0 16px 0;
                    color: #333;
                    font-size: 1.1rem;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .form-row {
                    display: flex;
                    gap: 16px;
                    flex-wrap: wrap;
                }
                .form-group {
                    flex: 1;
                    min-width: 200px;
                    margin-bottom: 16px;
                }
                .form-group label {
                    display: block;
                    margin-bottom: 6px;
                    font-weight: 600;
                    color: #495057;
                    font-size: 0.9rem;
                }
                .form-group input,
                .form-group textarea {
                    width: 100%;
                    padding: 12px 14px;
                    border: 2px solid #dee2e6;
                    border-radius: 8px;
                    font-size: 1rem;
                    box-sizing: border-box;
                    transition: border-color 0.2s, box-shadow 0.2s;
                    font-family: inherit;
                }
                .form-group input:focus,
                .form-group textarea:focus {
                    outline: none;
                    border-color: #27ae60;
                    box-shadow: 0 0 0 4px rgba(39,174,96,0.1);
                }
                .form-group textarea {
                    height: 80px;
                    resize: vertical;
                }
                .btn-adicionar {
                    background: linear-gradient(135deg, #27ae60, #219a52);
                    color: white;
                    border: none;
                    padding: 14px 24px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 1rem;
                    font-weight: 600;
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    transition: transform 0.2s, box-shadow 0.2s;
                }
                .btn-adicionar:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(39,174,96,0.4);
                }
                .btn-adicionar:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                    transform: none;
                }
                .lista-vazia {
                    text-align: center;
                    padding: 40px 20px;
                    color: #999;
                }
                .lista-vazia i {
                    font-size: 3rem;
                    margin-bottom: 10px;
                    display: block;
                }
                .loading-reservas {
                    text-align: center;
                    padding: 40px;
                    color: #666;
                }
                .reserva-card {
                    background: white;
                    border: 1px solid #e0e0e0;
                    border-left: 5px solid #27ae60;
                    border-radius: 10px;
                    padding: 16px;
                    margin-bottom: 12px;
                    transition: box-shadow 0.2s;
                }
                .reserva-card:hover {
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                }
                .reserva-card.finalizada {
                    border-left-color: #6c757d;
                    background: #fafafa;
                }
                .reserva-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 10px;
                    flex-wrap: wrap;
                    gap: 10px;
                }
                .reserva-viatura {
                    font-size: 1.1rem;
                    font-weight: 700;
                    color: #27ae60;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    flex-wrap: wrap;
                }
                .reserva-card.finalizada .reserva-viatura {
                    color: #6c757d;
                }
                .reserva-viatura-reserva {
                    color: #666;
                    font-weight: normal;
                    font-size: 0.95rem;
                }
                .reserva-viatura-reserva strong {
                    color: #e67e22;
                }
                .reserva-card.finalizada .reserva-viatura-reserva strong {
                    color: #888;
                }
                .reserva-status {
                    padding: 4px 10px;
                    border-radius: 20px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    white-space: nowrap;
                }
                .reserva-status.ativa {
                    background: #d4edda;
                    color: #155724;
                }
                .reserva-status.finalizada {
                    background: #e9ecef;
                    color: #495057;
                }
                .reserva-motivo {
                    color: #555;
                    margin-bottom: 12px;
                    line-height: 1.5;
                    word-break: break-word;
                }
                .reserva-datas {
                    display: flex;
                    gap: 20px;
                    flex-wrap: wrap;
                    font-size: 0.9rem;
                    color: #666;
                    margin-bottom: 12px;
                }
                .reserva-datas span {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .reserva-datas i {
                    color: #27ae60;
                }
                .reserva-card.finalizada .reserva-datas i {
                    color: #6c757d;
                }
                .reserva-acoes {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                }
                .btn-acao {
                    padding: 8px 14px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.85rem;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    transition: all 0.2s;
                }
                .btn-finalizar {
                    background: #007bff;
                    color: white;
                }
                .btn-finalizar:hover {
                    background: #0056b3;
                }
                .btn-editar {
                    background: #ffc107;
                    color: #333;
                }
                .btn-editar:hover {
                    background: #e0a800;
                }
                .btn-reativar {
                    background: #28a745;
                    color: white;
                }
                .btn-reativar:hover {
                    background: #1e7e34;
                }
                .btn-excluir {
                    background: #dc3545;
                    color: white;
                }
                .btn-excluir:hover {
                    background: #c82333;
                }
                .modal-edicao-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.6);
                    z-index: 10001;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .modal-edicao-content {
                    background: white;
                    padding: 24px;
                    border-radius: 12px;
                    width: 90%;
                    max-width: 500px;
                    max-height: 90vh;
                    overflow-y: auto;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                }
                .modal-edicao-content h3 {
                    margin: 0 0 20px 0;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    color: #333;
                }
                .modal-edicao-content .form-group {
                    margin-bottom: 16px;
                }
                .modal-edicao-content .form-group label {
                    display: block;
                    margin-bottom: 6px;
                    font-weight: 600;
                    color: #495057;
                    font-size: 0.9rem;
                }
                .modal-edicao-content .form-group input,
                .modal-edicao-content .form-group textarea {
                    width: 100%;
                    padding: 10px 12px;
                    border: 2px solid #dee2e6;
                    border-radius: 8px;
                    font-size: 1rem;
                    box-sizing: border-box;
                    font-family: inherit;
                }
                .modal-edicao-content .form-group input:focus,
                .modal-edicao-content .form-group textarea:focus {
                    outline: none;
                    border-color: #27ae60;
                }
                .modal-edicao-content .form-group textarea {
                    height: 80px;
                    resize: vertical;
                }
                .modal-edicao-buttons {
                    display: flex;
                    gap: 10px;
                    justify-content: flex-end;
                    margin-top: 20px;
                }
                .btn-cancelar {
                    padding: 10px 20px;
                    background: #6c757d;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 600;
                }
                .btn-cancelar:hover {
                    background: #5a6268;
                }
                .btn-salvar {
                    padding: 10px 20px;
                    background: #27ae60;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .btn-salvar:hover {
                    background: #219a52;
                }
                .dias-em-uso {
                    background: #fff3cd;
                    color: #856404;
                    padding: 4px 10px;
                    border-radius: 20px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    white-space: nowrap;
                }
                .header-badges {
                    display: flex;
                    gap: 8px;
                    align-items: center;
                    flex-wrap: wrap;
                }
                @media (max-width: 600px) {
                    .form-row {
                        flex-direction: column;
                        gap: 0;
                    }
                    .form-group {
                        min-width: 100%;
                    }
                    .reserva-header {
                        flex-direction: column;
                    }
                    .reserva-acoes {
                        flex-direction: column;
                    }
                    .btn-acao {
                        justify-content: center;
                    }
                    .header-badges {
                        width: 100%;
                        justify-content: flex-start;
                    }
                }
            </style>
        `;

        const modalHTML = `
            <div id="modal-reservas" class="modal-reservas" style="display:none;">
                <div class="modal-reservas-overlay" onclick="ReservasViaturas.fecharModal()"></div>
                <div class="modal-reservas-content">
                    <div class="modal-reservas-header">
                        <h2><i class="fas fa-wrench"></i> Controle de Viaturas em Reserva</h2>
                        <button class="modal-reservas-close" onclick="ReservasViaturas.fecharModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="reservas-tabs">
                        <button class="reservas-tab active" onclick="ReservasViaturas.trocarAba('ativas')">
                            <i class="fas fa-car"></i> Em Uso
                            <span class="badge" id="badge-ativas">0</span>
                        </button>
                        <button class="reservas-tab" onclick="ReservasViaturas.trocarAba('historico')">
                            <i class="fas fa-history"></i> Histórico
                            <span class="badge" id="badge-historico">0</span>
                        </button>
                    </div>
                    <div class="modal-reservas-body">
                        <div class="tab-panel active" id="panel-ativas">
                            <div class="form-nova-reserva">
                                <h3><i class="fas fa-plus-circle"></i> Registrar Viatura em Uso</h3>
                                <div class="form-row">
                                    <div class="form-group" style="flex: 2;">
                                        <label><i class="fas fa-car"></i> Viatura (Vereador)</label>
                                        <input type="text" id="input-viatura" placeholder="Ex: ABC-1234 - Vereador João Silva" maxlength="50">
                                    </div>
                                    <div class="form-group" style="flex: 2;">
                                        <label><i class="fas fa-car-side"></i> Viatura Reserva</label>
                                        <input type="text" id="input-viatura-reserva" placeholder="Ex: XYZ-9876" maxlength="50">
                                    </div>
                                </div>
                                <div class="form-row">
                                    <div class="form-group" style="flex: 1; max-width: 200px;">
                                        <label><i class="fas fa-calendar"></i> Data de Início</label>
                                        <input type="date" id="input-data-inicio">
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label><i class="fas fa-clipboard"></i> Motivo</label>
                                    <textarea id="input-motivo" placeholder="Ex: Viatura oficial em manutenção preventiva..." maxlength="500"></textarea>
                                </div>
                                <button class="btn-adicionar" onclick="ReservasViaturas.adicionar()">
                                    <i class="fas fa-plus"></i> Registrar Uso
                                </button>
                            </div>
                            <div id="lista-ativas">
                                <p class="loading-reservas"><i class="fas fa-spinner fa-spin"></i> Carregando...</p>
                            </div>
                        </div>
                        <div class="tab-panel" id="panel-historico">
                            <div id="lista-historico">
                                <p class="loading-reservas"><i class="fas fa-spinner fa-spin"></i> Carregando...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', estilos + modalHTML);

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modalAberto) {
                fecharModal();
            }
        });
    }

    function trocarAba(aba) {
        abaAtiva = aba;

        document.querySelectorAll('.reservas-tab').forEach(tab => tab.classList.remove('active'));
        document.querySelector(`.reservas-tab:nth-child(${aba === 'ativas' ? 1 : 2})`).classList.add('active');

        document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
        document.getElementById(`panel-${aba}`).classList.add('active');
    }

    function calcularDiasEmUso(dataInicio) {
        const inicio = new Date(dataInicio + 'T00:00:00');
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const diff = Math.floor((hoje - inicio) / (1000 * 60 * 60 * 24));
        return diff;
    }

    function formatarData(dataISO) {
        if (!dataISO) return '--';
        const [ano, mes, dia] = dataISO.split('-');
        return `${dia}/${mes}/${ano}`;
    }

    function renderizarConteudo() {
        const ativas = reservas.filter(r => r.ativa);
        const historico = reservas.filter(r => !r.ativa);

        document.getElementById('badge-ativas').textContent = ativas.length;
        document.getElementById('badge-historico').textContent = historico.length;

        // Renderizar ativas
        const listaAtivas = document.getElementById('lista-ativas');
        if (ativas.length === 0) {
            listaAtivas.innerHTML = `
                <div class="lista-vazia">
                    <i class="fas fa-check-circle"></i>
                    <p>Nenhuma viatura reserva em uso no momento.</p>
                </div>
            `;
        } else {
            listaAtivas.innerHTML = ativas.map(r => {
                const dias = calcularDiasEmUso(r.dataInicio);
                return `
                    <div class="reserva-card">
                        <div class="reserva-header">
                            <div class="reserva-viatura">
                                <i class="fas fa-car"></i> ${escapeHtml(r.viatura)}
                                <span class="reserva-viatura-reserva">
                                    → Reserva: <strong>${escapeHtml(r.viaturaReserva || 'N/A')}</strong>
                                </span>
                            </div>
                            <div class="header-badges">
                                <span class="dias-em-uso">${dias} dia${dias !== 1 ? 's' : ''} em uso</span>
                                <span class="reserva-status ativa">Em uso</span>
                            </div>
                        </div>
                        <div class="reserva-motivo">${escapeHtml(r.motivo)}</div>
                        <div class="reserva-datas">
                            <span><i class="fas fa-calendar-plus"></i> Início: ${formatarData(r.dataInicio)}</span>
                        </div>
                        <div class="reserva-acoes">
                            <button class="btn-acao btn-finalizar" onclick="ReservasViaturas.finalizar(${r.id})">
                                <i class="fas fa-check"></i> Finalizar
                            </button>
                            <button class="btn-acao btn-editar" onclick="ReservasViaturas.editar(${r.id})">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                            <button class="btn-acao btn-excluir" onclick="ReservasViaturas.excluir(${r.id})">
                                <i class="fas fa-trash"></i> Excluir
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // Renderizar histórico
        const listaHistorico = document.getElementById('lista-historico');
        if (historico.length === 0) {
            listaHistorico.innerHTML = `
                <div class="lista-vazia">
                    <i class="fas fa-history"></i>
                    <p>Nenhum registro no histórico.</p>
                </div>
            `;
        } else {
            const historicoOrdenado = [...historico].sort((a, b) => {
                return new Date(b.dataRetorno) - new Date(a.dataRetorno);
            });

            listaHistorico.innerHTML = historicoOrdenado.map(r => {
                const inicio = new Date(r.dataInicio + 'T00:00:00');
                const retorno = new Date(r.dataRetorno + 'T00:00:00');
                const diasTotal = Math.floor((retorno - inicio) / (1000 * 60 * 60 * 24));

                return `
                    <div class="reserva-card finalizada">
                        <div class="reserva-header">
                            <div class="reserva-viatura">
                                <i class="fas fa-car"></i> ${escapeHtml(r.viatura)}
                                <span class="reserva-viatura-reserva">
                                    → Reserva: <strong>${escapeHtml(r.viaturaReserva || 'N/A')}</strong>
                                </span>
                            </div>
                            <span class="reserva-status finalizada">Finalizada (${diasTotal} dia${diasTotal !== 1 ? 's' : ''})</span>
                        </div>
                        <div class="reserva-motivo">${escapeHtml(r.motivo)}</div>
                        <div class="reserva-datas">
                            <span><i class="fas fa-calendar-plus"></i> Início: ${formatarData(r.dataInicio)}</span>
                            <span><i class="fas fa-calendar-check"></i> Retorno: ${formatarData(r.dataRetorno)}</span>
                        </div>
                        <div class="reserva-acoes">
                            <button class="btn-acao btn-reativar" onclick="ReservasViaturas.reativar(${r.id})">
                                <i class="fas fa-undo"></i> Reativar
                            </button>
                            <button class="btn-acao btn-editar" onclick="ReservasViaturas.editar(${r.id})">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                            <button class="btn-acao btn-excluir" onclick="ReservasViaturas.excluir(${r.id})">
                                <i class="fas fa-trash"></i> Excluir
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ==================== CONTROLE DO MODAL ====================

    async function abrirModal() {
        criarModal();
        const modal = document.getElementById('modal-reservas');
        modal.style.display = 'flex';
        modalAberto = true;

        document.getElementById('lista-ativas').innerHTML = '<p class="loading-reservas"><i class="fas fa-spinner fa-spin"></i> Carregando...</p>';
        document.getElementById('lista-historico').innerHTML = '<p class="loading-reservas"><i class="fas fa-spinner fa-spin"></i> Carregando...</p>';

        await carregarDados();
        renderizarConteudo();

        const hoje = new Date().toISOString().split('T')[0];
        document.getElementById('input-data-inicio').value = hoje;
    }

    function fecharModal() {
        const modal = document.getElementById('modal-reservas');
        if (modal) modal.style.display = 'none';
        modalAberto = false;
    }

    // ==================== AÇÕES DO USUÁRIO ====================

    async function adicionar() {
        const viatura = document.getElementById('input-viatura').value.trim();
        const viaturaReserva = document.getElementById('input-viatura-reserva').value.trim();
        const motivo = document.getElementById('input-motivo').value.trim();
        const dataInicio = document.getElementById('input-data-inicio').value;

        if (!viatura) {
            alert('Informe a viatura do vereador!');
            document.getElementById('input-viatura').focus();
            return;
        }
        if (!viaturaReserva) {
            alert('Informe a viatura reserva!');
            document.getElementById('input-viatura-reserva').focus();
            return;
        }
        if (!motivo) {
            alert('Informe o motivo!');
            document.getElementById('input-motivo').focus();
            return;
        }
        if (!dataInicio) {
            alert('Informe a data de início!');
            document.getElementById('input-data-inicio').focus();
            return;
        }

        const jaAtiva = reservas.some(r => r.ativa && r.viatura.toUpperCase() === viatura.toUpperCase());
        if (jaAtiva) {
            alert('Esta viatura já está em uso!');
            return;
        }

        const btnAdicionar = document.querySelector('.btn-adicionar');
        btnAdicionar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
        btnAdicionar.disabled = true;

        await adicionarReserva(viatura, viaturaReserva, motivo, dataInicio);

        btnAdicionar.innerHTML = '<i class="fas fa-plus"></i> Registrar Uso';
        btnAdicionar.disabled = false;

        document.getElementById('input-viatura').value = '';
        document.getElementById('input-viatura-reserva').value = '';
        document.getElementById('input-motivo').value = '';
        document.getElementById('input-viatura').focus();
    }

    function init(container) {
        // Não cria botão - será criado externamente
    }

    // ==================== API PÚBLICA ====================

    return {
        init,
        abrirModal,
        fecharModal,
        adicionar,
        finalizar: finalizarReserva,
        reativar: reativarReserva,
        editar: editarReserva,
        salvarEdicao,
        excluir: excluirReserva,
        trocarAba
    };
})();
