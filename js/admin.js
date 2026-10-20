'use strict';

const ASSUNTOS_LABEL = {
  duvida: '❓ Dúvida',
  sugestao: '💡 Sugestão',
  reclamacao: '⚠️ Reclamação',
  parceria: '🤝 Parceria',
  outro: '📝 Outro'
};

/* ============================================================
   INICIALIZAÇÃO DO DASHBOARD
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  const buscaEvento       = document.getElementById('buscaEvento');
  const filtroCategoria   = document.getElementById('filtroCategoria');
  const ordemData         = document.getElementById('ordemData');
  const btnLimparFiltros  = document.getElementById('btnLimparFiltros');

  const buscaMensagem     = document.getElementById('buscaMensagem');
  const formEditar        = document.getElementById('formEditar');
  const modalEditar       = document.getElementById('modalEditar');
  const modalMensagem     = document.getElementById('modalMensagem');

  const sessaoAtual       = Auth.getSessao();
  const isAdminPrincipal  = sessaoAtual.tipo === 'admin';
  const isContratante     = sessaoAtual.tipo === 'contratante';

  // Ajusta o título da página conforme o tipo de usuário
  if (isContratante) {
    const headerH1 = document.querySelector('.page-header h1');
    const headerP  = document.querySelector('.page-header p');

    if (headerH1) headerH1.innerHTML = 'Painel do <span>Contratante</span>';
    if (headerP)  headerP.textContent = 'Gerencie os seus eventos criados';

    // Se for contratante, esconde Logs e Novo Admin
    const adminBotoes = document.getElementById('adminBotoes');
    if (adminBotoes) adminBotoes.style.display = 'none';
    
  }

  /* ---------- POPULAR SELECT DE CATEGORIAS ---------- */
  const categoriasUnicas = [...new Set(DB.getEventos().map(e => e.categoria))].sort();
  categoriasUnicas.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    filtroCategoria.appendChild(opt);
  });

  /* ============================================================
     ESTATÍSTICAS DO DASHBOARD
     ============================================================ */
  window.atualizarStats = function() {
    const eventos = DB.getEventos();
    const inscricoes = DB.getParticipantes();
    const mensagens = DB.getMensagens();
    const msgNaoLidas = mensagens.filter(m => !m.lida).length;
    const hoje = new Date().toISOString().split('T')[0];
    const futuros = eventos.filter(e => e.data >= hoje).length;
    const encerrados = eventos.filter(e => e.data < hoje).length;

    document.getElementById('statsGrid').innerHTML = `
      <div class="stat-card">
        <div class="icon">📅</div>
        <div><div class="number">${eventos.length}</div><div class="label">Eventos cadastrados</div></div>
      </div>
      <div class="stat-card success">
        <div class="icon">📝</div>
        <div><div class="number">${inscricoes.length}</div><div class="label">Inscrições</div></div>
      </div>
      <div class="stat-card info">
        <div class="icon">🚀</div>
        <div><div class="number">${futuros}</div><div class="label">Eventos futuros</div></div>
      </div>
      <div class="stat-card warning">
        <div class="icon">✅</div>
        <div><div class="number">${encerrados}</div><div class="label">Eventos encerrados</div></div>
      </div>
      <div class="stat-card" style="border-left-color:#8e44ad;">
        <div class="icon">📩</div>
        <div>
          <div class="number">${mensagens.length}${msgNaoLidas ? ` <span style="font-size:0.9rem;color:var(--danger);">(${msgNaoLidas} novas)</span>` : ''}</div>
          <div class="label">Mensagens de contato</div>
        </div>
      </div>`;
  };

  /* ============================================================
     RENDERIZAR TABELA DE EVENTOS (COM FILTROS E ORDENAÇÃO)
     ============================================================ */
    window.renderTabela = function() {
    const termoBusca = buscaEvento.value.toLowerCase().trim();
    const categoriaFiltro = filtroCategoria.value;
    const ordenacao = ordemData.value;
    
    // Pega os dados de quem está logado
    const sessaoAtual = Auth.getSessao();
    const isContratante = sessaoAtual && sessaoAtual.tipo === 'contratante';

    let eventos = DB.getEventos();
    
    // 🔒 FILTRO MÁGICO: Se for Contratante, vê só os eventos dele.
    // Se for Admin Principal, vê TODOS os eventos.
    if (isContratante) {
      eventos = eventos.filter(e => e.criador === sessaoAtual.email);
    }

    const inscricoes = DB.getParticipantes();
    const tbody = document.getElementById('tabelaEventos');

    let lista = eventos.filter(e => {
      const matchBusca = e.nome.toLowerCase().includes(termoBusca) || e.local.toLowerCase().includes(termoBusca);
      const matchCategoria = !categoriaFiltro || e.categoria === categoriaFiltro;
      return matchBusca && matchCategoria;
    });

    if (ordenacao === 'date-asc') {
      lista.sort((a, b) => new Date(a.data) - new Date(b.data));
    } else if (ordenacao === 'date-desc') {
      lista.sort((a, b) => new Date(b.data) - new Date(a.data));
    }

    if (!lista.length) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--gray-600);">Nenhum evento encontrado.</td></tr>`;
      return;
    }

    tbody.innerHTML = lista.map(e => {
      const inscritos = inscricoes.filter(p => p.eventoId === e.id).length;
      const restantes = e.vagas - inscritos;
      return `
        <tr>
          <td><strong>${e.nome}</strong></td>
          <td><span class="badge info">${e.categoria}</span></td>
          <td>${formatarData(e.data)}</td>
          <td>${e.vagas}</td>
          <td>${inscritos} (${restantes > 0 ? restantes + ' restantes' : 'LOTADO'})</td>
          <td>
            <div class="actions">
              <button class="btn btn-outline btn-sm" onclick="editarEvento(${e.id})" title="Editar">✏️</button>
              <button class="btn btn-danger btn-sm" onclick="excluirEvento(${e.id}, '${e.nome.replace(/'/g, "\\'")}')" title="Excluir">🗑</button>
            </div>
          </td>
        </tr>`;
    }).join('');
  };

  /* ============================================================
     LIMPAR FILTROS
     ============================================================ */
  btnLimparFiltros.addEventListener('click', () => {
    buscaEvento.value = '';
    filtroCategoria.value = '';
    ordemData.value = 'date-asc';
    renderTabela();
    mostrarToast('Filtros limpos!', 'success', '✓');
  });

  /* ============================================================
     LÓGICA DE EXCLUSÃO E EDIÇÃO
     ============================================================ */
  window.excluirEvento = function(id, nome) {
    // Confirmação
    if (!confirm(`Excluir o evento "${nome}"? Os participantes vinculados também serão removidos.`)) return;
    
    // Deleta o evento
    DB.deleteEvento(id);
    
    // Remove os participantes vinculados a ele
    const participantes = DB.getParticipantes().filter(p => p.eventoId !== id);
    DB.setParticipantes(participantes);
    
    // 👇 REGISTRA O LOG DE AUDITORIA
    if (typeof registrarLog === 'function') {
      registrarLog('Excluir Evento', `O evento "${nome}" (ID ${id}) foi excluído pelo admin.`);
    } else {
      console.warn('Função registrarLog não encontrada no app.js');
    }

    // Atualiza a tela
    mostrarToast('Evento excluído.', 'warning', '🗑');
    atualizarStats();
    renderTabela(); 
  };

  window.editarEvento = function(id) {
    const e = DB.getEventos().find(x => x.id === id);
    if (!e) return;
    
    document.getElementById('editId').value = e.id;
    document.getElementById('editNome').value = e.nome;
    document.getElementById('editData').value = e.data;
    document.getElementById('editHorario').value = e.horario;
    document.getElementById('editLocal').value = e.local;
    document.getElementById('editVagas').value = e.vagas;
    document.getElementById('editResponsavel').value = e.responsavel;
    document.getElementById('editDescricao').value = e.descricao;

    const catSelect = document.getElementById('editCategoria');
    catSelect.innerHTML = '';
    const categorias = ['Tecnologia', 'Inteligência Artificial', 'Programação', 'Redes', 'Banco de Dados', 'Desenvolvimento Web'];
    categorias.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c; opt.textContent = c;
      if (c === e.categoria) opt.selected = true;
      catSelect.appendChild(opt);
    });

    modalEditar.classList.add('open');
  };

  formEditar.addEventListener('submit', e => {
    e.preventDefault();
    
    const id = parseInt(document.getElementById('editId').value);
    
    // Captura os dados do formulário
    const dadosAtualizados = {
      nome: document.getElementById('editNome').value.trim(),
      categoria: document.getElementById('editCategoria').value,
      data: document.getElementById('editData').value,
      horario: document.getElementById('editHorario').value.trim(),
      local: document.getElementById('editLocal').value.trim(),
      vagas: parseInt(document.getElementById('editVagas').value),
      responsavel: document.getElementById('editResponsavel').value.trim(),
      descricao: document.getElementById('editDescricao').value.trim()
    };

    // Atualiza no banco de dados
    DB.updateEvento(id, dadosAtualizados);

    // 👇 ADICIONE ESTA LINHA PARA REGISTRAR O LOG
    registrarLog('Editar Evento', `O evento "${dadosAtualizados.nome}" (ID ${id}) foi atualizado.`);

    // Fecha o modal e atualiza a tela
    modalEditar.classList.remove('open');
    mostrarToast('Evento atualizado!', 'success', '✏️');
    atualizarStats();
    renderTabela();
  });

  /* ============================================================
     MENSAGENS DE CONTATO
     ============================================================ */
  window.renderMensagens = function() {
    const termoBusca = buscaMensagem.value.toLowerCase().trim();
    const tbody = document.getElementById('tabelaMensagens');
    let mensagens = DB.getMensagens().sort((a, b) => new Date(b.data) - new Date(a.data));

    if (termoBusca) {
      mensagens = mensagens.filter(m =>
        m.nome.toLowerCase().includes(termoBusca) ||
        m.email.toLowerCase().includes(termoBusca) ||
        m.mensagem.toLowerCase().includes(termoBusca) ||
        (ASSUNTOS_LABEL[m.assunto] || m.assunto).toLowerCase().includes(termoBusca)
      );
    }

    if (!mensagens.length) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--gray-600);">📭 Nenhuma mensagem encontrada.</td></tr>`;
      return;
    }

    tbody.innerHTML = mensagens.map(m => {
      const assuntoFmt = ASSUNTOS_LABEL[m.assunto] || m.assunto;
      const msgCurta = m.mensagem.length > 60 ? m.mensagem.slice(0, 60) + '...' : m.mensagem;
      const estiloNaoLida = !m.lida ? 'font-weight:700; background:#fff8f8;' : '';
      return `
        <tr style="${estiloNaoLida}">
          <td>${!m.lida ? '<span style="color:var(--danger);">●</span> ' : ''}<strong>${m.nome}</strong></td>
          <td>${m.email}</td>
          <td><span class="badge info">${assuntoFmt}</span></td>
          <td title="${m.mensagem.replace(/"/g, '&quot;')}">${msgCurta}</td>
          <td>${formatarDataHora(m.data)}</td>
          <td>
            <div class="actions">
              <button class="btn btn-outline btn-sm" onclick="verMensagem(${m.id})" title="Ver completa">👁</button>
              <button class="btn btn-danger btn-sm" onclick="excluirMensagem(${m.id})" title="Excluir">🗑</button>
            </div>
          </td>
        </tr>`;
    }).join('');
  };

  window.verMensagem = function(id) {
    const m = DB.getMensagens().find(x => x.id === id);
    if (!m) return;
    DB.marcarMensagemLida(id);
    
    document.getElementById('conteudoMensagem').innerHTML = `
      <h2>📩 Mensagem de Contato</h2>
      <div style="display:flex;flex-direction:column;gap:0.8rem; margin-top:1rem;">
        <div><strong>👤 Nome:</strong> ${m.nome}</div>
        <div><strong>📧 E-mail:</strong> ${m.email}</div>
        <div><strong>🏷️ Assunto:</strong> <span class="badge info">${ASSUNTOS_LABEL[m.assunto] || m.assunto}</span></div>
        <div><strong>🕒 Data:</strong> ${formatarDataHora(m.data)}</div>
        <div style="margin-top:1rem;padding-top:1rem;border-top:1px solid var(--gray-200);">
          <strong>💬 Mensagem:</strong>
          <p style="margin-top:0.5rem;white-space:pre-wrap;color:var(--gray-700);line-height:1.7;">${m.mensagem}</p>
        </div>
      </div>
      <div style="display:flex;gap:0.6rem;margin-top:1.5rem;">
        <a href="mailto:${m.email}?subject=Re: ${encodeURIComponent(ASSUNTOS_LABEL[m.assunto] || m.assunto)}" class="btn btn-primary" style="flex:1;">✉️ Responder</a>
        <button class="btn btn-danger" onclick="excluirMensagem(${m.id}, true)">🗑 Excluir</button>
      </div>
    `;
    modalMensagem.classList.add('open');
    atualizarStats();
    renderMensagens();
  };

  window.excluirMensagem = function(id, fecharModalDepois = false) {
    if (!confirm('Excluir esta mensagem?')) return;
    DB.deleteMensagem(id);
    mostrarToast('Mensagem excluída.', 'warning', '🗑');
    if (fecharModalDepois) modalMensagem.classList.remove('open');
    atualizarStats();
    renderMensagens();
  };

  /* ============================================================
     LISTENERS E INICIALIZAÇÃO
     ============================================================ */
  
  buscaEvento.addEventListener('input', renderTabela);
  filtroCategoria.addEventListener('change', renderTabela);
  ordemData.addEventListener('change', renderTabela);
  
  buscaMensagem.addEventListener('input', renderMensagens);

  document.getElementById('fecharModal').addEventListener('click', () => modalEditar.classList.remove('open'));
  document.getElementById('fecharModalMsg').addEventListener('click', () => modalMensagem.classList.remove('open'));
  modalEditar.addEventListener('click', (e) => { if (e.target === modalEditar) modalEditar.classList.remove('open'); });
  modalMensagem.addEventListener('click', (e) => { if (e.target === modalMensagem) modalMensagem.classList.remove('open'); });

  document.getElementById('limparMensagens').addEventListener('click', () => {
    if (!DB.getMensagens().length) return mostrarToast('Nenhuma mensagem.', 'info', 'ℹ️');
    if (!confirm('Tem certeza que deseja excluir TODAS as mensagens?')) return;
    DB.limparMensagens();
    mostrarToast('Todas as mensagens foram removidas.', 'warning', '🗑');
    atualizarStats();
    renderMensagens();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      modalEditar.classList.remove('open');
      modalMensagem.classList.remove('open');
    }
  });

  atualizarStats();
  renderTabela();
  renderMensagens();
});