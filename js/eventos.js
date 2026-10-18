'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const state = { search: '', categoria: '', ordenacao: 'date-asc' };
  const eventos = DB.getEventos();
  const categoryFilter = document.getElementById('categoryFilter');

  // Popular Select
  [...new Set(eventos.map(e => e.categoria))].sort().forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat; opt.textContent = cat;
    categoryFilter.appendChild(opt);
  });

  const params = new URLSearchParams(location.search);
  if (params.get('categoria')) {
    state.categoria = params.get('categoria');
    categoryFilter.value = state.categoria;
  }

  const searchInput = document.getElementById('searchInput');
  const sortFilter = document.getElementById('sortFilter');
  const clearBtn = document.getElementById('clearFilters');
  const grid = document.getElementById('eventsGrid');
  const resultsCount = document.getElementById('resultsCount');

  function cardHTML(e) {
    const imgUrl = obterImagemEvento(e);
    const vagasClass = e.vagas <= 10 ? 'full' : e.vagas <= 50 ? 'low' : '';
    return `
      <article class="event-card">
        <div class="event-image event-image-photo">
          <img src="${imgUrl}" class="img-cover" alt="${e.nome}" loading="lazy" onerror="this.src='${IMAGEM_FALLBACK}'">
          <span class="event-category-badge">${e.categoria}</span>
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
            <span class="badge ${vagasClass}">${e.vagas} vagas</span>
            <a href="evento.html?id=${e.id}" class="btn btn-primary btn-sm">Ver detalhes</a>
          </div>
        </div>
      </article>`;
  }

  function render() {
    let filtrados = eventos.filter(e => {
      const okBusca = e.nome.toLowerCase().includes(state.search.toLowerCase());
      const okCat = !state.categoria || e.categoria === state.categoria;
      return okBusca && okCat;
    });

    if (state.ordenacao === 'date-asc') filtrados.sort((a, b) => a.data.localeCompare(b.data));
    if (state.ordenacao === 'date-desc') filtrados.sort((a, b) => b.data.localeCompare(a.data));
    if (state.ordenacao === 'name-asc') filtrados.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

    resultsCount.textContent = filtrados.length;
    grid.innerHTML = filtrados.length ? filtrados.map(cardHTML).join('') : `<div class="empty-state" style="grid-column:1/-1;text-align:center;padding:3rem;"><h3>Nenhum evento encontrado.</h3></div>`;
  }

  searchInput.addEventListener('input', e => { state.search = e.target.value; render(); });
  categoryFilter.addEventListener('change', e => { state.categoria = e.target.value; render(); });
  sortFilter.addEventListener('change', e => { state.ordenacao = e.target.value; render(); });
  clearBtn.addEventListener('click', () => {
    state.search = ''; state.categoria = ''; state.ordenacao = 'date-asc';
    searchInput.value = ''; categoryFilter.value = ''; sortFilter.value = 'date-asc';
    render();
  });

  render();
});