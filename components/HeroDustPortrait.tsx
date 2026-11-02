"use client";

import Image from "next/image";
import { SITE_READY_EVENT } from "@/components/SiteLoader";
import { useEffect, useRef } from "react";

type Props = {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** Id of the hero element whose scroll progress drives the dissolve */
  targetId?: string;
};

// Canvas overflow around the portrait so drifting dust isn't clipped
const PAD_X = 0.7;
const PAD_TOP = 0.55;
const PAD_BOTTOM = 0.05;
const MAX_PARTICLES = 120000;
const INTRO_DELAY = 350;
const INTRO_MS = 2600;
// Fraction of the hero scrolled away at which the portrait is fully dust
const DISSOLVE_AT = 0.5;
// Cursor disturbance: brush radius, field resolution (css px) and heal speed
const HOVER_RADIUS = 70;
const FIELD_CELL = 6;
const HEAL_PER_SEC = 1.1;

// Shared by both passes so a cell's dust mote and its patch of the real image
// agree on exactly when that cell lands / is blown away by the cursor.
const common = (hover: boolean) => `${hover ? "#define HOVER\n" : ""}
precision highp float;
uniform float uT;
uniform float uGap;
uniform vec2 uGrid;
uniform vec2 uRes;
uniform sampler2D uField;
uniform vec2 uFieldSize;

// Cursor disturbance at a box position: 0 = intact, 1 = blown to dust
float disturb(vec2 bp) {
#ifdef HOVER
  float h = texture2D(uField, bp / uFieldSize).r;
  return h * h * (3.0 - 2.0 * h);
#else
  return 0.0;
#endif
}

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

// 0 = still airborne, 1 = in place. Head lands last / leaves first.
float landing(vec2 cell) {
  vec2 n = cell / uGrid;
  float d = min(1.0, 0.45 * hash(cell) + 0.55 * ((1.0 - n.y) * 0.75 + n.x * 0.25));
  return clamp((uT - d * 0.6) / 0.4, 0.0, 1.0);
}

// Hand-off from mote to real pixels over the last stretch of the flight
float reveal(float l) {
  return smoothstep(0.72, 1.0, l);
}

vec4 toClip(vec2 p) {
  vec2 c = p / uRes * 2.0 - 1.0;
  return vec4(c.x, -c.y, 0.0, 1.0);
}
`;

const dustVert = (hover: boolean) => `${common(hover)}
attribute vec2 aCell;
attribute vec2 aScatter;
attribute vec4 aColor;
uniform float uTime;
uniform float uDpr;
uniform vec2 uOrigin;
uniform vec3 uDust;
varying vec4 vColor;

void main() {
  vec2 bp = (aCell + 0.5) * uGap;
  float hv = disturb(bp);
  float l = landing(aCell);
  float shown = reveal(l) * (1.0 - hv);
  float a = aColor.a * smoothstep(0.0, 0.15, l) * (1.0 - shown);
  if (a <= 0.004) {
    gl_Position = vec4(2.0, 2.0, 0.0, 1.0);
    gl_PointSize = 0.0;
    vColor = vec4(0.0);
    return;
  }
  float e = l < 0.5 ? 4.0 * l * l * l : 1.0 - pow(-2.0 * l + 2.0, 3.0) / 2.0;
  float seed = hash(aCell + 17.0);
  float seed2 = hash(aCell + 41.0);
  float ph = seed * 60.0;

  vec2 pos = uOrigin + bp + aScatter * (1.0 - e);
  // Curved flight path + idle shimmer while airborne
  float side = seed > 0.5 ? 1.0 : -1.0;
  pos += vec2(-aScatter.y, aScatter.x) * 0.22 * side * sin(3.14159 * e);
  pos += vec2(sin(uTime * 1.3 + ph), cos(uTime * 1.1 + ph * 0.7)) * 5.0 * max(1.0 - e, hv);
  // Cursor puff: motes lift off and drift up around the disturbed patch
  vec2 dir = normalize(vec2(seed - 0.5, seed2 - 0.5) + 0.0001);
  pos += (dir * (10.0 + 22.0 * seed2) + vec2(sin(uTime * 1.7 + ph) * 6.0, -(14.0 + 30.0 * seed))) * hv;

  gl_Position = toClip(pos);
  gl_PointSize = mix(mix(1.4, uGap, e * e), 1.8, hv) * uDpr;
  float own = smoothstep(0.35, 1.0, e) * (1.0 - 0.6 * hv);
  vec3 rgb = mix(mix(aColor.rgb, uDust, 0.55), aColor.rgb, own);
  vColor = vec4(rgb, a);
}
`;

const DUST_FRAG = `
precision mediump float;
varying vec4 vColor;

void main() {
  float r = length(gl_PointCoord - 0.5);
  float a = vColor.a * (1.0 - smoothstep(0.3, 0.5, r));
  if (a < 0.01) discard;
  gl_FragColor = vec4(vColor.rgb * a, a);
}
`;

const imageVert = (hover: boolean) => `${common(hover)}
attribute vec2 aPos;
uniform vec4 uRect;
varying vec2 vUv;

void main() {
  vUv = aPos;
  gl_Position = toClip(uRect.xy + aPos * uRect.zw);
}
`;

const imageFrag = (hover: boolean) => `${common(hover)}
uniform sampler2D uTex;
uniform vec4 uRect;
uniform vec2 uOrigin;
uniform float uBoxH;
uniform vec2 uFade;
varying vec2 vUv;

void main() {
  vec2 bp = uRect.xy + vUv * uRect.zw - uOrigin;
  float shown = reveal(landing(floor(bp / uGap))) * (1.0 - disturb(bp));
  if (shown <= 0.0) discard;
  // Same bottom fade as the CSS mask on .person-image
  float fade = 1.0 - clamp((bp.y / uBoxH - uFade.x) / (uFade.y - uFade.x), 0.0, 1.0);
  gl_FragColor = texture2D(uTex, vUv) * shown * fade;
}
`;

function createProgram(gl: WebGLRenderingContext, vert: string, frag: string) {
  const program = gl.createProgram()!;
  for (const [type, source] of [
    [gl.VERTEX_SHADER, vert],
    [gl.FRAGMENT_SHADER, frag],
  ] as const) {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(shader) ?? "shader compile failed");
    }
    gl.attachShader(program, shader);
  }
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) ?? "program link failed");
  }
  return program;
}

/**
 * Hero portrait that assembles from drifting dust on load and dissolves back
 * into dust as the hero scrolls away (reassembling when scrolled back).
 * Each mote hands off to the full-resolution image as it lands, so the formed
 * portrait is always the real, crisp image — never a low-res particle grid.
 */
export default function HeroDustPortrait({ src, alt, width, height, targetId = "top" }: Props) {
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    const hero = document.getElementById(targetId);
    const scroller = hero?.closest<HTMLElement>(".layout-container");
    if (!img || !canvas) return;

    const showImage = () => {
      img.style.opacity = "";
      canvas.style.display = "none";
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return showImage();

    const gl = canvas.getContext("webgl", { premultipliedAlpha: true, antialias: false, alpha: true });
    if (!gl) return showImage();

    // Hover needs texture reads in the vertex shader; skip it on touch or if unsupported
    const hover =
      window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
      gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) > 0;

    let dustProg: WebGLProgram, imageProg: WebGLProgram;
    try {
      dustProg = createProgram(gl, dustVert(hover), DUST_FRAG);
      imageProg = createProgram(gl, imageVert(hover), imageFrag(hover));
    } catch {
      return showImage();
    }
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    const uniforms = (p: WebGLProgram, names: string[]) =>
      Object.fromEntries(names.map((n) => [n, gl.getUniformLocation(p, n)]));
    const SHARED = ["uT", "uGap", "uGrid", "uRes", "uField", "uFieldSize"];
    const dustU = uniforms(dustProg, [...SHARED, "uTime", "uDpr", "uOrigin", "uDust"]);
    const imageU = uniforms(imageProg, [...SHARED, "uTex", "uRect", "uOrigin", "uBoxH", "uFade"]);

    const DUST_ATTRS = [
      ["aCell", 2],
      ["aScatter", 2],
      ["aColor", 4],
    ] as const;
    const STRIDE = 8;
    const dustAttrs = DUST_ATTRS.map(([name, size]) => [gl.getAttribLocation(dustProg, name), size] as const);
    const dustBuf = gl.createBuffer();

    const quadLoc = gl.getAttribLocation(imageProg, "aPos");
    const quadBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]), gl.STATIC_DRAW);

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

    // Cursor disturbance field (texture unit 1), stamped by the pointer and healing over time
    const fieldTex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, fieldTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.activeTexture(gl.TEXTURE0);
    let fw = 1, fh = 1;
    let field = new Float32Array(1);
    let fieldBytes = new Uint8Array(1);
    let fieldActive = false;
    const pointer = { x: 0, y: 0, inside: false, has: false };
    const uploadField = () => {
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, fieldTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, fw, fh, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, fieldBytes);
      gl.activeTexture(gl.TEXTURE0);
    };

    let ready = false;
    let count = 0;
    let gap = 2;
    let dpr = 1;
    let cssW = 0, cssH = 0, boxH = 0;
    let cols = 0, rows = 0;
    let origin: [number, number] = [0, 0];
    let rect: [number, number, number, number] = [0, 0, 0, 0];
    let fade: [number, number] = [0.72, 0.99];
    let lastBox = "";

    const syncFilter = () => {
      // Mirror the portrait's drop-shadow (it differs per theme)
      canvas.style.filter = getComputedStyle(img).filter;
    };

    const build = () => {
      const w = img.offsetWidth;
      const h = img.offsetHeight;
      const nw = img.naturalWidth;
      const nh = img.naturalHeight;
      if (!w || !h || !nw || !nh) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const box = `${w}x${h}@${img.offsetLeft},${img.offsetTop}x${dpr}`;
      if (box === lastBox) return;
      lastBox = box;

      const padX = Math.round(w * PAD_X);
      const padTop = Math.round(h * PAD_TOP);
      cssW = w + padX * 2;
      cssH = padTop + h + Math.round(h * PAD_BOTTOM);
      boxH = h;
      origin = [padX, padTop];
      Object.assign(canvas.style, {
        left: `${img.offsetLeft - padX}px`,
        top: `${img.offsetTop - padTop}px`,
        width: `${cssW}px`,
        height: `${cssH}px`,
        transformOrigin: `${padX + w / 2}px ${padTop + h}px`,
      });
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);

      // Mirror object-fit: contain + object-position: bottom
      const s = Math.min(w / nw, h / nh);
      const dw = nw * s;
      const dh = nh * s;
      const ox = (w - dw) / 2;
      const oy = h - dh;
      rect = [padX + ox, padTop + oy, dw, dh];

      // Full-res texture, pre-scaled with the browser's high-quality resampler
      const hi = document.createElement("canvas");
      hi.width = Math.max(1, Math.round(dw * dpr));
      hi.height = Math.max(1, Math.round(dh * dpr));
      const hctx = hi.getContext("2d");
      if (!hctx) return showImage();
      hctx.imageSmoothingQuality = "high";
      hctx.drawImage(img, 0, 0, hi.width, hi.height);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, hi);

      gap = Math.max(2, Math.ceil(Math.sqrt((dw * dh) / (MAX_PARTICLES * 1.6))));
      cols = Math.ceil(w / gap);
      rows = Math.ceil(h / gap);
      const sampler = document.createElement("canvas");
      sampler.width = cols;
      sampler.height = rows;
      const ctx = sampler.getContext("2d", { willReadFrequently: true });
      if (!ctx) return showImage();
      ctx.drawImage(img, ox / gap, oy / gap, dw / gap, dh / gap);
      let pixels: Uint8ClampedArray;
      try {
        pixels = ctx.getImageData(0, 0, cols, rows).data;
      } catch {
        return showImage();
      }

      const compact = window.matchMedia("(max-width: 1024px)").matches;
      fade = compact ? [0.8, 1] : [0.72, 0.99];

      const data = new Float32Array(cols * rows * STRIDE);
      let n = 0;
      for (let y = 0; y < rows; y++) {
        const ny = y / rows;
        const f = ny < fade[0] ? 1 : Math.max(0, 1 - (ny - fade[0]) / (fade[1] - fade[0]));
        for (let x = 0; x < cols; x++) {
          const i = (y * cols + x) * 4;
          const a = (pixels[i + 3] / 255) * f;
          if (a < 0.06) continue;
          const o = n * STRIDE;
          data[o] = x;
          data[o + 1] = y;
          // Dust blows up and to the side
          data[o + 2] = (Math.random() - 0.38) * w * 1.25;
          data[o + 3] = -(0.12 + Math.random() * 0.88) * padTop * 0.95 + (ny - 0.5) * h * 0.15;
          data[o + 4] = pixels[i] / 255;
          data[o + 5] = pixels[i + 1] / 255;
          data[o + 6] = pixels[i + 2] / 255;
          data[o + 7] = a;
          n++;
        }
      }
      count = n;
      gl.bindBuffer(gl.ARRAY_BUFFER, dustBuf);
      gl.bufferData(gl.ARRAY_BUFFER, data.subarray(0, n * STRIDE), gl.STATIC_DRAW);

      fw = Math.ceil(w / FIELD_CELL);
      fh = Math.ceil(h / FIELD_CELL);
      field = new Float32Array(fw * fh);
      fieldBytes = new Uint8Array(fw * fh);
      fieldActive = false;
      uploadField();

      ready = true;
      syncFilter();
    };

    const smooth = (a: number, b: number, x: number) => {
      const k = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return k * k * (3 - 2 * k);
    };

    // Soft circular brush in box coordinates
    const stamp = (px: number, py: number) => {
      const r = HOVER_RADIUS / FIELD_CELL;
      const cx = px / FIELD_CELL;
      const cy = py / FIELD_CELL;
      const x0 = Math.max(0, Math.floor(cx - r)), x1 = Math.min(fw - 1, Math.ceil(cx + r));
      const y0 = Math.max(0, Math.floor(cy - r)), y1 = Math.min(fh - 1, Math.ceil(cy + r));
      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
          const v = 1 - smooth(r * 0.35, r, d);
          const i = y * fw + x;
          if (v > field[i]) field[i] = v;
        }
      }
    };

    const updateField = (dt: number, canStamp: boolean) => {
      if (!hover || (!fieldActive && !pointer.inside)) return;
      const heal = dt * HEAL_PER_SEC;
      for (let i = 0; i < field.length; i++) field[i] = Math.max(0, field[i] - heal);
      if (pointer.inside && canStamp) stamp(pointer.x, pointer.y);
      let max = 0;
      for (let i = 0; i < field.length; i++) {
        const v = field[i];
        if (v > max) max = v;
        fieldBytes[i] = v * 255;
      }
      fieldActive = max > 0.002;
      uploadField();
    };

    const toBox = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      return {
        x: ((e.clientX - r.left) * cssW) / r.width - origin[0],
        y: ((e.clientY - r.top) * cssH) / r.height - origin[1],
      };
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!ready || !cssW) return;
      const p = toBox(e);
      // Fill in fast sweeps so the trail has no gaps
      if (pointer.inside && pointer.has) {
        const dist = Math.hypot(p.x - pointer.x, p.y - pointer.y);
        const steps = Math.min(40, Math.floor(dist / (HOVER_RADIUS * 0.3)));
        for (let s = 1; s <= steps; s++) {
          const k = s / (steps + 1);
          stamp(pointer.x + (p.x - pointer.x) * k, pointer.y + (p.y - pointer.y) * k);
        }
      }
      pointer.x = p.x;
      pointer.y = p.y;
      pointer.inside = true;
      pointer.has = true;
      kick();
    };
    const onPointerLeave = () => {
      pointer.inside = false;
      kick();
    };

    const setShared = (u: Record<string, WebGLUniformLocation | null>, t: number) => {
      gl.uniform1f(u.uT, t);
      gl.uniform1f(u.uGap, gap);
      gl.uniform2f(u.uGrid, cols, rows);
      gl.uniform2f(u.uRes, cssW, cssH);
      gl.uniform2f(u.uOrigin, origin[0], origin[1]);
      gl.uniform1i(u.uField, 1);
      gl.uniform2f(u.uFieldSize, fw * FIELD_CELL, fh * FIELD_CELL);
    };

    const draw = (t: number, time: number) => {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      if (!ready || t <= 0) return;

      gl.useProgram(imageProg);
      setShared(imageU, t);
      gl.uniform4f(imageU.uRect, ...rect);
      gl.uniform1f(imageU.uBoxH, boxH);
      gl.uniform2f(imageU.uFade, ...fade);
      gl.uniform1i(imageU.uTex, 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      dustAttrs.forEach(([loc]) => gl.disableVertexAttribArray(loc));
      gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
      gl.enableVertexAttribArray(quadLoc);
      gl.vertexAttribPointer(quadLoc, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.disableVertexAttribArray(quadLoc);

      if ((t >= 1 && !fieldActive) || !count) return;
      gl.useProgram(dustProg);
      setShared(dustU, t);
      gl.uniform1f(dustU.uTime, time);
      gl.uniform1f(dustU.uDpr, dpr);
      if (document.documentElement.classList.contains("light-mode")) gl.uniform3f(dustU.uDust, 0.55, 0.36, 0.2);
      else gl.uniform3f(dustU.uDust, 0.95, 0.68, 0.4);
      gl.bindBuffer(gl.ARRAY_BUFFER, dustBuf);
      let offset = 0;
      for (const [loc, size] of dustAttrs) {
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, size, gl.FLOAT, false, STRIDE * 4, offset * 4);
        offset += size;
      }
      gl.drawArrays(gl.POINTS, 0, count);
    };

    let introStart = -1;
    let introT = 0;
    let dissolve = 0;
    let raf = 0;
    const t0 = performance.now();
    let last = t0;

    const readScroll = () => {
      if (!hero || !scroller) return 0;
      const p = (scroller.scrollTop - hero.offsetTop) / hero.offsetHeight;
      const d = Math.min(1, Math.max(0, p / DISSOLVE_AT));
      return d * d * (3 - 2 * d);
    };

    const frame = (now: number) => {
      raf = 0;
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      if (introStart >= 0 && introT < 1) {
        introT = Math.min(1, Math.max(0, (now - introStart) / INTRO_MS));
      }
      const t = introT * (1 - dissolve);
      updateField(dt, ready && t > 0);
      draw(t, (now - t0) / 1000);
      // The canvas keeps showing the formed portrait, so there's no swap back
      // to the <img>; just stop rendering once nothing is moving.
      const settled = ready && (t >= 1 || t <= 0) && !fieldActive;
      if (introT < 1 || !settled) raf = requestAnimationFrame(frame);
    };
    const kick = () => {
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };

    const onScroll = () => {
      dissolve = readScroll();
      kick();
    };

    const start = () => {
      build();
      dissolve = readScroll();
      introStart = performance.now() + INTRO_DELAY;
      kick();
    };

    if (img.complete && img.naturalWidth) start();
    else img.addEventListener("load", start, { once: true });

    // The page loader covers the first intro, so form the portrait again as it lifts
    const onSiteReady = () => {
      if (introStart < 0) return;
      introT = 0;
      introStart = performance.now() + INTRO_DELAY;
      kick();
    };
    window.addEventListener(SITE_READY_EVENT, onSiteReady);

    const ro = new ResizeObserver(() => {
      if (!img.naturalWidth) return;
      build();
      kick();
    });
    ro.observe(img);
    const themeObserver = new MutationObserver(syncFilter);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    scroller?.addEventListener("scroll", onScroll, { passive: true });
    if (hover && hero) {
      hero.addEventListener("pointermove", onPointerMove, { passive: true });
      hero.addEventListener("pointerleave", onPointerLeave);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      themeObserver.disconnect();
      img.removeEventListener("load", start);
      window.removeEventListener(SITE_READY_EVENT, onSiteReady);
      scroller?.removeEventListener("scroll", onScroll);
      hero?.removeEventListener("pointermove", onPointerMove);
      hero?.removeEventListener("pointerleave", onPointerLeave);
      gl.deleteBuffer(dustBuf);
      gl.deleteBuffer(quadBuf);
      gl.deleteTexture(tex);
      gl.deleteTexture(fieldTex);
      gl.deleteProgram(dustProg);
      gl.deleteProgram(imageProg);
    };
  }, [targetId]);

  return (
    <>
      <Image
        ref={imgRef}
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="person-image person-image--dust"
        style={{ opacity: 0, animation: "none" }}
        priority
      />
      <canvas
        ref={canvasRef}
        className="person-dust"
        aria-hidden="true"
        style={{
          position: "absolute",
          pointerEvents: "none",
          zIndex: 1,
          // Same cursor tilt as the <img> it stands in for
          rotate: "y calc(var(--px, 0) * 3deg)",
        }}
      />
    </>
  );
}
