const ReservasViaturas = (function() {
    // Configuração JSONBin.io
    const JSONBIN_BIN_ID = '69a87f2bae596e708f5f5724';
    const JSONBIN_API_KEY = '$2a$10$9YFcagKpP0flpiOMrmWzleuR5BoVE50.kExP.7PdKgdGciDmrkwo2';
    const JSONBIN_URL = `https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`;

    let reservas = [];
    let modalAberto = false;

    // ==================== FUNÇÕES DE API ====================

    // Carregar dados do JSONBin
    async function carregarDados() {
        try {
            const response = await fetch(JSONBIN_URL, {
                method: 'GET',
                headers: {
                    'X-Access-Key': JSONBIN_API_KEY
                }
            });
            const data = await response.json();
            reservas = data.record.reservas || data.record || [];
            if (!Array.isArray(reservas)) reservas = [];
            console.log('Reservas carregadas:', reservas);
        } catch (error) {
            console.error('Erro ao carregar reservas:', error);
            reservas = [];
        }
    }

    // Salvar dados no JSONBin
    async function salvarDados() {
        try {
            const response = await fetch(JSONBIN_URL, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Access-Key': JSONBIN_API_KEY
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

    // Adicionar reserva
    async function adicionarReserva(viatura, motivo, previsao) {
        const novaReserva = {
            id: Date.now(),
            viatura: viatura,
            motivo: motivo,
            previsao: previsao,
            dataRegistro: new Date().toISOString()
        };
        reservas.push(novaReserva);
        await salvarDados();
        renderizarLista();
    }

    // Remover reserva
    async function removerReserva(id) {
        if (confirm('Deseja realmente liberar esta viatura da reserva?')) {
            reservas = reservas.filter(r => r.id !== id);
            await salvarDados();
            renderizarLista();
        }
    }

    // ==================== INTERFACE ====================

    // Criar modal
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
                    border-radius: 12px;
                    width: 90%;
                    max-width: 700px;
                    max-height: 90vh;
                    overflow: hidden;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    animation: modalEntrada 0.3s ease;
                }
                @keyframes modalEntrada {
                    from {
                        opacity: 0;
                        transform: scale(0.9) translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }
                .modal-reservas-header {
                    background: linear-gradient(135deg, #27ae60, #219a52);
                    color: white;
                    padding: 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .modal-reservas-header h2 {
                    margin: 0;
                    font-size: 1.3rem;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .modal-reservas-close {
                    background: rgba(255,255,255,0.2);
                    border: none;
                    color: white;
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    cursor: pointer;
                    font-size: 1.1rem;
                    transition: background 0.2s;
                }
                .modal-reservas-close:hover {
                    background: rgba(255,255,255,0.3);
                }
                .modal-reservas-body {
                    padding: 20px;
                    max-height: calc(90vh - 80px);
                    overflow-y: auto;
                }
                .form-nova-reserva {
                    background: linear-gradient(135deg, #f8f9fa, #e9ecef);
                    padding: 20px;
                    border-radius: 10px;
                    margin-bottom: 20px;
                    border: 1px solid #dee2e6;
                }
                .form-nova-reserva h3 {
                    margin: 0 0 15px 0;
                    color: #333;
                    font-size: 1.1rem;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .form-row {
                    display: flex;
                    gap: 15px;
                }
                @media (max-width: 500px) {
                    .form-row {
                        flex-direction: column;
                        gap: 0;
                    }
                }
                .form-group {
                    flex: 1;
                    margin-bottom: 15px;
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
                .btn-adicionar:active {
                    transform: translateY(0);
                }
                .lista-reservas h3 {
                    margin: 0 0 15px 0;
                    color: #333;
                    font-size: 1.1rem;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                #contador-reservas {
                    background: #27ae60;
                    color: white;
                    padding: 2px 10px;
                    border-radius: 12px;
                    font-size: 0.85rem;
                    font-weight: 600;
                }
                .lista-vazia {
                    text-align: center;
                    color: #999;
                    padding: 40px 20px;
                    font-style: italic;
                }
                .loading-reservas {
                    text-align: center;
                    padding: 40px 20px;
                    color: #666;
                }
                .loading-reservas i {
                    font-size: 1.5rem;
                    margin-bottom: 10px;
                    display: block;
                    color: #27ae60;
                }
                .reserva-item {
                    background: white;
                    border: 1px solid #e0e0e0;
                    border-left: 4px solid #27ae60;
                    border-radius: 8px;
                    padding: 15px;
                    margin-bottom: 12px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 15px;
                    transition: box-shadow 0.2s, transform 0.2s;
                }
                .reserva-item:hover {
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                    transform: translateY(-1px);
                }
                .reserva-item.atrasada {
                    border-left-color: #e74c3c;
                    background: #fff9f9;
                }
                .reserva-info {
                    flex: 1;
                    min-width: 0;
                }
                .reserva-viatura {
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: #27ae60;
                    margin-bottom: 4px;
                }
                .reserva-item.atrasada .reserva-viatura {
                    color: #e74c3c;
                }
                .reserva-motivo {
                    color: #555;
                    margin: 6px 0;
                    line-height: 1.4;
                    word-break: break-word;
                }
                .reserva-datas {
                    display: flex;
                    gap: 15px;
                    flex-wrap: wrap;
                    font-size: 0.85rem;
                    color: #888;
                    margin-top: 8px;
                }
                .reserva-datas span {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }
                .reserva-datas .atrasada {
                    color: #e74c3c;
                    font-weight: 600;
                }
                .btn-remover {
                    background: linear-gradient(135deg, #27ae60, #219a52);
                    color: white;
                    border: none;
                    padding: 10px 16px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 0.9rem;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    transition: transform 0.2s, box-shadow 0.2s;
                    white-space: nowrap;
                }
                .btn-remover:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(39,174,96,0.4);
                }
                @media (max-width: 500px) {
                    .reserva-item {
                        flex-direction: column;
                        align-items: stretch;
                    }
                    .btn-remover {
                        justify-content: center;
                        margin-top: 10px;
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
                    <div class="modal-reservas-body">
                        <div class="form-nova-reserva">
                            <h3><i class="fas fa-plus-circle"></i> Adicionar Viatura à Reserva</h3>
                            <div class="form-row">
                                <div class="form-group">
                                    <label><i class="fas fa-car"></i> Viatura (Prefixo)</label>
                                    <input type="text" id="input-viatura" placeholder="Ex: 1234" maxlength="10">
                                </div>
                                <div class="form-group">
                                    <label><i class="fas fa-calendar-alt"></i> Previsão de Retorno</label>
                                    <input type="date" id="input-previsao">
                                </div>
                            </div>
                            <div class="form-group">
                                <label><i class="fas fa-clipboard"></i> Motivo da Reserva</label>
                                <textarea id="input-motivo" placeholder="Descreva o motivo da reserva..."></textarea>
                            </div>
                            <button class="btn-adicionar" onclick="ReservasViaturas.adicionar()">
                                <i class="fas fa-plus"></i> Adicionar à Reserva
                            </button>
                        </div>
                        <div class="lista-reservas">
                            <h3><i class="fas fa-list"></i> Viaturas em Reserva <span id="contador-reservas">0</span></h3>
                            <div id="lista-reservas-container">
                                <p class="lista-vazia">Nenhuma viatura em reserva.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', estilos + modalHTML);

        // Fechar com ESC
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modalAberto) {
                fecharModal();
            }
        });
    }

    // Renderizar lista de reservas
    function renderizarLista() {
        const container = document.getElementById('lista-reservas-container');
        const contador = document.getElementById('contador-reservas');
        
        if (!container) return;

        contador.textContent = reservas.length;

        if (reservas.length === 0) {
            container.innerHTML = '<p class="lista-vazia"><i class="fas fa-check-circle"></i> Nenhuma viatura em reserva.</p>';
            return;
        }

        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        // Ordenar: atrasadas primeiro, depois por data de previsão
        const reservasOrdenadas = [...reservas].sort((a, b) => {
            const dataA = new Date(a.previsao);
            const dataB = new Date(b.previsao);
            return dataA - dataB;
        });

        let html = '';
        reservasOrdenadas.forEach(r => {
            const previsaoDate = new Date(r.previsao + 'T00:00:00');
            const registroDate = new Date(r.dataRegistro);
            const atrasada = previsaoDate < hoje;
            
            const previsaoFormatada = previsaoDate.toLocaleDateString('pt-BR');
            const registroFormatado = registroDate.toLocaleDateString('pt-BR');

            html += `
                <div class="reserva-item ${atrasada ? 'atrasada' : ''}">
                    <div class="reserva-info">
                        <div class="reserva-viatura">
                            <i class="fas fa-car"></i> Viatura ${escapeHtml(r.viatura)}
                        </div>
                        <div class="reserva-motivo">${escapeHtml(r.motivo)}</div>
                        <div class="reserva-datas">
                            <span>
                                <i class="fas fa-calendar-plus"></i> 
                                Registro: ${registroFormatado}
                            </span>
                            <span class="${atrasada ? 'atrasada' : ''}">
                                <i class="fas fa-calendar-check"></i> 
                                Previsão: ${previsaoFormatada}
                                ${atrasada ? ' (ATRASADA)' : ''}
                            </span>
                        </div>
                    </div>
                    <button class="btn-remover" onclick="ReservasViaturas.remover(${r.id})">
                        <i class="fas fa-check"></i> Liberar
                    </button>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    // Escapar HTML para evitar XSS
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ==================== CONTROLE DO MODAL ====================

    // Abrir modal
    async function abrirModal() {
        criarModal();
        const modal = document.getElementById('modal-reservas');
        modal.style.display = 'flex';
        modalAberto = true;
        
        // Mostrar loading
        const container = document.getElementById('lista-reservas-container');
        container.innerHTML = '<div class="loading-reservas"><i class="fas fa-spinner fa-spin"></i><br>Carregando reservas...</div>';
        
        // Carregar dados e renderizar
        await carregarDados();
        renderizarLista();
        
        // Definir data mínima como hoje
        const hoje = new Date().toISOString().split('T')[0];
        document.getElementById('input-previsao').setAttribute('min', hoje);
    }

    // Fechar modal
    function fecharModal() {
        const modal = document.getElementById('modal-reservas');
        if (modal) modal.style.display = 'none';
        modalAberto = false;
    }

    // ==================== AÇÕES DO USUÁRIO ====================

    // Adicionar (chamado pelo botão)
    async function adicionar() {
        const inputViatura = document.getElementById('input-viatura');
        const inputMotivo = document.getElementById('input-motivo');
        const inputPrevisao = document.getElementById('input-previsao');

        const viatura = inputViatura.value.trim();
        const motivo = inputMotivo.value.trim();
        const previsao = inputPrevisao.value;

        // Validações
        if (!viatura) {
            alert('Informe o prefixo da viatura!');
            inputViatura.focus();
            return;
        }

        if (!motivo) {
            alert('Informe o motivo da reserva!');
            inputMotivo.focus();
            return;
        }

        if (!previsao) {
            alert('Informe a previsão de retorno!');
            inputPrevisao.focus();
            return;
        }

        // Verificar se viatura já está na lista
        const jaExiste = reservas.some(r => r.viatura.toLowerCase() === viatura.toLowerCase());
        if (jaExiste) {
            alert('Esta viatura já está na lista de reservas!');
            inputViatura.focus();
            return;
        }

        // Desabilitar botão durante salvamento
        const btnAdicionar = document.querySelector('.btn-adicionar');
        const textoOriginal = btnAdicionar.innerHTML;
        btnAdicionar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
        btnAdicionar.disabled = true;

        await adicionarReserva(viatura, motivo, previsao);

        // Reabilitar botão
        btnAdicionar.innerHTML = textoOriginal;
        btnAdicionar.disabled = false;

        // Limpar campos
        inputViatura.value = '';
        inputMotivo.value = '';
        inputPrevisao.value = '';
        inputViatura.focus();
    }

    // Criar botão (vazio - será criado externamente no HTML)
    function criarBotao(container) {
        // Não cria botão - será criado externamente
        return;
    }

    // ==================== INICIALIZAÇÃO ====================

    function init(container) {
        criarBotao(container);
    }

    // ==================== API PÚBLICA ====================

    return {
        init,
        abrirModal,
        fecharModal,
        adicionar,
        remover: removerReserva
    };
})();
