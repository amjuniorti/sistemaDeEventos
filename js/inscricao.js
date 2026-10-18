'use strict';

document.addEventListener('DOMContentLoaded', () => {
  // 🔒 PROTEÇÃO: Só entra se estiver logado como participante
  const sessao = Auth.getSessao();
  if (!sessao || sessao.tipo !== 'participante') {
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
  
  // O nome de usuário padrão é a parte antes do @. O usuário pode alterar se quiser.
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
  const sucesso = document.getElementById('mensagemSucesso');

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

    // Validação de duplicidade (mesmo e-mail no mesmo evento)
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

    // Insere a inscrição
       DB.addParticipante({
      nome: nome.value.trim(),
      email: emailFinal,
      telefone: telefone.value.trim(),
      nascimento: nascimento.value,
      eventoId: eventoId
    });

    // 👇 ADICIONE ESTA LINHA AQUI 👇
    registrarLog('Nova Inscrição', `Inscrição realizada no evento "${evento.nome}" pelo e-mail ${emailFinal}.`);

    form.reset();
    
    // Reaplica os dados da sessão após o reset
    nomeInput.value = sessao.nome || sessao.email.split('@')[0];
    emailInput.value = sessao.email;

    sucesso.style.display = 'block';
    mostrarToast('Inscrição confirmada com sucesso!', 'success', '✅');
    setTimeout(() => { sucesso.style.display = 'none'; }, 5000);
  });
});