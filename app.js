const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const planDirectory = 'https://www.hiltonimoveis.com.br/developments/five-ponta-verde/plans/';
const units = [
  { id: '1103', wing: 'Ala posterior', area: 45.9, price: 1279070, plan: 'planta-terminacao-03.webp' },
  { id: '1108', wing: 'Ala da orla', area: 57.5, price: 1250943, plan: 'planta-terminacoes-07-19.webp' }
];
const photographs = [
  {
    file: 'ponta-verde-drone.jpg',
    option: 'Ponta Verde',
    title: 'Ponta Verde vista por drone · 2021',
    alt: 'Vista de drone da ponta de Ponta Verde com prédios e luzes da orla ao anoitecer.',
    author: 'Arthur C A Bezerra',
    source: 'Foto_de_Macei%C3%B3.jpg'
  },
  {
    file: 'ponta-verde.jpg',
    option: 'Entardecer',
    title: 'Ponta Verde ao entardecer · 2016',
    alt: 'Vista aérea da ponta de Ponta Verde, entre duas enseadas, ao entardecer.',
    author: 'Ricardo Lêdo',
    source: 'Vista_da_praia_de_Ponta_Verde.jpg'
  },
  {
    file: 'litoral-maceio.jpg',
    option: 'Litoral',
    title: 'Sobrevoo do litoral de Maceió · 2017',
    alt: 'Litoral de Maceió visto da janela de um avião.',
    author: 'Hooper2002',
    source: '1_-_Sobrevoo_sobre_o_Litoral_de_Macei%C3%B3_-_AL.jpg'
  }
];
const storageKey = 'orla-five-flex-life-favourites';
const areaFormat = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const priceFormat = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const formatArea = value => areaFormat.format(value) + ' m²';
const mediaSmall = matchMedia('(max-width: 800px)');
let favourites = new Set();
try {
  const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
  if (Array.isArray(saved)) favourites = new Set(units.filter(unit => saved.includes(unit.id)).map(unit => unit.id));
} catch {}
let selectedUnit = null;
let selectedPhoto = null;

const canvas = $('#building-canvas');
const tooltip = $('#floor-tooltip');
const pin = $('#site-pin');
const beachLabel = $('#beach-label');
const groundImage = $('#satellite-ground');
const sceneLabel = $('#scene-label');
const aerialGallery = $('#aerial-gallery');
let activeView = 'model';
const model = window.createBuilding(canvas, {
  availableFloors: new Set(['11']),
  ground: {
    element: groundImage,
    size: 1152,
    metresPerPixel: 2350 / 1152,
    metresPerUnit: 4.8,
    // Shift from the mapped frontage pin towards the building footprint.
    originX: -5,
    originZ: 24
  },
  onPosition({ tower, beach, width, height }) {
    pin.hidden = activeView !== 'aerial';
    beachLabel.hidden = pin.hidden || beach.x < 75 || beach.x > width - 75
      || beach.y < 70 || beach.y > height - 110
      || Math.hypot(beach.x - tower.x, beach.y - tower.y) < 86;
    if (!beachLabel.hidden) {
      beachLabel.style.left = beach.x + 'px';
      beachLabel.style.top = beach.y + 'px';
    }
    if (pin.hidden) return;
    pin.style.left = Math.max(72, Math.min(width - 72, tower.x)) + 'px';
    pin.style.top = Math.max(96, tower.y) + 'px';
  },
  onSelect(floor) {
    if (floor === '11') {
      setView('plan', { focusTab: true });
      return;
    }
    model.select(floor);
    $('#floor-status').textContent = Number(floor) + 'º pavimento · Planta disponível para o 11º pavimento';
  },
  onHover(floor, x, y) {
    tooltip.hidden = !floor;
    if (!floor) return;
    tooltip.textContent = floor === '11' ? '11º pavimento · Abrir planta' : Number(floor) + 'º pavimento';
    tooltip.style.left = Math.min(Math.max(x + 12, 6), canvas.clientWidth - tooltip.offsetWidth - 6) + 'px';
    tooltip.style.top = Math.max(y - 40, 48) + 'px';
  },
  onViewChange(atMin, atMax) {
    $('[data-camera="out"]').disabled = atMin;
    $('[data-camera="in"]').disabled = atMax;
  }
});
$('#model-fallback').hidden = Boolean(model);
groundImage.hidden = !model;
function reportUnavailableImagery() {
  groundImage.hidden = true;
  sceneLabel.textContent = 'Imagem de satélite indisponível';
}
groundImage.addEventListener('error', reportUnavailableImagery);
if (groundImage.complete && !groundImage.naturalWidth) reportUnavailableImagery();
$('#model-controls').hidden = !model;
$('#angle-button').hidden = !model;
model?.select('11');

function setView(view, { focusTab = false, cameraAction } = {}) {
  const previousView = activeView;
  activeView = view;
  $('#model-stage').hidden = view === 'plan';
  $('#plan-stage').hidden = view !== 'plan';
  for (const button of $$('.view-switch [data-view]')) {
    button.setAttribute('aria-pressed', String(button.dataset.view === view));
  }
  tooltip.hidden = true;
  if (view !== 'plan') {
    model?.select('11');
    if (cameraAction || previousView !== view) model?.changeView(cameraAction || view);
    $('#floor-status').textContent = view === 'aerial'
      ? 'Arraste para girar · Clique no marcador para aproximar'
      : 'Arraste para girar · Clique no 11º pavimento';
  }
  if (focusTab) $('.view-switch [data-view="' + view + '"]').focus({ preventScroll: true });
}

pin.addEventListener('click', () => {
  setView('model', { focusTab: true });
});
aerialGallery.addEventListener('toggle', () => {
  if (aerialGallery.open && selectedPhoto === null) showPhotograph(0);
});

function unitPlanLink(unit, label) {
  return '<a class="plan-link" target="_blank" rel="noopener" href="' + planDirectory + unit.plan + '">' + label + ' ↗</a>';
}

$('#unit-list').innerHTML = units.map(unit => `
  <button type="button" class="unit-card" data-unit="${unit.id}" aria-pressed="false" aria-controls="unit-detail">
    <span class="unit-number">${unit.id}</span>
    <span class="unit-subtitle">${unit.wing}</span>
    <span class="unit-card-area">${formatArea(unit.area)}</span>
  </button>`).join('');

function selectUnit(id, fromPlan) {
  selectedUnit = units.find(unit => unit.id === id);
  setView('plan');
  const detail = $('#unit-detail');
  detail.innerHTML = `
    <div class="detail-head">
      <h3 tabindex="-1">Unidade ${selectedUnit.id}</h3>
      <button type="button" class="save-button" id="save-unit"></button>
    </div>
    <dl>
      <div><dt>Área privativa</dt><dd>${formatArea(selectedUnit.area)}</dd></div>
      <div><dt>Quartos</dt><dd>1 suíte</dd></div>
      <div><dt>Preço anunciado em 02/07/2026</dt><dd>${priceFormat.format(selectedUnit.price)}</dd></div>
    </dl>
    ${unitPlanLink(selectedUnit, 'Ver planta publicada')}`;
  detail.hidden = false;
  for (const button of $$('[data-unit]')) {
    button.setAttribute('aria-pressed', String(button.dataset.unit === id));
  }
  renderFavourite();
  $('#save-unit').addEventListener('click', toggleFavourite);
  if (fromPlan) {
    detail.querySelector('h3').focus({ preventScroll: true });
    if (mediaSmall.matches) detail.scrollIntoView({ block: 'nearest' });
  }
}

function renderFavourite() {
  const saved = favourites.has(selectedUnit.id);
  const button = $('#save-unit');
  button.setAttribute('aria-pressed', String(saved));
  button.textContent = saved ? '♥ Salva' : '♡ Salvar';
}

function toggleFavourite() {
  const id = selectedUnit.id;
  if (favourites.has(id)) favourites.delete(id);
  else favourites.add(id);
  try { localStorage.setItem(storageKey, JSON.stringify([...favourites])); } catch {}
  renderFavourite();
}

function showPhotograph(index) {
  selectedPhoto = index;
  const photo = photographs[index];
  const sourceUrl = 'https://commons.wikimedia.org/wiki/File:' + photo.source;
  const image = $('#aerial-photo');
  image.hidden = false;
  image.alt = photo.alt;
  $('#aerial-fallback').hidden = true;
  $('#aerial-fallback-link').href = sourceUrl;
  $('#aerial-title').textContent = photo.title;
  $('#aerial-source').textContent = photo.author;
  $('#aerial-source').href = sourceUrl;
  for (const button of $$('[data-photo]')) {
    button.setAttribute('aria-pressed', String(Number(button.dataset.photo) === index));
  }
  image.src = 'aerial/' + photo.file;
}

$('#aerial-photo').addEventListener('error', () => {
  $('#aerial-photo').hidden = true;
  $('#aerial-fallback').hidden = false;
});
$('#aerial-options').innerHTML = photographs.map((photo, index) => `
  <button type="button" data-photo="${index}" aria-pressed="false">${photo.option}</button>`).join('');

const comparisonRows = [
  ['Posição', unit => unit.wing],
  ['Área privativa', unit => formatArea(unit.area)],
  ['Quartos', () => '1 suíte'],
  ['Preço anunciado', unit => priceFormat.format(unit.price)],
  ['Planta', unit => unitPlanLink(unit, 'Ver planta ' + unit.id)]
];
$('#compare-summary').textContent = 'A unidade 1108 tem ' + formatArea(units[1].area - units[0].area) + ' a mais de área privativa.';
$('#compare-content').innerHTML = `
  <table class="compare-table">
    <thead><tr><th scope="col">Característica</th>${units.map(unit => '<th scope="col">' + unit.id + '</th>').join('')}</tr></thead>
    <tbody>${comparisonRows.map(([label, value]) => `
      <tr><th scope="row">${label}</th>${units.map(unit => '<td>' + value(unit) + '</td>').join('')}</tr>`).join('')}
    </tbody>
  </table>`;

for (const button of $$('[data-view]')) {
  button.addEventListener('click', () => setView(button.dataset.view, { focusTab: button.classList.contains('floor-chip') }));
}
for (const button of $$('[data-unit]')) {
  button.addEventListener('click', () => selectUnit(button.dataset.unit, button.classList.contains('plan-unit')));
}
for (const button of $$('[data-camera]')) {
  button.addEventListener('click', () => {
    const action = button.dataset.camera;
    if (action !== 'rear' && action !== 'reset') {
      model?.changeView(action);
      return;
    }
    setView('model', { cameraAction: action });
    const angleButton = $('#angle-button');
    angleButton.dataset.camera = action === 'rear' ? 'reset' : 'rear';
    angleButton.firstChild.textContent = action === 'rear' ? 'Ver fachada da orla ' : 'Ver ala posterior ';
  });
}
for (const button of $$('[data-photo]')) {
  button.addEventListener('click', () => showPhotograph(Number(button.dataset.photo)));
}
$('#compare-open').addEventListener('click', () => $('#compare-dialog').showModal());
