// scene.js — Three.js low-poly Chinese garden scene
// Exports window.GardenScene for the React UI layer to drive.

(function () {
  "use strict";

  // ── Palettes ──────────────────────────────────────────────────────────────
  // Three completely different visual directions. Each palette is a flat
  // dictionary of named THREE.Color hex strings; setPalette() swaps them in.
  const PALETTES = {
    ink: {
      // 水墨 — paper, ink, single seal-red accent
      label: "水墨 · Ink-wash",
      sky:        ["#ece5d6", "#b8ae96"],   // [top, bottom] of vertical gradient
      fog:        "#c8bfa8",
      fogNear:    24,
      fogFar:     62,
      ground:     "#a89a7e",
      groundEdge: "#8a7e64",
      stone:      "#5e564a",
      stoneLight: "#7a7160",
      water:      "#7e8a8d",
      waterDeep:  "#525c61",
      roof:       "#2d2825",
      roofTrim:   "#1a1714",
      wall:       "#b8a684",
      wallDark:   "#7c6f55",
      wood:       "#4d3f31",
      column:     "#3a302a",
      foliage:    "#4f5b4a",
      foliageAlt: "#3b4a3c",
      pine:       "#2f3a2f",
      bamboo:     "#79866a",
      willow:     "#8a937a",
      lantern:    "#a53a2c",         // small red dot — the only saturated color
      lanternGlow:"#a53a2c",
      koi:        "#c47a4e",
      koiAlt:     "#efe0c8",
      crane:      "#1a1714",
      accent:     "#a53a2c",
      ambient:    "#fbf7ec",
      sunDir:     [-8, 14, 6],
      sunColor:   "#fff5e0",
      sunIntensity: 1.05,
      ambientIntensity: 0.65,
      hemiTop:    "#ffffff",
      hemiBot:    "#a59c83",
      lanternsLit: false,
      annotations: false,
    },
    dusk: {
      // 暮色 — warm sunset, lanterns lit, deeper saturation
      label: "暮色 · Dusk",
      sky:        ["#f5b481", "#d97a5a"],
      fog:        "#d28461",
      fogNear:    16,
      fogFar:     44,
      ground:     "#7e5a45",
      groundEdge: "#5a3f30",
      stone:      "#6b5c4e",
      stoneLight: "#8b7a66",
      water:      "#d68a5a",
      waterDeep:  "#9c4f33",
      roof:       "#3a201a",
      roofTrim:   "#1a0d0a",
      wall:       "#e9c8a2",
      wallDark:   "#a07050",
      wood:       "#4a2a1c",
      column:     "#3a1f15",
      foliage:    "#5a4830",
      foliageAlt: "#473826",
      pine:       "#3a3624",
      bamboo:     "#7a6a3c",
      willow:     "#8a7a4a",
      lantern:    "#ffba6a",          // glowing
      lanternGlow:"#ffd07a",
      koi:        "#ff9650",
      koiAlt:     "#ffe2b4",
      crane:      "#2a1610",
      accent:     "#ffba6a",
      ambient:    "#ffd9b0",
      sunDir:     [-12, 6, 4],
      sunColor:   "#ffb070",
      sunIntensity: 1.1,
      ambientIntensity: 0.55,
      hemiTop:    "#ffb070",
      hemiBot:    "#5a3020",
      lanternsLit: true,
      annotations: false,
    },
    research: {
      // 空间研究 — cool blueprint, building wireframes, annotations
      label: "空间研究 · Spatial Research",
      sky:        ["#e8ebe9", "#bcc1c0"],
      fog:        "#c6c9c7",
      fogNear:    24,
      fogFar:     64,
      ground:     "#b8bbb6",
      groundEdge: "#9aa09a",
      stone:      "#6e7474",
      stoneLight: "#90948f",
      water:      "#a2b4bd",
      waterDeep:  "#7a8e98",
      roof:       "#26303a",
      roofTrim:   "#11181f",
      wall:       "#b4b6af",
      wallDark:   "#7d8280",
      wood:       "#3a4148",
      column:     "#2a3038",
      foliage:    "#6a7466",
      foliageAlt: "#566250",
      pine:       "#4a5246",
      bamboo:     "#8a9682",
      willow:     "#9aa292",
      lantern:    "#4a6fd0",          // accent — research-blueprint blue
      lanternGlow:"#5e85e8",
      koi:        "#4a6fd0",
      koiAlt:     "#e2e8f0",
      crane:      "#2a3038",
      accent:     "#4a6fd0",
      ambient:    "#f6f8fa",
      sunDir:     [-6, 14, 8],
      sunColor:   "#ffffff",
      sunIntensity: 0.9,
      ambientIntensity: 0.7,
      hemiTop:    "#ffffff",
      hemiBot:    "#9aa0a0",
      lanternsLit: false,
      annotations: true,    // show axis/sightline overlays
    },
  };
  window.GARDEN_PALETTES = PALETTES;

  // ── Three.js setup helpers ────────────────────────────────────────────────
  const THREE = window.THREE;
  if (!THREE) { console.error("THREE not loaded"); return; }

  const c = (hex) => new THREE.Color(hex);

  function flatMat(color, opts = {}) {
    return new THREE.MeshLambertMaterial(Object.assign({
      color: c(color),
      flatShading: true,
    }, opts));
  }

  // Convert a y-up curved roof into low-poly geometry.
  // A "pagoda eave" roof: a wide overhang that flares up at the corners.
  function pagodaRoof(width, depth, height, overhang, flare) {
    const geom = new THREE.BufferGeometry();
    const w = width / 2, d = depth / 2;
    const o = overhang;
    // Eight corners: bottom (4) + apex ridge (2)
    // Base plate vertices (overhanging, upturned at corners by `flare`)
    const verts = [];
    const push = (x, y, z) => verts.push(x, y, z);
    // Outer bottom corners (flared up)
    push(-w - o, flare, -d - o); // 0 BL
    push( w + o, flare, -d - o); // 1 BR
    push( w + o, flare,  d + o); // 2 FR
    push(-w - o, flare,  d + o); // 3 FL
    // Ridge top (along X)
    push(-w * 0.5, height,  0); // 4 ridgeL
    push( w * 0.5, height,  0); // 5 ridgeR
    // Inner mid points where the roof meets the wall plane (for the sag in the middle)
    push(-w, -flare * 0.2, -d); // 6 inner BL
    push( w, -flare * 0.2, -d); // 7 inner BR
    push( w, -flare * 0.2,  d); // 8 inner FR
    push(-w, -flare * 0.2,  d); // 9 inner FL

    const idx = [
      // Back slope (from ridge to back outer edge), as two triangles via inner pts
      4, 6, 0,   4, 0, 5,
      5, 0, 1,   5, 1, 7,
      // Front slope
      4, 3, 9,   4, 9, 5,
      5, 9, 8,   5, 8, 2,
      // Side wedges (the flared corners)
      4, 0, 3,   0, 9, 3,   // left side
      5, 2, 1,   5, 8, 2,   // right side
      // Underside (back)
      0, 6, 7,   0, 7, 1,
      3, 2, 8,   3, 8, 9,
    ];
    geom.setIndex(idx);
    geom.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    geom.computeVertexNormals();
    return geom;
  }

  // ── Building factories ────────────────────────────────────────────────────
  // Each returns a THREE.Group with `.userData.building = "<key>"` set on the
  // group AND every clickable child mesh.

  function makePavilion(pal) {
    const g = new THREE.Group();
    g.userData.building = "pavilion";

    // Hexagonal stone base
    const baseGeom = new THREE.CylinderGeometry(2.2, 2.4, 0.4, 6);
    const base = new THREE.Mesh(baseGeom, flatMat(pal.stoneLight));
    base.position.y = 0.2;
    base.userData.paletteRole = "stoneLight";
    g.add(base);

    // 6 columns
    const colMat = flatMat(pal.column);
    colMat.userData = { paletteRole: "column" };
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
      const col = new THREE.Mesh(
        new THREE.CylinderGeometry(0.09, 0.09, 2.0, 6),
        colMat
      );
      col.position.set(Math.cos(a) * 1.8, 1.4, Math.sin(a) * 1.8);
      col.userData.paletteRole = "column";
      g.add(col);
    }

    // Floor platform
    const floor = new THREE.Mesh(
      new THREE.CylinderGeometry(1.9, 1.9, 0.1, 6),
      flatMat(pal.wood)
    );
    floor.position.y = 0.45;
    floor.userData.paletteRole = "wood";
    g.add(floor);

    // Pagoda roof — two stacked tiers
    const roof1 = new THREE.Mesh(
      new THREE.ConeGeometry(2.7, 0.9, 6),
      flatMat(pal.roof)
    );
    roof1.position.y = 2.85;
    roof1.userData.paletteRole = "roof";
    g.add(roof1);

    const eave = new THREE.Mesh(
      new THREE.CylinderGeometry(2.8, 2.5, 0.15, 6),
      flatMat(pal.roofTrim)
    );
    eave.position.y = 2.45;
    eave.userData.paletteRole = "roofTrim";
    g.add(eave);

    const roof2 = new THREE.Mesh(
      new THREE.ConeGeometry(1.6, 0.8, 6),
      flatMat(pal.roof)
    );
    roof2.position.y = 3.8;
    roof2.userData.paletteRole = "roof";
    g.add(roof2);

    // Finial
    const finial = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 6, 5),
      flatMat(pal.accent)
    );
    finial.position.y = 4.35;
    finial.userData.paletteRole = "accent";
    g.add(finial);

    // Lanterns hanging from the eaves (3 of them)
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + Math.PI / 3;
      const lantern = makeLantern(pal);
      lantern.position.set(Math.cos(a) * 2.4, 2.0, Math.sin(a) * 2.4);
      g.add(lantern);
    }

    // Mark every mesh as clickable on this group
    g.traverse((o) => { if (o.isMesh) o.userData.building = "pavilion"; });
    return g;
  }

  function makeLantern(pal) {
    const lg = new THREE.Group();
    lg.userData.lantern = true;
    // String
    const string = new THREE.Mesh(
      new THREE.CylinderGeometry(0.01, 0.01, 0.3, 4),
      flatMat(pal.wood)
    );
    string.position.y = 0.0;
    string.userData.paletteRole = "wood";
    lg.add(string);
    // Body — small lantern
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 0.22, 8),
      new THREE.MeshLambertMaterial({
        color: c(pal.lantern),
        emissive: c(pal.lanternsLit ? pal.lanternGlow : "#000000"),
        emissiveIntensity: pal.lanternsLit ? 1.2 : 0,
        flatShading: true,
      })
    );
    body.position.y = -0.27;
    body.userData.paletteRole = "lantern_body";
    lg.add(body);
    // Top + bottom caps
    const cap1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.13, 0.04, 8),
      flatMat(pal.wood)
    );
    cap1.position.y = -0.16;
    cap1.userData.paletteRole = "wood";
    lg.add(cap1);
    const cap2 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.07, 0.04, 8),
      flatMat(pal.wood)
    );
    cap2.position.y = -0.38;
    cap2.userData.paletteRole = "wood";
    lg.add(cap2);
    // Tassel
    const tassel = new THREE.Mesh(
      new THREE.ConeGeometry(0.04, 0.12, 6),
      flatMat(pal.accent)
    );
    tassel.position.y = -0.46;
    tassel.rotation.x = Math.PI;
    tassel.userData.paletteRole = "accent";
    lg.add(tassel);
    // Optional point light (only when lit)
    if (pal.lanternsLit) {
      const pl = new THREE.PointLight(c(pal.lanternGlow), 0.6, 4, 1.5);
      pl.position.y = -0.27;
      lg.add(pl);
      lg.userData.pointLight = pl;
    }
    return lg;
  }

  function makePond(pal) {
    const g = new THREE.Group();
    g.userData.building = "pond";

    // Water — slightly inset rectangle, low position
    const waterMat = new THREE.MeshLambertMaterial({
      color: c(pal.water),
      transparent: true,
      opacity: 0.92,
      flatShading: true,
    });
    waterMat.userData = { paletteRole: "water" };
    const water = new THREE.Mesh(
      new THREE.PlaneGeometry(6, 5, 6, 5),
      waterMat
    );
    water.rotation.x = -Math.PI / 2;
    water.position.y = 0.04;
    water.userData.building = "pond";
    water.userData.paletteRole = "water";
    water.userData.waterMesh = true;
    g.add(water);

    // Stone rim
    const rimMat = flatMat(pal.stone);
    rimMat.userData = { paletteRole: "stone" };
    const rim = (w, d, x, z) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.15, d), rimMat);
      m.position.set(x, 0.08, z);
      m.userData.paletteRole = "stone";
      m.userData.building = "pond";
      g.add(m);
    };
    rim(6.4, 0.3, 0,  2.65);
    rim(6.4, 0.3, 0, -2.65);
    rim(0.3, 5.0, 3.2, 0);
    rim(0.3, 5.0, -3.2, 0);

    // Lotus pads (8)
    const padMat = flatMat(pal.foliage);
    padMat.userData = { paletteRole: "foliage" };
    const lotusMat = flatMat(pal.wall);
    lotusMat.userData = { paletteRole: "wall" };
    const padPositions = [
      [-2, 0.07, -1.4], [-1.4, 0.07, 1.2], [0.4, 0.07, -1.0],
      [1.6, 0.07, 0.8], [2.2, 0.07, -1.6], [-0.6, 0.07, 1.7],
      [-2.4, 0.07, 0.4], [1.0, 0.07, -2.0]
    ];
    padPositions.forEach((p, i) => {
      const pad = new THREE.Mesh(
        new THREE.CircleGeometry(0.4 + (i % 3) * 0.08, 6),
        padMat
      );
      pad.rotation.x = -Math.PI / 2;
      pad.position.set(p[0], p[1], p[2]);
      pad.userData.building = "pond";
      pad.userData.paletteRole = "foliage";
      g.add(pad);
      // Lotus flower on a third of them
      if (i % 3 === 0) {
        const flower = new THREE.Mesh(
          new THREE.ConeGeometry(0.12, 0.18, 6),
          lotusMat
        );
        flower.position.set(p[0] + 0.08, p[1] + 0.1, p[2] + 0.05);
        flower.userData.building = "pond";
        flower.userData.paletteRole = "wall";
        g.add(flower);
      }
    });

    return g;
  }

  function makeKoi(pal, color) {
    const koi = new THREE.Group();
    koi.userData.koi = true;
    const bodyMat = flatMat(color);
    const body = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 6, 5),
      bodyMat
    );
    body.scale.set(1.6, 0.5, 0.7);
    koi.add(body);
    const tail = new THREE.Mesh(
      new THREE.ConeGeometry(0.12, 0.25, 4),
      bodyMat
    );
    tail.rotation.z = -Math.PI / 2;
    tail.position.x = -0.28;
    koi.add(tail);
    return koi;
  }

  function makeStudy(pal) {
    const g = new THREE.Group();
    g.userData.building = "study";

    // Stone plinth
    const plinth = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 0.3, 2.6),
      flatMat(pal.stoneLight)
    );
    plinth.position.y = 0.15;
    plinth.userData.paletteRole = "stoneLight";
    g.add(plinth);

    // Walls — front (with door), back, two sides
    const wallMat = flatMat(pal.wall);
    wallMat.userData = { paletteRole: "wall" };
    const wallDarkMat = flatMat(pal.wallDark);
    wallDarkMat.userData = { paletteRole: "wallDark" };

    // Back wall
    const back = new THREE.Mesh(
      new THREE.BoxGeometry(3.4, 1.6, 0.16),
      wallMat
    );
    back.position.set(0, 1.1, -1.2);
    back.userData.paletteRole = "wall";
    g.add(back);
    // Sides
    const left = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 1.6, 2.4),
      wallMat
    );
    left.position.set(-1.7, 1.1, 0);
    left.userData.paletteRole = "wall";
    g.add(left);
    const right = left.clone();
    right.position.set(1.7, 1.1, 0);
    right.userData.paletteRole = "wall";
    g.add(right);
    // Front wall with central door gap
    const fL = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 1.6, 0.16),
      wallMat
    );
    fL.position.set(-1.15, 1.1, 1.2);
    fL.userData.paletteRole = "wall";
    g.add(fL);
    const fR = fL.clone();
    fR.position.set(1.15, 1.1, 1.2);
    fR.userData.paletteRole = "wall";
    g.add(fR);
    const lintel = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.3, 0.18),
      wallDarkMat
    );
    lintel.position.set(0, 1.75, 1.2);
    lintel.userData.paletteRole = "wallDark";
    g.add(lintel);
    // Door interior (dark)
    const interior = new THREE.Mesh(
      new THREE.PlaneGeometry(1.2, 1.3),
      flatMat(pal.wood)
    );
    interior.position.set(0, 0.95, 1.21);
    interior.userData.paletteRole = "wood";
    g.add(interior);

    // Window slats (back side)
    const slatMat = flatMat(pal.wallDark);
    slatMat.userData = { paletteRole: "wallDark" };
    for (let i = 0; i < 3; i++) {
      const slat = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.6, 0.04),
        slatMat
      );
      slat.position.set(-0.4 + i * 0.4, 1.2, -1.13);
      slat.userData.paletteRole = "wallDark";
      g.add(slat);
    }

    // Pitched gable roof — built from two angled box slopes + 2 gable triangles
    const roofMat = new THREE.MeshLambertMaterial({
      color: c(pal.roof), flatShading: true, side: THREE.DoubleSide,
    });
    roofMat.userData = { paletteRole: "roof" };
    const W = 2.1 + 0.4;   // half-width incl. overhang
    const L = 1.6 + 0.4;   // half-depth incl. overhang
    const RH = 0.9;        // ridge height above roof base
    const slopeLen = Math.hypot(L, RH);
    // Back slope (facing -z) — a box rotated about x-axis
    const backSlope = new THREE.Mesh(
      new THREE.BoxGeometry(W * 2, 0.08, slopeLen),
      roofMat
    );
    backSlope.position.set(0, RH / 2, -L / 2);
    backSlope.rotation.x = Math.atan2(L, RH) - Math.PI / 2; // tilt so top edge is at ridge
    backSlope.userData.paletteRole = "roof";
    // Wrapper group so we can position the whole roof
    const roofGroup = new THREE.Group();
    roofGroup.position.set(0, 1.9, 0);
    roofGroup.add(backSlope);
    // Front slope (facing +z)
    const frontSlope = new THREE.Mesh(
      new THREE.BoxGeometry(W * 2, 0.08, slopeLen),
      roofMat
    );
    frontSlope.position.set(0, RH / 2, L / 2);
    frontSlope.rotation.x = -(Math.atan2(L, RH) - Math.PI / 2);
    frontSlope.userData.paletteRole = "roof";
    roofGroup.add(frontSlope);
    // Gable end-walls — vertical triangles
    const gableMat = flatMat(pal.wall);
    gableMat.userData = { paletteRole: "wall" };
    const gableGeom = new THREE.BufferGeometry();
    const gVerts = new Float32Array([
      -L * 0.85, 0, 0,    // bottom-left
       L * 0.85, 0, 0,    // bottom-right
       0, RH, 0,           // top
    ]);
    gableGeom.setAttribute("position", new THREE.BufferAttribute(gVerts, 3));
    gableGeom.setIndex([0, 1, 2]);
    gableGeom.computeVertexNormals();
    const gableMatDS = new THREE.MeshLambertMaterial({
      color: c(pal.wall), flatShading: true, side: THREE.DoubleSide,
    });
    gableMatDS.userData = { paletteRole: "wall" };
    const gL = new THREE.Mesh(gableGeom, gableMatDS);
    gL.position.set(-2.1, 0, 0);
    gL.rotation.y = Math.PI / 2;
    gL.userData.paletteRole = "wall";
    roofGroup.add(gL);
    const gR = new THREE.Mesh(gableGeom, gableMatDS);
    gR.position.set(2.1, 0, 0);
    gR.rotation.y = Math.PI / 2;
    gR.userData.paletteRole = "wall";
    roofGroup.add(gR);
    g.add(roofGroup);

    // Roof ridge trim
    const ridge = new THREE.Mesh(
      new THREE.BoxGeometry(4.4, 0.12, 0.18),
      flatMat(pal.roofTrim)
    );
    ridge.position.set(0, 1.9 + RH + 0.05, 0);
    ridge.userData.paletteRole = "roofTrim";
    g.add(ridge);
    // Ridge caps (curled-up ends, traditional touch)
    const capMat = flatMat(pal.roofTrim);
    capMat.userData = { paletteRole: "roofTrim" };
    const capL = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.32, 4), capMat);
    capL.position.set(-2.25, 1.9 + RH + 0.18, 0);
    capL.rotation.z = 0.4;
    capL.userData.paletteRole = "roofTrim";
    g.add(capL);
    const capR = capL.clone();
    capR.position.x = 2.25;
    capR.rotation.z = -0.4;
    capR.userData.paletteRole = "roofTrim";
    g.add(capR);

    g.traverse((o) => { if (o.isMesh) o.userData.building = "study"; });
    return g;
  }

  function makeCorridor(pal) {
    const g = new THREE.Group();
    g.userData.building = "corridor";

    // 6 segments along a gentle curve
    const segCount = 6;
    const segLen = 2.0;
    const colMat = flatMat(pal.column);
    colMat.userData = { paletteRole: "column" };
    const roofMat = flatMat(pal.roof);
    roofMat.userData = { paletteRole: "roof" };
    const floorMat = flatMat(pal.wood);
    floorMat.userData = { paletteRole: "wood" };

    for (let i = 0; i < segCount; i++) {
      const x = (i - (segCount - 1) / 2) * segLen;
      const z = Math.cos(i * 0.4) * 0.3; // gentle wave
      // Two columns per segment (front and back)
      for (const dz of [-0.6, 0.6]) {
        const col = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.08, 1.7, 6),
          colMat
        );
        col.position.set(x, 1.0, z + dz);
        col.userData.paletteRole = "column";
        g.add(col);
      }
      // Floor segment
      const floor = new THREE.Mesh(
        new THREE.BoxGeometry(segLen * 0.95, 0.12, 1.5),
        floorMat
      );
      floor.position.set(x, 0.18, z);
      floor.userData.paletteRole = "wood";
      g.add(floor);
      // Roof segment — flat for now with slight pitch
      const roof = new THREE.Mesh(
        new THREE.BoxGeometry(segLen * 1.05, 0.12, 1.7),
        roofMat
      );
      roof.position.set(x, 1.95, z);
      roof.userData.paletteRole = "roof";
      g.add(roof);
      // Roof crown ridge
      const crown = new THREE.Mesh(
        new THREE.BoxGeometry(segLen * 1.05, 0.06, 0.2),
        flatMat(pal.roofTrim)
      );
      crown.position.set(x, 2.04, z);
      crown.userData.paletteRole = "roofTrim";
      g.add(crown);
    }

    // A lantern on alternate segments
    for (let i = 0; i < segCount; i += 2) {
      const x = (i - (segCount - 1) / 2) * segLen;
      const z = Math.cos(i * 0.4) * 0.3;
      const lantern = makeLantern(pal);
      lantern.position.set(x, 1.85, z);
      g.add(lantern);
    }

    g.traverse((o) => { if (o.isMesh) o.userData.building = "corridor"; });
    return g;
  }

  function makeMoonGate(pal) {
    const g = new THREE.Group();
    // Ring (torus)
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.2, 0.18, 6, 18),
      flatMat(pal.wall)
    );
    ring.position.y = 1.4;
    ring.userData.paletteRole = "wall";
    g.add(ring);
    // Inner shadow disk (transparent dark)
    const inner = new THREE.Mesh(
      new THREE.CircleGeometry(1.05, 18),
      new THREE.MeshBasicMaterial({ color: c(pal.fog), transparent: true, opacity: 0.25 })
    );
    inner.position.y = 1.4;
    inner.position.z = -0.02;
    g.add(inner);
    // Wall stubs on either side
    const stubMat = flatMat(pal.wallDark);
    stubMat.userData = { paletteRole: "wallDark" };
    const sL = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.4, 0.3), stubMat);
    sL.position.set(-1.55, 0.7, 0);
    sL.userData.paletteRole = "wallDark";
    g.add(sL);
    const sR = sL.clone();
    sR.position.x = 1.55;
    sR.userData.paletteRole = "wallDark";
    g.add(sR);
    return g;
  }

  function makeBridge(pal) {
    const g = new THREE.Group();
    // Arched deck — approximate with 7 short box segments at curved heights
    const N = 9;
    const span = 3.6;
    const peak = 0.7;
    const deckMat = flatMat(pal.stoneLight);
    deckMat.userData = { paletteRole: "stoneLight" };
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1);
      const x = (t - 0.5) * span;
      const y = 0.4 + Math.sin(t * Math.PI) * peak;
      const ry = -Math.cos(t * Math.PI) * 0.5;
      const seg = new THREE.Mesh(
        new THREE.BoxGeometry(span / N + 0.05, 0.12, 1.1),
        deckMat
      );
      seg.position.set(x, y, 0);
      seg.rotation.z = ry * 0.3;
      seg.userData.paletteRole = "stoneLight";
      g.add(seg);
    }
    // Railings — two rows of small posts
    const postMat = flatMat(pal.stone);
    postMat.userData = { paletteRole: "stone" };
    for (let i = 0; i < N; i += 2) {
      const t = i / (N - 1);
      const x = (t - 0.5) * span;
      const y = 0.5 + Math.sin(t * Math.PI) * peak;
      for (const dz of [-0.5, 0.5]) {
        const post = new THREE.Mesh(
          new THREE.BoxGeometry(0.07, 0.3, 0.07),
          postMat
        );
        post.position.set(x, y + 0.15, dz);
        post.userData.paletteRole = "stone";
        g.add(post);
      }
    }
    return g;
  }

  function makePine(pal, scale = 1) {
    const g = new THREE.Group();
    // Trunk
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.12, 1.2 * scale, 5),
      flatMat(pal.wood)
    );
    trunk.position.y = 0.6 * scale;
    trunk.userData.paletteRole = "wood";
    g.add(trunk);
    // Three stacked cones
    const pineMat = flatMat(pal.pine);
    pineMat.userData = { paletteRole: "pine" };
    const cone1 = new THREE.Mesh(new THREE.ConeGeometry(0.7 * scale, 0.9 * scale, 6), pineMat);
    cone1.position.y = 1.3 * scale;
    cone1.userData.paletteRole = "pine";
    g.add(cone1);
    const cone2 = new THREE.Mesh(new THREE.ConeGeometry(0.55 * scale, 0.8 * scale, 6), pineMat);
    cone2.position.y = 1.85 * scale;
    cone2.userData.paletteRole = "pine";
    g.add(cone2);
    const cone3 = new THREE.Mesh(new THREE.ConeGeometry(0.4 * scale, 0.7 * scale, 6), pineMat);
    cone3.position.y = 2.35 * scale;
    cone3.userData.paletteRole = "pine";
    g.add(cone3);
    return g;
  }

  function makeWillow(pal, scale = 1) {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.14, 1.6 * scale, 5),
      flatMat(pal.wood)
    );
    trunk.position.y = 0.8 * scale;
    trunk.userData.paletteRole = "wood";
    g.add(trunk);
    // Bushy crown
    const willowMat = flatMat(pal.willow);
    willowMat.userData = { paletteRole: "willow" };
    const crown = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.95 * scale, 0),
      willowMat
    );
    crown.position.y = 2.0 * scale;
    crown.scale.set(1.3, 0.85, 1.3);
    crown.userData.paletteRole = "willow";
    g.add(crown);
    // Droopy strands — thin cylinders hanging down
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      const r = 0.9 * scale;
      const strand = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.005, 0.8 * scale, 4),
        willowMat
      );
      strand.position.set(Math.cos(a) * r, 1.5 * scale, Math.sin(a) * r);
      strand.userData.paletteRole = "willow";
      g.add(strand);
    }
    return g;
  }

  function makeBambooClump(pal, count = 7) {
    const g = new THREE.Group();
    const bambooMat = flatMat(pal.bamboo);
    bambooMat.userData = { paletteRole: "bamboo" };
    for (let i = 0; i < count; i++) {
      const h = 1.8 + Math.random() * 1.0;
      const stalk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.05, h, 5),
        bambooMat
      );
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * 0.6;
      stalk.position.set(Math.cos(a) * r, h / 2, Math.sin(a) * r);
      stalk.rotation.z = (Math.random() - 0.5) * 0.1;
      stalk.userData.paletteRole = "bamboo";
      g.add(stalk);
      // Top tuft
      const tuft = new THREE.Mesh(
        new THREE.ConeGeometry(0.16, 0.22, 5),
        bambooMat
      );
      tuft.position.set(stalk.position.x, h + 0.05, stalk.position.z);
      tuft.userData.paletteRole = "bamboo";
      g.add(tuft);
    }
    return g;
  }

  function makeRock(pal, size = 1, variant = 0) {
    const geom = new THREE.DodecahedronGeometry(size, 0);
    const mat = flatMat(variant ? pal.stoneLight : pal.stone);
    mat.userData = { paletteRole: variant ? "stoneLight" : "stone" };
    const rock = new THREE.Mesh(geom, mat);
    rock.scale.set(1 + Math.random() * 0.4, 0.6 + Math.random() * 0.3, 1 + Math.random() * 0.4);
    rock.rotation.y = Math.random() * Math.PI;
    rock.userData.paletteRole = variant ? "stoneLight" : "stone";
    return rock;
  }

  function makeCrane(pal) {
    const g = new THREE.Group();
    g.userData.crane = true;
    const mat = flatMat(pal.crane);
    mat.userData = { paletteRole: "crane" };
    // Body — slim, slightly tall
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.04, 0.05),
      mat
    );
    body.userData.paletteRole = "crane";
    g.add(body);
    // Neck — small protrusion forward
    const neck = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.025, 0.025),
      mat
    );
    neck.position.set(0.16, 0.015, 0);
    neck.userData.paletteRole = "crane";
    g.add(neck);
    // Wings — thin boxes at slight V angle
    const wingGeom = new THREE.BoxGeometry(0.04, 0.012, 0.32);
    const wL = new THREE.Mesh(wingGeom, mat);
    wL.position.set(0, 0.01, -0.15);
    wL.rotation.x = -0.25;
    wL.userData.paletteRole = "crane";
    g.add(wL);
    const wR = new THREE.Mesh(wingGeom, mat);
    wR.position.set(0, 0.01, 0.15);
    wR.rotation.x = 0.25;
    wR.userData.paletteRole = "crane";
    g.add(wR);
    g.userData.wings = [wL, wR];
    // Tail tip
    const tail = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.02, 0.02),
      mat
    );
    tail.position.set(-0.13, 0, 0);
    tail.userData.paletteRole = "crane";
    g.add(tail);
    return g;
  }

  // ── Ground ─────────────────────────────────────────────────────────────────
  function makeGround(pal) {
    const g = new THREE.Group();
    const groundMat = flatMat(pal.ground);
    groundMat.userData = { paletteRole: "ground" };
    // Main ground — large hexagonal disc with slight bumps
    const groundGeom = new THREE.CircleGeometry(22, 12);
    const ground = new THREE.Mesh(groundGeom, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.userData.paletteRole = "ground";
    g.add(ground);
    // Edge ring (slightly darker)
    const edgeMat = flatMat(pal.groundEdge);
    edgeMat.userData = { paletteRole: "groundEdge" };
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(20, 24, 24),
      edgeMat
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -0.01;
    ring.userData.paletteRole = "groundEdge";
    g.add(ring);

    // Footpath — a winding strip across the garden
    const pathMat = flatMat(pal.stoneLight);
    pathMat.userData = { paletteRole: "stoneLight" };
    const pathPoints = [
      [-10, 4], [-7, 3], [-4, 2.5], [-2, 3.5], [1, 4.5], [4, 4],
      [7, 3], [9, 2.5]
    ];
    for (let i = 0; i < pathPoints.length - 1; i++) {
      const [x1, z1] = pathPoints[i];
      const [x2, z2] = pathPoints[i + 1];
      const mx = (x1 + x2) / 2, mz = (z1 + z2) / 2;
      const len = Math.hypot(x2 - x1, z2 - z1);
      const ang = Math.atan2(z2 - z1, x2 - x1);
      const seg = new THREE.Mesh(
        new THREE.PlaneGeometry(len + 0.1, 0.7),
        pathMat
      );
      seg.rotation.x = -Math.PI / 2;
      seg.rotation.z = -ang;
      seg.position.set(mx, 0.02, mz);
      seg.userData.paletteRole = "stoneLight";
      g.add(seg);
    }

    // Soft shadow / earth patches under buildings — gives grounding + contrast against light bg
    const shadowMat = new THREE.MeshBasicMaterial({
      color: c(pal.groundEdge), transparent: true, opacity: 0.55, side: THREE.DoubleSide,
    });
    shadowMat.userData = { paletteRole: "groundEdge" };
    const shadowPatches = [
      [-7, -2, 3.0, 3.0],   // pavilion
      [8, -3, 4.2, 3.0],    // study
      [0, 7.5, 13, 2.2],    // corridor
    ];
    shadowPatches.forEach(([x, z, w, d]) => {
      const sh = new THREE.Mesh(
        new THREE.PlaneGeometry(w, d, 1, 1),
        shadowMat
      );
      sh.rotation.x = -Math.PI / 2;
      sh.position.set(x, 0.015, z);
      sh.userData.paletteRole = "groundEdge";
      g.add(sh);
    });

    return g;
  }

  // ── Sky gradient ──────────────────────────────────────────────────────────
  function makeSky(pal) {
    // Vertical gradient via large inverted sphere with vertex colors
    const geom = new THREE.SphereGeometry(60, 16, 12);
    geom.scale(-1, 1, 1);
    const top = c(pal.sky[0]);
    const bot = c(pal.sky[1]);
    const colors = [];
    const pos = geom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const t = THREE.MathUtils.clamp((y + 30) / 60, 0, 1);
      const col = new THREE.Color().lerpColors(bot, top, t);
      colors.push(col.r, col.g, col.b);
    }
    geom.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    const mat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide });
    const sky = new THREE.Mesh(geom, mat);
    sky.userData.skyMesh = true;
    return sky;
  }

  // ── Annotations (research direction only) ─────────────────────────────────
  function makeAnnotations(pal) {
    const g = new THREE.Group();
    g.userData.annotations = true;
    g.visible = false;

    const lineMat = new THREE.LineBasicMaterial({
      color: c(pal.accent),
      transparent: true,
      opacity: 0.55,
    });
    const lineMatFaint = new THREE.LineBasicMaterial({
      color: c(pal.accent),
      transparent: true,
      opacity: 0.22,
    });

    // North-South-East-West axes through origin
    const axisLen = 16;
    const axisGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-axisLen, 0.05, 0),
      new THREE.Vector3(axisLen, 0.05, 0),
    ]);
    const axisGeomZ = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0.05, -axisLen),
      new THREE.Vector3(0, 0.05, axisLen),
    ]);
    g.add(new THREE.Line(axisGeom, lineMatFaint));
    g.add(new THREE.Line(axisGeomZ, lineMatFaint));

    // Grid rings at 5, 10, 15 from origin
    for (const r of [5, 10, 15]) {
      const pts = [];
      const N = 48;
      for (let i = 0; i <= N; i++) {
        const a = (i / N) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a) * r, 0.04, Math.sin(a) * r));
      }
      const ringGeom = new THREE.BufferGeometry().setFromPoints(pts);
      g.add(new THREE.Line(ringGeom, lineMatFaint));
    }

    // Sightlines: short directional vectors from each building to origin
    const buildings = [
      [-7, 0.1, -2],
      [1, 0.1, 2],
      [8, 0.1, -3],
      [0, 0.1, 7.5],
    ];
    for (const [x, y, z] of buildings) {
      const target = new THREE.Vector3(0, 0.1, 0);
      const origin = new THREE.Vector3(x, y, z);
      const dir = new THREE.Vector3().subVectors(target, origin).normalize();
      const len = origin.distanceTo(target);
      const pts = [origin, origin.clone().add(dir.multiplyScalar(len * 0.55))];
      const sgGeom = new THREE.BufferGeometry().setFromPoints(pts);
      g.add(new THREE.Line(sgGeom, lineMat));
    }

    return g;
  }

  // ── Custom orbit controls (simple) ────────────────────────────────────────
  class SimpleOrbit {
    constructor(camera, dom, target) {
      this.camera = camera;
      this.dom = dom;
      this.target = target || new THREE.Vector3(0, 1.2, 0);
      // Spherical state
      const offset = new THREE.Vector3().subVectors(camera.position, this.target);
      this.radius = offset.length();
      this.theta = Math.atan2(offset.x, offset.z); // azimuth
      this.phi = Math.acos(THREE.MathUtils.clamp(offset.y / this.radius, -1, 1)); // polar
      this.minPhi = 0.35;
      this.maxPhi = 1.35;
      this.minRadius = 9;
      this.maxRadius = 28;
      this.autoRotateSpeed = 0.05;
      this.autoRotate = true;
      this.dragging = false;
      this._lastX = 0; this._lastY = 0;
      this._bind();
      this.update();
    }
    _bind() {
      const d = this.dom;
      // Active pointers keyed by id — lets one finger orbit and two fingers
      // pinch-to-zoom on touch devices.
      this._pointers = new Map();
      this._pinchDist = 0;

      d.addEventListener("pointerdown", (e) => {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        this._pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        try { d.setPointerCapture(e.pointerId); } catch {}
        if (this._pointers.size === 1) {
          this.dragging = true;
          this._dragStartX = e.clientX;
          this._dragStartY = e.clientY;
          this._lastX = e.clientX; this._lastY = e.clientY;
          this._dragMoved = false;
        } else if (this._pointers.size === 2) {
          // A second finger starts a pinch: stop the in-progress orbit and
          // mark interaction so the gesture is never read as a click.
          this.dragging = false;
          this._dragMoved = true;
          this._pinchDist = this._pointerSpread();
        }
      });
      d.addEventListener("pointermove", (e) => {
        const p = this._pointers.get(e.pointerId);
        if (!p) return;
        p.x = e.clientX; p.y = e.clientY;

        if (this._pointers.size >= 2) {
          // Pinch-to-zoom: change in finger spread maps to orbit radius.
          const dist = this._pointerSpread();
          if (this._pinchDist > 0 && dist > 0) {
            this.radius *= this._pinchDist / dist;
            this.radius = THREE.MathUtils.clamp(this.radius, this.minRadius, this.maxRadius);
            this.autoRotate = false;
            this.update();
          }
          this._pinchDist = dist;
          return;
        }

        if (!this.dragging) return;
        const dx = e.clientX - this._lastX;
        const dy = e.clientY - this._lastY;
        if (Math.hypot(e.clientX - this._dragStartX, e.clientY - this._dragStartY) > 4) {
          this._dragMoved = true;
        }
        this.theta -= dx * 0.005;
        this.phi   -= dy * 0.005;
        this.phi = THREE.MathUtils.clamp(this.phi, this.minPhi, this.maxPhi);
        this._lastX = e.clientX; this._lastY = e.clientY;
        this.autoRotate = false;
        this.update();
      });
      const endPointer = (e) => {
        if (!this._pointers.has(e.pointerId)) return;
        this._pointers.delete(e.pointerId);
        try { d.releasePointerCapture(e.pointerId); } catch {}
        if (this._pointers.size < 2) this._pinchDist = 0;
        if (this._pointers.size === 1) {
          // One finger remains after a pinch — resume orbit from where it is.
          const rem = this._pointers.values().next().value;
          this.dragging = true;
          this._dragStartX = rem.x; this._dragStartY = rem.y;
          this._lastX = rem.x; this._lastY = rem.y;
        } else if (this._pointers.size === 0) {
          this.dragging = false;
        }
      };
      d.addEventListener("pointerup", endPointer);
      d.addEventListener("pointercancel", endPointer);
      d.addEventListener("wheel", (e) => {
        e.preventDefault();
        this.radius *= 1 + (e.deltaY > 0 ? 0.06 : -0.06);
        this.radius = THREE.MathUtils.clamp(this.radius, this.minRadius, this.maxRadius);
        this.autoRotate = false;
        this.update();
      }, { passive: false });
    }
    _pointerSpread() {
      const pts = [...this._pointers.values()];
      if (pts.length < 2) return 0;
      return Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
    }
    tick(dt) {
      if (this.autoRotate) {
        this.theta += this.autoRotateSpeed * dt;
        this.update();
      }
    }
    update() {
      const sinPhi = Math.sin(this.phi);
      this.camera.position.set(
        this.target.x + this.radius * sinPhi * Math.sin(this.theta),
        this.target.y + this.radius * Math.cos(this.phi),
        this.target.z + this.radius * sinPhi * Math.cos(this.theta)
      );
      this.camera.lookAt(this.target);
    }
    didDrag() { return this._dragMoved; }
    flyTo(targetPos, lookAt, duration = 1.0) {
      // Stop autorotate, animate radius/theta/phi to land at targetPos looking at lookAt
      this.autoRotate = false;
      const startCam = this.camera.position.clone();
      const startTarget = this.target.clone();
      this._fly = {
        startCam, startTarget,
        endCam: targetPos.clone(),
        endTarget: lookAt.clone(),
        t: 0,
        duration,
      };
    }
    flyTick(dt) {
      if (!this._fly) return;
      this._fly.t += dt;
      const k = THREE.MathUtils.smoothstep(this._fly.t / this._fly.duration, 0, 1);
      this.camera.position.lerpVectors(this._fly.startCam, this._fly.endCam, k);
      this.target.lerpVectors(this._fly.startTarget, this._fly.endTarget, k);
      this.camera.lookAt(this.target);
      if (this._fly.t >= this._fly.duration) {
        // Restore spherical state from final camera position
        const offset = new THREE.Vector3().subVectors(this.camera.position, this.target);
        this.radius = offset.length();
        this.theta = Math.atan2(offset.x, offset.z);
        this.phi = Math.acos(THREE.MathUtils.clamp(offset.y / this.radius, -1, 1));
        this._fly = null;
      }
    }
  }

  // ── Scene orchestrator ────────────────────────────────────────────────────
  class GardenScene {
    constructor(container) {
      this.container = container;
      this.palette = PALETTES.ink;
      this._listeners = { click: [], hover: [] };
      this._hovered = null;
      this._paused = false;
      this._init();
    }

    on(evt, cb) {
      if (!this._listeners[evt]) this._listeners[evt] = [];
      this._listeners[evt].push(cb);
    }
    _emit(evt, payload) {
      (this._listeners[evt] || []).forEach((cb) => cb(payload));
    }

    _init() {
      const w = this.container.clientWidth;
      const h = this.container.clientHeight;
      this.scene = new THREE.Scene();
      this.scene.fog = new THREE.Fog(c(this.palette.fog), this.palette.fogNear, this.palette.fogFar);
      this.camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 200);
      this.camera.position.set(14, 9, 14);
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.setSize(w, h);
      this.renderer.setClearColor(c(this.palette.sky[1]));
      this.container.appendChild(this.renderer.domElement);

      // Lights
      this.ambient = new THREE.AmbientLight(c(this.palette.ambient), this.palette.ambientIntensity);
      this.scene.add(this.ambient);
      this.sun = new THREE.DirectionalLight(c(this.palette.sunColor), this.palette.sunIntensity);
      this.sun.position.set(...this.palette.sunDir);
      this.scene.add(this.sun);
      this.hemi = new THREE.HemisphereLight(c(this.palette.hemiTop), c(this.palette.hemiBot), 0.35);
      this.scene.add(this.hemi);

      // Sky
      this.sky = makeSky(this.palette);
      this.scene.add(this.sky);

      // Ground
      this.ground = makeGround(this.palette);
      this.scene.add(this.ground);

      // Buildings
      this.pavilion = makePavilion(this.palette);
      this.pavilion.position.set(-7, 0, -2);
      this.scene.add(this.pavilion);

      this.pond = makePond(this.palette);
      this.pond.position.set(1, 0, 2);
      this.scene.add(this.pond);

      this.study = makeStudy(this.palette);
      this.study.position.set(8, 0, -3);
      this.study.rotation.y = -0.3;
      this.scene.add(this.study);

      this.corridor = makeCorridor(this.palette);
      this.corridor.position.set(0, 0, 7.5);
      this.scene.add(this.corridor);

      // Decorations
      this.moonGate = makeMoonGate(this.palette);
      this.moonGate.position.set(-11, 0, 4);
      this.moonGate.rotation.y = 0.4;
      this.scene.add(this.moonGate);

      this.bridge = makeBridge(this.palette);
      this.bridge.position.set(-1.7, 0, 2);
      this.bridge.rotation.y = Math.PI / 2;
      this.scene.add(this.bridge);

      // Trees scattered
      const treeSpots = [
        [makePine,  [-9.5, -5.0], 1.0],
        [makePine,  [-5.0, -7.0], 1.1],
        [makePine,  [10.5, -7.0], 0.9],
        [makePine,  [5.5, -8.5], 1.05],
        [makeWillow,[3.5, -1.0], 0.95],
        [makeWillow,[-4.5, 4.5], 1.0],
        [makePine,  [12, 0], 0.85],
        [makePine,  [-12, -2], 0.8],
        [makePine,  [11, 5], 0.9],
      ];
      treeSpots.forEach(([fn, [x, z], s]) => {
        const t = fn(this.palette, s);
        t.position.set(x, 0, z);
        t.rotation.y = Math.random() * Math.PI;
        this.scene.add(t);
      });

      // Bamboo grove
      const bamboo = makeBambooClump(this.palette, 12);
      bamboo.position.set(10, 0, 1);
      this.scene.add(bamboo);
      const bamboo2 = makeBambooClump(this.palette, 8);
      bamboo2.position.set(-10, 0, 7);
      this.scene.add(bamboo2);

      // Rocks (假山) — clusters
      const rockSpots = [
        [-5, -3.5, 0.7, 0], [-4.3, -3.2, 0.5, 1], [-4.8, -2.8, 0.4, 0],
        [6, 0.5, 0.6, 0], [6.5, 0.7, 0.4, 1],
        [-2, -1.5, 0.3, 1],
        [3, -5, 0.55, 0], [3.4, -4.5, 0.4, 1],
      ];
      rockSpots.forEach(([x, z, s, v]) => {
        const r = makeRock(this.palette, s, v);
        r.position.set(x, s * 0.3, z);
        this.scene.add(r);
      });

      // Koi — each has its own slightly different orbit + wander seed
      this.koi = [];
      const koiColors = [this.palette.koi, this.palette.koiAlt, this.palette.koi, this.palette.koiAlt];
      for (let i = 0; i < 4; i++) {
        const k = makeKoi(this.palette, koiColors[i]);
        k.userData.koiPhase = (i / 4) * Math.PI * 2;
        k.userData.koiRadius = 1.2 + i * 0.35;
        k.userData.koiSpeed = 0.28 + i * 0.04;
        k.userData.koiSeed = i * 2.7;
        k.userData.prev = new THREE.Vector3(0, 0.08, 0);
        this.scene.add(k);
        this.koi.push(k);
      }
      // Ripples — small ring meshes that follow each koi
      this.koiRipples = [];
      for (let i = 0; i < 4; i++) {
        const ripple = new THREE.Mesh(
          new THREE.RingGeometry(0.18, 0.26, 12),
          new THREE.MeshBasicMaterial({
            color: c(this.palette.waterDeep),
            transparent: true, opacity: 0.35, side: THREE.DoubleSide,
          })
        );
        ripple.rotation.x = -Math.PI / 2;
        ripple.position.y = 0.06;
        ripple.userData.paletteRole = "waterDeep";
        this.scene.add(ripple);
        this.koiRipples.push(ripple);
      }

      // Cranes
      this.cranes = [];
      for (let i = 0; i < 3; i++) {
        const c1 = makeCrane(this.palette);
        c1.userData.cranePhase = (i / 3) * Math.PI * 2;
        c1.userData.craneRadius = 10 + i * 2;
        c1.userData.craneSpeed = 0.06 + i * 0.01;
        c1.userData.craneAlt = 7 + i * 0.4;
        this.scene.add(c1);
        this.cranes.push(c1);
      }

      // Annotations (research mode)
      this.annotations = makeAnnotations(this.palette);
      this.scene.add(this.annotations);

      // Collect all lanterns + their resting positions for sway animation
      this.lanterns = [];
      this.scene.traverse((o) => {
        if (o.userData && o.userData.lantern) {
          o.userData.baseY = o.position.y;
          o.userData.swaySeed = Math.random() * Math.PI * 2;
          this.lanterns.push(o);
        }
      });

      // Raycaster
      this.raycaster = new THREE.Raycaster();
      this.pointer = new THREE.Vector2();

      // Pointer tracking
      const dom = this.renderer.domElement;
      dom.addEventListener("pointermove", (e) => this._onPointerMove(e));
      dom.addEventListener("click", (e) => this._onClick(e));
      window.addEventListener("resize", () => this._onResize());

      // Controls
      this.controls = new SimpleOrbit(this.camera, dom, new THREE.Vector3(0, 1.2, 0));

      // Respect the visitor's reduced-motion preference: no idle auto-rotation,
      // and ambient animation (koi, cranes, water, lanterns) is held still.
      this.reducedMotion = !!(window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches);
      if (this.reducedMotion) this.controls.autoRotate = false;

      // Animation loop
      this._clock = new THREE.Clock();
      this._tick = this._tick.bind(this);
      this._tick();
    }

    _onResize() {
      const w = this.container.clientWidth;
      const h = this.container.clientHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    }

    _onPointerMove(e) {
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    }

    _onClick(e) {
      if (this.controls.didDrag()) return;
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const hits = this.raycaster.intersectObjects(
        [this.pavilion, this.pond, this.study, this.corridor], true
      );
      if (hits.length) {
        const b = hits[0].object.userData.building;
        if (b) {
          this._emit("click", b);
          this._flyToBuilding(b);
        }
      }
    }

    _flyToBuilding(key) {
      const positions = {
        pavilion: { target: new THREE.Vector3(-7, 1.5, -2), cam: new THREE.Vector3(-3.0, 3.0, 1.5) },
        pond:     { target: new THREE.Vector3(1, 0.3, 2),  cam: new THREE.Vector3(2.5, 3.5, 6.5) },
        study:    { target: new THREE.Vector3(8, 1.2, -3), cam: new THREE.Vector3(11.5, 3.0, 0.5) },
        corridor: { target: new THREE.Vector3(0, 1.2, 7.5),cam: new THREE.Vector3(3.5, 3.5, 11.5) },
      };
      const p = positions[key];
      if (p) this.controls.flyTo(p.cam, p.target, 1.1);
    }

    resetCamera() {
      this.controls.flyTo(new THREE.Vector3(14, 9, 14), new THREE.Vector3(0, 1.2, 0), 1.1);
      setTimeout(() => {
        if (!this.reducedMotion) this.controls.autoRotate = true;
      }, 1200);
    }

    setPaused(paused) {
      // When a section panel covers the scene the render loop idles; see _tick.
      this._paused = !!paused;
    }

    _checkHover() {
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const hits = this.raycaster.intersectObjects(
        [this.pavilion, this.pond, this.study, this.corridor], true
      );
      let hovered = null;
      if (hits.length) {
        hovered = hits[0].object.userData.building;
      }
      if (hovered !== this._hovered) {
        this._hovered = hovered;
        this.renderer.domElement.style.cursor = hovered ? "pointer" : "grab";
        this._emit("hover", hovered);
      }
    }

    _tick() {
      requestAnimationFrame(this._tick);

      // Skip the frame while a section panel covers the scene — but keep
      // rendering whenever a camera fly-through is mid-flight.
      if (this._paused && !this.controls._fly) return;

      const dt = Math.min(this._clock.getDelta(), 0.06);
      const t = this._clock.getElapsedTime();

      // Auto-rotate orbit
      this.controls.tick(dt);
      this.controls.flyTick(dt);

      // Ambient animation (koi, cranes, water, lanterns). With reduced motion
      // requested, run it once to place everything, then hold it still.
      if (!this.reducedMotion || !this._posed) {
      this._posed = true;
      // Animate koi — proper facing direction via velocity, with subtle wander
      this.koi.forEach((k, i) => {
        const prev = k.userData.prev;
        prev.copy(k.position);
        k.userData.koiPhase += k.userData.koiSpeed * dt;
        const phase = k.userData.koiPhase;
        const seed = k.userData.koiSeed;
        const r = k.userData.koiRadius;
        // Wander adds a small extra excursion that varies over time so the path isn't a perfect ellipse
        const wander = Math.sin(phase * 1.7 + seed) * 0.35 + Math.sin(phase * 0.6 + seed * 0.8) * 0.2;
        const rx = r + wander;
        const rz = r * 0.72 + wander * 0.5;
        const x = 1 + Math.cos(phase) * rx;
        const z = 2 + Math.sin(phase) * rz;
        k.position.set(x, 0.085 + Math.sin(t * 2.5 + phase * 3) * 0.012, z);
        // Face the direction we're moving (velocity vector)
        const dx = x - prev.x, dz = z - prev.z;
        if (dx * dx + dz * dz > 1e-7) {
          k.rotation.y = Math.atan2(-dz, dx);
        }
        // Subtle body sway (left/right wiggle while swimming)
        k.rotation.z = Math.sin(t * 6 + phase * 4) * 0.05;
        // Ripple trails behind koi
        if (this.koiRipples[i]) {
          const ripple = this.koiRipples[i];
          // Pulse expand/fade based on phase modulo
          const rPhase = (phase * 0.7 + seed) % 1.0;
          ripple.position.set(prev.x, 0.06, prev.z);
          const s = 0.4 + rPhase * 1.2;
          ripple.scale.set(s, s, 1);
          ripple.material.opacity = (1 - rPhase) * 0.35;
        }
      });

      // Animate cranes — face direction of flight, gentle altitude wave
      this.cranes.forEach((cr) => {
        const prevX = cr.position.x, prevZ = cr.position.z;
        cr.userData.cranePhase += cr.userData.craneSpeed * dt;
        const phase = cr.userData.cranePhase;
        const r = cr.userData.craneRadius;
        const x = Math.cos(phase) * r;
        const z = Math.sin(phase) * r * 0.85;
        cr.position.set(x, cr.userData.craneAlt + Math.sin(t * 0.45 + phase) * 0.4, z);
        // Face direction of motion
        const dx = x - prevX, dz = z - prevZ;
        if (dx * dx + dz * dz > 1e-7) {
          cr.rotation.y = Math.atan2(-dz, dx);
        }
        // Subtle banking into turns
        cr.rotation.z = Math.sin(phase) * 0.12;
        // Wing flap (around the local Z axis of each wing)
        const flap = Math.sin(t * 5 + cr.userData.cranePhase * 2) * 0.35;
        if (cr.userData.wings) {
          cr.userData.wings[0].rotation.x = -0.25 - flap;
          cr.userData.wings[1].rotation.x =  0.25 + flap;
        }
      });

      // Water surface — subtle vertex wave
      const pondWater = this.pond.children.find((m) => m.userData.waterMesh);
      if (pondWater) {
        const pos = pondWater.geometry.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i), y0 = pos.getY(i);
          pos.setZ(i, Math.sin(t * 1.2 + x * 0.6 + y0 * 0.4) * 0.04);
        }
        pos.needsUpdate = true;
      }

      // Lantern sway — gentle pendulum motion (different phase per lantern)
      if (this.lanterns) {
        this.lanterns.forEach((ln) => {
          const seed = ln.userData.swaySeed || 0;
          ln.rotation.z = Math.sin(t * 0.9 + seed) * 0.05;
          ln.rotation.x = Math.cos(t * 0.7 + seed * 1.3) * 0.04;
        });
      }
      } // end ambient animation

      // Hover check
      this._checkHover();

      this.renderer.render(this.scene, this.camera);
    }

    // ── Public API for UI ───────────────────────────────────────────────────
    setPalette(name) {
      const pal = PALETTES[name];
      if (!pal) return;
      this.palette = pal;
      // Rebuild scene contents in-place (cheap enough at this poly count)
      // Update fog, lights, sky
      this.scene.fog.color = c(pal.fog);
      this.scene.fog.near = pal.fogNear;
      this.scene.fog.far = pal.fogFar;
      this.ambient.color = c(pal.ambient);
      this.ambient.intensity = pal.ambientIntensity;
      this.sun.color = c(pal.sunColor);
      this.sun.intensity = pal.sunIntensity;
      this.sun.position.set(...pal.sunDir);
      this.hemi.color = c(pal.hemiTop);
      this.hemi.groundColor = c(pal.hemiBot);
      this.renderer.setClearColor(c(pal.sky[1]));

      // Re-bake sky vertex colors
      this._rebakeSky(pal);

      // Walk all meshes: if material has a paletteRole, retint
      this.scene.traverse((o) => {
        if (o.isMesh && o.material && o.userData.paletteRole) {
          const role = o.userData.paletteRole;
          if (role === "lantern_body") {
            o.material.color = c(pal.lantern);
            if (o.material.emissive) {
              o.material.emissive = c(pal.lanternsLit ? pal.lanternGlow : "#000000");
              o.material.emissiveIntensity = pal.lanternsLit ? 1.2 : 0;
            }
          } else if (pal[role]) {
            o.material.color = c(pal[role]);
          }
        }
      });

      // Toggle lantern point lights
      this.scene.traverse((o) => {
        if (o.userData.lantern) {
          const hasLight = !!o.userData.pointLight;
          if (pal.lanternsLit && !hasLight) {
            const pl = new THREE.PointLight(c(pal.lanternGlow), 0.6, 4, 1.5);
            pl.position.y = -0.27;
            o.add(pl);
            o.userData.pointLight = pl;
          } else if (!pal.lanternsLit && hasLight) {
            o.remove(o.userData.pointLight);
            o.userData.pointLight = null;
          } else if (hasLight) {
            o.userData.pointLight.color = c(pal.lanternGlow);
          }
        }
      });

      // Annotations visibility
      this.annotations.visible = !!pal.annotations;
      this.annotations.traverse((o) => {
        if (o.isLine && o.material) {
          o.material.color = c(pal.accent);
        }
      });

      // Force an immediate render so the new palette shows up even if RAF is throttled
      this.renderer.render(this.scene, this.camera);
    }

    _rebakeSky(pal) {
      this.scene.remove(this.sky);
      this.sky.geometry.dispose();
      this.sky.material.dispose();
      this.sky = makeSky(pal);
      this.scene.add(this.sky);
    }

    getCameraSpherical() {
      return { theta: this.controls.theta, phi: this.controls.phi, radius: this.controls.radius };
    }
  }

  window.GardenScene = GardenScene;
})();
