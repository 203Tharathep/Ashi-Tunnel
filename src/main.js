import * as THREE from "three";
import { ANOMALIES, DIFFICULTY_TIERS, POSTER_SLOTS, StageDirector } from "./anomalies.js";
import { TunnelAudio } from "./audio.js";
import { TextureManager } from "./textures.js";
import { SubwayCorridor } from "./corridor.js";

const STORAGE_KEY = "ashi_tunnel_discovered_v1";

class AshiTunnelGame {
  constructor() {
    this.container = document.getElementById("canvas-container");
    this.audio = new TunnelAudio();
    this.director = new StageDirector();

    // Persistent discovered anomalies
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      this.discovered = new Set(Array.isArray(saved) ? saved : []);
    } catch {
      this.discovered = new Set();
    }

    // Detect touch / mobile / iPad capability
    this.isTouchDevice =
      window.matchMedia?.("(pointer: coarse)")?.matches ||
      navigator.maxTouchPoints > 0 ||
      "ontouchstart" in window;

    // Game State
    this.state = "LOADING"; // LOADING | TITLE | PLAYING | PAUSED | GALLERY | VICTORY
    this.gameMode = "classic"; // "classic" | "checkpoint"
    this.stage = 0;
    this.currentConfig = { stageNum: 0, hasAnomaly: false, anomaly: null };
    this.decisionCommitted = null; // null | "forward" | "backward"
    this.victoryUnlocked = false;
    this.mistakesCount = 0;
    this.runStartTime = 0;

    // Player Physics & Camera
    this.eyeHeight = 1.66;
    this.playerPos = new THREE.Vector3(0, this.eyeHeight, -2.6);
    this.yaw = 0; // 0 = looking North (-Z)
    this.pitch = 0;
    this.quickTurnRemaining = 0;
    this.sensitivity = 1.0;
    this.isZoomed = false;
    this.baseFov = 68;
    this.zoomFov = 27;
    this.bobTimer = 0;
    this.lastBobSin = 0;

    // Keyboard & Mouse Input State
    this.keys = new Set();
    this.isDragging = false;
    this.flashlightOn = false;

    // Touch Input State (Mobile & iPad)
    this.joyTouchId = null;
    this.joyOrigin = { x: 0, y: 0 };
    this.joyVec = { x: 0, y: 0 }; // x: right [-1..1], y: forward [-1..1]
    this.joyMag = 0;
    this.lookTouchId = null;
    this.lookLast = { x: 0, y: 0 };
    this.touchSprintToggle = false;

    this.initThree();
    this.bindUI();
    this.bindInputs();
    this.bindTouchControls();
    this.setTouchUIVisible(this.isTouchDevice);
    this.preloadAll();

    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.screenCenter = new THREE.Vector2(0, 0);

    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  initThree() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0d1016);
    this.scene.fog = new THREE.FogExp2(0x131720, 0.022);

    this.camera = new THREE.PerspectiveCamera(
      this.baseFov,
      window.innerWidth / window.innerHeight,
      0.08,
      90
    );
    this.camera.rotation.order = "YXZ";

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.06;
    this.container.appendChild(this.renderer.domElement);

    // Optional handheld flashlight attached to camera
    this.flashlight = new THREE.SpotLight(0xffffff, 0, 22, Math.PI / 5.5, 0.45, 1.2);
    this.flashlight.position.set(0, 0, 0);
    this.flashlightTarget = new THREE.Object3D();
    this.flashlightTarget.position.set(0, 0, -5);
    this.camera.add(this.flashlight);
    this.camera.add(this.flashlightTarget);
    this.flashlight.target = this.flashlightTarget;
    this.scene.add(this.camera);

    this.texMgr = new TextureManager(this.renderer);

    window.addEventListener("resize", () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  setTouchUIVisible(show) {
    this.touchUIEnabled = Boolean(show);
    const tc = document.getElementById("touch-controls");
    const chk = document.getElementById("toggle-touch-ui");
    if (tc) tc.classList.toggle("hidden", !this.touchUIEnabled);
    if (chk) chk.checked = this.touchUIEnabled;
    document.body.classList.toggle("touch-enabled", this.touchUIEnabled);
  }

  async preloadAll() {
    const fillEl = document.getElementById("loading-bar-fill");
    const txtEl = document.getElementById("loading-text");
    const startBtn = document.getElementById("btn-start");

    const baseUrls = Object.values(POSTER_SLOTS).map((s) => s.baseUrl);
    const warmupUrls = [...baseUrls, "/ashi/variants/L1_var_eyes_open.jpg"];

    await this.texMgr.preloadList(warmupUrls, (done, total) => {
      const pct = Math.round((done / total) * 100);
      fillEl.style.width = `${pct}%`;
      txtEl.textContent = `กำลังโหลดภาพโปสเตอร์เข้าสู่อุโมงค์... ${pct}%`;
    });

    this.corridor = new SubwayCorridor(this.scene, this.texMgr);
    await this.corridor.applyStageConfig(this.currentConfig);

    // Warm-preload remaining variants quietly in background
    const variantUrls = ANOMALIES.filter((a) => a.variantUrl).map((a) => a.variantUrl);
    this.texMgr.preloadList(variantUrls);

    txtEl.textContent = "พร้อมเข้าสู่อุโมงค์สถานีอชิ 100%!";
    startBtn.disabled = false;
    startBtn.textContent = "🚪 ก้าวเข้าสู่อุโมงค์ (เริ่มที่ทางออก 0)";
    this.state = "TITLE";
    this.updateDiscoveredHUD();

    const params = new URLSearchParams(window.location.search);
    if (params.get("autostart") === "1") {
      if (params.get("touch") === "1") this.setTouchUIVisible(true);
      await this.startNewRun();
      const zParam = parseFloat(params.get("z") || "-3.2");
      const yawParam = parseFloat(params.get("yaw") || "0");
      this.playerPos.set(0, this.eyeHeight, zParam);
      this.yaw = yawParam;
    }
  }

  bindUI() {
    const cardClassic = document.getElementById("mode-card-classic");
    const cardCheck = document.getElementById("mode-card-checkpoint");
    document.querySelectorAll('input[name="gamemode"]').forEach((radio) => {
      radio.addEventListener("change", (e) => {
        this.gameMode = e.target.value;
        cardClassic.classList.toggle("selected", this.gameMode === "classic");
        cardCheck.classList.toggle("selected", this.gameMode === "checkpoint");
      });
    });

    document.getElementById("btn-start").addEventListener("click", () => {
      this.startNewRun();
    });

    document.getElementById("btn-resume").addEventListener("click", () => {
      this.resumeGame();
    });

    document.getElementById("btn-restart").addEventListener("click", () => {
      this.startNewRun();
    });

    document.getElementById("btn-back-title").addEventListener("click", () => {
      this.exitPointerLock();
      this.resetTouchJoystick();
      document.getElementById("pause-screen").classList.add("hidden");
      document.getElementById("hud").classList.add("hidden");
      document.getElementById("title-screen").classList.remove("hidden");
      this.state = "TITLE";
    });

    document.getElementById("btn-play-again").addEventListener("click", () => {
      const vv = document.getElementById("victory-video");
      vv.pause();
      document.getElementById("victory-screen").classList.add("hidden");
      this.startNewRun();
    });

    // Sensitivity Slider & Touch UI Toggle
    const sensSlider = document.getElementById("sens-slider");
    const sensVal = document.getElementById("sens-val");
    sensSlider.addEventListener("input", () => {
      this.sensitivity = parseFloat(sensSlider.value);
      sensVal.textContent = this.sensitivity.toFixed(1);
    });

    document.getElementById("toggle-touch-ui").addEventListener("change", (e) => {
      this.setTouchUIVisible(e.target.checked);
    });

    // Top-Right Interactive HUD Buttons (for both Touch & Mouse!)
    const openGal = (returnState) => {
      this.galleryReturnState = returnState;
      this.exitPointerLock();
      this.resetTouchJoystick();
      this.renderGallery();
      document.getElementById("gallery-modal").classList.remove("hidden");
      this.state = "GALLERY";
    };

    document.getElementById("btn-hud-gallery").addEventListener("click", () => {
      if (this.state === "PLAYING") openGal("PLAYING");
    });

    document.getElementById("btn-hud-mute").addEventListener("click", () => {
      this.toggleMute();
    });

    document.getElementById("btn-hud-pause").addEventListener("click", () => {
      if (this.state === "PLAYING") this.pauseGame();
    });

    document.getElementById("btn-open-gallery-title").addEventListener("click", () => openGal("TITLE"));
    document.getElementById("btn-open-gallery-pause").addEventListener("click", () => openGal("PAUSED"));
    document.getElementById("btn-vic-gallery").addEventListener("click", () => openGal("VICTORY"));
    document.getElementById("btn-close-gallery").addEventListener("click", () => {
      document.getElementById("gallery-modal").classList.add("hidden");
      this.state = this.galleryReturnState || "TITLE";
      if (this.state === "PLAYING" && !this.touchUIEnabled) {
        this.requestLock();
      }
    });
  }

  toggleMute() {
    this.audio.setMuted(!this.audio.muted);
    document.getElementById("btn-hud-mute").textContent = this.audio.muted ? "🔇" : "🔊";
    this.showToast(this.audio.muted ? "🔇 ปิดเสียงแล้ว" : "🔊 เปิดเสียงแล้ว", "#38bdf8");
  }

  setZoom(active) {
    if (this.isZoomed === active) return;
    this.isZoomed = active;
    document.getElementById("zoom-overlay").classList.toggle("hidden", !active);
    document.getElementById("btn-touch-zoom")?.classList.toggle("active", active);
    this.audio.playZoom(active);
  }

  toggleFlashlight() {
    this.flashlightOn = !this.flashlightOn;
    this.flashlight.intensity = this.flashlightOn ? 4.5 : 0;
    document.getElementById("btn-touch-light")?.classList.toggle("active", this.flashlightOn);
    this.showToast(this.flashlightOn ? "🔦 เปิดไฟฉายส่องภาพ" : "🔦 ปิดไฟฉาย", "#facc15");
  }

  triggerQuickTurn180() {
    if (this.quickTurnRemaining <= 0.05) {
      this.quickTurnRemaining = Math.PI;
    }
  }

  bindInputs() {
    window.addEventListener("keydown", (e) => {
      this.keys.add(e.code);

      if (e.code === "KeyM") {
        this.toggleMute();
      }

      if (this.state === "PLAYING") {
        if (e.code === "KeyF" || e.code === "Space") {
          this.setZoom(true);
        }
        if (e.code === "KeyR") {
          this.triggerQuickTurn180();
        }
        if (e.code === "KeyL") {
          this.toggleFlashlight();
        }
        if (e.code === "KeyG") {
          document.getElementById("btn-hud-gallery").click();
        }
        if (e.code === "Escape") {
          this.pauseGame();
        }
      } else if (this.state === "GALLERY" && e.code === "Escape") {
        document.getElementById("btn-close-gallery").click();
      } else if (this.state === "PAUSED" && e.code === "Escape") {
        this.resumeGame();
      }
    });

    window.addEventListener("keyup", (e) => {
      this.keys.delete(e.code);
      if (e.code === "KeyF" || e.code === "Space") {
        this.setZoom(false);
      }
    });

    // Desktop Mouse PointerLock + Drag fallback + Right-Click Zoom
    this.renderer.domElement.addEventListener("mousedown", (e) => {
      if (this.state !== "PLAYING") return;
      if (e.button === 2) {
        this.setZoom(true);
      } else if (e.button === 0 && !this.touchUIEnabled) {
        if (document.pointerLockElement !== this.renderer.domElement) {
          this.requestLock();
        }
        this.isDragging = true;
      }
    });

    window.addEventListener("mouseup", (e) => {
      if (e.button === 2 && this.isZoomed) {
        this.setZoom(false);
      }
      if (e.button === 0) {
        this.isDragging = false;
      }
    });

    window.addEventListener("contextmenu", (e) => e.preventDefault());

    window.addEventListener("mousemove", (e) => {
      if (this.state !== "PLAYING") return;
      const locked = document.pointerLockElement === this.renderer.domElement;
      if (!locked && !this.isDragging) return;

      const zoomScale = this.isZoomed ? 0.42 : 1.0;
      const factor = 0.0021 * this.sensitivity * zoomScale;
      this.yaw -= e.movementX * factor;
      this.pitch -= e.movementY * factor;
      this.pitch = Math.max(-Math.PI * 0.46, Math.min(Math.PI * 0.46, this.pitch));
    });

    document.addEventListener("pointerlockchange", () => {
      if (
        this.state === "PLAYING" &&
        !this.touchUIEnabled &&
        document.pointerLockElement !== this.renderer.domElement &&
        !this.victoryUnlocked
      ) {
        this.pauseGame();
      }
    });
  }

  // =====================================================================
  // Mobile & iPad Multi-Touch Controls (Virtual Analog Stick + Touch Look)
  // =====================================================================
  bindTouchControls() {
    // Auto-reveal touch controls if user touches screen on a hybrid device
    window.addEventListener(
      "touchstart",
      () => {
        if (!this.touchUIEnabled) {
          this.setTouchUIVisible(true);
        }
      },
      { passive: true, once: true }
    );

    const joyZone = document.getElementById("touch-joystick-zone");
    const joyBase = document.getElementById("joystick-base");
    const joyKnob = document.getElementById("joystick-knob");
    const lookZone = document.getElementById("touch-look-zone");

    const updateJoystickFromPoint = (clientX, clientY) => {
      const maxR = 46;
      const dx = clientX - this.joyOrigin.x;
      const dy = clientY - this.joyOrigin.y;
      const dist = Math.hypot(dx, dy);
      const clamped = Math.min(maxR, dist);
      const angle = Math.atan2(dy, dx);
      const kx = Math.cos(angle) * clamped;
      const ky = Math.sin(angle) * clamped;

      joyKnob.style.transform = `translate(calc(-50% + ${kx}px), calc(-50% + ${ky}px))`;
      this.joyVec.x = kx / maxR; // +1 = strafe right
      this.joyVec.y = -ky / maxR; // +1 = walk forward
      this.joyMag = clamped / maxR;
    };

    joyZone.addEventListener(
      "touchstart",
      (e) => {
        if (this.state !== "PLAYING") return;
        e.preventDefault();
        this.audio.init();
        for (const t of e.changedTouches) {
          if (this.joyTouchId === null) {
            this.joyTouchId = t.identifier;
            const rect = joyBase.getBoundingClientRect();
            this.joyOrigin.x = rect.left + rect.width * 0.5;
            this.joyOrigin.y = rect.top + rect.height * 0.5;
            updateJoystickFromPoint(t.clientX, t.clientY);
            break;
          }
        }
      },
      { passive: false }
    );

    joyZone.addEventListener(
      "touchmove",
      (e) => {
        if (this.joyTouchId === null) return;
        e.preventDefault();
        for (const t of e.changedTouches) {
          if (t.identifier === this.joyTouchId) {
            updateJoystickFromPoint(t.clientX, t.clientY);
            break;
          }
        }
      },
      { passive: false }
    );

    const endJoy = (e) => {
      if (this.joyTouchId === null) return;
      for (const t of e.changedTouches) {
        if (t.identifier === this.joyTouchId) {
          this.resetTouchJoystick();
          break;
        }
      }
    };
    joyZone.addEventListener("touchend", endJoy);
    joyZone.addEventListener("touchcancel", endJoy);

    // Right Half Touch Camera Look
    lookZone.addEventListener(
      "touchstart",
      (e) => {
        if (this.state !== "PLAYING") return;
        e.preventDefault();
        this.audio.init();
        for (const t of e.changedTouches) {
          if (this.lookTouchId === null) {
            this.lookTouchId = t.identifier;
            this.lookLast.x = t.clientX;
            this.lookLast.y = t.clientY;
            break;
          }
        }
      },
      { passive: false }
    );

    lookZone.addEventListener(
      "touchmove",
      (e) => {
        if (this.lookTouchId === null || this.state !== "PLAYING") return;
        e.preventDefault();
        for (const t of e.changedTouches) {
          if (t.identifier === this.lookTouchId) {
            const dx = t.clientX - this.lookLast.x;
            const dy = t.clientY - this.lookLast.y;
            this.lookLast.x = t.clientX;
            this.lookLast.y = t.clientY;

            const zoomScale = this.isZoomed ? 0.42 : 1.0;
            const factor = 0.0046 * this.sensitivity * zoomScale;
            this.yaw -= dx * factor;
            this.pitch -= dy * factor;
            this.pitch = Math.max(-Math.PI * 0.46, Math.min(Math.PI * 0.46, this.pitch));
            break;
          }
        }
      },
      { passive: false }
    );

    const endLook = (e) => {
      if (this.lookTouchId === null) return;
      for (const t of e.changedTouches) {
        if (t.identifier === this.lookTouchId) {
          this.lookTouchId = null;
          break;
        }
      }
    };
    lookZone.addEventListener("touchend", endLook);
    lookZone.addEventListener("touchcancel", endLook);

    // Touch Action Cluster Buttons
    document.getElementById("btn-touch-zoom").addEventListener("click", (e) => {
      e.stopPropagation();
      this.setZoom(!this.isZoomed);
    });

    document.getElementById("btn-touch-turn").addEventListener("click", (e) => {
      e.stopPropagation();
      this.triggerQuickTurn180();
    });

    document.getElementById("btn-touch-sprint").addEventListener("click", (e) => {
      e.stopPropagation();
      this.touchSprintToggle = !this.touchSprintToggle;
      document.getElementById("btn-touch-sprint").classList.toggle("active", this.touchSprintToggle);
      this.showToast(this.touchSprintToggle ? "🏃 เปิดโหมดวิ่งเร็ว" : "🚶 โหมดเดินปกติ", "#38bdf8");
    });

    document.getElementById("btn-touch-light").addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggleFlashlight();
    });
  }

  resetTouchJoystick() {
    this.joyTouchId = null;
    this.joyVec.x = 0;
    this.joyVec.y = 0;
    this.joyMag = 0;
    const joyKnob = document.getElementById("joystick-knob");
    if (joyKnob) {
      joyKnob.style.transform = "translate(-50%, -50%)";
    }
  }

  requestLock() {
    if (this.touchUIEnabled) return;
    try {
      this.renderer.domElement.requestPointerLock?.();
    } catch {}
  }

  exitPointerLock() {
    if (document.pointerLockElement) {
      document.exitPointerLock?.();
    }
  }

  async startNewRun() {
    this.audio.init();
    this.corridor.startVideo();
    this.corridor.closeVictoryExit();

    this.director.resetRun();
    this.stage = 0;
    this.mistakesCount = 0;
    this.victoryUnlocked = false;
    this.decisionCommitted = null;
    this.quickTurnRemaining = 0;
    this.runStartTime = performance.now();

    this.currentConfig = this.director.nextStageConfig(0);
    await this.corridor.applyStageConfig(this.currentConfig);
    this.corridor.updateExitSign(0, false);
    this.audio.setEerieMode(false);

    // Spawn at South entrance of Main Hall looking North (-Z)
    this.playerPos.set(0, this.eyeHeight, -2.6);
    this.yaw = 0;
    this.pitch = 0;
    this.setZoom(false);
    this.resetTouchJoystick();
    document.getElementById("fx-sunlight").style.opacity = "0";
    document.getElementById("mistake-card").classList.add("hidden");

    document.getElementById("title-screen").classList.add("hidden");
    document.getElementById("pause-screen").classList.add("hidden");
    document.getElementById("victory-screen").classList.add("hidden");
    document.getElementById("hud").classList.remove("hidden");

    document.getElementById("hud-mode-pill").textContent =
      this.gameMode === "classic" ? "🔥 โหมด Exit 8 ต้นฉบับ" : "🛡️ โหมดปราณี (Checkpoint)";

    this.updateStageHUD();
    this.state = "PLAYING";
    if (!this.touchUIEnabled) {
      this.requestLock();
    }
  }

  pauseGame() {
    if (this.state !== "PLAYING") return;
    this.state = "PAUSED";
    this.keys.clear();
    this.resetTouchJoystick();
    this.setZoom(false);
    document.getElementById("pause-screen").classList.remove("hidden");
  }

  resumeGame() {
    document.getElementById("pause-screen").classList.add("hidden");
    this.state = "PLAYING";
    if (!this.touchUIEnabled) {
      this.requestLock();
    }
  }

  unlockAnomaly(anomId) {
    if (!anomId) return;
    if (!this.discovered.has(anomId)) {
      this.discovered.add(anomId);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...this.discovered]));
      } catch {}
      this.updateDiscoveredHUD();
    }
  }

  updateDiscoveredHUD() {
    document.getElementById("hud-discovered-count").textContent = String(this.discovered.size);
  }

  updateStageHUD() {
    const stageText = document.getElementById("hud-stage-text");
    const starsEl = document.getElementById("hud-diff-stars");
    const labelEl = document.getElementById("hud-diff-label");
    const banner0 = document.getElementById("stage0-banner");

    if (this.victoryUnlocked) {
      stageText.textContent = "ทางออก 10 เปิดแล้ว!";
      starsEl.textContent = "☀️☀️☀️☀️☀️";
      labelEl.textContent = "เดินตรงไปขึ้นบันไดสู่แสงสว่างด้านหน้า!";
      banner0.classList.add("hidden");
      return;
    }

    stageText.textContent = `ทางออก ${this.stage} / 10`;
    const meta = DIFFICULTY_TIERS[Math.min(10, this.stage)];
    starsEl.textContent = meta.stars;
    labelEl.textContent = meta.label;
    banner0.classList.toggle("hidden", this.stage !== 0);
  }

  showToast(msg, bg = "#22c55e") {
    const el = document.getElementById("feedback-toast");
    el.textContent = msg;
    el.style.background = bg;
    el.classList.remove("hidden");
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => el.classList.add("hidden"), 2800);
  }

  flashScreen(colorCss) {
    const fx = document.getElementById("fx-flash");
    fx.style.background = colorCss;
    fx.style.opacity = "0.52";
    setTimeout(() => {
      fx.style.opacity = "0";
    }, 220);
  }

  showMistakeReveal(prevConfig, choseAnomaly) {
    const card = document.getElementById("mistake-card");
    const titleEl = document.getElementById("mistake-title");
    const descEl = document.getElementById("mistake-desc");
    const compareEl = document.getElementById("mistake-compare");
    const imgBase = document.getElementById("mistake-img-base");
    const imgVar = document.getElementById("mistake-img-var");
    const ring = document.getElementById("mistake-focus-ring");
    const wrap = document.getElementById("mistake-anom-wrap");

    clearTimeout(this.mistakeTimeout);

    if (!prevConfig.hasAnomaly && choseAnomaly) {
      titleEl.textContent = "✗ พลาด! ทางเดินเมื่อกี้ปกติดีทุกอย่าง!";
      descEl.textContent =
        this.stage === 0
          ? "ระแวงเกินไป! เมื่อไม่พบสิ่งผิดปกติ ต้องเดินตรงไปสุดทางแล้วเลี้ยวขวานะ!"
          : `คุณหันหลังกลับทั้งที่ไม่มีความผิดปกติ! (ถอยกลับมาที่ ทางออก ${this.stage})`;
      compareEl.classList.add("hidden");
      card.classList.remove("hidden");
      this.mistakeTimeout = setTimeout(() => card.classList.add("hidden"), 5500);
      return;
    }

    const anom = prevConfig.anomaly;
    if (!anom) return;
    this.unlockAnomaly(anom.id);

    titleEl.textContent = `✗ พลาด! คุณมองข้าม: ${anom.title}`;
    descEl.textContent = anom.desc;

    if ((anom.type === "poster" && anom.slot) || anom.type === "tv_hijack") {
      compareEl.classList.remove("hidden");
      const baseSrc =
        anom.type === "poster" ? POSTER_SLOTS[anom.slot].baseUrl : "/ashi/base/L1_sleep.jpg";
      imgBase.src = baseSrc;
      imgVar.src = anom.variantUrl;

      imgVar.onload = () => {
        if (!anom.focus) {
          ring.classList.add("hidden");
          return;
        }
        ring.classList.remove("hidden");
        const boxW = wrap.clientWidth || 185;
        const boxH = wrap.clientHeight || 140;
        const imgAsp = (imgVar.naturalWidth || 4) / (imgVar.naturalHeight || 3);
        const boxAsp = boxW / boxH;
        let drawW = boxW,
          drawH = boxH,
          offX = 0,
          offY = 0;
        if (imgAsp > boxAsp) {
          drawH = boxW / imgAsp;
          offY = (boxH - drawH) * 0.5;
        } else {
          drawW = boxH * imgAsp;
          offX = (boxW - drawW) * 0.5;
        }
        ring.style.left = `${offX + anom.focus[0] * drawW}px`;
        ring.style.top = `${offY + anom.focus[1] * drawH}px`;
      };
    } else {
      compareEl.classList.add("hidden");
    }

    card.classList.remove("hidden");
    this.mistakeTimeout = setTimeout(() => card.classList.add("hidden"), 7500);
  }

  // Called synchronously once player crosses |x| > 7.5 inside North or South connector
  commitCorridorChoice(direction) {
    if (this.decisionCommitted || this.victoryUnlocked) return;
    this.decisionCommitted = direction;

    const prevConfig = this.currentConfig;
    const playerSaidAnomaly = direction === "backward";
    const isCorrect =
      prevConfig.stageNum === 0
        ? direction === "forward"
        : prevConfig.hasAnomaly === playerSaidAnomaly;

    if (prevConfig.hasAnomaly && prevConfig.anomaly) {
      this.unlockAnomaly(prevConfig.anomaly.id);
    }

    if (isCorrect) {
      document.getElementById("mistake-card").classList.add("hidden");
      if (this.stage >= 10) {
        // CLEARED ALL 10 STAGES!! Open the Golden Stairway at the end of Main Hall!
        this.victoryUnlocked = true;
        this.audio.playVictory();
        this.audio.setEerieMode(false);
        this.corridor.openVictoryExit();
        this.updateStageHUD();
        this.showToast("🎉 ผ่านครบ 10 ด่าน! เดินตรงไปขึ้นบันไดสู่แสงสว่าง!", "#fde047");
        this.corridor.applyStageConfig({ stageNum: 10, hasAnomaly: false, anomaly: null });
        return;
      }

      this.stage += 1;
      this.audio.playCorrectChime(this.stage);
      this.flashScreen("rgba(74, 222, 128, 0.22)");
      this.currentConfig = this.director.nextStageConfig(this.stage);
      this.corridor.updateExitSign(this.stage, false);
      this.audio.setEerieMode(
        this.stage >= 8 || this.currentConfig.anomaly?.type === "env_red_lights"
      );
      this.updateStageHUD();
      this.showToast(`✓ ถูกต้อง! เข้าสู่ ทางออก ${this.stage} / 10`, "#4ade80");
      this.corridor.applyStageConfig(this.currentConfig);
    } else {
      // WRONG CHOICE!
      this.mistakesCount += 1;
      this.audio.playWrongBuzz();
      this.flashScreen("rgba(239, 68, 68, 0.55)");

      if (this.gameMode === "classic") {
        this.stage = 0;
        this.director.resetRun();
      } else {
        this.stage = Math.max(0, this.stage - 1);
      }

      this.showMistakeReveal(prevConfig, playerSaidAnomaly);

      this.currentConfig = this.director.nextStageConfig(this.stage);
      this.corridor.updateExitSign(this.stage, false);
      this.audio.setEerieMode(
        this.stage >= 8 || this.currentConfig.anomaly?.type === "env_red_lights"
      );
      this.updateStageHUD();
      this.corridor.applyStageConfig(this.currentConfig);
    }
  }

  triggerFinalVictoryScreen() {
    if (this.state === "VICTORY") return;
    this.state = "VICTORY";
    this.exitPointerLock();
    this.resetTouchJoystick();

    const elapsedSec = Math.floor((performance.now() - this.runStartTime) / 1000);
    const mm = String(Math.floor(elapsedSec / 60)).padStart(2, "0");
    const ss = String(elapsedSec % 60).padStart(2, "0");

    document.getElementById("vic-time").textContent = `${mm}:${ss}`;
    document.getElementById("vic-mistakes").textContent = String(this.mistakesCount);
    document.getElementById("vic-mode").textContent =
      this.gameMode === "classic" ? "Exit 8 ต้นฉบับ" : "Checkpoint";
    document.getElementById("vic-discovered").textContent = `${this.discovered.size} / ${ANOMALIES.length}`;

    document.getElementById("hud").classList.add("hidden");
    document.getElementById("victory-screen").classList.remove("hidden");

    const vv = document.getElementById("victory-video");
    vv.currentTime = 0;
    vv.play().catch(() => {});
  }

  renderGallery() {
    const grid = document.getElementById("gallery-grid");
    const sub = document.getElementById("gallery-subtitle");
    sub.textContent = `ค้นพบแล้ว ${this.discovered.size} / ${ANOMALIES.length} รูปแบบ — ยิ่งด่านสูงความผิดปกติยิ่งเนียน!`;

    const tierMeta = {
      1: { name: "ระดับง่าย (ด่าน 1-2)", color: "#38bdf8" },
      2: { name: "ปานกลาง (ด่าน 3-5)", color: "#facc15" },
      3: { name: "ระดับยาก (ด่าน 6-8)", color: "#f97316" },
      4: { name: "ระดับนรก (ด่าน 9-10)", color: "#f43f5e" },
    };

    grid.innerHTML = ANOMALIES.map((a, idx) => {
      const unlocked = this.discovered.has(a.id);
      const tm = tierMeta[a.tier];
      const thumb = unlocked
        ? a.variantUrl
          ? `<img src="${a.variantUrl}" alt="${a.title}" loading="lazy" />`
          : `<div style="font-size:2.5rem;">🚨</div>`
        : `<div style="font-size:2rem;color:#475569;">🔒 ???</div>`;

      return `
        <div class="gal-item ${unlocked ? "" : "locked"}">
          <div class="gal-thumb">
            ${thumb}
            <span class="gal-tier-tag" style="color:${tm.color}">#${String(idx + 1).padStart(2, "0")} • ${tm.name}</span>
          </div>
          <div class="gal-body">
            <div class="gal-title">${unlocked ? a.title : "ยังไม่เคยพบความผิดปกตินี้"}</div>
            <div class="gal-desc">${unlocked ? a.desc : "สำรวจอุโมงค์ในระดับความยากนี้เพื่อปลดล็อกข้อมูล"}</div>
          </div>
        </div>
      `;
    }).join("");
  }

  updatePlayer(dt) {
    // Smooth 180-degree quick turn animation
    if (this.quickTurnRemaining > 0) {
      const step = Math.min(this.quickTurnRemaining, dt * 11.5);
      this.yaw += step;
      this.quickTurnRemaining -= step;
    }

    // Keyboard Q/E camera yaw assist
    if (this.keys.has("KeyQ")) this.yaw += 1.9 * dt;
    if (this.keys.has("KeyE")) this.yaw -= 1.9 * dt;

    let moveForward = 0;
    let moveRight = 0;
    if (this.keys.has("KeyW") || this.keys.has("ArrowUp")) moveForward += 1;
    if (this.keys.has("KeyS") || this.keys.has("ArrowDown")) moveForward -= 1;
    if (this.keys.has("KeyD") || this.keys.has("ArrowRight")) moveRight += 1;
    if (this.keys.has("KeyA") || this.keys.has("ArrowLeft")) moveRight -= 1;

    // Combine Virtual Touch Joystick input seamlessly
    if (this.joyMag > 0.08) {
      moveForward += this.joyVec.y;
      moveRight += this.joyVec.x;
    }

    const rawLen = Math.hypot(moveForward, moveRight);
    const isMoving = rawLen > 0.05;
    const isSprint =
      !this.isZoomed &&
      (this.keys.has("ShiftLeft") ||
        this.keys.has("ShiftRight") ||
        this.touchSprintToggle ||
        this.joyMag > 0.84);
    const speed = this.isZoomed ? 1.85 : isSprint ? 5.8 : 3.7;

    if (isMoving) {
      const scale = Math.min(1, rawLen);
      const nf = (moveForward / rawLen) * scale;
      const nr = (moveRight / rawLen) * scale;

      const forwardX = -Math.sin(this.yaw);
      const forwardZ = -Math.cos(this.yaw);
      const rightX = Math.cos(this.yaw);
      const rightZ = -Math.sin(this.yaw);

      this.playerPos.x += (forwardX * nf + rightX * nr) * speed * dt;
      this.playerPos.z += (forwardZ * nf + rightZ * nr) * speed * dt;

      // Once decision is committed in a connector, prevent backing out into the old Main Hall
      if (this.decisionCommitted === "forward" && this.playerPos.z > -40.5) {
        this.playerPos.x = Math.max(4.5, this.playerPos.x);
      } else if (this.decisionCommitted === "backward" && this.playerPos.z < 2.5) {
        this.playerPos.x = Math.min(-4.5, this.playerPos.x);
      }

      this.corridor.clampPlayerPosition(this.playerPos, 0.45);

      // Head-bob + Footsteps
      this.bobTimer += dt * (isSprint ? 13.5 : 9.2) * scale;
      const curSin = Math.sin(this.bobTimer);
      if (this.lastBobSin >= 0 && curSin < 0) {
        this.audio.playStep(isSprint);
      }
      this.lastBobSin = curSin;
    } else {
      this.bobTimer = 0;
    }

    // Check Connector Decision Pre-Commit (at |x| > 7.5, Main Hall is 100% occluded!)
    if (!this.decisionCommitted && !this.victoryUnlocked) {
      if (this.playerPos.x > 7.5 && this.playerPos.z < -35.0) {
        this.commitCorridorChoice("forward");
      } else if (this.playerPos.x < -7.5 && this.playerPos.z > -3.0) {
        this.commitCorridorChoice("backward");
      }
    }

    // Seamless Non-Euclidean SE(2) Portal Teleports!
    // 1. North Stub (x ~ 14, z < -41.5) -> Translate (-14, +38) back to (0, -3.5)
    if (this.playerPos.x > 11.5 && this.playerPos.z < -41.5) {
      this.playerPos.x -= 14.0;
      this.playerPos.z += 38.0;
      this.decisionCommitted = null;
    }
    // 2. South Stub (x ~ -14, z > +3.5) -> Rotate 180 deg around (-7, 0) back to (0, -3.5)
    else if (this.playerPos.x < -11.5 && this.playerPos.z > 3.5) {
      this.playerPos.x = -14.0 - this.playerPos.x;
      this.playerPos.z = -this.playerPos.z;
      this.yaw += Math.PI;
      this.decisionCommitted = null;
    }

    // Climbing the Golden Stairway when Victory Exit is open (z < -40.3 in Main Hall)!
    let stairLift = 0;
    if (this.victoryUnlocked && Math.abs(this.playerPos.x) < 2.4 && this.playerPos.z < -40.3) {
      const climbDist = -40.3 - this.playerPos.z;
      stairLift = climbDist * 0.3;
      const sunAlpha = Math.min(1, climbDist / 6.2);
      document.getElementById("fx-sunlight").style.opacity = sunAlpha.toFixed(3);
      if (climbDist >= 6.2) {
        this.triggerFinalVictoryScreen();
      }
    }

    // Smooth camera FOV zoom & transform
    const targetFov = this.isZoomed ? this.zoomFov : this.baseFov;
    if (Math.abs(this.camera.fov - targetFov) > 0.05) {
      this.camera.fov += (targetFov - this.camera.fov) * Math.min(1, dt * 13);
      this.camera.updateProjectionMatrix();
    }

    const bobOffset = isMoving ? Math.sin(this.bobTimer) * (isSprint ? 0.055 : 0.035) : 0;
    this.camera.position.set(
      this.playerPos.x,
      this.eyeHeight + stairLift + bobOffset,
      this.playerPos.z
    );
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;

    // Raycast poster hover caption
    this.raycaster.setFromCamera(this.screenCenter, this.camera);
    const hits = this.raycaster.intersectObjects(this.corridor.inspectables, false);
    const labelEl = document.getElementById("inspect-label");
    if (hits.length > 0 && hits[0].distance < 5.6 && hits[0].object.userData.inspectLabel) {
      labelEl.textContent = hits[0].object.userData.inspectLabel;
      labelEl.classList.remove("hidden");
    } else {
      labelEl.classList.add("hidden");
    }
  }

  animate() {
    requestAnimationFrame(this.animate);
    const dt = Math.min(0.05, this.clock.getDelta());

    if (this.corridor) {
      if (this.state === "PLAYING") {
        this.updatePlayer(dt);
      } else if (this.state === "TITLE") {
        const t = performance.now() * 0.00035;
        this.camera.position.set(Math.sin(t) * 0.45, 1.72, -6.5 - (1 + Math.sin(t * 0.7)) * 6.0);
        this.camera.rotation.set(-0.02, Math.sin(t * 0.9) * 0.32, 0);
      }
      this.corridor.update(dt, this.playerPos);
    }

    this.renderer.render(this.scene, this.camera);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  window.ashiGame = new AshiTunnelGame();
});
