'use strict';

document.addEventListener('DOMContentLoaded', () => {
  // 🔒 PROTEÇÃO: Permite Participante OU Contratante
  const sessao = Auth.getSessao();
  if (!sessao || (sessao.tipo !== 'participante' && sessao.tipo !== 'contratante')) {
    mostrarToast('Você precisa estar logado para se inscrever.', 'warning', '🔒');
    const urlAtual = location.pathname.split('/').pop() + location.search;
    setTimeout(() => {
      window.location.href = `login.html?redirect=${encodeURIComponent(urlAtual)}`;
    }, 1500);
    return;
  }

  // Preenche os dados do usuário logado
  document.getElementById('emailSessao').textContent = sessao.email;
  const nomeInput = document.getElementById('nome');
  const emailInput = document.getElementById('email');
  
  nomeInput.value = sessao.nome || sessao.email.split('@')[0];
  emailInput.value = sessao.email;

  // ... (o restante do código continua igual, a partir do "Popula o select de eventos")
  // Preenche os dados do usuário logado
  document.getElementById('emailSessao').textContent = sessao.email;
  const nomeInput = document.getElementById('nome');
  const emailInput = document.getElementById('email');
  
  nomeInput.value = sessao.nome || sessao.email.split('@')[0];
  emailInput.value = sessao.email;

  // Popula o select de eventos
  const eventos = DB.getEventos();
  const select = document.getElementById('eventoSelect');

  eventos.forEach(e => {
    const inscritos = DB.getParticipantes().filter(p => p.eventoId === e.id).length;
    const restantes = e.vagas - inscritos;
    const opt = document.createElement('option');
    opt.value = e.id;
    opt.textContent = `${e.nome} — ${formatarData(e.data)} (${restantes > 0 ? restantes + ' vagas' : 'LOTADO'})`;
    opt.disabled = restantes <= 0;
    select.appendChild(opt);
  });

  // Pré-seleciona o evento se vier pela URL
  const params = new URLSearchParams(location.search);
  if (params.get('eventoId')) {
    select.value = params.get('eventoId');
  }

  const form = document.getElementById('formInscricao');

  // Máscara de telefone
  document.getElementById('telefone').addEventListener('input', e => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 11);
    if (v.length > 6) {
      v = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
    } else if (v.length > 2) {
      v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
    }
    e.target.value = v;
  });

  form.querySelectorAll('input, select').forEach(campo => {
    campo.addEventListener('input', () => Validacao.limparErro(campo));
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    Validacao.limparTodos(form);

    const nome = document.getElementById('nome');
    const email = document.getElementById('email');
    const telefone = document.getElementById('telefone');
    const nascimento = document.getElementById('nascimento');

    let valido = true;

    if (!nome.value.trim() || nome.value.trim().length < 3) {
      Validacao.aplicarErro(nome, 'Nome inválido (mín. 3 letras).'); valido = false;
    }
    if (!Validacao.emailValido(email.value.trim())) {
      Validacao.aplicarErro(email, 'E-mail inválido.'); valido = false;
    }
    if (!Validacao.telefoneValido(telefone.value)) {
      Validacao.aplicarErro(telefone, 'Telefone inválido.'); valido = false;
    }
    if (!Validacao.dataNascimentoValida(nascimento.value)) {
      Validacao.aplicarErro(nascimento, 'Data inválida.'); valido = false;
    }
    if (!select.value) {
      Validacao.aplicarErro(select, 'Escolha um evento.'); valido = false;
    }

    if (!valido) {
      mostrarToast('Corrija os campos destacados.', 'error', '⚠️');
      return;
    }

    const eventoId = parseInt(select.value);
    const emailFinal = email.value.trim().toLowerCase();

    // Validação de duplicidade
    const jaInscrito = DB.getParticipantes().find(p =>
      p.eventoId === eventoId && p.email.toLowerCase() === emailFinal
    );

    if (jaInscrito) {
      const ev = DB.getEventos().find(x => x.id === eventoId);
      mostrarToast(`Você já está inscrito em "${ev.nome}"!`, 'error', '❌');
      return;
    }

    // Validação de vagas
    const evento = DB.getEventos().find(e => e.id === eventoId);
    const inscritos = DB.getParticipantes().filter(p => p.eventoId === eventoId).length;

    if (inscritos >= evento.vagas) {
      mostrarToast('Este evento já está lotado!', 'error', '❌');
      return;
    }

    // ============================================================
    // GERA O CÓDIGO DO INGRESSO E SALVA
    // ============================================================
    const codigoIngresso = 'EVH-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    DB.addParticipante({
      nome: nome.value.trim(),
      email: emailFinal,
      telefone: telefone.value.trim(),
      nascimento: nascimento.value,
      eventoId: eventoId,
      codigo: codigoIngresso
    });

    registrarLog('Nova Inscrição', `Inscrição no evento "${evento.nome}" por ${emailFinal}.`);

    // ============================================================
    // EXIBE O INGRESSO COM QR CODE NA TELA
    // ============================================================
    form.style.display = 'none';
    
    const ticketDiv = document.createElement('div');
    ticketDiv.className = 'form-card';
    ticketDiv.style.textAlign = 'center';
    ticketDiv.innerHTML = `
      <h2 style="color:var(--success); margin-bottom:0.5rem;">✅ Inscrição Confirmada!</h2>
      <p style="color:var(--gray-600); margin-bottom:2rem;">Apresente este ingresso na entrada do evento.</p>
      
      <div style="background:white; border: 2px dashed var(--primary); border-radius: 12px; padding: 2rem; max-width: 400px; margin: 0 auto;">
        <div style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; color: var(--gray-500);">${evento.categoria}</div>
        <h3 style="font-size: 1.5rem; color: var(--dark); margin: 0.5rem 0;">${evento.nome}</h3>
        <p style="color: var(--gray-600); font-size: 0.9rem;">📅 ${formatarData(evento.data)} às ${evento.horario}</p>
        <p style="color: var(--gray-600); font-size: 0.9rem;">📍 ${evento.local}</p>
        
        <hr style="border: none; border-top: 1px dashed var(--gray-300); margin: 1.5rem 0;">
        
        <div style="display: flex; justify-content: space-between; text-align: left; font-size: 0.9rem;">
          <div><strong>Participante:</strong><br>${nome.value.trim()}</div>
          <div><strong>Código:</strong><br>${codigoIngresso}</div>
        </div>
        
        <div id="qrcode" style="display: flex; justify-content: center; margin-top: 1.5rem; padding: 1rem; background: white;"></div>
      </div>
      
      <div style="margin-top: 2rem; display: flex; gap: 1rem; justify-content: center;">
        <button onclick="window.location.href='participantes.html'" class="btn btn-outline">Ver Minhas Inscrições</button>
        <button onclick="window.print()" class="btn btn-primary">🖨️ Baixar Ingresso</button>
      </div>
    `;
    
    // Adiciona o ingresso na tela (logo abaixo do formulário oculto)
    form.parentElement.appendChild(ticketDiv);
    
    // Gera o QR Code
    setTimeout(() => {
      new QRCode(document.getElementById("qrcode"), {
        text: `Evento: ${evento.nome}\nParticipante: ${nome.value.trim()}\nCódigo: ${codigoIngresso}`,
        width: 128,
        height: 128,
        colorDark: "#1a1a2e",
        colorLight: "#ffffff"
      });
    }, 100);
  });
});