'use strict';

/* ============================================================
   INSCRIÇÃO EM EVENTOS
   - Bloqueia duplicidade (mesmo e-mail no mesmo evento)
   - Força e-mail da sessão (participante) para vincular inscrição
   - Verifica vagas e evento lotado
   ============================================================ */

const eventos = DB.getEventos();
const select = document.getElementById('eventoSelect');

// Popular select
eventos.forEach(e => {
  const inscritos = DB.getParticipantes().filter(p => p.eventoId === e.id).length;
  const restantes = e.vagas - inscritos;
  const opt = document.createElement('option');
  opt.value = e.id;
  opt.textContent = `${e.nome} — ${formatarData(e.data)} (${restantes > 0 ? restantes + ' vagas' : 'LOTADO'})`;
  opt.disabled = restantes <= 0;
  select.appendChild(opt);
});

// Pré-selecionar evento via ?eventoId=
const params = new URLSearchParams(location.search);
if (params.get('eventoId')) {
  select.value = params.get('eventoId');
}

const form = document.getElementById('formInscricao');
const sucesso = document.getElementById('mensagemSucesso');
const sessao = Auth.getSessao();

// Se participante logado, preenche e trava o e-mail (vínculo com sessão)
const emailInput = document.getElementById('email');
if (sessao && sessao.tipo === 'participante') {
  emailInput.value = sessao.email;
  emailInput.readOnly = true;
  emailInput.style.background = 'var(--gray-100)';
  emailInput.title = 'E-mail vinculado à sua conta';
}

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

// Limpar erro ao digitar
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

  /* ============================================================
     🔴 VALIDAÇÃO DE DUPLICIDADE
     ============================================================ */
  const jaInscrito = DB.getParticipantes().find(p =>
    p.eventoId === eventoId && p.email.toLowerCase() === emailFinal
  );

    if (jaInscrito) {
    const ev = DB.getEventos().find(x => x.id === eventoId);
    mostrarToast(
      `Você já está inscrito no evento "${ev ? ev.nome : 'selecionado'}"!`,
      'error', '❌'
    );

    alert(
      `⚠️ Inscrição Duplicada!\n\n` +
      `Você já possui uma inscrição para este evento:\n\n` +
      `📅 Evento: ${ev ? ev.nome : 'Evento'}\n` +
      `📧 E-mail: ${emailFinal}\n\n` +
      `Para se inscrever novamente, cancele a inscrição anterior em:\n` +
      `"Minhas Inscrições" (área do participante).`
    );
    return;
  }

  /* ============================================================
     🔴 VALIDAÇÃO DE VAGAS
     ============================================================ */
  const evento = DB.getEventos().find(e => e.id === eventoId);
  const inscritos = DB.getParticipantes().filter(p => p.eventoId === eventoId).length;

  if (inscritos >= evento.vagas) {
    mostrarToast('Este evento já está lotado!', 'error', '❌');
    return;
  }

  /* ============================================================
     ✅ INSERIR INSCRIÇÃO
     ============================================================ */
  DB.addParticipante({
    nome: nome.value.trim(),
    email: emailFinal,
    telefone: telefone.value.trim(),
    nascimento: nascimento.value,
    eventoId: eventoId
  });

  form.reset();

  // Reaplica e-mail da sessão após reset
  if (sessao && sessao.tipo === 'participante') {
    emailInput.value = sessao.email;
    emailInput.readOnly = true;
  }

  sucesso.style.display = 'block';
  mostrarToast('Inscrição confirmada com sucesso!', 'success', '✅');
  setTimeout(() => { sucesso.style.display = 'none'; }, 5000);
});