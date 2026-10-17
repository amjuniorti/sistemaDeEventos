'use strict';

/* ============================================================
   VALIDAÇÃO DE FORMULÁRIOS
   ============================================================ */
const Validacao = {
  emailValido(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  telefoneValido(tel) {
    const limpo = tel.replace(/\D/g, '');
    return limpo.length >= 10 && limpo.length <= 11;
  },

  dataNascimentoValida(data) {
    if (!data) return false;
    const nasc = new Date(data);
    const hoje = new Date();
    const idade = hoje.getFullYear() - nasc.getFullYear();
    return idade >= 10 && idade <= 120;
  },

  aplicarErro(campo, msg) {
    const group = campo.closest('.form-group');
    if (!group) return;
    group.classList.add('has-error');
    campo.classList.add('error');
    let errEl = group.querySelector('.error-msg');
    if (errEl) errEl.textContent = msg;
  },

  limparErro(campo) {
    const group = campo.closest('.form-group');
    if (!group) return;
    group.classList.remove('has-error');
    campo.classList.remove('error');
  },

  limparTodos(form) {
    form.querySelectorAll('.form-group').forEach(g => g.classList.remove('has-error'));
    form.querySelectorAll('input, select, textarea').forEach(c => c.classList.remove('error'));
  }
};