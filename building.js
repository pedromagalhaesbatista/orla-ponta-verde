(() => {
  const initialView = { yaw: 0.61, pitch: 0.30, zoom: 1 };
  const minZoom = 0.75;
  const maxZoom = 1.65;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  function buildScene() {
    const surfaces = [];
    function addFace(points, normal, color, floor, details = []) {
      surfaces.push({ points, normal, color, floor, details });
    }

    // Every face keeps its own decorative panels in plane, so glass and trim
    // rotate with the geometry and do not interfere with floor picking.
    function box(x1, x2, y1, y2, z1, z2, colors, floor = null, panels = () => []) {
      addFace([[x1,y1,z2],[x2,y1,z2],[x2,y2,z2],[x1,y2,z2]], [0,0,1], colors[0], floor, panels('front'));
      addFace([[x2,y1,z1],[x1,y1,z1],[x1,y2,z1],[x2,y2,z1]], [0,0,-1], colors[0], floor, panels('back'));
      addFace([[x2,y1,z2],[x2,y1,z1],[x2,y2,z1],[x2,y2,z2]], [1,0,0], colors[1], floor, panels('right'));
      addFace([[x1,y1,z1],[x1,y1,z2],[x1,y2,z2],[x1,y2,z1]], [-1,0,0], colors[1], floor, panels('left'));
      addFace([[x1,y2,z2],[x2,y2,z2],[x2,y2,z1],[x1,y2,z1]], [0,1,0], colors[2], floor, panels('top'));
    }

    const stone = ['#ece9dd','#c9cbbc','#fbf7e9'];
    const plaster = ['#ede7d7','#bfc6b9','#f7efe0'];
    const garden = ['#56765b','#456249','#8eae7e'];
    const bronze = ['#a38460','#725b45','#be9d73'];
    const panel = (u1, v1, u2, v2, color) => ({ u1, v1, u2, v2, color });
    const glass = ['#426e69','#5a8881','#4b7d77','#69978c','#4e7a76'];

    function windows(side, floor) {
      if (side === 'top') return [];
      const columns = side === 'front' || side === 'back' ? 6 : 4;
      const result = [panel(0, 0, 1, .11, '#dad8cb')];
      for (let i = 0; i < columns; i++) {
        const start = (i + .15) / columns;
        const end = (i + .90) / columns;
        const pane = glass[(floor + i) % glass.length];
        result.push(
          panel(start, .12, end, .94, '#3b534e'),
          panel(start + .012, .19, end - .012, .90, pane),
          panel(start + .016, .46, end - .016, .49, '#a5bab0'),
          panel(start, .12, start + .009, .94, '#a18a68')
        );
      }
      return result;
    }

    box(-4.6, 4.6, -.23, -.12, -3.5, 3.6, ['#8da398','#819a8c','#bfd0c1']);
    box(-4.2, 4.2, -.12, 0, -3.12, 3.17, ['#b9b7a8','#a9b0a1','#e4e1d2']);
    box(-2.95, 2.95, 0, 1.12, -1.85, 1.91, ['#a49981','#7d887b','#dddacc'], null, side => windows(side, 1));
    box(-3.9, -3.25, 0, .24, -.55, 2.65, garden);
    box(3.25, 3.85, 0, .24, -.55, 2.65, garden);
    box(-2.8, 2.8, 0, .07, 2.08, 2.94, ['#a1b6aa','#819d91','#c9d5c5']);

    for (let floor = 1; floor <= 12; floor++) {
      const y = 1.12 + (floor - 1) * 1.04;
      const id = String(floor).padStart(2, '0');
      const setback = floor > 10 ? .18 : 0;
      box(-2.85 + setback, 2.85 - setback, y, y + .89, -1.76, 1.82, plaster, id, side => windows(side, floor));
      box(-3.17 + setback, 3.17 - setback, y + .89, y + 1.04, -2.07, 2.31, stone, id);
      // The glass guard sits at the edge of the projecting balcony.
      const rail = ['#91afa5','#79988f','#bad2c7'];
      const railPanels = side => side === 'front' || side === 'back'
        ? [.17,.34,.51,.68,.85].map(u => panel(u, 0, u + .006, 1, '#e3e8dc'))
        : [];
      box(-3.06 + setback, 3.06 - setback, y + .035, y + .27, 2.205, 2.25, rail, id, railPanels);
      box(-3.06 + setback, 3.06 - setback, y + .035, y + .27, -2.01, -1.965, rail, id, railPanels);
    }

    const roof = 1.12 + 12 * 1.04;
    box(-2.85, 2.85, roof, roof + .16, -1.94, 2.16, stone, '12');
    box(-2.55, 2.55, roof + .16, roof + .22, -1.85, 1.97, ['#d0bb9a','#b39f82','#d9c4a1'], '12');
    box(-2.62, -2.13, roof + .2, roof + .48, -1.62, 1.75, garden, '12');
    box(2.13, 2.62, roof + .2, roof + .48, -1.62, 1.75, garden, '12');
    box(-1.65, .52, roof + .2, roof + .27, .5, 1.62, ['#6aa797','#6aa797','#83bdaf'], '12');
    for (const x of [0.72, 2.04]) {
      for (const z of [-1.35, -.03]) {
        box(x, x + .08, roof + .22, roof + 1.18, z, z + .08, bronze, '12');
      }
    }
    for (let i = 0; i < 6; i++) {
      const x = .68 + i * .29;
      box(x, x + .10, roof + 1.18, roof + 1.27, -1.5, .16, bronze, '12');
    }
    return surfaces;
  }

  function trace(ctx, points) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (const point of points.slice(1)) ctx.lineTo(point.x, point.y);
    ctx.closePath();
  }

  function contains(points, x, y) {
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const a = points[i], b = points[j];
      if ((a.y > y) !== (b.y > y) && x < (b.x - a.x) * (y - a.y) / (b.y - a.y) + a.x) inside = !inside;
    }
    return inside;
  }

  function createBuilding(canvas, { availableFloors, onSelect, onHover, onViewChange }) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const surfaces = buildScene();
    const camera = { ...initialView };
    let width = 0;
    let height = 0;
    let frame = 0;
    let projectedFaces = [];
    let selected = null;
    let hovered = null;

    function draw() {
      frame = 0;
      if (!width || !height) return;
      ctx.clearRect(0, 0, width, height);
      const sinYaw = Math.sin(camera.yaw), cosYaw = Math.cos(camera.yaw);
      const sinPitch = Math.sin(camera.pitch), cosPitch = Math.cos(camera.pitch);
      const scale = Math.max(5, Math.min((width - 62) / 11.4, (height - 156) / 16.3)) * camera.zoom;

      function project([x, y, z]) {
        const ahead = x * sinYaw + z * cosYaw;
        const vertical = y - 7.1;
        const depth = ahead * cosPitch + vertical * sinPitch;
        const perspective = 36 / (36 - depth);
        return {
          x: width * .49 + (x * cosYaw - z * sinYaw) * scale * perspective,
          y: height * .49 - (vertical * cosPitch - ahead * sinPitch) * scale * perspective,
          depth
        };
      }

      const shadow = project([0, -.28, 0]);
      ctx.save();
      ctx.translate(shadow.x, shadow.y + 3);
      ctx.scale(1, .39);
      const shadowSize = scale * 5.9;
      const shadowGradient = ctx.createRadialGradient(0, 0, shadowSize * .25, 0, 0, shadowSize);
      shadowGradient.addColorStop(0, '#244b4260');
      shadowGradient.addColorStop(1, '#244b4200');
      ctx.fillStyle = shadowGradient;
      ctx.fillRect(-shadowSize, -shadowSize, shadowSize * 2, shadowSize * 2);
      ctx.restore();

      projectedFaces = [];
      for (const surface of surfaces) {
        const [nx, ny, nz] = surface.normal;
        if (nx * sinYaw * cosPitch + ny * sinPitch + nz * cosYaw * cosPitch <= 0) continue;
        const points = surface.points.map(project);
        const depth = points.reduce((sum, point) => sum + point.depth, 0) / points.length;
        projectedFaces.push({ surface, points, depth });
      }
      projectedFaces.sort((a, b) => a.depth - b.depth);

      for (const { surface, points } of projectedFaces) {
        trace(ctx, points);
        ctx.fillStyle = surface.color;
        ctx.fill();
        const [origin, right, , top] = surface.points;
        function onFace(u, v) {
          return project(origin.map((value, axis) => value + (right[axis] - value) * u + (top[axis] - value) * v));
        }
        for (const { u1, v1, u2, v2, color } of surface.details) {
          trace(ctx, [onFace(u1,v1), onFace(u2,v1), onFace(u2,v2), onFace(u1,v2)]);
          ctx.fillStyle = color;
          ctx.fill();
        }
        const { floor } = surface;
        if (!floor) continue;
        let tint;
        if (floor === selected) tint = '#8ce5b0aa';
        else if (floor === hovered) tint = '#c2f5d294';
        else if (!selected && availableFloors.has(floor)) tint = '#b8f2cc29';
        if (tint) {
          trace(ctx, points);
          ctx.fillStyle = tint;
          ctx.fill();
        }
      }
    }

    function redraw() {
      if (!frame) frame = requestAnimationFrame(draw);
    }

    function resize() {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      width = rect.width;
      height = rect.height;
      const resolution = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * resolution);
      canvas.height = Math.round(height * resolution);
      ctx.setTransform(resolution, 0, 0, resolution, 0, 0);
      redraw();
    }

    function pick(x, y) {
      for (let i = projectedFaces.length - 1; i >= 0; i--) {
        const face = projectedFaces[i];
        if (contains(face.points, x, y)) return face.surface.floor;
      }
      return null;
    }

    function setHover(floor, x, y) {
      if (hovered !== floor) {
        hovered = floor;
        canvas.classList.toggle('over-floor', Boolean(floor));
        redraw();
      }
      onHover(floor, x, y);
    }

    function changeView(action) {
      switch (action) {
        case 'left': camera.yaw -= Math.PI / 6; break;
        case 'right': camera.yaw += Math.PI / 6; break;
        case 'up': camera.pitch = clamp(camera.pitch + .10, .13, .70); break;
        case 'down': camera.pitch = clamp(camera.pitch - .10, .13, .70); break;
        case 'in': camera.zoom = clamp(camera.zoom * 1.18, minZoom, maxZoom); break;
        case 'out': camera.zoom = clamp(camera.zoom / 1.18, minZoom, maxZoom); break;
        case 'reset': Object.assign(camera, initialView); break;
      }
      onViewChange(camera.zoom <= minZoom, camera.zoom >= maxZoom);
      setHover(null);
      redraw();
    }

    const pointers = new Map();
    let dragged = false;
    let start = null;
    function coordinates(event) {
      const rect = canvas.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    }
    const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

    canvas.addEventListener('pointerdown', event => {
      if (event.button !== 0 || pointers.size >= 2) return;
      const position = coordinates(event);
      if (!pointers.size) {
        start = position;
        dragged = false;
      } else {
        dragged = true;
      }
      pointers.set(event.pointerId, position);
      canvas.setPointerCapture(event.pointerId);
      setHover(null);
    });

    canvas.addEventListener('pointermove', event => {
      const current = coordinates(event);
      const previous = pointers.get(event.pointerId);
      if (!previous) {
        if (!pointers.size && event.pointerType === 'mouse') setHover(pick(current.x, current.y), current.x, current.y);
        return;
      }
      pointers.set(event.pointerId, current);
      if (pointers.size === 2) {
        const other = [...pointers.entries()].find(([id]) => id !== event.pointerId)[1];
        const previousGap = distance(previous, other);
        if (previousGap > 1) camera.zoom = clamp(camera.zoom * distance(current, other) / previousGap, minZoom, maxZoom);
        onViewChange(camera.zoom <= minZoom, camera.zoom >= maxZoom);
      } else {
        if (!dragged && distance(current, start) < 5) return;
        dragged = true;
        camera.yaw -= (current.x - previous.x) * .010;
        camera.pitch = clamp(camera.pitch + (current.y - previous.y) * .005, .13, .70);
      }
      canvas.classList.add('dragging');
      redraw();
    });

    function endPointer(event) {
      if (!pointers.delete(event.pointerId)) return;
      if (!pointers.size) {
        canvas.classList.remove('dragging');
        if (!dragged && event.type === 'pointerup') {
          const { x, y } = coordinates(event);
          const floor = pick(x, y);
          if (floor) onSelect(floor);
        }
      }
    }

    for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      canvas.addEventListener(event, endPointer);
    }
    canvas.addEventListener('pointerleave', () => setHover(null));
    canvas.addEventListener('keydown', event => {
      const action = {
        ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
        '+': 'in', '=': 'in', '-': 'out', Home: 'reset'
      }[event.key];
      if (!action) return;
      event.preventDefault();
      changeView(action);
    });
    new ResizeObserver(resize).observe(canvas);
    resize();
    return {
      changeView,
      select(floor) {
        selected = floor;
        redraw();
      }
    };
  }

  window.createBuilding = createBuilding;
})();
