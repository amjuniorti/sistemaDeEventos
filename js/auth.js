'use strict';

const Auth = {
  USUARIOS_KEY: 'eventhub_usuarios',
  SESSAO_KEY: 'eventhub_sessao',
  EMAIL_ADMIN_PADRAO: 'admin@eventhub.com',
  SENHA_ADMIN_PADRAO: '123',

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

  getUsuarios() {
    return JSON.parse(localStorage.getItem(this.USUARIOS_KEY) || '[]');
  },
  setUsuarios(lista) {
    localStorage.setItem(this.USUARIOS_KEY, JSON.stringify(lista));
  },
  getUsuario(email) {
    return this.getUsuarios().find(u => u.email.toLowerCase() === email.toLowerCase());
  },

  cadastrar(email, senha) {
    if (!email || !senha) return { sucesso: false, mensagem: 'Preencha todos os campos.' };
    if (senha.length < 4) return { sucesso: false, mensagem: 'Senha deve ter no mínimo 4 caracteres.' };
    
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
    
    // LOG DE AUDITORIA
    if (typeof registrarLog === 'function') {
      registrarLog('Novo Cadastro', `Uma nova conta de participante foi criada: ${email}.`);
    }

    return { sucesso: true, mensagem: 'Conta criada com sucesso!' };
  },

  /* ============================================================
     CADASTRAR NOVO ADMIN (Só pode ser chamado por um admin logado)
     ============================================================ */
  cadastrarAdmin(email, senha) {
    if (!this.isAdmin()) {
      return { sucesso: false, mensagem: 'Acesso negado. Apenas administradores podem criar outros administradores.' };
    }
    if (!email || !senha) {
      return { sucesso: false, mensagem: 'Preencha todos os campos.' };
    }
    if (senha.length < 4) {
      return { sucesso: false, mensagem: 'A senha deve ter no mínimo 4 caracteres.' };
    }
    
    const usuarios = this.getUsuarios();
    if (usuarios.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { sucesso: false, mensagem: 'Este e-mail já está cadastrado no sistema.' };
    }

    usuarios.push({
      email: email,
      senha: senha,
      tipo: 'admin',
      nome: 'Administrador',
      criadoEm: new Date().toISOString()
    });
    this.setUsuarios(usuarios);

    // 👇 LOG DE AUDITORIA PARA NOVO ADMIN
    if (typeof registrarLog === 'function') {
      registrarLog('Novo Admin', `Um novo administrador foi cadastrado: ${email}.`);
    }

    return { sucesso: true, mensagem: 'Novo Administrador criado com sucesso!' };
  },

  login(email, senha) {
    if (!email || !senha) return { sucesso: false, mensagem: 'Preencha todos os campos.' };
    
    const usuario = this.getUsuarios().find(u =>
      u.email.toLowerCase() === email.toLowerCase() && u.senha === senha
    );
    
    if (!usuario) return { sucesso: false, mensagem: 'E-mail ou senha inválidos.' };
    
    this.setSessao({
      email: usuario.email,
      tipo: usuario.tipo,
      nome: usuario.nome || usuario.email.split('@')[0],
      logadoEm: new Date().toISOString()
    });

    // LOG DE AUDITORIA
    if (typeof registrarLog === 'function') {
      registrarLog('Login', `O usuário ${usuario.email} entrou no sistema.`);
    }

    return { sucesso: true, usuario };
  },

  recuperarSenha(email) {
    const usuario = this.getUsuario(email);
    if (!usuario) return { sucesso: true, mensagem: 'Se o e-mail estiver cadastrado, você receberá instruções em breve.' };
    if (usuario.email === this.EMAIL_ADMIN_PADRAO) return { sucesso: true, mensagem: 'Sua senha foi redefinida para "123".' };
    return { sucesso: true, mensagem: 'Enviamos as instruções para o seu e-mail (simulação).' };
  },

  getSessao() {
    return JSON.parse(localStorage.getItem(this.SESSAO_KEY) || 'null');
  },
  setSessao(dados) {
    localStorage.setItem(this.SESSAO_KEY, JSON.stringify(dados));
  },
  logout() {
    const sessao = this.getSessao();
    if (sessao && typeof registrarLog === 'function') {
      registrarLog('Logout', `O usuário ${sessao.email} saiu do sistema.`);
    }
    localStorage.removeItem(this.SESSAO_KEY);
  },
  estaLogado() {
    return !!this.getSessao();
  },
  isAdmin() {
    const s = this.getSessao();
    return !!(s && s.tipo === 'admin');
  },

  proteger(apenasAdmin = false) {
    const sessao = this.getSessao();
    const atual = location.pathname.split('/').pop();
    if (!sessao) {
      window.location.href = `login.html?redirect=${encodeURIComponent(atual)}`;
      return false;
    }
    if (apenasAdmin && sessao.tipo !== 'admin') {
      window.location.href = 'acesso-negado.html';
      return false;
    }
    return true;
  },

  aplicarMenuPorPerfil() {
    const sessao = this.getSessao();
    const adminLink = document.getElementById('adminLink');
    const userMenu = document.getElementById('userMenu');
    const btnCriar = document.getElementById('btnCriarEvento');

    if (adminLink) {
      adminLink.style.display = (sessao && sessao.tipo === 'admin') ? '' : 'none';
    }
    if (btnCriar) {
      btnCriar.style.display = (sessao && sessao.tipo === 'admin') ? '' : 'none';
    }
    if (userMenu) {
      if (!sessao) {
        userMenu.innerHTML = `<a href="login.html" class="btn-login">Entrar</a>`;
      } else {
        userMenu.innerHTML = `
          <a href="#" id="logoutBtn" class="btn-login" title="Sair"
             style="display:flex;align-items:center;gap:0.4rem;">
            👤 ${sessao.nome || sessao.email.split('@')[0]} ✕
          </a>`;
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
          logoutBtn.addEventListener('click', ev => {
            ev.preventDefault();
            if (confirm('Deseja sair da conta?')) {
              Auth.logout();
              location.reload();
            }
          });
        }
      }
    }
  }
};

Auth.init();

document.addEventListener('DOMContentLoaded', () => {
  Auth.aplicarMenuPorPerfil();
});