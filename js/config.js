// SeeSpace — tudo que muda com frequência fica aqui.
// Mudou algo? Salve e rode PUBLICAR_SEESPACE.bat.
window.SITE = {
  marca: "SeeSpace",                                  // nome PROVISÓRIO (INPI ainda não conferido)
  whatsapp: "5551999866460",                          // WhatsApp de vendas (só dígitos, com 55)
  servidor: "https://vecchifefe--tour3d-web.modal.run",
  captura: "https://vecchifefe-byte.github.io/captura/",

  // Cena 3D do topo do site.
  // tipo "servidor": um tour nosso, já processado no Modal (só leitura).
  // tipo "arquivo":  um splat publicado junto com o site (ex.: cena CC BY de terceiro),
  //                  com crédito obrigatório em "credito".
  hero: {
    tipo: "arquivo",
    modo: "tela",                                      // "tela" = 3D na tela inteira; "janela" = 3D num quadro ao lado do título
    url: "cena/cena-pc.spz",                           // 1,5 milhão de splats (computador)
    urlCelular: "cena/cena-cel.spz",                   // 600 mil splats (celular)
    pos: [-4.23, 1.19, 3.53], alvo: [-2.23, 1.5, 3.46], girar: true,   // ângulo do próprio autor (SuperSplat)
    tour: "exemplo.html",                              // página aberta por "Ver um tour 3D" e pela seção "Experimente"
    imovel: "teste-noite",
    credito: "Cena de exemplo: Hotel Rusall, Lago de Como · Paolo Tosolini · CC BY 4.0"
  },

  // Preços PROVISÓRIOS (seção 1 do CLAUDE.md). Ajustar depois da conversa com a imobiliária do tio.
  planos: [
    { id: "avulso", nome: "Avulso", preco: 147, sufixo: "por espaço",
      resumo: "Para conhecer, com um espaço só.",
      itens: ["1 tour 3D completo", "Link para site, WhatsApp e redes", "Botão “Agendar visita”", "Hospedado por 6 meses"] },
    { id: "pro", nome: "Profissional", preco: 297, sufixo: "por mês", destaque: true,
      resumo: "Para quem anuncia toda semana.",
      itens: ["Até 5 tours por mês", "Sua marca e sua cor no tour", "Números de cada tour", "Hospedado enquanto assinar", "Suporte no WhatsApp"] },
    { id: "empresa", nome: "Empresa", preco: 597, sufixo: "por mês",
      resumo: "Para equipes e várias unidades.",
      itens: ["Até 15 tours por mês", "Vários usuários", "Marca da empresa", "Relatório mensal", "Atendimento prioritário"] }
  ],
  filmagemInclusa: 247,                                // "nós filmamos para você": a partir de

  // Imóveis que aparecem no painel de demonstração (ids do servidor)
  imoveisDemo: ["teste-noite"]
};

// link de WhatsApp com mensagem pronta
window.SITE.wa = (msg) => `https://wa.me/${window.SITE.whatsapp}?text=${encodeURIComponent(msg)}`;
