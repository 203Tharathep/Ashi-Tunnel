import * as THREE from "three";

export class TextureManager {
  constructor(renderer) {
    this.renderer = renderer;
    this.loader = new THREE.TextureLoader();
    this.cache = new Map();
    this.maxAniso = renderer ? renderer.capabilities.getMaxAnisotropy() : 8;
  }

  async preloadList(urls, onProgress) {
    let done = 0;
    const total = urls.length;
    await Promise.all(
      urls.map(async (url) => {
        try {
          await this.loadPosterTexture(url);
        } catch (err) {
          console.warn("Texture load warning:", url, err);
        } finally {
          done++;
          if (onProgress) onProgress(done, total);
        }
      })
    );
  }

  loadPosterTexture(url) {
    if (this.cache.has(url)) {
      return Promise.resolve(this.cache.get(url));
    }
    return new Promise((resolve, reject) => {
      this.loader.load(
        url,
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.anisotropy = this.maxAniso;
          tex.minFilter = THREE.LinearMipmapLinearFilter;
          tex.magFilter = THREE.LinearFilter;
          tex.generateMipmaps = true;
          tex.needsUpdate = true;
          this.cache.set(url, tex);
          resolve(tex);
        },
        undefined,
        (err) => reject(err)
      );
    });
  }

  // Procedural Glazed Subway Ceramic Tile Texture (Diffuse + Bump)
  createSubwayWallTextures(repeatX = 8, repeatY = 2) {
    const W = 512,
      H = 512;
    const diffCanvas = document.createElement("canvas");
    diffCanvas.width = W;
    diffCanvas.height = H;
    const ctx = diffCanvas.getContext("2d");

    const bumpCanvas = document.createElement("canvas");
    bumpCanvas.width = W;
    bumpCanvas.height = H;
    const bctx = bumpCanvas.getContext("2d");

    // Grout background
    ctx.fillStyle = "#c9cbc4";
    ctx.fillRect(0, 0, W, H);
    bctx.fillStyle = "#404040";
    bctx.fillRect(0, 0, W, H);

    const cols = 4,
      rows = 8;
    const tw = W / cols,
      th = H / rows;
    const grout = 4;

    for (let r = 0; r < rows; r++) {
      const offsetX = r % 2 === 1 ? tw * 0.5 : 0;
      for (let c = -1; c <= cols; c++) {
        const x = c * tw + offsetX;
        const y = r * th;
        const shade = 237 + Math.floor((Math.sin(r * 7.3 + c * 13.1) * 0.5 + 0.5) * 9);
        const warm = shade - 3;
        ctx.fillStyle = `rgb(${shade}, ${shade}, ${warm})`;
        ctx.fillRect(x + grout / 2, y + grout / 2, tw - grout, th - grout);

        // Subtle highlight bevel on top/left of each glazed tile
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        ctx.fillRect(x + grout / 2, y + grout / 2, tw - grout, 2);

        bctx.fillStyle = "#e8e8e8";
        bctx.fillRect(x + grout / 2 + 1, y + grout / 2 + 1, tw - grout - 2, th - grout - 2);
      }
    }

    // Subtle grime/micro-speckle
    for (let i = 0; i < 1600; i++) {
      const rx = Math.random() * W;
      const ry = Math.random() * H;
      ctx.fillStyle = `rgba(110,115,105,${Math.random() * 0.045})`;
      ctx.fillRect(rx, ry, 2, 2);
    }

    const map = new THREE.CanvasTexture(diffCanvas);
    map.colorSpace = THREE.SRGBColorSpace;
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(repeatX, repeatY);
    map.anisotropy = this.maxAniso;

    const bumpMap = new THREE.CanvasTexture(bumpCanvas);
    bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
    bumpMap.repeat.set(repeatX, repeatY);

    return { map, bumpMap };
  }

  // Procedural Subway Terrazzo Floor Texture
  createFloorTextures(repeatX = 3, repeatY = 20) {
    const W = 512,
      H = 512;
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const ctx = c.getContext("2d");

    ctx.fillStyle = "#5a5e63";
    ctx.fillRect(0, 0, W, H);

    // Tile grid 2x2
    const step = W / 2;
    for (let gy = 0; gy < 2; gy++) {
      for (let gx = 0; gx < 2; gx++) {
        const v = 94 + ((gx + gy) % 2) * 5;
        ctx.fillStyle = `rgb(${v},${v + 2},${v + 5})`;
        ctx.fillRect(gx * step + 3, gy * step + 3, step - 6, step - 6);
      }
    }

    // Terrazzo stone speckles
    for (let i = 0; i < 3200; i++) {
      const x = Math.random() * W;
      const y = Math.random() * H;
      const bright = Math.random() > 0.5 ? 140 : 62;
      ctx.fillStyle = `rgba(${bright},${bright},${bright + 4},0.24)`;
      ctx.fillRect(x, y, 2.2, 2.2);
    }

    const map = new THREE.CanvasTexture(c);
    map.colorSpace = THREE.SRGBColorSpace;
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(repeatX, repeatY);
    map.anisotropy = this.maxAniso;
    return map;
  }

  // Yellow Tactile Paving Strip (เบรลล์บล็อกสีเหลือง)
  createTactileTexture(repeatY = 48) {
    const W = 256,
      H = 256;
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const ctx = c.getContext("2d");

    ctx.fillStyle = "#e0b100";
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "#9c7900";
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, W - 6, H - 6);

    // Directional raised bars
    for (let i = 0; i < 4; i++) {
      const x = 32 + i * 54;
      ctx.fillStyle = "#ffd633";
      ctx.fillRect(x, 22, 28, H - 44);
      ctx.fillStyle = "#b38b00";
      ctx.fillRect(x + 28, 22, 5, H - 44);
    }

    const map = new THREE.CanvasTexture(c);
    map.colorSpace = THREE.SRGBColorSpace;
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(1, repeatY);
    map.anisotropy = this.maxAniso;
    return map;
  }

  // Acoustic Ceiling Grid Texture
  createCeilingTexture(repeatX = 4, repeatY = 26) {
    const W = 256,
      H = 256;
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const ctx = c.getContext("2d");

    ctx.fillStyle = "#dcded9";
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "#aeb2aa";
    ctx.lineWidth = 6;
    ctx.strokeRect(0, 0, W, H);

    for (let i = 0; i < 900; i++) {
      ctx.fillStyle = "rgba(90,95,90,0.08)";
      ctx.fillRect(Math.random() * W, Math.random() * H, 2, 2);
    }

    const map = new THREE.CanvasTexture(c);
    map.colorSpace = THREE.SRGBColorSpace;
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(repeatX, repeatY);
    return map;
  }

  // Dynamic Hanging Subway Exit Sign Canvas (ทางออก X / EXIT X)
  drawExitSignCanvas(canvas, stageNum, isFinalExit = false) {
    const W = canvas.width,
      H = canvas.height;
    const ctx = canvas.getContext("2d");

    // Iconic Japanese/Metro Yellow & Black Exit Sign
    ctx.fillStyle = isFinalExit ? "#16a34a" : "#facc15";
    ctx.fillRect(0, 0, W, H);

    // Top black header bar
    ctx.fillStyle = "#111317";
    ctx.fillRect(0, 0, W, 52);
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 24px 'Prompt', 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("ASHI UNDERGROUND PASSAGEWAY • อุโมงค์ใต้ดินสถานีอชิ", W / 2, 35);

    // Border
    ctx.strokeStyle = "#111317";
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, W - 10, H - 10);

    // Running man + Exit Icon on Left
    ctx.fillStyle = isFinalExit ? "#ffffff" : "#111317";
    ctx.font = "900 92px 'Prompt', 'Segoe UI', sans-serif";
    ctx.textAlign = "left";
    const labelMain = isFinalExit ? "ทางออกจริง!" : `ทางออก ${stageNum}`;
    ctx.fillText(labelMain, 56, 165);

    ctx.font = "800 38px 'Segoe UI', sans-serif";
    ctx.fillText(isFinalExit ? "SURFACE EXIT 10 — FREEDOM!" : `EXIT ${stageNum}  /  10`, 60, 218);

    // Big Directional Arrow on Right
    ctx.save();
    ctx.translate(W - 120, 148);
    ctx.fillStyle = isFinalExit ? "#ffffff" : "#111317";
    ctx.beginPath();
    ctx.moveTo(0, -56);
    ctx.lineTo(52, -4);
    ctx.lineTo(20, -4);
    ctx.lineTo(20, 56);
    ctx.lineTo(-20, 56);
    ctx.lineTo(-20, -4);
    ctx.lineTo(-52, -4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Tutorial Rules Sign placed on the wall at the entrance of the corridor (just like Exit 8!)
  createRulesBoardTexture() {
    const c = document.createElement("canvas");
    c.width = 900;
    c.height = 1150;
    const ctx = c.getContext("2d");

    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, c.width, c.height);

    // Outer dark subway frame
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 22;
    ctx.strokeRect(11, 11, c.width - 22, c.height - 22);

    // Yellow Warning Header
    ctx.fillStyle = "#facc15";
    ctx.fillRect(22, 22, c.width - 44, 175);
    ctx.fillStyle = "#0f172a";
    ctx.font = "900 58px 'Prompt', 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("คำแนะนำการออกจากอุโมงค์", c.width / 2, 102);
    ctx.font = "800 32px 'Segoe UI', sans-serif";
    ctx.fillText("GUIDE TO EXIT ASHI TUNNEL (STAGE 0 - 10)", c.width / 2, 158);

    const rules = [
      ["01", "อย่ามองข้ามสิ่งผิดปกติแม้แต่จุดเดียว", "Do not overlook any anomalies in the posters or tunnel."],
      ["02", "หากพบความผิดปกติ ให้หันหลังเดินย้อนกลับทันที!", "If you find an anomaly, turn around and walk BACK immediately."],
      ["03", "หากไม่พบความผิดปกติ ให้เดินหน้าเลี้ยวขวาต่อไป", "If there are NO anomalies, walk FORWARD around the corner."],
      ["04", "ยิ่งด่านสูงขึ้น (1 → 10) จุดที่เปลี่ยนจะยิ่งเนียนขึ้น!", "Difficulty increases every stage up to Exit 10."],
      ["05", "คลิกขวา [RMB] หรือกด [F] เพื่อซูมเพ่งดูรายละเอียดภาพ", "Right-Click or press [F] to zoom in on subtle details."],
    ];

    let y = 275;
    ctx.textAlign = "left";
    for (const [num, th, en] of rules) {
      ctx.fillStyle = num === "02" ? "#dc2626" : "#0f172a";
      ctx.fillRect(58, y - 48, 76, 66);
      ctx.fillStyle = "#ffffff";
      ctx.font = "900 36px 'Segoe UI', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(num, 96, y - 3);

      ctx.textAlign = "left";
      ctx.fillStyle = num === "02" ? "#b91c1c" : "#0f172a";
      ctx.font = "800 34px 'Prompt', 'Segoe UI', sans-serif";
      ctx.fillText(th, 156, y - 12);

      ctx.fillStyle = "#475569";
      ctx.font = "600 23px 'Segoe UI', sans-serif";
      ctx.fillText(en, 156, y + 26);

      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(58, y + 54);
      ctx.lineTo(c.width - 58, y + 54);
      ctx.stroke();

      y += 155;
    }

    // Bottom red warning banner
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(22, c.height - 115, c.width - 44, 93);
    ctx.fillStyle = "#facc15";
    ctx.font = "700 28px 'Prompt', 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("ทางออก 0 คือทางเดินปกติ 100% — จดจำทุกภาพให้แม่นก่อนก้าวออกไป!", c.width / 2, c.height - 58);

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = this.maxAniso;
    return tex;
  }

  // Small Subway Poster Caption Plaque
  createPlaqueTexture(numStr, titleStr, subStr) {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 96;
    const ctx = c.getContext("2d");

    ctx.fillStyle = "#111318";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, c.width - 4, c.height - 4);

    ctx.fillStyle = "#facc15";
    ctx.fillRect(10, 10, 96, 76);
    ctx.fillStyle = "#111318";
    ctx.font = "900 40px 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(numStr, 58, 63);

    ctx.textAlign = "left";
    ctx.fillStyle = "#f8fafc";
    ctx.font = "700 28px 'Prompt', 'Segoe UI', sans-serif";
    ctx.fillText(titleStr, 124, 46);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "600 18px 'Segoe UI', sans-serif";
    ctx.fillText(subStr, 124, 76);

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = this.maxAniso;
    return tex;
  }

  // Directional Wall Sign for Corridor Turns
  createDirectionSignTexture(badgeText, mainText, subText, arrowDir = "right", accent = "#22c55e") {
    const c = document.createElement("canvas");
    c.width = 768;
    c.height = 280;
    const ctx = c.getContext("2d");

    ctx.fillStyle = "#0f131a";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, c.width - 10, c.height - 10);

    // Top accent strip
    ctx.fillStyle = accent;
    ctx.fillRect(10, 10, c.width - 20, 62);
    ctx.fillStyle = "#090b10";
    ctx.font = "900 30px 'Prompt', 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(badgeText, c.width / 2, 52);

    const isLeft = arrowDir === "left";
    const textX = isLeft ? 215 : 44;
    ctx.textAlign = "left";
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 48px 'Prompt', 'Segoe UI', sans-serif";
    ctx.fillText(mainText, textX, 158);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "700 24px 'Segoe UI', sans-serif";
    ctx.fillText(subText, textX, 208);

    // Big arrow box
    const arrowX = isLeft ? 105 : c.width - 105;
    ctx.save();
    ctx.translate(arrowX, 172);
    if (isLeft) ctx.scale(-1, 1);
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.moveTo(56, 0);
    ctx.lineTo(4, -50);
    ctx.lineTo(4, -20);
    ctx.lineTo(-52, -20);
    ctx.lineTo(-52, 20);
    ctx.lineTo(4, 20);
    ctx.lineTo(4, 50);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = this.maxAniso;
    return tex;
  }
}

