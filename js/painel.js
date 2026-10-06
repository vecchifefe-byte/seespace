// Painel do cliente (versão de demonstração).
// Lê os tours REAIS do servidor (só leitura: tour.json, números e estado de cada job).
// Login, marca e plano ficam no navegador até ligarmos as contas de verdade.
(() => {
  const S = window.SITE, $ = (id) => document.getElementById(id);
  const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const ler = (k, padrao) => { try { return JSON.parse(localStorage.getItem(k)) ?? padrao; } catch (e) { return padrao; } };
  const gravar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const fmt = (n) => Number(n || 0).toLocaleString("pt-BR");

  // ---------- sessão e cabeçalho
  const sessao = ler("ss_sessao", null);
  if (!sessao) { location.replace("entrar.html"); return; }
  const primeiro = (sessao.nome || "").split(/[\s.]/)[0] || "você";
  $("nome-usuario").textContent = sessao.nome;
  $("avatar").textContent = primeiro.charAt(0).toUpperCase();
  $("ola").textContent = `Olá, ${primeiro.charAt(0).toUpperCase() + primeiro.slice(1)}`;
  $("sair").onclick = () => { try { localStorage.removeItem("ss_sessao"); } catch (e) {} location.href = "index.html"; };
  document.querySelectorAll("[data-marca]").forEach((e) => (e.textContent = S.marca));
  document.querySelectorAll("[data-captura]").forEach((a) => { a.href = S.captura; a.target = "_blank"; a.rel = "noopener"; });

  // ---------- navegação entre telas
  const vistas = ["inicio", "tours", "gravacoes", "numeros", "marca", "plano"];
  function mostrar() {
    const v = vistas.includes(location.hash.slice(1)) ? location.hash.slice(1) : "inicio";
    vistas.forEach((x) => ($("v-" + x).hidden = x !== v));
    document.querySelectorAll(".lateral nav a").forEach((a) => a.classList.toggle("on", a.dataset.v === v));
    scrollTo(0, 0);
  }
  addEventListener("hashchange", mostrar); mostrar();

  const toast = (msg) => { const t = $("toast"); t.textContent = msg; t.classList.add("on"); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove("on"), 2200); };
  async function copiar(texto, msg) {
    try { await navigator.clipboard.writeText(texto); toast(msg); }
    catch (e) { prompt("Copie:", texto); }
  }

  // ---------- dados do servidor
  const get = (p) => fetch(S.servidor + p, { cache: "no-cache" }).then((r) => (r.ok ? r.json() : Promise.reject(r.status)));
  let imoveis = [];   // [{ id, nome, url, comodos:[{nome, job}], numeros, jobs:[estado] }]

  async function carregar() {
    document.querySelectorAll("[data-lista-tours]").forEach((e) => (e.innerHTML = '<div class="carregando-l"></div>'));
    $("lista-grav").innerHTML = '<div class="carregando-l" style="height:80px"></div>';
    imoveis = await Promise.all(S.imoveisDemo.map(async (id) => {
      const im = { id, nome: id, url: `${S.servidor}/i/${id}/`, comodos: [], numeros: { abriu: 0, whatsapp: 0 }, jobs: [], erro: false };
      try {
        const t = await get(`/i/${id}/tour.json`);
        im.nome = t.nome || id;
        im.comodos = (t.comodos || []).map((c) => ({ nome: c.nome || "Cômodo", job: (c.base || "").match(/\/t\/([^/]+)/)?.[1] }));
      } catch (e) { im.erro = true; }
      try { im.numeros = await get(`/i/${id}/numeros`); } catch (e) {}
      const jobs = [...new Set(im.comodos.map((c) => c.job).filter(Boolean))];
      im.jobs = await Promise.all(jobs.map(async (job) => {
        try { return { job, ...(await get(`/status/${job}`)) }; } catch (e) { return { job, estado: "erro", mensagem: "não encontrado" }; }
      }));
      return im;
    }));
    desenhar();
  }

  // ---------- telas
  const IC = {
    abrir: '<svg viewBox="0 0 24 24"><path d="M14 4h6v6M20 4l-9 9M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/></svg>',
    link: '<svg viewBox="0 0 24 24"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>',
    cod: '<svg viewBox="0 0 24 24"><path d="m8 8-4 4 4 4M16 8l4 4-4 4"/></svg>',
    zap: '<svg viewBox="0 0 24 24"><path d="M4 20l1.3-4A8 8 0 1 1 8 18.7L4 20Z"/></svg>',
    cubo: '<svg viewBox="0 0 24 24"><path d="M12 2 3 7v10l9 5 9-5V7l-9-5Z"/><path d="m3 7 9 5 9-5M12 12v10"/></svg>',
    video: '<svg viewBox="0 0 24 24"><rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3"/></svg>'
  };

  function cartaoTour(im, i) {
    if (im.erro) return `<div class="vazio">Não consegui abrir “${esc(im.id)}”. Confira a conexão e toque em Atualizar.</div>`;
    return `<article class="tour-card">
      <button class="tour-capa" data-ver="${i}" aria-label="Ver ${esc(im.nome)} em 3D">
        <span class="cub">${IC.cubo}</span><span class="play">▶ Ver em 3D</span>
      </button>
      <div class="tour-corpo">
        <h3>${esc(im.nome)}</h3>
        <div class="meta"><span>${im.comodos.length} ${im.comodos.length === 1 ? "cômodo" : "cômodos"}</span><span>${fmt(im.numeros.abriu)} aberturas</span><span>${fmt(im.numeros.whatsapp)} pedidos</span></div>
        <div class="comodos-l">${im.comodos.map((c) => `<span>${esc(c.nome)}</span>`).join("")}</div>
        <div class="acoes-t">
          <a href="${im.url}" target="_blank" rel="noopener">${IC.abrir}Abrir</a>
          <button data-link="${i}">${IC.link}Link</button>
          <button data-cod="${i}">${IC.cod}Site</button>
          <a href="https://wa.me/?text=${encodeURIComponent(`Veja ${im.nome} em 3D: ${im.url}`)}" target="_blank" rel="noopener">${IC.zap}Enviar</a>
        </div>
      </div>
    </article>`;
  }

  function desenhar() {
    const ok = imoveis.filter((i) => !i.erro);
    const soma = (f) => ok.reduce((s, i) => s + (Number(i.numeros[f]) || 0), 0);
    const todosJobs = imoveis.flatMap((i) => i.jobs);
    $("k-tours").textContent = fmt(ok.length);
    $("k-abriu").textContent = fmt(soma("abriu"));
    $("k-zap").textContent = fmt(soma("whatsapp"));
    $("k-proc").textContent = fmt(todosJobs.filter((j) => j.estado === "processando").length);

    const html = imoveis.length ? imoveis.map(cartaoTour).join("") : '<div class="vazio">Você ainda não tem tours. Toque em “Nova gravação” para começar.</div>';
    document.querySelectorAll("[data-lista-tours]").forEach((e) => (e.innerHTML = html));

    // gravações
    const nomeDoJob = (job) => { for (const im of imoveis) { const c = im.comodos.find((c) => c.job === job); if (c) return `${im.nome} · ${c.nome}`; } return job; };
    $("lista-grav").innerHTML = todosJobs.length ? todosJobs.map((j) => {
      const est = j.estado === "pronto" ? ["pronto", "Pronto"] : j.estado === "processando" ? ["processando", j.etapa ? `Processando · ${j.etapa}` : "Processando"] : ["erro", "Com problema"];
      const quando = j.atualizado ? new Date(j.atualizado * 1000).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "";
      const extra = [quando, j.minutos ? `${Math.round(j.minutos)} min de processamento` : ""].filter(Boolean).join(" · ");
      return `<div class="grav"><span class="ic">${IC.video}</span><div><h3>${esc(nomeDoJob(j.job))}</h3><small>${esc(extra)}</small></div><span class="estado ${est[0]}">${esc(est[1])}</span></div>`;
    }).join("") : '<div class="vazio">Nenhuma gravação ainda.</div>';

    // números
    $("tab-num").innerHTML = ok.map((im) => {
      const a = Number(im.numeros.abriu) || 0, w = Number(im.numeros.whatsapp) || 0, taxa = a ? (100 * w) / a : 0;
      return `<tr><td><b>${esc(im.nome)}</b></td><td>${fmt(a)}</td><td>${fmt(w)}</td><td>${taxa.toFixed(1).replace(".", ",")}%<div class="barra-mini"><i style="width:${Math.min(100, taxa * 5)}%"></i></div></td></tr>`;
    }).join("") || '<tr><td colspan="4" class="mut">Sem números ainda.</td></tr>';

    // plano
    const meu = S.planos.find((p) => p.destaque) || S.planos[0];
    const limite = Number((meu.itens[0].match(/\d+/) || [1])[0]);
    $("plano-atual").textContent = meu.nome;
    $("uso-barra").style.width = Math.min(100, (100 * ok.length) / limite) + "%";
    $("uso-txt").textContent = `${ok.length} de ${limite} tours usados este mês`;
  }

  // ações dos cartões (link, código, ver em 3D)
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-link],[data-cod],[data-ver]");
    if (!b) return;
    const im = imoveis[+(b.dataset.link ?? b.dataset.cod ?? b.dataset.ver)];
    if (b.dataset.link != null) copiar(im.url, "Link copiado");
    else if (b.dataset.cod != null) copiar(`<iframe src="${im.url}" width="100%" height="600" style="border:0;border-radius:12px" allow="fullscreen; xr-spatial-tracking" loading="lazy"></iframe>`, "Código para o site copiado");
    else { $("janela-titulo").textContent = im.nome; $("janela-tour").src = im.url; $("janela").showModal(); }
  });
  $("fechar").onclick = () => $("janela").close();
  $("janela").addEventListener("close", () => ($("janela-tour").src = "about:blank"));
  $("atualizar").onclick = carregar;

  // ---------- minha marca (prévia ao vivo, salva no navegador)
  const CORES = ["#1f8a5b", "#2563eb", "#7c3aed", "#db2777", "#ea580c", "#0f766e", "#111827"];
  const marca = ler("ss_marca", { nome: "", cor: CORES[0], zap: "" });
  $("m-nome").value = marca.nome; $("m-zap").value = marca.zap;
  $("cores").innerHTML = CORES.map((c) => `<button type="button" style="background:${c}" data-cor="${c}" aria-label="Cor ${c}" aria-pressed="${c === marca.cor}"></button>`).join("");
  function previa() {
    $("pm-nome").textContent = $("m-nome").value.trim() || "Sua Marca";
    $("pm-chip").style.background = marca.cor; $("pm-chip").style.borderColor = marca.cor;
    $("pm-zap").style.background = marca.cor; $("pm-zap").style.color = "#fff";
    $("pedir-marca").href = S.wa(`Olá! Quero mudar a marca dos meus tours: nome "${$("m-nome").value.trim()}", cor ${marca.cor}, WhatsApp ${$("m-zap").value.trim()}.`);
    $("pedir-marca").target = "_blank";
  }
  $("cores").onclick = (e) => { const b = e.target.closest("[data-cor]"); if (!b) return; marca.cor = b.dataset.cor; $("cores").querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", x === b)); previa(); };
  $("m-nome").oninput = $("m-zap").oninput = previa;
  $("form-marca").onsubmit = (e) => { e.preventDefault(); marca.nome = $("m-nome").value.trim(); marca.zap = $("m-zap").value.trim(); gravar("ss_marca", marca); toast("Marca salva neste navegador"); };
  previa();

  // ---------- planos (trocar = WhatsApp)
  const ok = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
  $("planos-mini").innerHTML = S.planos.map((p) => `
    <article class="plano${p.destaque ? " destaque" : ""}">
      ${p.destaque ? '<span class="tag">Seu plano</span>' : ""}
      <h3>${p.nome}</h3><p class="res">${p.resumo}</p>
      <div class="preco"><small>R$</small><b>${p.preco}</b><small>${p.sufixo}</small></div>
      <ul>${p.itens.map((i) => `<li>${ok}<span>${i}</span></li>`).join("")}</ul>
      ${p.destaque ? '<span class="btn btn-vidro" aria-disabled="true">Plano atual</span>'
        : `<a class="btn btn-vidro" target="_blank" rel="noopener" href="${S.wa(`Olá! Quero mudar para o plano ${p.nome} do ${S.marca}.`)}">Mudar para este</a>`}
    </article>`).join("");

  carregar();
})();
