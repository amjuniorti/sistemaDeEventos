'use strict';

/* ============================================================
   MENSAGENS — tradução dos assuntos
   ============================================================ */
const ASSUNTOS_LABEL = {
  duvida: '❓ Dúvida',
  sugestao: '💡 Sugestão',
  reclamacao: '⚠️ Reclamação',
  parceria: '🤝 Parceria',
  outro: '📝 Outro'
};

/* ============================================================
   ESTATÍSTICAS DO DASHBOARD
   ============================================================ */
function atualizarStats() {
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
}

/* ============================================================
   TABELA DE EVENTOS
   ============================================================ */
function renderTabela(busca = '') {
  const eventos = DB.getEventos();
  const inscricoes = DB.getParticipantes();
  const tbody = document.getElementById('tabelaEventos');

  let lista = eventos;
  if (busca) {
    const q = busca.toLowerCase();
    lista = eventos.filter(e =>
      e.nome.toLowerCase().includes(q) || e.categoria.toLowerCase().includes(q)
    );
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
}

function excluirEvento(id, nome) {
  if (!confirm(`Excluir o evento "${nome}"? Os participantes vinculados também serão removidos.`)) return;
  DB.deleteEvento(id);
  const participantes = DB.getParticipantes().filter(p => p.eventoId !== id);
  DB.setParticipantes(participantes);
  mostrarToast('Evento excluído.', 'warning', '🗑');
  atualizarStats();
  renderTabela(document.getElementById('buscaEvento').value);
}

/* ============================================================
   MODAL DE EDIÇÃO DE EVENTO
   ============================================================ */
const modalEditar = document.getElementById('modalEditar');
const formEditar = document.getElementById('formEditar');

function editarEvento(id) {
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
}

document.getElementById('fecharModal').addEventListener('click', () => {
  modalEditar.classList.remove('open');
});
modalEditar.addEventListener('click', e => {
  if (e.target === modalEditar) modalEditar.classList.remove('open');
});

formEditar.addEventListener('submit', e => {
  e.preventDefault();
  const id = parseInt(document.getElementById('editId').value);
  DB.updateEvento(id, {
    nome: document.getElementById('editNome').value.trim(),
    categoria: document.getElementById('editCategoria').value,
    data: document.getElementById('editData').value,
    horario: document.getElementById('editHorario').value.trim(),
    local: document.getElementById('editLocal').value.trim(),
    vagas: parseInt(document.getElementById('editVagas').value),
    responsavel: document.getElementById('editResponsavel').value.trim(),
    descricao: document.getElementById('editDescricao').value.trim()
  });
  modalEditar.classList.remove('open');
  mostrarToast('Evento atualizado!', 'success', '✏️');
  atualizarStats();
  renderTabela(document.getElementById('buscaEvento').value);
});

document.getElementById('buscaEvento').addEventListener('input', e => renderTabela(e.target.value));

/* ============================================================
   MENSAGENS DE CONTATO — RENDER
   ============================================================ */
function renderMensagens(busca = '') {
  const tbody = document.getElementById('tabelaMensagens');
  if (!tbody) return;

  let mensagens = DB.getMensagens();

  // Mais recentes primeiro
  mensagens.sort((a, b) => new Date(b.data) - new Date(a.data));

  // Filtro de busca
  if (busca) {
    const q = busca.toLowerCase();
    mensagens = mensagens.filter(m =>
      m.nome.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.mensagem.toLowerCase().includes(q) ||
      (ASSUNTOS_LABEL[m.assunto] || m.assunto).toLowerCase().includes(q)
    );
  }

  if (!mensagens.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center;padding:2rem;color:var(--gray-600);">
          📭 Nenhuma mensagem recebida ainda. Envie uma pelo formulário de <a href="contato.html" style="color:var(--primary);font-weight:700;">Contato</a>.
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = mensagens.map(m => {
    const assuntoFmt = ASSUNTOS_LABEL[m.assunto] || m.assunto;
    const msgCurta = m.mensagem.length > 60
      ? m.mensagem.slice(0, 60) + '...'
      : m.mensagem;
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
}

/* ============================================================
   MENSAGENS — VER COMPLETA (modal)
   ============================================================ */
const modalMensagem = document.getElementById('modalMensagem');
const conteudoMensagem = document.getElementById('conteudoMensagem');

function verMensagem(id) {
  const m = DB.getMensagens().find(x => x.id === id);
  if (!m) return;

  // Marcar como lida
  DB.marcarMensagemLida(id);

  const assuntoFmt = ASSUNTOS_LABEL[m.assunto] || m.assunto;

  conteudoMensagem.innerHTML = `
    <h2>📩 Mensagem de Contato</h2>
    <div style="display:flex;flex-direction:column;gap:0.8rem;">
      <div><strong>👤 Nome:</strong> ${m.nome}</div>
      <div><strong>📧 E-mail:</strong> <a href="mailto:${m.email}" style="color:var(--primary);">${m.email}</a></div>
      <div><strong>🏷️ Assunto:</strong> <span class="badge info">${assuntoFmt}</span></div>
      <div><strong>🕒 Data:</strong> ${formatarDataHora(m.data)}</div>
      <div style="margin-top:1rem;padding-top:1rem;border-top:1px solid var(--gray-200);">
        <strong>💬 Mensagem:</strong>
        <p style="margin-top:0.5rem;white-space:pre-wrap;color:var(--gray-700);line-height:1.7;">${m.mensagem}</p>
      </div>
    </div>
    <div style="display:flex;gap:0.6rem;margin-top:1.5rem;">
      <a href="mailto:${m.email}?subject=Re: ${encodeURIComponent(assuntoFmt)}" class="btn btn-primary" style="flex:1;">✉️ Responder por e-mail</a>
      <button class="btn btn-danger" onclick="excluirMensagem(${m.id}, true)">🗑 Excluir</button>
    </div>
  `;

  modalMensagem.classList.add('open');
  atualizarStats();
  renderMensagens(document.getElementById('buscaMensagem').value);
}

document.getElementById('fecharModalMsg').addEventListener('click', () => {
  modalMensagem.classList.remove('open');
});
modalMensagem.addEventListener('click', e => {
  if (e.target === modalMensagem) modalMensagem.classList.remove('open');
});

/* ============================================================
   MENSAGENS — EXCLUIR
   ============================================================ */
function excluirMensagem(id, fecharModalDepois = false) {
  if (!confirm('Excluir esta mensagem?')) return;
  DB.deleteMensagem(id);
  mostrarToast('Mensagem excluída.', 'warning', '🗑');
  if (fecharModalDepois) modalMensagem.classList.remove('open');
  atualizarStats();
  renderMensagens(document.getElementById('buscaMensagem').value);
}

/* ============================================================
   MENSAGENS — LIMPAR TODAS
   ============================================================ */
const btnLimpar = document.getElementById('limparMensagens');
if (btnLimpar) {
  btnLimpar.addEventListener('click', () => {
    if (!DB.getMensagens().length) {
      mostrarToast('Nenhuma mensagem para limpar.', 'info', 'ℹ️');
      return;
    }
    if (!confirm('Tem certeza que deseja excluir TODAS as mensagens?')) return;
    DB.limparMensagens();
    mostrarToast('Todas as mensagens foram removidas.', 'warning', '🗑');
    atualizarStats();
    renderMensagens();
  });
}

/* ============================================================
   MENSAGENS — BUSCA EM TEMPO REAL
   ============================================================ */
const buscaMsg = document.getElementById('buscaMensagem');
if (buscaMsg) {
  buscaMsg.addEventListener('input', e => renderMensagens(e.target.value));
}

/* ============================================================
   FECHAR MODAIS COM ESC
   ============================================================ */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    modalEditar.classList.remove('open');
    modalMensagem.classList.remove('open');
  }
});

/* ============================================================
   INICIALIZAÇÃO
   ============================================================ */
atualizarStats();
renderTabela();
renderMensagens();