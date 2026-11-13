const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const planDirectory = 'https://www.hiltonimoveis.com.br/developments/five-ponta-verde/plans/';
const units = [
  {
    id: '1103', wing: 'Ala posterior', area: 45.9, price: 1279070, plan: 'planta-terminacao-03.webp',
    layout: 'Planta mais estreita, com um recorte diagonal entre a sala e a suíte.',
    orientation: 'Ala posterior · orla para baixo'
  },
  {
    id: '1108', wing: 'Ala da orla', area: 57.5, price: 1250943, plan: 'planta-terminacoes-07-19.webp',
    layout: 'Planta mais larga, com sala e suíte lado a lado e varanda junto à sala.',
    orientation: 'Ala da orla · orla para baixo'
  }
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
const floorChip = $('.floor-chip');
const planStage = $('#plan-stage');
const unitPin = $('#unit-pin');
const beachLabel = $('#beach-label');
const avenueLabel = $('#avenue-label');
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
  onPosition({ tower, floor, unit, beach, avenue, width, height }) {
    const aerial = activeView === 'aerial';
    pin.hidden = !aerial;
    if (aerial) place(pin, tower, 72, width - 72, 96, height - 78);
    floorChip.classList.toggle('floor-chip-anchored', !aerial);
    if (!aerial) place(floorChip, floor, 62, width - 44, 65, height - 88, 13);
    unitPin.hidden = !unit || aerial;
    if (!unitPin.hidden) place(unitPin, unit, 26, width - 26, 79, height - 86, 0, -10);

    for (const [label, point] of [[beachLabel, beach], [avenueLabel, avenue]]) {
      label.hidden = point.x < 65 || point.x > width - 65 || point.y < 80 || point.y > height - 54
        || (Math.abs(point.x - width / 2) < 175 && point.y > height - 98)
        || Math.hypot(point.x - tower.x, point.y - tower.y) < 56
        || Math.hypot(point.x - floor.x, point.y - floor.y) < 49;
      if (!label.hidden) place(label, point, 0, width, 0, height);
    }
  },
  onSelect(floor) {
    if (floor === '11') {
      openPlan(true);
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
if (model) {
  fetch('aerial/osm-buildings.json')
    .then(response => response.ok ? response.json() : [])
    .then(footprints => {
      model.setNeighbours(footprints);
      $('#osm-credit').hidden = !footprints.length;
    })
    .catch(() => {});
}

function place(element, point, minX, maxX, minY, maxY, offsetX = 0, offsetY = 0) {
  element.style.left = Math.max(minX, Math.min(maxX, point.x + offsetX)) + 'px';
  element.style.top = Math.max(minY, Math.min(maxY, point.y + offsetY)) + 'px';
}

function setView(view, { focusTab = false, cameraAction } = {}) {
  activeView = view;
  const showPlan = view === 'plan';
  planStage.hidden = !showPlan;
  $('#units-floor').hidden = showPlan;
  $('#units-title').classList.toggle('sr-only', showPlan);
  $('.units-intro').hidden = showPlan;
  $('#unit-list').hidden = showPlan;
  $('#unit-detail').hidden = !selectedUnit || !showPlan;
  floorChip.setAttribute('aria-expanded', String(showPlan));
  floorChip.setAttribute('aria-label', (showPlan ? 'Fechar' : 'Abrir') + ' planta do 11º pavimento');
  for (const button of $$('.view-switch [data-view]')) {
    button.setAttribute('aria-pressed', String(button.dataset.view === view));
  }
  tooltip.hidden = true;
  model?.select('11');
  if (!showPlan) model?.showUnit(null);
  if (cameraAction || view !== 'plan') model?.changeView(cameraAction || view);
  $('#floor-status').textContent = view === 'aerial'
    ? 'Arraste para girar · Clique no marcador para aproximar'
    : showPlan ? 'Selecione uma unidade na planta' : 'Arraste para girar · Explore o 11º pavimento';
  if (focusTab) $('.view-switch [data-view="' + view + '"]').focus({ preventScroll: true });
}

function openPlan(moveFocus) {
  const wasOpen = activeView === 'plan';
  setView('plan', { cameraAction: !wasOpen && !selectedUnit ? 'model' : undefined });
  if (selectedUnit) focusUnitInScene(selectedUnit);
  if (!moveFocus) return;
  $('#plan-title').focus({ preventScroll: true });
  if (mediaSmall.matches) planStage.scrollIntoView({ block: 'nearest' });
}

pin.addEventListener('click', () => {
  setView('model', { focusTab: true });
  updateAngleButton(false);
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
  openPlan(false);
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
    <div class="unit-detail-links">
      ${unitPlanLink(selectedUnit, 'Ver planta publicada')}
      <button type="button" class="jump-to-model">Ver no 3D ↑</button>
    </div>`;
  detail.hidden = false;
  for (const button of $$('[data-unit]')) {
    button.setAttribute('aria-pressed', String(button.dataset.unit === id));
  }
  renderFavourite();
  $('#save-unit').addEventListener('click', toggleFavourite);
  $('.jump-to-model').addEventListener('click', () => {
    focusUnitInScene(selectedUnit);
    canvas.focus({ preventScroll: true });
    $('.viewer').scrollIntoView({ block: 'start' });
  });
  if (fromPlan) {
    detail.querySelector('h3').focus({ preventScroll: true });
    if (mediaSmall.matches) detail.scrollIntoView({ block: 'nearest' });
  }
}

function focusUnitInScene(unit) {
  model?.showUnit(unit.id);
  unitPin.textContent = unit.id;
  $('#floor-status').textContent = 'Unidade ' + unit.id + ' · ' + unit.wing;
  updateAngleButton(unit.id === '1103');
}

function updateAngleButton(showWaterfront) {
  const button = $('#angle-button');
  button.dataset.camera = showWaterfront ? 'model' : 'rear';
  button.firstChild.textContent = showWaterfront ? 'Ver fachada da orla ' : 'Ver ala posterior ';
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
  ['Preço anunciado', unit => priceFormat.format(unit.price)]
];
const areaDifference = units[1].area - units[0].area;
$('#compare-summary').textContent = 'A unidade 1108 tem ' + formatArea(areaDifference)
  + ' a mais de área privativa (' + new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 1 }).format(areaDifference / units[0].area) + ').';
$('#compare-plans').innerHTML = units.map(unit => `
  <figure class="compare-plan">
    <figcaption><strong>${unit.id}</strong><span>${formatArea(unit.area)}</span></figcaption>
    <div class="compare-diagram" role="img" aria-label="Contorno aproximado da unidade ${unit.id}. ${unit.orientation}. ${unit.layout}">
      <div class="compare-footprint compare-footprint-${unit.id}">
        <span class="room-label room-living">Sala</span>
        <span class="room-label room-suite">Suíte</span>
        ${unit.id === '1108' ? '<span class="room-label room-balcony">Varanda</span>' : ''}
      </div>
      <span class="compare-diagram-coast">↓ Orla</span>
    </div>
    <p>${unit.layout}</p>
    ${unitPlanLink(unit, 'Ver desenho publicado')}
  </figure>`).join('');
$('#compare-content').innerHTML = `
  <table class="compare-table">
    <thead><tr><th scope="col">Característica</th>${units.map(unit => '<th scope="col">' + unit.id + '</th>').join('')}</tr></thead>
    <tbody>${comparisonRows.map(([label, value]) => `
      <tr><th scope="row">${label}</th>${units.map(unit => '<td>' + value(unit) + '</td>').join('')}</tr>`).join('')}
    </tbody>
  </table>`;

for (const button of $$('[data-view]')) {
  button.addEventListener('click', () => {
    if (button.dataset.view !== 'plan') {
      setView(button.dataset.view);
      updateAngleButton(false);
    } else if (button === floorChip && activeView === 'plan') {
      setView('model');
      updateAngleButton(false);
    } else {
      openPlan(true);
    }
  });
}
for (const button of $$('[data-unit]')) {
  button.addEventListener('click', () => selectUnit(button.dataset.unit, button.classList.contains('plan-unit')));
}
for (const button of $$('[data-camera]')) {
  button.addEventListener('click', () => {
    const action = button.dataset.camera;
    if (!['rear', 'model', 'reset'].includes(action)) {
      model?.changeView(action);
      return;
    }
    if (activeView === 'plan') {
      model?.changeView(action);
    } else {
      setView('model', { cameraAction: action });
    }
    updateAngleButton(action === 'rear');
  });
}
for (const button of $$('[data-photo]')) {
  button.addEventListener('click', () => showPhotograph(Number(button.dataset.photo)));
}
$('#compare-open').addEventListener('click', () => $('#compare-dialog').showModal());
