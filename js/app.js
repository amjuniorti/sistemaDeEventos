'use strict';

/* ============================================================
   DADOS INICIAIS — carregados no LocalStorage na primeira visita
   ============================================================ */
const EVENTOS_INICIAIS = [
  { id: 1, nome: "React Summit 2025", categoria: "Desenvolvimento Web", data: "2025-11-15", horario: "09:00 - 18:00", local: "São Paulo, SP", descricao: "O maior evento de React do Brasil. Aprenda sobre React, Next.js e Server Components.", vagas: 150, imagem: "⚛️", cor: "linear-gradient(135deg, #61dafb 0%, #20232a 100%)", responsavel: "Comunidade React Brasil", programacao: [{hora:"09:00", titulo:"Abertura"},{hora:"10:00", titulo:"React 19"},{hora:"14:00", titulo:"Next.js"},{hora:"17:00", titulo:"Encerramento"}] },
  { id: 2, nome: "Workshop de Inteligência Artificial", categoria: "Inteligência Artificial", data: "2025-10-22", horario: "14:00 - 18:00", local: "Online - Zoom", descricao: "Aprenda na prática como construir modelos de machine learning com Python e TensorFlow.", vagas: 80, imagem: "🤖", cor: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", responsavel: "AI Academy", programacao: [{hora:"14:00", titulo:"Fundamentos de ML"},{hora:"15:30", titulo:"TensorFlow"},{hora:"17:00", titulo:"Projeto prático"}] },
  { id: 3, nome: "Python para Iniciantes", categoria: "Programação", data: "2025-11-05", horario: "19:00 - 22:00", local: "Rio de Janeiro, RJ", descricao: "Curso introdutório de Python para quem está começando na programação.", vagas: 40, imagem: "🐍", cor: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", responsavel: "Code School RJ", programacao: [{hora:"19:00", titulo:"Variáveis"},{hora:"20:00", titulo:"Estruturas"},{hora:"21:00", titulo:"Prática"}] },
  { id: 4, nome: "Segurança em Redes", categoria: "Redes", data: "2025-12-03", horario: "08:30 - 17:30", local: "Belo Horizonte, MG", descricao: "Conferência sobre segurança de redes, firewalls e proteção contra ataques.", vagas: 120, imagem: "🔒", cor: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)", responsavel: "CyberSec BH", programacao: [{hora:"08:30", titulo:"Abertura"},{hora:"10:00", titulo:"Firewalls"},{hora:"14:00", titulo:"VPNs"},{hora:"16:00", titulo:"Cases"}] },
  { id: 5, nome: "Masterclass Banco de Dados", categoria: "Banco de Dados", data: "2025-10-30", horario: "13:00 - 17:00", local: "Curitiba, PR", descricao: "Domine SQL, NoSQL, otimização de queries e modelagem de dados.", vagas: 60, imagem: "🗄️", cor: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)", responsavel: "DB Masters", programacao: [{hora:"13:00", titulo:"SQL"},{hora:"14:30", titulo:"NoSQL"},{hora:"16:00", titulo:"Otimização"}] },
  { id: 6, nome: "Cloud Computing & DevOps", categoria: "Tecnologia", data: "2025-11-20", horario: "09:00 - 18:00", local: "São Paulo, SP", descricao: "Explore AWS, Azure, Docker, Kubernetes e ferramentas de DevOps.", vagas: 200, imagem: "☁️", cor: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)", responsavel: "Cloud Summit", programacao: [{hora:"09:00", titulo:"AWS"},{hora:"11:00", titulo:"Docker"},{hora:"14:00", titulo:"Kubernetes"},{hora:"16:00", titulo:"CI/CD"}] },
  { id: 7, nome: "Hackathon de IA Generativa", categoria: "Inteligência Artificial", data: "2025-12-15", horario: "08:00 - 20:00", local: "Recife, PE", descricao: "48 horas de imersão criando soluções com IA generativa.", vagas: 100, imagem: "🧠", cor: "linear-gradient(135deg, #30cfd0 0%, #330867 100%)", responsavel: "Porto Digital", programacao: [{hora:"08:00", titulo:"Kickoff"},{hora:"12:00", titulo:"Mentoria"},{hora:"18:00", titulo:"Pitch"}] },
  { id: 8, nome: "Vue.js Conference Brasil", categoria: "Desenvolvimento Web", data: "2025-11-28", horario: "09:00 - 18:00", local: "Porto Alegre, RS", descricao: "Conferência dedicada ao framework Vue.js com Composition API e Pinia.", vagas: 130, imagem: "💚", cor: "linear-gradient(135deg, #42b883 0%, #35495e 100%)", responsavel: "Vue BR", programacao: [{hora:"09:00", titulo:"Vue 3"},{hora:"11:00", titulo:"Composition API"},{hora:"14:00", titulo:"Pinia"}] },
  { id: 9, nome: "Fundamentos de Redes", categoria: "Redes", data: "2025-10-18", horario: "19:00 - 21:30", local: "Online - Google Meet", descricao: "Conceitos essenciais: modelo OSI, TCP/IP, DNS e roteamento.", vagas: 90, imagem: "🌐", cor: "linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)", responsavel: "Net Academy", programacao: [{hora:"19:00", titulo:"Modelo OSI"},{hora:"20:00", titulo:"TCP/IP"}] },
  { id: 10, nome: "MongoDB para Devs", categoria: "Banco de Dados", data: "2025-11-12", horario: "14:00 - 17:00", local: "Online", descricao: "Workshop prático sobre MongoDB: modelagem, aggregation e integração.", vagas: 45, imagem: "🍃", cor: "linear-gradient(135deg, #13aa52 0%, #023430 100%)", responsavel: "MongoDB BR", programacao: [{hora:"14:00", titulo:"Modelagem"},{hora:"15:30", titulo:"Aggregation"}] },
  { id: 11, nome: "Bootcamp Full Stack", categoria: "Programação", data: "2025-12-01", horario: "08:00 - 17:00", local: "Belo Horizonte, MG", descricao: "Bootcamp intensivo de 5 dias: Node.js, Express, React e MongoDB.", vagas: 30, imagem: "⚡", cor: "linear-gradient(135deg, #f7df1e 0%, #1a1a2e 100%)", responsavel: "Instituto Tech", programacao: [{hora:"08:00", titulo:"Node.js"},{hora:"13:00", titulo:"React"}] },
  { id: 12, nome: "Kubernetes na Prática", categoria: "Tecnologia", data: "2025-11-25", horario: "09:00 - 17:00", local: "Campinas, SP", descricao: "Hands-on de Kubernetes: pods, services, deployments e HPA.", vagas: 55, imagem: "⎈", cor: "linear-gradient(135deg, #326ce5 0%, #1a3a8f 100%)", responsavel: "K8s Campinas", programacao: [{hora:"09:00", titulo:"Pods"},{hora:"11:00", titulo:"Services"},{hora:"14:00", titulo:"Deployments"}] }
];

const PARTICIPANTES_INICIAIS = [
  { id: 1, nome: "Ana Silva", email: "ana@email.com", telefone: "(11) 98765-4321", nascimento: "1998-05-12", eventoId: 1 },
  { id: 2, nome: "Carlos Souza", email: "carlos@email.com", telefone: "(21) 99876-5432", nascimento: "1995-08-22", eventoId: 2 },
  { id: 3, nome: "Maria Oliveira", email: "maria@email.com", telefone: "(31) 97654-3210", nascimento: "2000-02-14", eventoId: 5 },
  { id: 4, nome: "João Pereira", email: "joao@email.com", telefone: "(41) 98765-1234", nascimento: "1997-11-30", eventoId: 3 }
];

/* ============================================================
   LOCALSTORAGE — Helpers
   ============================================================ */
const DB = {
  EVENTOS_KEY: 'eventhub_eventos',
  PARTICIPANTES_KEY: 'eventhub_participantes',
  MENSAGENS_KEY: 'eventhub_mensagens',

  init() {
    if (!localStorage.getItem(this.EVENTOS_KEY)) {
      localStorage.setItem(this.EVENTOS_KEY, JSON.stringify(EVENTOS_INICIAIS));
    }
    if (!localStorage.getItem(this.PARTICIPANTES_KEY)) {
      localStorage.setItem(this.PARTICIPANTES_KEY, JSON.stringify(PARTICIPANTES_INICIAIS));
    }
    if (!localStorage.getItem(this.MENSAGENS_KEY)) {
      localStorage.setItem(this.MENSAGENS_KEY, JSON.stringify([]));
    }
  },

  /* ---------- EVENTOS ---------- */
  getEventos() {
    return JSON.parse(localStorage.getItem(this.EVENTOS_KEY) || '[]');
  },
  setEventos(lista) {
    localStorage.setItem(this.EVENTOS_KEY, JSON.stringify(lista));
  },
  addEvento(evento) {
    const lista = this.getEventos();
    evento.id = lista.length ? Math.max(...lista.map(e => e.id)) + 1 : 1;
    lista.push(evento);
    this.setEventos(lista);
    return evento;
  },
  updateEvento(id, dados) {
    const lista = this.getEventos();
    const idx = lista.findIndex(e => e.id === id);
    if (idx >= 0) {
      lista[idx] = { ...lista[idx], ...dados };
      this.setEventos(lista);
    }
  },
  deleteEvento(id) {
    const lista = this.getEventos().filter(e => e.id !== id);
    this.setEventos(lista);
  },

  /* ---------- PARTICIPANTES (sem "situacao") ---------- */
  getParticipantes() {
    return JSON.parse(localStorage.getItem(this.PARTICIPANTES_KEY) || '[]');
  },
  setParticipantes(lista) {
    localStorage.setItem(this.PARTICIPANTES_KEY, JSON.stringify(lista));
  },
  addParticipante(p) {
    const lista = this.getParticipantes();
    p.id = lista.length ? Math.max(...lista.map(x => x.id)) + 1 : 1;
    lista.push(p);
    this.setParticipantes(lista);
    return p;
  },
  deleteParticipante(id) {
    this.setParticipantes(this.getParticipantes().filter(p => p.id !== id));
  },

  /* ---------- MENSAGENS DE CONTATO ---------- */
  getMensagens() {
    return JSON.parse(localStorage.getItem(this.MENSAGENS_KEY) || '[]');
  },
  setMensagens(lista) {
    localStorage.setItem(this.MENSAGENS_KEY, JSON.stringify(lista));
  },
  addMensagem(m) {
    const lista = this.getMensagens();
    m.id = lista.length ? Math.max(...lista.map(x => x.id || 0)) + 1 : 1;
    m.data = m.data || new Date().toISOString();
    m.lida = false;
    lista.push(m);
    this.setMensagens(lista);
    return m;
  },
  marcarMensagemLida(id) {
    const lista = this.getMensagens();
    const idx = lista.findIndex(m => m.id === id);
    if (idx >= 0) {
      lista[idx].lida = true;
      this.setMensagens(lista);
    }
  },
  deleteMensagem(id) {
    this.setMensagens(this.getMensagens().filter(m => m.id !== id));
  },
  limparMensagens() {
    this.setMensagens([]);
  }
};

DB.init();

/* ============================================================
   UTILITÁRIOS
   ============================================================ */
function formatarData(iso) {
  if (!iso) return '';
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
}

function formatarDataHora(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function mostrarToast(msg, tipo = 'info', icone = 'ℹ️') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${tipo}`;
  toast.innerHTML = `<span>${icone}</span><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/* ============================================================
   MENU MOBILE
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('mobileToggle');
  const nav = document.getElementById('navMenu');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('mobile-open');
      toggle.setAttribute('aria-expanded', open);
      toggle.textContent = open ? '✕' : '☰';
    });
  }
});