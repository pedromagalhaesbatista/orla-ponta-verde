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
const workspace = $('.workspace');
const sheetHeader = $('#sheet-header');
const sheetToggle = $('#sheet-toggle');
const panelToggle = $('#panel-toggle');
const sheetContent = $('#sheet-content');
const compareDialog = $('#compare-dialog');
const unitPins = $$('[data-unit-pin]');
const rotateToUnit = $('#rotate-to-unit');
const panelTabs = $$('[data-panel]');
const panels = { plan: planStage, details: $('#details-panel'), compare: $('#compare-panel') };
const simView = $('#sim-view');
const simOrientation = $('#sim-orientation');
const planDialog = $('#plan-dialog');
const compass = $('#compass');
const cameraHeading = $('#camera-heading');
const scenePresets = $$('[data-preset]');
let activePanel = 'plan';
let panelOpen = false;
let simulating = false;
let lastSimulationYaw;
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
  onPosition({ footprint, floor, units: points, beach, avenue, entrance, width, height, heading, preset, simulationYaw }) {
    const aerial = activeView === 'aerial';
    pin.hidden = !aerial || simulating;
    if (!pin.hidden) {
      const x = Math.max(74, Math.min(width - 74, footprint.x));
      const y = Math.max(74, Math.min(height - 30, footprint.y - Math.min(156, height * .43)));
      place(pin, { x, y }, 0, width, 0, height);
      const dx = footprint.x - x;
      const dy = footprint.y - y + 2;
      pin.style.setProperty('--leader-length', Math.hypot(dx, dy) + 'px');
      pin.style.setProperty('--leader-angle', Math.atan2(dx, dy) + 'rad');
    }
    compass.hidden = false;
    const bearing = (Math.round(heading) + 360) % 360;
    const [short, name] = [
      ['N','norte'], ['NE','nordeste'], ['L','leste'], ['SE','sudeste'],
      ['S','sul'], ['SO','sudoeste'], ['O','oeste'], ['NO','noroeste']
    ][Math.round(bearing / 45) % 8];
    compass.style.setProperty('--bearing', -bearing + 'deg');
    cameraHeading.textContent = short;
    compass.setAttribute('aria-label', 'Rumo da câmera: ' + name + ', ' + bearing + ' graus');
    for (const button of scenePresets) button.setAttribute('aria-pressed', String(button.dataset.preset === preset && !aerial && !simulating));
    const access = $('#site-entrance');
    access.hidden = aerial || simulating || preset !== 'entrance' || entrance.w <= 0;
    if (!access.hidden) place(access, entrance, 75, width - 75, 120, height - 22, 0, 10);
    if (simulating && simulationYaw !== lastSimulationYaw) {
      drawPlan(simOrientation, '1108', { simulationYaw });
      lastSimulationYaw = simulationYaw;
    }
    const anchorFloor = !aerial && !simulating && preset !== 'rear' && floor.x + 13 < width - 68 && floor.y > 92;
    floorChip.hidden = aerial;
    floorChip.classList.toggle('floor-chip-anchored', anchorFloor);
    if (anchorFloor) place(floorChip, floor, 40, width - 67, 59, height - 41, 13);
    else {
      floorChip.style.left = '';
      floorChip.style.top = '';
    }

    const placedPins = [];
    for (const button of [...unitPins].sort((a, b) => Number(b.dataset.unitPin === selectedUnit?.id) - Number(a.dataset.unitPin === selectedUnit?.id))) {
      const point = points[button.dataset.unitPin];
      const raised = point && placedPins.some(previous =>
        Math.abs(previous.x - point.x) < 55 && Math.abs(previous.y - point.y) < 40);
      button.hidden = !point || aerial || simulating;
      if (button.hidden) continue;
      place(button, point, 27, width - 27, 46, height - 20, 0, raised ? -45 : -5);
      placedPins.push(point);
    }
    rotateToUnit.hidden = !selectedUnit || (!aerial && Boolean(points[selectedUnit.id])) || simulating;

    for (const [label, point] of [[beachLabel, beach], [avenueLabel, avenue]]) {
      label.hidden = simulating || point.w <= 0 || point.x < 65 || point.x > width - 65 || point.y < 80 || point.y > height - 14
        || Math.hypot(point.x - footprint.x, point.y - footprint.y) < 56
        || Math.hypot(point.x - floor.x, point.y - floor.y) < 49;
      if (!label.hidden) place(label, point, 0, width, 0, height);
    }
  },
  onSelect({ floor, unit }) {
    if (unit) {
      selectUnit(unit, { rotate: false, focus: true });
    } else if (floor === '11') {
      openPanel('plan', { focus: true });
    } else {
      model.select(floor);
      $('#floor-status').textContent = Number(floor) + 'º pavimento · Planta disponível para o 11º pavimento';
    }
  },
  onHover(hit, x, y) {
    tooltip.hidden = !hit || simulating;
    if (tooltip.hidden) return;
    tooltip.textContent = hit.unit ? 'Unidade ' + hit.unit + ' · ' + formatArea(units.find(unit => unit.id === hit.unit).area)
      : hit.floor === '11' ? '11º pavimento · Abrir planta' : Number(hit.floor) + 'º pavimento';
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
$('.scene-presets').hidden = !model;
floorChip.hidden = false;
model?.select('11');
if (model) {
  for (const [file, apply] of [
    ['osm-buildings.json', model.setNeighbours],
    ['osm-streets.json', model.setStreets],
    ['osm-parks.json', model.setParks]
  ]) {
    fetch('aerial/' + file)
      .then(response => response.ok ? response.json() : [])
      .then(features => {
        apply(features);
        if (features.length) $('#osm-credit').hidden = false;
      })
      .catch(() => {});
  }
}

function place(element, point, minX, maxX, minY, maxY, offsetX = 0, offsetY = 0) {
  element.style.left = Math.max(minX, Math.min(maxX, point.x + offsetX)) + 'px';
  element.style.top = Math.max(minY, Math.min(maxY, point.y + offsetY)) + 'px';
}

function setView(view, { cameraAction, updateUrl = true } = {}) {
  if (simulating) setSimulation(false);
  activeView = view;
  workspace.classList.toggle('aerial-open', view === 'aerial');
  model?.showFootprint(view === 'aerial');
  for (const button of $$('.view-switch [data-view]')) {
    button.setAttribute('aria-pressed', String(button.dataset.view === view));
  }
  tooltip.hidden = true;
  model?.select('11');
  model?.changeView(cameraAction || view);
  updateSummary();
  if (updateUrl) syncUrl();
}

function renderPanel() {
  workspace.classList.toggle('plan-open', panelOpen);
  sheetHeader.hidden = !panelOpen;
  $('#unit-tabs').hidden = !panelOpen;
  $('#units-title').classList.toggle('sr-only', panelOpen);
  $('.units-intro').hidden = panelOpen;
  $('#unit-list').hidden = panelOpen;
  $('#compare-open').hidden = panelOpen;
  for (const name of Object.keys(panels)) panels[name].hidden = !panelOpen || name !== activePanel;
  for (const button of panelTabs) {
    const active = button.dataset.panel === activePanel;
    button.setAttribute('aria-selected', String(active));
    button.tabIndex = active ? 0 : -1;
  }
  floorChip.setAttribute('aria-expanded', String(panelOpen && activePanel === 'plan'));
  $('#panel-share-status').replaceChildren();
  sheetContent.scrollTop = 0;
  $('#unit-panel').scrollTop = 0;
  updateSummary();
}

function openPanel(name, { focus = false, updateUrl = true } = {}) {
  if (name === 'details' && !selectedUnit) name = 'plan';
  if (simulating) setSimulation(false);
  panelOpen = true;
  activePanel = name;
  renderPanel();
  setSheetExpanded(true);
  if (updateUrl) syncUrl();
  if (focus) panelTabs.find(button => button.dataset.panel === name).focus({ preventScroll: true });
  if (focus && mediaSmall.matches) $('.site-header').scrollIntoView({ block: 'start' });
}

function updateSummary() {
  const unit = selectedUnit;
  $('#sheet-selection').textContent = unit ? 'Unidade ' + unit.id + ' · ' + formatArea(unit.area) : '11º pavimento';
  $('#floor-status').textContent = simulating ? 'Arraste para olhar ao redor'
    : activeView === 'aerial' ? 'Arraste para girar · Clique no marcador para aproximar'
    : unit ? 'Unidade ' + unit.id + ' · ' + unit.wing
    : 'Arraste para girar · Selecione uma unidade ou o 11º pavimento';
}

function setSheetExpanded(expanded) {
  workspace.classList.toggle('sheet-collapsed', !expanded);
  sheetContent.inert = !expanded;
  panelToggle.setAttribute('aria-expanded', String(expanded));
  panelToggle.textContent = expanded ? 'Recolher painel' : 'Abrir painel';
  sheetToggle.setAttribute('aria-expanded', String(expanded));
  sheetToggle.textContent = expanded ? 'Recolher' : 'Abrir painel';
  floorChip.setAttribute('aria-expanded', String(expanded && panelOpen && activePanel === 'plan'));
}

function closePlan() {
  panelOpen = false;
  renderPanel();
  setSheetExpanded(true);
  syncUrl();
  (activeView === 'aerial' ? pin : floorChip).focus({ preventScroll: true });
}

for (const toggle of [panelToggle, sheetToggle]) {
  toggle.addEventListener('click', () => setSheetExpanded(toggle.getAttribute('aria-expanded') !== 'true'));
}
floorChip.addEventListener('click', () => openPanel('plan', { focus: true }));
$('#close-plan').addEventListener('click', closePlan);
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || event.defaultPrevented || document.querySelector('dialog[open]')) return;
  if (simulating) setSimulation(false, true);
  else if (panelOpen) closePlan();
});

for (const button of panelTabs) {
  button.addEventListener('click', () => openPanel(button.dataset.panel));
  button.addEventListener('keydown', event => {
    const options = panelTabs.filter(tab => !tab.disabled);
    const index = options.indexOf(button);
    const direction = { ArrowLeft: -1, ArrowRight: 1 }[event.key];
    const next = event.key === 'Home' ? options[0] : event.key === 'End' ? options.at(-1)
      : direction ? options[(index + direction + options.length) % options.length] : null;
    if (!next) return;
    event.preventDefault();
    openPanel(next.dataset.panel, { focus: true });
  });
}

pin.addEventListener('click', () => {
  setView('model');
  $('.view-switch [data-view="model"]').focus({ preventScroll: true });
});
for (const button of unitPins) {
  button.addEventListener('click', () => selectUnit(button.dataset.unitPin, { rotate: false, focus: true }));
}
rotateToUnit.addEventListener('click', () => {
  if (!selectedUnit) return;
  focusUnitInScene(selectedUnit, true);
  if (mediaSmall.matches) setSheetExpanded(false);
  canvas.focus({ preventScroll: true });
});
$('#exit-sim').addEventListener('click', () => setSimulation(false, true));

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

function selectUnit(id, { rotate = true, focus = false, updateUrl = true } = {}) {
  const unit = units.find(item => item.id === id);
  if (!unit) return;
  if (simulating) setSimulation(false);
  selectedUnit = unit;
  renderUnit();
  openPanel('details', { focus, updateUrl: false });
  focusUnitInScene(unit, rotate);
  if (updateUrl) syncUrl();
}

function renderUnit() {
  $('#tab-details').disabled = !selectedUnit;
  for (const button of $$('[data-unit], [data-unit-pin]')) {
    const id = button.dataset.unit || button.dataset.unitPin;
    button.setAttribute('aria-pressed', String(id === selectedUnit?.id));
  }
  const detail = $('#unit-detail');
  if (!selectedUnit) {
    detail.replaceChildren();
    return;
  }
  const { id, area, price } = selectedUnit;
  detail.innerHTML = `
    <div class="detail-head">
      <h3 tabindex="-1">Unidade ${id}</h3>
      <button type="button" class="save-button" id="save-unit"></button>
    </div>
    <dl>
      <div><dt>Área privativa</dt><dd>${formatArea(area)}</dd></div>
      <div><dt>Quartos</dt><dd>1 suíte</dd></div>
      <div><dt>Preço anunciado em 02/07/2026</dt><dd>${priceFormat.format(price)}</dd></div>
    </dl>
    ${id === '1108' ? '<button type="button" class="compare-button sim-start" id="start-sim">Explorar vista simulada <span aria-hidden="true">↗</span></button>' : ''}
    <figure class="unit-plan">
      <figcaption><strong>Planta da unidade</strong><span>Esquemática · ${selectedUnit.wing}</span></figcaption>
      <div class="plan-viewport" tabindex="0" aria-label="Planta da unidade ${id}">
        <div class="plan-image">${planCanvas(selectedUnit)}</div>
      </div>
      <div class="plan-zoom" role="group" aria-label="Zoom da planta" data-plan-zoom="unit"></div>
      <p>${id === '1108' ? 'Entrada pelo corredor · Varanda voltada para a orla' : 'Entrada pelo corredor lateral · Orla indicada para orientação'}</p>
    </figure>
    <div class="unit-detail-links">
      <button type="button" class="text-button" id="expand-unit-plan">Abrir planta em tela ampla</button>
      ${unitPlanLink(selectedUnit, 'Ver planta publicada')}
      <button type="button" class="text-button" id="locate-unit">Ver no edifício ↑</button>
      <button type="button" class="text-button" id="copy-unit">Copiar link da unidade</button>
    </div>
    ${id === '1108' ? `<div class="nearby-footage"><strong>Sobrevoo real da orla</strong><span>Ponta Verde · Farol, Rua Fechada e Marco dos Corais</span>
      <a href="https://www.youtube.com/watch?v=blCQvmzeiV0" target="_blank" rel="noopener">Assistir ao vídeo ↗</a>
      <a href="https://www.openstreetmap.org/node/1181443792" target="_blank" rel="noopener">Localizar o Farol ↗</a></div>` : ''}`;
  drawPlan(detail.querySelector('canvas'), id);
  planZooms.unit = 0;
  attachPlanZoom(detail.querySelector('[data-plan-zoom]'));
  renderFavourite();
  $('#save-unit').addEventListener('click', toggleFavourite);
  $('#locate-unit').addEventListener('click', () => showUnitOnBuilding(id));
  $('#copy-unit').addEventListener('click', () => copyLink(unitLink(id), $('#panel-share-status')));
  $('#expand-unit-plan').addEventListener('click', () => {
    $('#large-plan-title').textContent = 'Planta · Unidade ' + id;
    $('#large-plan-image').innerHTML = planCanvas(selectedUnit);
    drawPlan($('#large-plan-image canvas'), id);
    planZooms.large = 0;
    planDialog.showModal();
    updatePlanZoom(planDialog.querySelector('[data-plan-zoom]'));
  });
  const startSim = $('#start-sim');
  if (startSim) {
    startSim.disabled = !model;
    startSim.addEventListener('click', () => setSimulation(true, true));
  }
}

function showUnitOnBuilding(id) {
  selectUnit(id, { focus: false });
  if (mediaSmall.matches) setSheetExpanded(false);
  canvas.focus({ preventScroll: true });
}

function focusUnitInScene(unit, rotate) {
  if (rotate && activeView === 'aerial') setView('model', { updateUrl: false });
  model?.showUnit(unit.id, { rotate });
  updateSummary();
}

function setSimulation(enabled, focus = false) {
  simulating = enabled;
  model?.simulate(enabled);
  workspace.classList.toggle('simulating', enabled);
  simView.hidden = !enabled;
  lastSimulationYaw = undefined;
  canvas.setAttribute('aria-label', enabled ? 'Vista simulada da unidade 1108 voltada para a orla' : 'Maquete do Five Flex Life sobre imagem de satélite de Ponta Verde');
  if (enabled) {
    rotateToUnit.hidden = true;
    setSheetExpanded(false);
    if (mediaSmall.matches) $('.site-header').scrollIntoView({ block: 'start' });
    if (focus) $('#exit-sim').focus({ preventScroll: true });
  } else if (focus) {
    setSheetExpanded(true);
    openPanel('details');
    $('#start-sim')?.focus({ preventScroll: true });
  }
  updateSummary();
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
const compareSummary = 'A unidade 1108 tem ' + formatArea(areaDifference)
  + ' a mais de área privativa (' + new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 1 }).format(areaDifference / units[0].area) + ').';
$('#compare-summary').textContent = compareSummary;
$('#compare-panel-summary').textContent = compareSummary;
const comparisonCards = units.map(unit => `
  <figure class="compare-plan">
    <figcaption><strong>${unit.id}</strong><span>${formatArea(unit.area)}</span></figcaption>
    <div class="compare-diagram">
      ${planCanvas(unit)}
    </div>
    <p>${unit.layout}</p>
    <div class="compare-plan-actions">
      <button type="button" class="compare-locate" data-show-building="${unit.id}" aria-label="Ver unidade ${unit.id} no edifício">Ver no edifício</button>
      ${unitPlanLink(unit, 'Desenho publicado')}
    </div>
  </figure>`).join('');
$('#compare-plans').innerHTML = comparisonCards;
$('#compare-panel-plans').innerHTML = comparisonCards;
// Both outlines use the same coordinate scale from the typical floor drawing.
const planDrawings = {
  '1103': {
    outline: [[44,10],[163,10],[163,235],[44,235],[44,143],[72,112],[44,85]],
    rooms: [
      { path: [[44,10],[163,10],[163,158],[134,158],[44,85]], fill: '#eef1df' },
      { path: [[44,143],[72,112],[133,166],[133,235],[44,235]], fill: '#dbe8cf' },
      { path: [[133,169],[163,169],[163,235],[133,235]], fill: '#dceae9' },
      { path: [[82,10],[163,10],[163,48],[82,48]], fill: '#eadfcd' }
    ],
    walls: [[[72,112],[129,166]], [[133,170],[133,235]], [[133,169],[147,169]]],
    windows: [[[44,62],[44,81]], [[44,151],[44,198]]],
    doors: [
      { x: 163, y: 131, radius: 20, angle: Math.PI / 2, swing: Math.PI / 2 },
      { x: 130, y: 166, radius: 16, angle: 0, swing: Math.PI / 2 },
      { x: 163, y: 169, radius: 15, angle: Math.PI, swing: -Math.PI / 2 }
    ],
    fixtures: [[91,15,65,8], [140,199,16,11], [140,217,15,10], [63,178,48,37]],
    labels: [['Cozinha',122,35],['Sala',112,78],['Suíte',87,160],['Banho',149,190]],
    entrance: { x: 177, y: 141, angle: Math.PI }
  },
  '1108': {
    outline: [[18,38],[190,38],[190,226],[18,226]],
    rooms: [
      { path: [[18,38],[113,38],[113,226],[18,226]], fill: '#eef1df' },
      { path: [[113,38],[190,38],[190,226],[113,226]], fill: '#dbe8cf' },
      { path: [[18,38],[60,38],[60,72],[18,72]], fill: '#dceae9' },
      { path: [[113,38],[150,38],[150,96],[113,96]], fill: '#dceae9' },
      { path: [[92,38],[113,38],[113,111],[92,111]], fill: '#eadfcd' },
      { path: [[18,187],[113,187],[113,226],[18,226]], fill: '#e7e6d0' }
    ],
    walls: [[[113,38],[113,102]], [[113,121],[113,226]], [[18,72],[43,72]], [[60,72],[60,38]], [[150,38],[150,96]], [[150,96],[132,96]], [[18,187],[29,187]], [[91,187],[113,187]]],
    windows: [[[29,187],[91,187]], [[25,226],[105,226]], [[127,226],[178,226]]],
    doors: [
      { x: 77, y: 38, radius: 17, angle: 0, swing: Math.PI / 2 },
      { x: 43, y: 72, radius: 16, angle: 0, swing: -Math.PI / 2 },
      { x: 113, y: 120, radius: 18, angle: -Math.PI / 2, swing: Math.PI / 2 },
      { x: 132, y: 96, radius: 17, angle: Math.PI, swing: Math.PI / 2 }
    ],
    fixtures: [[98,42,11,60], [22,43,9,17], [43,43,10,18], [121,47,20,13], [121,72,16,10], [140,133,37,47], [22,125,16,48]],
    labels: [['Banho',39,65],['Cozinha',82,91],['Banho',131,89],['Sala',66,142],['Suíte',153,119],['Varanda',64,201]],
    entrance: { x: 83, y: 23, angle: Math.PI / 2 }
  }
};

function planCanvas(unit) {
  return `<canvas width="832" height="976" data-plan-drawing="${unit.id}" role="img"
    aria-label="Planta esquemática da unidade ${unit.id}. ${unit.orientation}. ${unit.layout} Entrada e direção da orla indicadas."></canvas>`;
}

function drawPlan(diagram, id, { simulationYaw } = {}) {
  const ctx = diagram.getContext('2d');
  if (!ctx) return;
  const plan = planDrawings[id];
  const scale = diagram.width / 208;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.clearRect(0, 0, 208, 244);
  ctx.lineJoin = 'round';
  function trace(points, closed = false) {
    ctx.beginPath();
    ctx.moveTo(...points[0]);
    for (const point of points.slice(1)) ctx.lineTo(...point);
    if (closed) ctx.closePath();
  }
  for (const room of plan.rooms) {
    trace(room.path, true);
    ctx.fillStyle = room.fill;
    ctx.fill();
  }
  ctx.lineWidth = 2.3;
  ctx.strokeStyle = '#3b524a';
  trace(plan.outline, true);
  ctx.stroke();
  for (const wall of plan.walls) {
    trace(wall);
    ctx.stroke();
  }
  ctx.lineWidth = 1.05;
  ctx.fillStyle = '#f7f4e8';
  for (const [x,y,width,height] of plan.fixtures) {
    ctx.fillRect(x,y,width,height);
    ctx.strokeRect(x,y,width,height);
  }
  for (const window of plan.windows) {
    trace(window);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#f5f3e8';
    ctx.stroke();
    ctx.lineWidth = 1.7;
    ctx.strokeStyle = '#4b8688';
    ctx.stroke();
  }
  for (const { x, y, radius, angle, swing } of plan.doors) {
    trace([[x,y],[x+Math.cos(angle)*radius,y+Math.sin(angle)*radius]]);
    ctx.lineWidth = 3.1;
    ctx.strokeStyle = '#f4f3e9';
    ctx.stroke();
    ctx.lineWidth = .9;
    ctx.strokeStyle = '#687269';
    ctx.beginPath();
    ctx.arc(x,y,radius,angle,angle+swing,swing < 0);
    ctx.stroke();
    trace([[x,y],[x+Math.cos(angle+swing)*radius,y+Math.sin(angle+swing)*radius]]);
    ctx.stroke();
  }
  ctx.font = '600 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#213c32';
  if (simulationYaw === undefined) {
    for (const [label,x,y] of plan.labels) ctx.fillText(label,x,y);
    const { x, y, angle } = plan.entrance;
    arrow(x + Math.cos(angle) * 8, y + Math.sin(angle) * 8, angle, 15, '#2d6050');
    ctx.font = '700 9px system-ui, sans-serif';
    if (id === '1103') {
      ctx.save();
      ctx.translate(191, y);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText('Entrada', 0, 0);
      ctx.restore();
      ctx.fillText('↓ Orla', 185, 230);
    } else {
      ctx.fillText('Entrada', x, 11);
      ctx.fillText('↓ Orla', 104, 237);
    }
  } else {
    const x = 67, y = 211, angle = Math.PI / 2 - simulationYaw;
    ctx.fillStyle = '#214f43';
    ctx.beginPath();
    ctx.arc(x, y, 9, 0, Math.PI * 2);
    ctx.fill();
    arrow(x + Math.cos(angle) * 25, y + Math.sin(angle) * 25, angle, 24, '#214f43', 6);
  }

  function arrow(x, y, angle, length, colour, head = 4) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.strokeStyle = colour;
    ctx.lineWidth = head / 2;
    trace([[-length, 0], [0, 0]]);
    ctx.stroke();
    trace([[-head, -head], [0, 0], [-head, head]]);
    ctx.stroke();
    ctx.restore();
  }
}

const zoomLevels = [100, 125, 150, 200];
const planZooms = { unit: 0, large: 0, compare: 0 };

function updatePlanZoom(group) {
  const index = planZooms[group.dataset.planZoom];
  const viewport = group.previousElementSibling;
  const position = (viewport.scrollLeft + viewport.clientWidth / 2) / (viewport.scrollWidth || 1);
  viewport.style.setProperty('--plan-width', zoomLevels[index] + '%');
  if (viewport.clientWidth) viewport.scrollLeft = position * viewport.scrollWidth - viewport.clientWidth / 2;
  group.querySelector('output').textContent = zoomLevels[index] + '%';
  group.querySelector('[data-zoom="-1"]').disabled = index === 0;
  group.querySelector('[data-zoom="1"]').disabled = index === zoomLevels.length - 1;
}

function attachPlanZoom(group) {
  const kind = group.dataset.planZoom;
  group.innerHTML = '<button type="button" data-zoom="-1" aria-label="Reduzir zoom">−</button><output aria-live="polite"></output><button type="button" data-zoom="1" aria-label="Aumentar zoom">+</button>';
  for (const button of group.querySelectorAll('button')) button.addEventListener('click', () => {
    planZooms[kind] += Number(button.dataset.zoom);
    for (const control of $$('[data-plan-zoom="' + kind + '"]')) updatePlanZoom(control);
    if (button.disabled) group.querySelector('button:not(:disabled)').focus({ preventScroll: true });
  });
  updatePlanZoom(group);
}

for (const diagram of $$('[data-plan-drawing]')) drawPlan(diagram, diagram.dataset.planDrawing);
for (const group of $$('[data-plan-zoom]')) attachPlanZoom(group);

$('#compare-content').innerHTML = `
  <table class="compare-table">
    <thead><tr><th scope="col">Característica</th>${units.map(unit => '<th scope="col">' + unit.id + '</th>').join('')}</tr></thead>
    <tbody>${comparisonRows.map(([label, value]) => `
      <tr><th scope="row">${label}</th>${units.map(unit => '<td>' + value(unit) + '</td>').join('')}</tr>`).join('')}
    </tbody>
  </table>`;

for (const button of $$('[data-view]')) {
  button.addEventListener('click', () => setView(button.dataset.view));
}
for (const button of $$('[data-unit]')) {
  button.addEventListener('click', () => selectUnit(button.dataset.unit, { focus: true }));
}
for (const button of $$('[data-camera]')) {
  button.addEventListener('click', () => model?.changeView(button.dataset.camera));
}
for (const button of scenePresets) {
  button.addEventListener('click', () => setView('model', { cameraAction: button.dataset.preset }));
}
for (const button of $$('[data-photo]')) {
  button.addEventListener('click', () => showPhotograph(Number(button.dataset.photo)));
}
$('#compare-open').addEventListener('click', () => openPanel('compare', { focus: true }));
$('#expand-compare').addEventListener('click', () => {
  compareDialog.showModal();
  updatePlanZoom(compareDialog.querySelector('[data-plan-zoom]'));
  compareDialog.scrollTop = 0;
});
for (const button of $$('[data-show-building]')) {
  button.addEventListener('click', () => {
    if (compareDialog.open) compareDialog.close();
    showUnitOnBuilding(button.dataset.showBuilding);
  });
}

const comparisonIds = units.map(unit => unit.id).join(',');

function stateLink({ unit, compare = false } = {}) {
  const url = new URL(location.href);
  url.searchParams.delete('unidade');
  url.searchParams.delete('comparar');
  if (unit) url.searchParams.set('unidade', unit);
  if (compare) url.searchParams.set('comparar', comparisonIds);
  return url;
}

function unitLink(id) {
  const url = stateLink({ unit: id });
  url.hash = '';
  return url;
}

function comparisonLink() {
  const url = stateLink({ compare: true });
  url.hash = '';
  return url;
}

function syncUrl() {
  const url = stateLink({
    unit: selectedUnit?.id,
    compare: panelOpen && activePanel === 'compare'
  });
  if (url.search !== location.search) history.pushState(null, '', url);
}

function restoreRoute(initial = false) {
  if (compareDialog.open) compareDialog.close();
  if (planDialog.open) planDialog.close();
  if (simulating) setSimulation(false);
  const params = new URLSearchParams(location.search);
  selectedUnit = units.find(unit => unit.id === params.get('unidade')) || null;
  renderUnit();
  const pair = params.get('comparar');
  if (pair?.split(',').sort().join(',') === comparisonIds) {
    if (selectedUnit) focusUnitInScene(selectedUnit, true);
    else model?.showUnit(null);
    openPanel('compare', { updateUrl: false });
  } else if (selectedUnit) {
    focusUnitInScene(selectedUnit, true);
    openPanel('details', { updateUrl: false });
  } else if (!initial) {
    panelOpen = false;
    renderPanel();
    setSheetExpanded(true);
    model?.showUnit(null);
    setView('model', { updateUrl: false });
  }
}

async function copyLink(url, status) {
  status.replaceChildren();
  try {
    await navigator.clipboard.writeText(url.href);
    status.textContent = 'Link copiado.';
  } catch {
    const input = document.createElement('input');
    input.type = 'url';
    input.readOnly = true;
    input.value = url.href;
    input.setAttribute('aria-label', 'Link para copiar');
    status.append(input);
    input.focus({ preventScroll: true });
    input.select();
  }
}

$('#copy-panel-compare').addEventListener('click', () => copyLink(comparisonLink(), $('#panel-share-status')));
$('#copy-compare').addEventListener('click', () => copyLink(comparisonLink(), $('#compare-share-status')));
window.addEventListener('popstate', () => restoreRoute());
restoreRoute(true);
