const $ = (s) => document.querySelector(s);
const units = [{floor:'12',area:160,rooms:3},{floor:'08',area:142,rooms:3},{floor:'05',area:118,rooms:2},{floor:'03',area:110,rooms:2}];
let favourites = new Set();
try { favourites = new Set(JSON.parse(localStorage.getItem('orla-favourites') || '[]')); } catch (_) {}
let favouriteOnly = false;
let selected = null;
let viewingModel = true;
const floorFilter = $('#floorFilter');
const floorTooltip = $('#floorTooltip');
const floorPreview = $('#floorPreview');
const floorButtons = document.querySelectorAll('[data-pick-floor]');
const viewButtons = document.querySelectorAll('[data-view-action]');

for (let floor = 1; floor <= 12; floor++) {
  floorFilter.add(new Option(floor + 'º pavimento', String(floor).padStart(2, '0')));
}

const building = window.createBuilding($('#buildingCanvas'), {
  availableFloors: new Set(units.map(unit => unit.floor)),
  onSelect: selectFloor,
  onHover(floor, x, y) {
    floorTooltip.hidden = !floor;
    if (!floor) return;
    floorTooltip.textContent = Number(floor) + 'º pavimento';
    const width = $('#buildingCanvas').clientWidth;
    floorTooltip.style.left = Math.max(0, Math.min(x, width - 112)) + 'px';
    floorTooltip.style.top = Math.max(90, y) + 'px';
  },
  onViewChange(atMin, atMax) {
    $('[data-view-action="out"]').disabled = atMin;
    $('[data-view-action="in"]').disabled = atMax;
  }
});
$('#modelFallback').hidden = Boolean(building);

function selectFloor(floor) {
  floorFilter.value = floor;
  render();
}

function renderFloor(items) {
  const floor = floorFilter.value;
  const hasFloor = floor !== 'all';
  building?.select(hasFloor ? floor : null);
  floorButtons.forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.pickFloor === floor));
  });
  floorPreview.hidden = !hasFloor || !viewingModel;
  $('#resultsContext').textContent = hasFloor
    ? Number(floor) + 'º pavimento selecionado.'
    : 'Selecione uma unidade para ver os detalhes.';
  if (!hasFloor) return;
  const unit = items[0];
  $('#previewFloor').textContent = Number(floor) + 'º pavimento';
  $('#previewUnit').textContent = unit
    ? 'Unidade ' + Number(floor) + '01 · ' + unit.area + ' m² · ' + unit.rooms + ' quartos'
    : 'Nenhuma unidade nesta seleção';
  $('#previewDetail').hidden = !unit;
}

function setView(showModel) {
  viewingModel = showModel;
  $('.viewer').classList.toggle('aerial', !showModel);
  $('#modelStage').hidden = !showModel;
  $('#aerialStage').hidden = showModel;
  $('#modelView').setAttribute('aria-pressed', String(showModel));
  $('#aerialView').setAttribute('aria-pressed', String(!showModel));
  $('#floorRail').hidden = !showModel;
  $('#modelControls').hidden = !showModel || !building;
  $('#modelHint').hidden = !showModel || !building;
  $('#resultsJump').hidden = !showModel;
  floorTooltip.hidden = true;
  render();
}
const plan = '<svg viewBox="0 0 130 95" aria-hidden="true"><path d="M12 10h106v75H12z M12 38h53V10M65 38h53M65 38v47M12 62h53M92 38v25h26" fill="none" stroke="#c3d2c7" stroke-width="3"/><path d="M19 15h20v17H19z M72 15h35v17H72z M18 44h25v12H18z" fill="#dce7dc"/></svg>';
function render(){
 let items=units.filter(u=>($('#floorFilter').value==='all'||u.floor===$('#floorFilter').value)&&($('#roomsFilter').value==='all'||String(u.rooms)===$('#roomsFilter').value)&&(!favouriteOnly||favourites.has(u.floor)));
 const sort=$('#sort').value;items.sort((a,b)=>sort==='asc'?Number(a.floor)-Number(b.floor):sort==='area'?b.area-a.area:Number(b.floor)-Number(a.floor));
 $('#resultCount').textContent=items.length+' '+(items.length===1?'residência ilustrativa':'residências ilustrativas');
 $('#cards').innerHTML=items.map(u=>`<article class="card"><button class="card-main" data-detail="${u.floor}" aria-label="Ver detalhes da unidade ${Number(u.floor)}01"><h3>${Number(u.floor)}01</h3><span class="tag">Unidade ilustrativa</span><div class="card-stats"><div class="stat"><span>Área exemplo</span><strong>${u.area} m²</strong></div><div class="stat"><span>Quartos</span><strong>${u.rooms}</strong></div><div class="stat"><span>Pavimento</span><strong>${Number(u.floor)}º</strong></div></div></button><button class="card-art" data-detail="${u.floor}" aria-label="Ver planta ilustrativa da unidade ${Number(u.floor)}01">${plan}</button><button class="heart ${favourites.has(u.floor)?'saved':''}" data-fav="${u.floor}" aria-label="${favourites.has(u.floor)?'Remover dos':'Adicionar aos'} favoritos" aria-pressed="${favourites.has(u.floor)}">${favourites.has(u.floor)?'♥':'♡'}</button></article>`).join('') || '<p class="empty">Nenhuma residência encontrada. Experimente alterar os filtros.</p>';
 renderFloor(items);
 const n=Number($('#floorFilter').value!=='all')+Number($('#roomsFilter').value!=='all');$('#activeFilters').hidden=!n;$('#activeFilters').textContent=n;$('#favCount').textContent=favourites.size;
}
function toggleFav(floor){favourites.has(floor)?favourites.delete(floor):favourites.add(floor);try{localStorage.setItem('orla-favourites',JSON.stringify([...favourites]));}catch(_){}render();if(selected)$('#detailSave').textContent=favourites.has(selected)?'♥  Remover dos favoritos':'♡  Salvar nos favoritos';}
function showDetail(floor){const u=units.find(x=>x.floor===floor);if(!u)return;selected=floor;$('#detailTitle').textContent='Unidade '+Number(floor)+'01';$('#detailFloor').textContent=Number(floor)+'º pavimento · Exemplo conceitual';$('#detailArea').textContent=u.area+' m²';$('#detailRooms').textContent=u.rooms;$('#detailLevel').textContent=Number(floor)+'º';$('#detailSave').textContent=favourites.has(floor)?'♥  Remover dos favoritos':'♡  Salvar nos favoritos';$('#detail').showModal();}
function showInfo(kind){const content={help:['BEM-VINDO À ORLA','Explore a experiência.','<p>Arraste a maquete para girar ou use os controles abaixo dela. Use + e − para mudar a escala. Na tela sensível ao toque, aproxime ou afaste dois dedos.</p><p>Clique ou toque em um pavimento para ver as unidades ilustrativas. Pode também usar os botões à direita da maquete ou os filtros da lista.</p>'],localizacao:['O ENDEREÇO','Ponta Verde, Maceió.','<p>Rua Desportista Humberto Guimarães, 101<br>Ponta Verde · Maceió, AL</p><p><a href="https://www.google.com/maps/place/R.+Desportista+Humberto+Guimar%C3%A3es,+101+-+Ponta+Verde,+Macei%C3%B3+-+AL,+57035-030,+Brazil/" target="_blank" rel="noopener noreferrer">Abrir localização no Google Maps ↗</a></p><p>A maquete e a vista aérea são representações conceituais.</p>'],sobre:['ESTUDO VISUAL INDEPENDENTE','Uma ideia para a Orla.','<p>Esta demonstração apresenta uma forma de explorar residências em Ponta Verde. Imagens, unidades, áreas e plantas são ilustrativas; disponibilidade, características e valores reais não foram verificados.</p>']};const c=content[kind];$('#infoKicker').textContent=c[0];$('#infoTitle').textContent=c[1];$('#infoContent').innerHTML=c[2];$('#info').showModal();}
function menu(open){$('#menu').hidden=!open;$('#menuBackdrop').hidden=!open;$('#menuButton').setAttribute('aria-expanded',String(open));if(open)$('#closeMenu').focus();}
function filters(open){$('#filterPanel').hidden=!open;$('#filterBackdrop').hidden=!open;if(open)$('#floorFilter').focus();}
$('#cards').addEventListener('click',e=>{const d=e.target.closest('[data-detail]'),f=e.target.closest('[data-fav]');if(d)showDetail(d.dataset.detail);if(f)toggleFav(f.dataset.fav);});
floorButtons.forEach(button => {
  button.addEventListener('click', () => selectFloor(button.dataset.pickFloor));
});
viewButtons.forEach(button => {
  button.addEventListener('click', () => building?.changeView(button.dataset.viewAction));
});
$('#clearFloor').addEventListener('click', () => {
  selectFloor('all');
  $('#buildingCanvas').focus({ preventScroll: true });
});
$('#previewDetail').addEventListener('click', () => showDetail(floorFilter.value));
$('#modelView').addEventListener('click', () => setView(true));
$('#aerialView').addEventListener('click', () => setView(false));
$('#modelControls').hidden = !building;
$('#modelHint').hidden = !building;
$('#detailSave').addEventListener('click',()=>toggleFav(selected));
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>document.getElementById(b.dataset.close).close()));
$('#menuButton').onclick=()=>menu(true);$('#closeMenu').onclick=$('#menuBackdrop').onclick=()=>menu(false);$('#filterButton').onclick=()=>filters(true);$('#closeFilter').onclick=$('#filterBackdrop').onclick=$('#applyFilters').onclick=()=>filters(false);
$('#resetFilters').onclick=()=>{$('#floorFilter').value='all';$('#roomsFilter').value='all';favouriteOnly=false;render();};['floorFilter','roomsFilter','sort'].forEach(id=>$('#'+id).addEventListener('change',render));
$('#locationButton').onclick=()=>showInfo('localizacao');$('#helpButton').onclick=()=>showInfo('help');
$('#menu').addEventListener('click',e=>{const page=e.target.closest('[data-page]')?.dataset.page;if(!page)return;menu(false);if(page==='favoritos'){favouriteOnly=true;render();$('#residencias').scrollIntoView({behavior:'smooth'});}else if(page==='residencias'){favouriteOnly=false;render();$('#residencias').scrollIntoView({behavior:'smooth'});}else showInfo(page);});
render();
