'use strict';

/* ============================================================
   MÓDULO DE AUTENTICAÇÃO COM PERFIS
   - Tipos: "admin" | "participante"
   - Usuários em localStorage: eventhub_usuarios
   - Sessão ativa em localStorage: eventhub_sessao
   - Admin padrão: admin@eventhub.com / 123
   ============================================================ */
const Auth = {
  USUARIOS_KEY: 'eventhub_usuarios',
  SESSAO_KEY: 'eventhub_sessao',
  EMAIL_ADMIN_PADRAO: 'admin@eventhub.com',
  SENHA_ADMIN_PADRAO: '123',

  /* Cria o admin padrão se não existir */
  init() {
    let usuarios = this.getUsuarios();
    if (!usuarios.find(u => u.email === this.EMAIL_ADMIN_PADRAO)) {
      usuarios.push({
        email: this.EMAIL_ADMIN_PADRAO,
        senha: this.SENHA_ADMIN_PADRAO,
        tipo: 'admin',
        nome: 'Administrador',
        criadoEm: new Date().toISOString()
      });
      this.setUsuarios(usuarios);
    }
  },

  /* ---------- USUÁRIOS ---------- */
  getUsuarios() {
    return JSON.parse(localStorage.getItem(this.USUARIOS_KEY) || '[]');
  },
  setUsuarios(lista) {
    localStorage.setItem(this.USUARIOS_KEY, JSON.stringify(lista));
  },
  getUsuario(email) {
    return this.getUsuarios().find(u => u.email.toLowerCase() === email.toLowerCase());
  },

  /* ---------- CADASTRO (sempre "participante") ---------- */
  cadastrar(email, senha) {
    if (!email || !senha) {
      return { sucesso: false, mensagem: 'Preencha todos os campos.' };
    }
    if (senha.length < 4) {
      return { sucesso: false, mensagem: 'Senha deve ter no mínimo 4 caracteres.' };
    }
    const usuarios = this.getUsuarios();
    if (usuarios.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { sucesso: false, mensagem: 'E-mail já cadastrado.' };
    }
    usuarios.push({
      email: email,
      senha: senha,
      tipo: 'participante',
      nome: email.split('@')[0],
      criadoEm: new Date().toISOString()
    });
    this.setUsuarios(usuarios);
    return { sucesso: true, mensagem: 'Conta criada com sucesso!' };
  },

  /* ---------- LOGIN ---------- */
  login(email, senha) {
    if (!email || !senha) {
      return { sucesso: false, mensagem: 'Preencha todos os campos.' };
    }
    const usuario = this.getUsuarios().find(u =>
      u.email.toLowerCase() === email.toLowerCase() && u.senha === senha
    );
    if (!usuario) {
      return { sucesso: false, mensagem: 'E-mail ou senha inválidos.' };
    }
    this.setSessao({
      email: usuario.email,
      tipo: usuario.tipo,
      nome: usuario.nome || usuario.email.split('@')[0],
      logadoEm: new Date().toISOString()
    });
    return { sucesso: true, usuario };
  },

  /* ---------- RECUPERAR SENHA (simulado) ---------- */
  recuperarSenha(email) {
    const usuario = this.getUsuario(email);
    if (!usuario) {
      return {
        sucesso: true,
        mensagem: 'Se o e-mail estiver cadastrado, você receberá instruções em breve.'
      };
    }
    if (usuario.email === this.EMAIL_ADMIN_PADRAO) {
      return {
        sucesso: true,
        mensagem: 'Sua senha foi redefinida para "123".'
      };
    }
    return {
      sucesso: true,
      mensagem: 'Enviamos as instruções para o seu e-mail (simulação).'
    };
  },

  /* ---------- SESSÃO ---------- */
  getSessao() {
    return JSON.parse(localStorage.getItem(this.SESSAO_KEY) || 'null');
  },
  setSessao(dados) {
    localStorage.setItem(this.SESSAO_KEY, JSON.stringify(dados));
  },
  logout() {
    localStorage.removeItem(this.SESSAO_KEY);
  },
  estaLogado() {
    return !!this.getSessao();
  },
  isAdmin() {
    const s = this.getSessao();
    return s && s.tipo === 'admin';
  },
  isParticipante() {
    const s = this.getSessao();
    return s && s.tipo === 'participante';
  },

  /* ---------- PROTEÇÃO DE PÁGINA ---------- */
  /**
   * @param {boolean} apenasAdmin - se true, exige tipo admin
   * @returns {boolean} true se autorizado (continua), false se redirecionou
   */
  proteger(apenasAdmin = false) {
    const sessao = this.getSessao();
    const atual = location.pathname.split('/').pop();

    // 1) Não logado → login com redirect
    if (!sessao) {
      window.location.href = `login.html?redirect=${encodeURIComponent(atual)}`;
      return false;
    }

    // 2) Logado mas não é admin quando exige admin → acesso negado
    if (apenasAdmin && sessao.tipo !== 'admin') {
      // Redireciona para página de acesso negado com mensagem
      window.location.href = 'acesso-negado.html';
      return false;
    }

    return true;
  }
};

Auth.init();