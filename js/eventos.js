'use strict';

const state = {
  search: '',
  categoria: '',
  data: '',
  ordenacao: 'date-asc'
};

const eventos = DB.getEventos();

// Popular select de categorias
const categoryFilter = document.getElementById('categoryFilter');
[...new Set(eventos.map(e => e.categoria))].sort().forEach(cat => {
  const opt = document.createElement('option');
  opt.value = cat;
  opt.textContent = cat;
  categoryFilter.appendChild(opt);
});

// Ler query string (?categoria=)
const params = new URLSearchParams(location.search);
if (params.get('categoria')) {
  state.categoria = params.get('categoria');
  categoryFilter.value = state.categoria;
}

const searchInput = document.getElementById('searchInput');
const dateFilter = document.getElementById('dateFilter');
const sortFilter = document.getElementById('sortFilter');
const clearBtn = document.getElementById('clearFilters');
const grid = document.getElementById('eventsGrid');
const resultsCount = document.getElementById('resultsCount');
const activeFilters = document.getElementById('activeFilters');

function cardHTML(e) {
  return `
    <article class="event-card">
      <div class="event-image" style="background:${e.cor}">
        <span class="event-category-badge">${e.categoria}</span>
        <span>${e.imagem}</span>
      </div>
      <div class="event-info">
        <h3>${e.nome}</h3>
        <ul class="event-meta-list">
          <li><span class="icon">📅</span> ${formatarData(e.data)}</li>
          <li><span class="icon">🕒</span> ${e.horario}</li>
          <li><span class="icon">📍</span> ${e.local}</li>
        </ul>
        <p class="event-description">${e.descricao}</p>
        <div class="event-footer">
          <span class="badge ${e.vagas <= 10 ? 'full' : e.vagas <= 50 ? 'low' : ''}">${e.vagas} vagas</span>
          <a href="evento.html?id=${e.id}" class="btn btn-primary btn-sm">Ver detalhes</a>
        </div>
      </div>
    </article>`;
}

function render() {
  let filtrados = eventos.filter(e => {
    const okBusca = e.nome.toLowerCase().includes(state.search.toLowerCase());
    const okCat = !state.categoria || e.categoria === state.categoria;
    const okData = !state.data || e.data === state.data;
    return okBusca && okCat && okData;
  });

  switch (state.ordenacao) {
    case 'date-asc': filtrados.sort((a, b) => a.data.localeCompare(b.data)); break;
    case 'date-desc': filtrados.sort((a, b) => b.data.localeCompare(a.data)); break;
    case 'name-asc': filtrados.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')); break;
    case 'vagas-desc': filtrados.sort((a, b) => b.vagas - a.vagas); break;
  }

  resultsCount.textContent = filtrados.length;

  if (!filtrados.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <span class="icon">🔎</span>
        <h3>Nenhum evento encontrado</h3>
        <p>Ajuste os filtros ou limpe tudo.</p>
        <button class="btn btn-primary" onclick="document.getElementById('clearFilters').click()">Limpar filtros</button>
      </div>`;
  } else {
    grid.innerHTML = filtrados.map(cardHTML).join('');
  }

  renderChips();
}

function renderChips() {
  activeFilters.innerHTML = '';
  const chips = [];
  if (state.search) chips.push({ label: `Busca: "${state.search}"`, key: 'search' });
  if (state.categoria) chips.push({ label: `Categoria: ${state.categoria}`, key: 'categoria' });
  if (state.data) chips.push({ label: `Data: ${formatarData(state.data)}`, key: 'data' });

  if (!chips.length) return;

  const label = document.createElement('span');
  label.className = 'label';
  label.textContent = 'Filtros ativos:';
  activeFilters.appendChild(label);

  chips.forEach(c => {
    const el = document.createElement('span');
    el.className = 'filter-chip';
    el.innerHTML = `${c.label} <button aria-label="Remover">✕</button>`;
    el.querySelector('button').onclick = () => {
      if (c.key === 'search') { state.search = ''; searchInput.value = ''; }
      if (c.key === 'categoria') { state.categoria = ''; categoryFilter.value = ''; }
      if (c.key === 'data') { state.data = ''; dateFilter.value = ''; }
      render();
    };
    activeFilters.appendChild(el);
  });
}

searchInput.addEventListener('input', e => {
  state.search = e.target.value.trim();
  render();
});
categoryFilter.addEventListener('change', e => { state.categoria = e.target.value; render(); });
dateFilter.addEventListener('change', e => { state.data = e.target.value; render(); });
sortFilter.addEventListener('change', e => { state.ordenacao = e.target.value; render(); });
clearBtn.addEventListener('click', () => {
  state.search = ''; state.categoria = ''; state.data = ''; state.ordenacao = 'date-asc';
  searchInput.value = ''; categoryFilter.value = ''; dateFilter.value = ''; sortFilter.value = 'date-asc';
  render();
  mostrarToast('Filtros limpos!', 'success', '✓');
});

render();