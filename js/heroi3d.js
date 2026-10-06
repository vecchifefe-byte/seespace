// Cena 3D de verdade no topo do site (Spark 2.2 + Three.js, os mesmos do visualizador).
// - balança devagar para mostrar que é 3D; arrastar olha em volta
// - rolar a página aproxima um pouco a câmera
// - só desenha enquanto o topo está na tela; celular fraco/sem WebGL fica com o fundo parado
import * as THREE from "three";
import { SparkRenderer, SplatMesh } from "@sparkjsdev/spark";

const S = window.SITE;
const T0 = performance.now();
window.__heroi = { inicio: Math.round(T0) };
const $ = (id) => document.getElementById(id);
const canvas = $("cena"), carga = $("carga");
const MOBILE = /Android|iPhone|iPad/i.test(navigator.userAgent) || matchMedia("(max-width: 760px)").matches;
const PARADO = matchMedia("(prefers-reduced-motion: reduce)").matches;

function desistir() { carga && carga.classList.add("some"); canvas.style.display = "none"; }

async function dadosDaCena() {
  const h = { ...(S.hero || {}) };
  const teste = new URLSearchParams(location.search).get("cena");   // ?cena=<job> para testar outra cena
  if (teste) { h.tipo = "servidor"; h.job = teste; }
  if (h.tipo === "arquivo") {
    // ajuste fino pelo link (?pos=x,y,z&alvo=x,y,z&girar=0) para escolher o ângulo
    const q = new URLSearchParams(location.search), v = (k) => q.get(k) ? q.get(k).split(",").map(Number) : null;
    const url = q.get("arq") || (MOBILE && h.urlCelular ? h.urlCelular : h.url);
    return { url, pos: v("pos") || h.pos, alvo: v("alvo") || h.alvo, paged: url.endsWith(".rad"),
             girar: q.has("girar") ? q.get("girar") === "1" : h.girar !== false, lod: !!h.lod };
  }
  const base = `${S.servidor}/t/${h.job}/`;
  const t = await (await fetch(base + "tour.json", { cache: "no-cache" })).json();
  return { url: base + (t.arquivo || "cena-lod.rad"), pos: t.pos, alvo: t.alvo, paged: true, girar: true };
}

try {
  const gl = canvas.getContext("webgl2", { alpha: true, premultipliedAlpha: true });
  if (!gl) throw new Error("sem webgl2");
  const d = await dadosDaCena();

  const renderer = new THREE.WebGLRenderer({ canvas, context: gl, antialias: false, alpha: true, powerPreference: "high-performance" });
  renderer.setClearColor(0x000000, 0);                  // fundo transparente: o degradê do site vira o "céu"
  const pr = Math.min(devicePixelRatio, MOBILE ? 1.5 : 2);
  renderer.setPixelRatio(pr);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.02, 500);
  const spark = new SparkRenderer({ renderer, lodSplatCount: MOBILE ? 700000 : 1800000, lodRenderScale: MOBILE ? 1.5 : 1 });
  scene.add(spark);

  window.__heroi.dados = Math.round(performance.now() - T0);
  const mesh = new SplatMesh(d.paged ? { url: d.url, paged: true } : d.lod ? { url: d.url, lod: true } : { url: d.url });
  if (d.girar) mesh.quaternion.set(1, 0, 0, 0);          // arquivos do treino têm Y para baixo (igual ao visualizador)
  scene.add(mesh);
  // marca o tempo de carga mesmo com a aba em segundo plano (o desenho pausa, a carga não)
  mesh.initialized.then(() => { window.__heroi.carregou = Math.round(performance.now() - T0); }).catch(() => desistir());

  // câmera: posição e direção iniciais do tour
  const p0 = new THREE.Vector3(...(d.pos || [0, 0, 0]));
  const a0 = new THREE.Vector3(...(d.alvo || [0, 0, -1]));
  const frente = a0.clone().sub(p0).setY(0).normalize();
  const yaw0 = Math.atan2(-frente.x, -frente.z);
  const pitch0 = Math.asin(THREE.MathUtils.clamp((a0.y - p0.y) / Math.max(1e-6, a0.distanceTo(p0)), -0.6, 0.6));

  function tamanho() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = camera.aspect >= 1 ? 55 : Math.min(80, 2 * Math.atan(Math.tan(30 * Math.PI / 180) / camera.aspect) * 180 / Math.PI);
    camera.updateProjectionMatrix();
  }
  tamanho(); addEventListener("resize", tamanho);

  // arrastar = olhar em volta (volta devagar para o centro quando solta)
  let arrX = 0, arrY = 0, alvoX = 0, alvoY = 0, segurando = false, ux = 0, uy = 0;
  canvas.addEventListener("pointerdown", (e) => { if (e.pointerType === "touch") return; segurando = true; ux = e.clientX; uy = e.clientY; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener("pointermove", (e) => {
    if (!segurando) return;
    alvoX = THREE.MathUtils.clamp(alvoX - (e.clientX - ux) * 0.004, -1.1, 1.1);
    alvoY = THREE.MathUtils.clamp(alvoY - (e.clientY - uy) * 0.003, -0.35, 0.35);
    ux = e.clientX; uy = e.clientY;
  });
  addEventListener("pointerup", () => { segurando = false; });

  // só desenha com o topo visível
  let visivel = true;
  new IntersectionObserver(([en]) => { visivel = en.isIntersecting; }, { threshold: 0.01 }).observe(canvas);

  let pronto = false;
  // o servidor do Modal pode estar "dormindo" (10-60 s para acordar): espera bastante antes de desistir
  const vigia = setTimeout(() => { if (!pronto) desistir(); }, 120000);
  const t0 = performance.now();
  renderer.setAnimationLoop(() => {
    if (!visivel || document.hidden) return;
    const t = (performance.now() - t0) / 1000;
    if (!segurando) { alvoX *= 0.985; alvoY *= 0.985; }
    arrX += (alvoX - arrX) * 0.08; arrY += (alvoY - arrY) * 0.08;
    const balanco = PARADO ? 0 : Math.sin(t * 0.32) * 0.2;           // ~±11°, um ciclo a cada ~20 s
    const rolagem = Math.min(1, scrollY / innerHeight);
    const yaw = yaw0 + balanco + arrX;
    const pitch = pitch0 + arrY;
    camera.position.copy(p0).addScaledVector(frente, rolagem * 0.35);
    camera.quaternion.setFromEuler(new THREE.Euler(pitch, yaw, 0, "YXZ"));
    renderer.render(scene, camera);
    if (!pronto && mesh.numSplats > 0) {
      pronto = true; clearTimeout(vigia);
      window.__heroi.pronto = Math.round(performance.now() - T0);
      carga && carga.classList.add("some");
      canvas.style.opacity = 1;
    }
  });
} catch (e) {
  console.warn("cena 3D desligada:", e);
  desistir();
}
