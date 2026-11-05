import * as THREE from "three";
import { POSTER_SLOTS } from "./anomalies.js";

export class SubwayCorridor {
  constructor(scene, texMgr) {
    this.scene = scene;
    this.texMgr = texMgr;

    this.HW = 2.3; // Corridor half-width (4.6m wide)
    this.H = 3.45; // Ceiling height

    this.posterFrames = new Map(); // slotId -> { mesh, mat, frameGroup, baseTex }
    this.inspectables = []; // Meshes for raycast hover/zoom label
    this.ceilingLights = []; // { light, tubeMat }
    this.redLightMode = false;
    this.time = 0;

    // Exit sign shared dynamic canvas
    this.signCanvas = document.createElement("canvas");
    this.signCanvas.width = 1024;
    this.signCanvas.height = 256;
    this.signTexture = new THREE.CanvasTexture(this.signCanvas);
    this.signTexture.colorSpace = THREE.SRGBColorSpace;
    this.signTexture.anisotropy = this.texMgr.maxAniso;

    // Video element for Promo TV
    this.videoEl = document.createElement("video");
    this.videoEl.src = "/ashi/promo.mov";
    this.videoEl.loop = true;
    this.videoEl.muted = true;
    this.videoEl.playsInline = true;
    this.videoEl.crossOrigin = "anonymous";
    this.videoTex = new THREE.VideoTexture(this.videoEl);
    this.videoTex.colorSpace = THREE.SRGBColorSpace;

    // Disjoint rectangles for non-overlapping floor/ceiling geometry: [minX, maxX, minZ, maxZ]
    this.floorCeilRects = [
      [-2.3, 2.3, -40.3, 2.3], // Main Hall
      [2.3, 11.7, -40.3, -35.7], // North Connector (Forward)
      [11.7, 16.3, -54.0, -35.7], // North Stub
      [-11.7, -2.3, -2.3, 2.3], // South Connector (Turn Back)
      [-16.3, -11.7, -2.3, 16.0], // South Stub
    ];

    // Full-span OVERLAPPING rectangles for player collision so all 90° corners connect seamlessly!
    this.collisionRects = [
      [-2.3, 2.3, -40.3, 2.3], // Main Hall (extends to -50.0 when Victory stairs open)
      [-2.3, 16.3, -40.3, -35.7], // Full North Connector (spans x = -2.3 to +16.3)
      [11.7, 16.3, -54.0, -35.7], // Full North Stub (spans z = -54.0 to -35.7)
      [-16.3, 2.3, -2.3, 2.3], // Full South Connector (spans x = -16.3 to +2.3)
      [-16.3, -11.7, -2.3, 16.0], // Full South Stub (spans z = -2.3 to +16.0)
    ];

    this.victoryGroup = new THREE.Group();
    this.victoryGroup.visible = false;
    this.scene.add(this.victoryGroup);

    this.buildArchitecture();
    this.buildLighting();
    this.buildExitSignsAndRules();
    this.buildPostersAndProps();
    this.buildPasserbyNPC();
    this.buildVictoryStairway();
    this.updateExitSign(0, false);
  }

  startVideo() {
    this.videoEl.play().catch(() => {});
  }

  // Build watertight non-overlapping subway tunnel geometry
  buildArchitecture() {
    const floorTex = this.texMgr.createFloorTextures(2, 22);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.34,
      metalness: 0.08,
    });

    const ceilTex = this.texMgr.createCeilingTexture(3, 26);
    const ceilMat = new THREE.MeshStandardMaterial({
      map: ceilTex,
      roughness: 0.78,
      metalness: 0.05,
    });

    const baseboardMat = new THREE.MeshStandardMaterial({
      color: 0x1e2229,
      roughness: 0.45,
      metalness: 0.2,
    });

    // Floors & Ceilings for all 5 disjoint rectangles
    for (const [x1, x2, z1, z2] of this.floorCeilRects) {
      const w = x2 - x1;
      const d = z2 - z1;
      const cx = (x1 + x2) * 0.5;
      const cz = (z1 + z2) * 0.5;

      const fGeo = new THREE.PlaneGeometry(w, d);
      fGeo.rotateX(-Math.PI / 2);
      const fMesh = new THREE.Mesh(fGeo, floorMat);
      fMesh.position.set(cx, 0, cz);
      this.scene.add(fMesh);

      const cGeo = new THREE.PlaneGeometry(w, d);
      cGeo.rotateX(Math.PI / 2);
      const cMesh = new THREE.Mesh(cGeo, ceilMat);
      cMesh.position.set(cx, this.H, cz);
      this.scene.add(cMesh);
    }

    // Yellow Tactile Paving Strip down center of halls & connectors
    const tacMat = new THREE.MeshStandardMaterial({
      map: this.texMgr.createTactileTexture(42),
      roughness: 0.45,
    });
    const addTactile = (x1, z1, x2, z2) => {
      const dx = x2 - x1,
        dz = z2 - z1;
      const len = Math.hypot(dx, dz);
      const geo = new THREE.PlaneGeometry(0.42, len);
      geo.rotateX(-Math.PI / 2);
      if (Math.abs(dx) > Math.abs(dz)) geo.rotateY(Math.PI / 2);
      const m = new THREE.Mesh(geo, tacMat);
      m.position.set((x1 + x2) * 0.5, 0.004, (z1 + z2) * 0.5);
      this.scene.add(m);
    };
    addTactile(0, 0.2, 0, -38.2);
    addTactile(-0.2, -38, 14.2, -38);
    addTactile(14, -37.8, 14, -53.5);
    addTactile(0.2, 0, -14.2, 0);
    addTactile(-14, -0.2, -14, 15.5);

    // Helper to create tiled subway wall segment from (x1, z1) to (x2, z2) facing inward normal
    const addWall = (x1, z1, x2, z2, normalX, normalZ, isVictoryEnd = false) => {
      const len = Math.hypot(x2 - x1, z2 - z1);
      const { map, bumpMap } = this.texMgr.createSubwayWallTextures(
        Math.max(1, Math.round(len * 0.9)),
        2
      );
      const mat = new THREE.MeshStandardMaterial({
        map,
        bumpMap,
        bumpScale: 0.015,
        roughness: 0.36,
        metalness: 0.04,
      });

      const geo = new THREE.PlaneGeometry(len, this.H);
      const mesh = new THREE.Mesh(geo, mat);
      const cx = (x1 + x2) * 0.5;
      const cz = (z1 + z2) * 0.5;
      mesh.position.set(cx, this.H * 0.5, cz);
      mesh.lookAt(cx + normalX, this.H * 0.5, cz + normalZ);
      this.scene.add(mesh);

      // Dark subway baseboard along bottom of wall
      const bbGeo = new THREE.BoxGeometry(len, 0.14, 0.03);
      const bb = new THREE.Mesh(bbGeo, baseboardMat);
      bb.position.set(cx + normalX * 0.012, 0.07, cz + normalZ * 0.012);
      bb.lookAt(cx + normalX * 2, 0.07, cz + normalZ * 2);
      this.scene.add(bb);

      if (isVictoryEnd) {
        this.northEndWall = mesh;
        this.northEndBaseboard = bb;
      }
    };

    // Main Hall Walls
    addWall(-2.3, -40.3, -2.3, -2.3, 1, 0); // West wall
    addWall(2.3, -35.7, 2.3, 2.3, -1, 0); // East wall
    addWall(-2.3, -40.3, 2.3, -40.3, 0, 1, true); // North cap (opens into Golden Stairway on Stage 10 Clear!)
    addWall(-2.3, 2.3, 2.3, 2.3, 0, -1); // South cap

    // North Connector Walls
    addWall(2.3, -40.3, 11.7, -40.3, 0, 1);
    addWall(2.3, -35.7, 11.7, -35.7, 0, -1);

    // North Stub Walls
    addWall(11.7, -54.0, 11.7, -40.3, 1, 0);
    addWall(16.3, -54.0, 16.3, -35.7, -1, 0);
    addWall(11.7, -35.7, 16.3, -35.7, 0, -1);
    addWall(11.7, -54.0, 16.3, -54.0, 0, 1);

    // South Connector Walls
    addWall(-11.7, -2.3, -2.3, -2.3, 0, 1);
    addWall(-11.7, 2.3, -2.3, 2.3, 0, -1);

    // South Stub Walls
    addWall(-11.7, 2.3, -11.7, 16.0, -1, 0);
    addWall(-16.3, -2.3, -16.3, 16.0, 1, 0);
    addWall(-16.3, -2.3, -11.7, -2.3, 0, 1);
    addWall(-16.3, 16.0, -11.7, 16.0, 0, -1);

    // Industrial ceiling pipes along East upper corner for authentic subway detail
    const pipeMat = new THREE.MeshStandardMaterial({
      color: 0x9aa0a6,
      roughness: 0.4,
      metalness: 0.6,
    });
    for (const py of [3.22, 3.08]) {
      const pipeGeo = new THREE.CylinderGeometry(0.045, 0.045, 38, 10);
      pipeGeo.rotateX(Math.PI / 2);
      const pipe = new THREE.Mesh(pipeGeo, pipeMat);
      pipe.position.set(2.16, py, -19);
      this.scene.add(pipe);
    }
  }

  buildLighting() {
    this.ambientLight = new THREE.AmbientLight(0xdce4f2, 1.05);
    this.scene.add(this.ambientLight);

    const hemi = new THREE.HemisphereLight(0xf2f6ff, 0x6c7078, 0.55);
    this.scene.add(hemi);

    const housingMat = new THREE.MeshStandardMaterial({
      color: 0x2b2f36,
      roughness: 0.5,
      metalness: 0.5,
    });

    const addFixture = (x, z, withPointLight = true, rotate90 = false) => {
      const g = new THREE.Group();
      g.position.set(x, this.H - 0.03, z);
      if (rotate90) g.rotation.y = Math.PI / 2;

      const housing = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.06, 1.5), housingMat);
      g.add(housing);

      const tubeMat = new THREE.MeshBasicMaterial({ color: 0xf6f9ff });
      for (const ox of [-0.09, 0.09]) {
        const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 1.42, 8), tubeMat);
        tube.rotation.x = Math.PI / 2;
        tube.position.set(ox, -0.03, 0);
        g.add(tube);
      }
      this.scene.add(g);

      let pt = null;
      if (withPointLight) {
        pt = new THREE.PointLight(0xf4f8ff, 3.2, 13.5, 1.45);
        pt.position.set(x, this.H - 0.25, z);
        this.scene.add(pt);
      }
      this.ceilingLights.push({ light: pt, tubeMat });
    };

    // Main Hall Fluorescent Fixtures
    for (const z of [-2, -8.5, -15, -21.5, -28, -34.5]) {
      addFixture(0, z, true, false);
    }
    // Connectors & Stubs
    addFixture(7, -38, true, true);
    addFixture(14, -40, false, false);
    addFixture(14, -46.5, true, false);
    addFixture(-7, 0, true, true);
    addFixture(-14, 2, false, false);
    addFixture(-14, 8.5, true, false);
  }

  buildExitSignsAndRules() {
    // 3 Identical Hanging Subway Exit Signs (Main Hall, North Stub, South Stub)
    const createHangingSign = (x, z, rotY) => {
      const group = new THREE.Group();
      group.position.set(x, 2.78, z);
      group.rotation.y = rotY;

      const rodMat = new THREE.MeshStandardMaterial({ color: 0x333842, metalness: 0.7, roughness: 0.3 });
      for (const rx of [-0.75, 0.75]) {
        const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.65, 8), rodMat);
        rod.position.set(rx, 0.36, 0);
        group.add(rod);
      }

      const box = new THREE.Mesh(
        new THREE.BoxGeometry(2.1, 0.52, 0.1),
        new THREE.MeshStandardMaterial({ color: 0x111317, roughness: 0.4 })
      );
      group.add(box);

      const signMat = new THREE.MeshBasicMaterial({ map: this.signTexture });
      const front = new THREE.Mesh(new THREE.PlaneGeometry(2.04, 0.48), signMat);
      front.position.z = 0.052;
      group.add(front);

      const back = new THREE.Mesh(new THREE.PlaneGeometry(2.04, 0.48), signMat);
      back.position.z = -0.052;
      back.rotation.y = Math.PI;
      group.add(back);

      this.scene.add(group);
    };

    createHangingSign(0, -5.0, 0); // Main Hall
    createHangingSign(14, -43.0, 0); // North Stub
    createHangingSign(-14, 5.0, Math.PI); // South Stub

    // Rules Guide Board on Entrance Left Wall (and replicated in stubs for seamlessness)
    const rulesTex = this.texMgr.createRulesBoardTexture();
    const rulesMat = new THREE.MeshBasicMaterial({ map: rulesTex });
    const placeRules = (x, z, rotY) => {
      const frame = new THREE.Group();
      frame.position.set(x, 1.72, z);
      frame.rotation.y = rotY;
      const backing = new THREE.Mesh(
        new THREE.BoxGeometry(1.18, 1.5, 0.04),
        new THREE.MeshStandardMaterial({ color: 0x111318, roughness: 0.4 })
      );
      frame.add(backing);
      const face = new THREE.Mesh(new THREE.PlaneGeometry(1.12, 1.43), rulesMat);
      face.position.z = 0.022;
      face.userData = { inspectLabel: "ป้ายกฎการออกจากอุโมงค์อชิ • คลิกขวาเพื่อซูมอ่าน" };
      this.inspectables.push(face);
      frame.add(face);
      this.scene.add(frame);
    };

    placeRules(-2.27, -4.2, Math.PI / 2);
    placeRules(11.73, -42.2, Math.PI / 2);
    placeRules(-11.73, 4.2, -Math.PI / 2);

    // Directional Turn Wayfinding Signs at Corridor Ends & Outer Corners
    const addTurnSign = (tex, x, y, z, rotY) => {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(1.75, 0.64),
        new THREE.MeshBasicMaterial({ map: tex })
      );
      m.position.set(x, y, z);
      m.rotation.y = rotY;
      this.scene.add(m);
      return m;
    };

    const forwardSignTex = this.texMgr.createDirectionSignTexture(
      "กรณีปกติดี • NO ANOMALIES",
      "เดินเลี้ยวขวาไปต่อ",
      "PROCEED TO NEXT STAGE",
      "right",
      "#4ade80"
    );
    this.northTurnSign = addTurnSign(forwardSignTex, 0, 1.72, -40.26, 0);

    const backSignTex = this.texMgr.createDirectionSignTexture(
      "กรณีเจอสิ่งผิดปกติ • ANOMALY FOUND!",
      "เลี้ยวขวาเพื่อย้อนกลับ",
      "TURN BACK IMMEDIATELY",
      "right",
      "#f87171"
    );
    addTurnSign(backSignTex, 0, 1.72, 2.26, Math.PI);

    const cornerNextTex = this.texMgr.createDirectionSignTexture(
      "NEXT CORRIDOR",
      "เลี้ยวซ้ายเข้าอุโมงค์",
      "ENTER PASSAGEWAY",
      "left",
      "#facc15"
    );
    addTurnSign(cornerNextTex, 16.26, 1.72, -38.0, -Math.PI / 2);
    addTurnSign(cornerNextTex, -16.26, 1.72, 0.0, Math.PI / 2);
  }

  updateExitSign(stageNum, isFinalExit = false) {
    this.texMgr.drawExitSignCanvas(this.signCanvas, stageNum, isFinalExit);
    this.signTexture.needsUpdate = true;
  }

  createLightboxPoster(slotId, x, y, z, rotY, width, height) {
    const meta = POSTER_SLOTS[slotId];
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.rotation.y = rotY;

    // Brushed aluminum outer lightbox bezel
    const bezel = new THREE.Mesh(
      new THREE.BoxGeometry(width + 0.14, height + 0.14, 0.06),
      new THREE.MeshStandardMaterial({
        color: 0xd4d8de,
        roughness: 0.28,
        metalness: 0.72,
      })
    );
    group.add(bezel);

    // Inner dark mat trim
    const inner = new THREE.Mesh(
      new THREE.BoxGeometry(width + 0.04, height + 0.04, 0.064),
      new THREE.MeshStandardMaterial({ color: 0x15181e, roughness: 0.5 })
    );
    group.add(inner);

    // Backlit high-clarity poster surface
    const baseTex = this.texMgr.cache.get(meta.baseUrl) || null;
    const mat = new THREE.MeshBasicMaterial({
      map: baseTex,
      color: 0xffffff,
    });
    const artMesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), mat);
    artMesh.position.z = 0.034;
    artMesh.userData = {
      slotId,
      inspectLabel: `โปสเตอร์ ${meta.number}: ${meta.title}  [คลิกขวา / F เพื่อซูม]`,
    };
    this.inspectables.push(artMesh);
    group.add(artMesh);

    // Number Plaque underneath poster
    const plaqueTex = this.texMgr.createPlaqueTexture(meta.number, meta.title, meta.subtitle);
    const plaque = new THREE.Mesh(
      new THREE.PlaneGeometry(0.76, 0.14),
      new THREE.MeshBasicMaterial({ map: plaqueTex })
    );
    plaque.position.set(0, -height * 0.5 - 0.16, 0.015);
    group.add(plaque);

    this.scene.add(group);
    this.posterFrames.set(slotId, {
      group,
      mesh: artMesh,
      mat,
      baseUrl: meta.baseUrl,
      defaultRotZ: 0,
    });
  }

  buildPostersAndProps() {
    // Left Wall (West, x = -2.26, facing East +X): 5 Landscape 4:3 Posters + Four-Arms + Promo TV
    const zPositions = [-7.6, -11.4, -15.2, -19.0, -22.8];
    ["L1", "L2", "L3", "L4", "L5"].forEach((id, idx) => {
      this.createLightboxPoster(id, -2.26, 1.74, zPositions[idx], Math.PI / 2, 1.96, 1.47);
    });

    // Right Wall (East, x = +2.26, facing West -X): 5 Portrait 3:4 Posters + Larva + Utility Door
    ["R1", "R2", "R3", "R4", "R5"].forEach((id, idx) => {
      this.createLightboxPoster(id, 2.26, 1.74, zPositions[idx], -Math.PI / 2, 1.38, 1.84);
    });

    // Special Feature Posters inside safe occluded zone
    this.createLightboxPoster("S2", -2.26, 1.74, -26.4, Math.PI / 2, 1.24, 1.86); // Four-Arms
    this.createLightboxPoster("S3", 2.26, 1.74, -26.4, -Math.PI / 2, 1.24, 1.86); // Larva

    // Overhead Valorant Gekko Banner (S1) suspended at z = -17.1
    const s1Meta = POSTER_SLOTS.S1;
    const s1Group = new THREE.Group();
    s1Group.position.set(0, 2.74, -17.1);
    const s1RodMat = new THREE.MeshStandardMaterial({ color: 0x333842, metalness: 0.7, roughness: 0.3 });
    for (const rx of [-0.88, 0.88]) {
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.7, 8), s1RodMat);
      rod.position.set(rx, 0.42, 0);
      s1Group.add(rod);
    }
    const s1Frame = new THREE.Mesh(
      new THREE.BoxGeometry(2.36, 1.16, 0.06),
      new THREE.MeshStandardMaterial({ color: 0x181c24, metalness: 0.6, roughness: 0.35 })
    );
    s1Group.add(s1Frame);
    const s1Mat = new THREE.MeshBasicMaterial({
      map: this.texMgr.cache.get(s1Meta.baseUrl) || null,
    });
    const s1Face = new THREE.Mesh(new THREE.PlaneGeometry(2.28, 1.08), s1Mat);
    s1Face.position.z = 0.033;
    s1Face.userData = {
      slotId: "S1",
      inspectLabel: "ป้ายแขวนโฆษณา: VALORANT GEKKO ASHI  [คลิกขวา / F เพื่อซูม]",
    };
    this.inspectables.push(s1Face);
    s1Group.add(s1Face);

    const s1Back = new THREE.Mesh(new THREE.PlaneGeometry(2.28, 1.08), s1Mat);
    s1Back.position.z = -0.033;
    s1Back.rotation.y = Math.PI;
    s1Group.add(s1Back);
    this.scene.add(s1Group);
    this.posterFrames.set("S1", { group: s1Group, mesh: s1Face, mat: s1Mat, baseUrl: s1Meta.baseUrl });

    // Wall-Mounted Digital Promo TV Monitor at Left Wall z = -29.5
    this.tvGroup = new THREE.Group();
    this.tvGroup.position.set(-2.25, 1.78, -29.5);
    this.tvGroup.rotation.y = Math.PI / 2;

    const tvBezel = new THREE.Mesh(
      new THREE.BoxGeometry(1.52, 1.16, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x111317, roughness: 0.3, metalness: 0.5 })
    );
    this.tvGroup.add(tvBezel);

    this.tvMat = new THREE.MeshBasicMaterial({ map: this.videoTex });
    this.tvScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.04), this.tvMat);
    this.tvScreen.position.z = 0.042;
    this.tvScreen.userData = {
      inspectLabel: "จอมอนิเตอร์ประชาสัมพันธ์อุโมงค์อชิ  [คลิกขวา / F เพื่อซูม]",
    };
    this.inspectables.push(this.tvScreen);
    this.tvGroup.add(this.tvScreen);
    this.scene.add(this.tvGroup);

    // Steel Maintenance Door + S4 Bald Ashi Warning Sign at Right Wall z = -29.5
    this.doorFrameGroup = new THREE.Group();
    this.doorFrameGroup.position.set(2.27, 0, -29.5);
    this.doorFrameGroup.rotation.y = -Math.PI / 2;

    // Dark void behind door for when door cracks open in anomaly!
    const darkVoid = new THREE.Mesh(
      new THREE.PlaneGeometry(1.16, 2.24),
      new THREE.MeshBasicMaterial({ color: 0x040406 })
    );
    darkVoid.position.set(0, 1.12, 0.005);
    this.doorFrameGroup.add(darkVoid);

    // Glowing red eyes hidden behind the door gap unless door_anomaly is active!
    this.doorEyesGroup = new THREE.Group();
    this.doorEyesGroup.position.set(0.36, 1.52, 0.02);
    this.doorEyesGroup.visible = false;
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff1e1e });
    for (const ex of [-0.045, 0.045]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), eyeMat);
      eye.position.x = ex;
      this.doorEyesGroup.add(eye);
    }
    this.doorFrameGroup.add(this.doorEyesGroup);

    const jamb = new THREE.Mesh(
      new THREE.BoxGeometry(1.28, 2.32, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.45, metalness: 0.5 })
    );
    jamb.position.set(0, 1.16, 0.01);
    this.doorFrameGroup.add(jamb);

    // Hinged door pivot at left edge (-0.58)
    this.doorPivot = new THREE.Group();
    this.doorPivot.position.set(-0.58, 0, 0.035);

    const doorLeaf = new THREE.Mesh(
      new THREE.BoxGeometry(1.16, 2.24, 0.04),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.4, metalness: 0.45 })
    );
    doorLeaf.position.set(0.58, 1.12, 0);
    this.doorPivot.add(doorLeaf);

    // Door handle
    const handle = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.035, 0.06),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85, roughness: 0.2 })
    );
    handle.position.set(1.02, 1.05, 0.04);
    this.doorPivot.add(handle);

    // S4 Bald Ashi Warning Sticker on Door
    const s4Tex = this.texMgr.cache.get(POSTER_SLOTS.S4.baseUrl) || null;
    this.doorSticker = new THREE.Mesh(
      new THREE.PlaneGeometry(0.42, 0.6),
      new THREE.MeshBasicMaterial({ map: s4Tex })
    );
    this.doorSticker.position.set(0.58, 1.56, 0.024);
    this.doorSticker.userData = {
      inspectLabel: "ประตูห้องเครื่อง: เฉพาะเจ้าหน้าที่อชิเท่านั้น",
    };
    this.inspectables.push(this.doorSticker);
    this.doorPivot.add(this.doorSticker);

    this.doorFrameGroup.add(this.doorPivot);
    this.scene.add(this.doorFrameGroup);

    // CCTV Dome Camera near ceiling
    const cctv = new THREE.Group();
    cctv.position.set(2.05, 3.28, -9.5);
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 14, 14),
      new THREE.MeshStandardMaterial({ color: 0x111318, roughness: 0.15, metalness: 0.6 })
    );
    cctv.add(dome);
    this.cctvLed = new THREE.Mesh(
      new THREE.SphereGeometry(0.018, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xff2222 })
    );
    this.cctvLed.position.set(-0.08, -0.06, 0.05);
    cctv.add(this.cctvLed);
    this.scene.add(cctv);
  }

  // Iconic Subway Passerby NPC (Walking Office Worker)
  buildPasserbyNPC() {
    this.npc = new THREE.Group();
    const suitMat = new THREE.MeshStandardMaterial({ color: 0x1e2430, roughness: 0.7 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.6 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xe6be9a, roughness: 0.65 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x16181d, roughness: 0.8 });

    // Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.64, 0.24), suitMat);
    torso.position.y = 1.16;
    this.npc.add(torso);

    const tie = new THREE.Mesh(
      new THREE.PlaneGeometry(0.12, 0.36),
      new THREE.MeshBasicMaterial({ color: 0x991b1b })
    );
    tie.position.set(0, 1.22, 0.122);
    this.npc.add(tie);

    // Normal Head Group
    this.npcHeadGroup = new THREE.Group();
    this.npcHeadGroup.position.set(0, 1.63, 0);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.27, 0.24), skinMat);
    this.npcHeadGroup.add(head);
    const hair = new THREE.Mesh(new THREE.BoxGeometry(0.255, 0.1, 0.255), hairMat);
    hair.position.y = 0.11;
    this.npcHeadGroup.add(hair);

    // Giant Cursed Ashi Billboard Head (hidden unless npc_ashi_head anomaly!)
    const ashiFaceTex = this.texMgr.cache.get("/ashi/variants/L1_var_eyes_open.jpg") || null;
    this.npcAshiHead = new THREE.Mesh(
      new THREE.BoxGeometry(0.72, 0.56, 0.52),
      new THREE.MeshBasicMaterial({ map: ashiFaceTex })
    );
    this.npcAshiHead.position.y = 0.12;
    this.npcAshiHead.visible = false;
    this.npcHeadGroup.add(this.npcAshiHead);

    this.npc.add(this.npcHeadGroup);

    // Legs & Arms
    this.npcLeftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.82, 0.18), suitMat);
    this.npcLeftLeg.position.set(-0.11, 0.42, 0);
    this.npc.add(this.npcLeftLeg);

    this.npcRightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.82, 0.18), suitMat);
    this.npcRightLeg.position.set(0.11, 0.42, 0);
    this.npc.add(this.npcRightLeg);

    this.npcLeftArm = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.58, 0.14), suitMat);
    this.npcLeftArm.position.set(-0.3, 1.12, 0);
    this.npc.add(this.npcLeftArm);

    this.npcRightArm = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.58, 0.14), suitMat);
    this.npcRightArm.position.set(0.3, 1.12, 0);
    // Briefcase in right hand
    const bag = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.28, 0.38),
      new THREE.MeshStandardMaterial({ color: 0x3b2618, roughness: 0.5 })
    );
    bag.position.set(0.05, -0.34, 0);
    this.npcRightArm.add(bag);
    this.npc.add(this.npcRightArm);

    this.npcAnomalyHead = false;
    this.resetNPC();
    this.scene.add(this.npc);
  }

  resetNPC() {
    this.npcZ = -29.8;
    this.npcActive = true;
    this.npc.position.set(0.68, 0, this.npcZ);
    this.npc.rotation.set(0, 0, 0); // Facing +Z (walking South toward player)
    this.npcHeadGroup.rotation.set(0, 0, 0);
  }

  // Sunlit Stairway to Freedom at the North End of Main Hall (x=0, z=-40.3..-52)
  buildVictoryStairway() {
    const skyMat = new THREE.MeshBasicMaterial({ color: 0xfffdf2 });
    const skyBackdrop = new THREE.Mesh(new THREE.PlaneGeometry(6.5, 7), skyMat);
    skyBackdrop.position.set(0, 4.2, -51.5);
    this.victoryGroup.add(skyBackdrop);

    const stepMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.4 });
    for (let i = 0; i < 15; i++) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(4.56, 0.22, 0.76), stepMat);
      step.position.set(0, i * 0.21 + 0.11, -40.6 - i * 0.7);
      this.victoryGroup.add(step);
    }

    // Side walls & bright golden sunlight
    const sideMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.45 });
    for (const sx of [-2.28, 2.28]) {
      const sw = new THREE.Mesh(new THREE.PlaneGeometry(12, 7.5), sideMat);
      sw.position.set(sx, 3.4, -46.0);
      sw.rotation.y = sx < 0 ? Math.PI / 2 : -Math.PI / 2;
      this.victoryGroup.add(sw);
    }

    this.sunLight = new THREE.PointLight(0xfff1b8, 28, 36, 1.0);
    this.sunLight.position.set(0, 5.6, -47.5);
    this.victoryGroup.add(this.sunLight);
  }

  openVictoryExit() {
    this.victoryGroup.visible = true;
    if (this.northEndWall) this.northEndWall.visible = false;
    if (this.northEndBaseboard) this.northEndBaseboard.visible = false;
    if (this.northTurnSign) this.northTurnSign.visible = false;
    // Extend Main Hall walkable rectangle up the sunlit stairs!
    this.collisionRects[0] = [-2.3, 2.3, -50.0, 2.3];
    this.updateExitSign(10, true);
  }

  closeVictoryExit() {
    this.victoryGroup.visible = false;
    if (this.northEndWall) this.northEndWall.visible = true;
    if (this.northEndBaseboard) this.northEndBaseboard.visible = true;
    if (this.northTurnSign) this.northTurnSign.visible = true;
    this.collisionRects[0] = [-2.3, 2.3, -40.3, 2.3];
  }

  // Apply Stage Configuration (Reset all to 100% Normal, then apply single Anomaly if any)
  async applyStageConfig(config) {
    // 1. Reset all posters to Base Texture
    for (const [, pf] of this.posterFrames.entries()) {
      const baseTex = await this.texMgr.loadPosterTexture(pf.baseUrl);
      pf.mat.map = baseTex;
      pf.mat.needsUpdate = true;
      pf.group.rotation.z = 0;
    }

    // 2. Reset TV to live video
    this.tvMat.map = this.videoTex;
    this.tvMat.needsUpdate = true;

    // 3. Reset Utility Door & Sticker
    this.doorPivot.rotation.y = 0;
    this.doorSticker.rotation.z = 0;
    this.doorEyesGroup.visible = false;

    // 4. Reset Corridor Lighting
    this.redLightMode = false;
    this.ambientLight.color.setHex(0xdce4f2);
    for (const cl of this.ceilingLights) {
      cl.tubeMat.color.setHex(0xf6f9ff);
      if (cl.light) {
        cl.light.color.setHex(0xf4f8ff);
        cl.light.intensity = 3.2;
      }
    }

    // 5. Reset Passerby NPC
    this.npcAnomalyHead = false;
    this.npcAshiHead.visible = false;
    this.resetNPC();

    if (!config.hasAnomaly || !config.anomaly) return;

    const anom = config.anomaly;

    if (anom.type === "poster" && anom.slot) {
      const pf = this.posterFrames.get(anom.slot);
      if (pf) {
        const varTex = await this.texMgr.loadPosterTexture(anom.variantUrl);
        pf.mat.map = varTex;
        pf.mat.needsUpdate = true;
      }
    } else if (anom.type === "tv_hijack") {
      const hijackTex = await this.texMgr.loadPosterTexture(anom.variantUrl);
      this.tvMat.map = hijackTex;
      this.tvMat.needsUpdate = true;
    } else if (anom.type === "env_red_lights") {
      this.redLightMode = true;
      this.ambientLight.color.setHex(0x6e141b);
      for (const cl of this.ceilingLights) {
        cl.tubeMat.color.setHex(0xff2a2a);
        if (cl.light) {
          cl.light.color.setHex(0xff1e26);
          cl.light.intensity = 3.6;
        }
      }
    } else if (anom.type === "npc_ashi_head") {
      const faceTex = await this.texMgr.loadPosterTexture("/ashi/variants/L1_var_eyes_open.jpg");
      this.npcAshiHead.material.map = faceTex;
      this.npcAshiHead.material.needsUpdate = true;
      this.npcAnomalyHead = true;
      this.npcAshiHead.visible = true;
    } else if (anom.type === "door_anomaly") {
      this.doorSticker.rotation.z = Math.PI; // Upside down Bald Ashi warning sticker!
      this.doorPivot.rotation.y = 0.24; // Door cracked slightly ajar!
      this.doorEyesGroup.visible = true; // Red eyes staring out of the dark room!
    }
  }

  update(dt, playerPos) {
    this.time += dt;

    // Blinking CCTV LED
    if (this.cctvLed) {
      this.cctvLed.visible = Math.sin(this.time * 4.2) > -0.2;
    }

    // Eerie flicker if Red Lights anomaly active
    if (this.redLightMode) {
      const flick = 0.85 + 0.35 * Math.sin(this.time * 19.0) * Math.cos(this.time * 7.3);
      for (const cl of this.ceilingLights) {
        if (cl.light) cl.light.intensity = 3.2 * flick;
      }
    }

    // Animate Passerby NPC walking calmly from z = -29.8 to z = -7.2 (strictly inside occluded zone!)
    if (this.npcActive) {
      const speed = this.npcAnomalyHead ? 1.85 : 1.32;
      if (this.npcZ < -7.2) {
        this.npcZ += speed * dt;
        this.npc.position.z = this.npcZ;
        const swing = Math.sin(this.time * (this.npcAnomalyHead ? 9.5 : 6.8)) * 0.42;
        this.npcLeftLeg.rotation.x = swing;
        this.npcRightLeg.rotation.x = -swing;
        this.npcLeftArm.rotation.x = -swing * 0.7;
        this.npcRightArm.rotation.x = swing * 0.45;
      } else {
        this.npcLeftLeg.rotation.x = 0;
        this.npcRightLeg.rotation.x = 0;
        this.npcLeftArm.rotation.x = 0;
        this.npcRightArm.rotation.x = 0;
      }

      if (this.npcAnomalyHead && playerPos) {
        // Eerily turn giant Ashi head to track player!
        const dx = playerPos.x - this.npc.position.x;
        const dz = playerPos.z - this.npc.position.z;
        const targetYaw = Math.atan2(dx, dz);
        this.npcHeadGroup.rotation.y = targetYaw;
      }
    }
  }

  // Smooth circle-vs-union-of-overlapping-rectangles collision resolver
  clampPlayerPosition(pos, radius = 0.45) {
    let bestX = pos.x;
    let bestZ = pos.z;
    let bestDistSq = Infinity;

    for (const [x1, x2, z1, z2] of this.collisionRects) {
      const cx = Math.max(x1 + radius, Math.min(x2 - radius, pos.x));
      const cz = Math.max(z1 + radius, Math.min(z2 - radius, pos.z));
      const dx = pos.x - cx;
      const dz = pos.z - cz;
      const d2 = dx * dx + dz * dz;
      if (d2 < bestDistSq) {
        bestDistSq = d2;
        bestX = cx;
        bestZ = cz;
      }
    }

    pos.x = bestX;
    pos.z = bestZ;
  }
}
