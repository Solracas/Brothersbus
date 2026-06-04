const WA = "244954929881";
const PASS_ADMIN = "brothers2025";

const FOTOS = {
  1: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&q=80",
  2: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&q=80",
  3: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80",
  4: "https://images.unsplash.com/photo-1551954810-43cd27cce4e8?w=600&q=80",
  5: "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=600&q=80",
  6: "https://images.unsplash.com/photo-1593359677879-a4bb92f829e1?w=600&q=80"
};

const CATALOG_BASE = [
  { id:1, nome:"Huawei Y7 Prime", preco:37000, categoria:"Tecnologia", descricao:"Bateria 4000mAh, ecrã 6.26\", Snapdragon 450, 3GB RAM. Bom estado, sem riscos.", imagem:FOTOS[1], criadorId:"admin", criadorNome:"Carlos CJ", whatsapp:WA },
  { id:2, nome:"Notebook Dell Inspiron", preco:289000, categoria:"Tecnologia", descricao:"Intel i5, 8GB RAM, SSD 256GB, ecrã 15.6\". Com carregador original.", imagem:FOTOS[2], criadorId:"admin", criadorNome:"Carlos CJ", whatsapp:WA },
  { id:3, nome:"Auscultadores Bluetooth", preco:6000, categoria:"Tecnologia", descricao:"Cancelamento de ruído, 20h bateria. Almofadas confortáveis para uso prolongado.", imagem:FOTOS[3], criadorId:"admin", criadorNome:"Carlos CJ", whatsapp:WA },
  { id:4, nome:"Camisa Real Madrid 2024", preco:7000, categoria:"Moda", descricao:"Tamanho XL, algodão premium. Original com etiqueta.", imagem:FOTOS[4], criadorId:"admin", criadorNome:"Carlos CJ", whatsapp:WA },
  { id:5, nome:"Frigorífico Frost Free 400L", preco:140000, categoria:"Casa", descricao:"400L, acabamento inox, classe energética A+. Pouco uso.", imagem:FOTOS[5], criadorId:"admin", criadorNome:"MarketFlow", whatsapp:WA },
  { id:6, nome:"Smart TV 50\" 4K", preco:185000, categoria:"Casa", descricao:"4K HDR, Android TV, Wi-Fi. Com controlo remoto e cabos originais.", imagem:FOTOS[6], criadorId:"admin", criadorNome:"MarketFlow", whatsapp:WA }
];

// estado da aplicação
let utilizador = null;
let produtos = [];
let carrinho = [];
let busca = "";
let categoria = "todos";
let ordem = "recente";
let prodAberto = null;
let qty = 1, corSel = "", tamSel = "", notaSel = 0;

// utils
const $ = id => document.getElementById(id);
const esc = s => !s ? "" : String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const kz = v => Number(v).toLocaleString("pt-AO") + " Kz";
const fallback = "https://images.unsplash.com/photo-1588421357574-87938a86fa28?w=400&q=60";

function nota(msg, tipo) {
  const el = $("notificacao");
  el.textContent = msg;
  el.className = "notificacao visivel " + (tipo || "");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.className = "notificacao", 2800);
}

// utilizador
function carregarUtilizador() {
  try { const s = localStorage.getItem("bb_user"); if (s) utilizador = JSON.parse(s); } catch(e) {}
  renderAuth();
}
function guardarUtilizador(u) {
  utilizador = u;
  u ? localStorage.setItem("bb_user", JSON.stringify(u)) : localStorage.removeItem("bb_user");
  renderAuth();
}
function entrar(nome, via) {
  if (!nome?.trim()) { nota("Escreve o teu nome.", "err"); return; }
  guardarUtilizador({ id: "u" + Date.now(), nome: nome.trim(), via: via || "manual" });
  fecharLogin();
  nota("Bem-vindo(a), " + utilizador.nome + "! 👋", "ok");
  renderProdutos();
}
function sair() {
  if (!confirm("Sair da conta?")) return;
  guardarUtilizador(null);
  renderProdutos();
  nota("Sessão encerrada.");
}
function renderAuth() {
  const z = $("zonaAuth"); if (!z) return;
  z.innerHTML = utilizador
    ? `<div class="chip-user"><i class="fas fa-user-circle"></i><span>${esc(utilizador.nome)}</span><button class="btn-sair" onclick="sair()"><i class="fas fa-sign-out-alt"></i></button></div>`
    : `<button class="btn-auth" onclick="abrirLogin()"><i class="fas fa-user-plus"></i> Entrar</button>`;
}

// modais login
function abrirLogin() {
  $("modalLogin").classList.add("visivel");
  document.body.style.overflow = "hidden";
  setTimeout(() => $("loginNome")?.focus(), 80);
}
function fecharLogin() {
  $("modalLogin").classList.remove("visivel");
  document.body.style.overflow = "";
}

// produtos
function carregarProdutos() {
  try { const s = localStorage.getItem("bb_produtos"); if (s) produtos = JSON.parse(s); } catch(e) {}
  if (!produtos.length) { produtos = JSON.parse(JSON.stringify(CATALOG_BASE)); guardarProdutos(); }
  $("totalProdutos").textContent = produtos.length;
}
function guardarProdutos() {
  localStorage.setItem("bb_produtos", JSON.stringify(produtos));
}

function renderProdutos() {
  let lista = [...produtos];
  if (categoria !== "todos") lista = lista.filter(p => p.categoria === categoria);
  if (busca) {
    const t = busca.toLowerCase();
    lista = lista.filter(p => p.nome.toLowerCase().includes(t) || p.descricao.toLowerCase().includes(t));
  }
  if (ordem === "barato") lista.sort((a,b) => a.preco - b.preco);
  if (ordem === "caro")   lista.sort((a,b) => b.preco - a.preco);

  const g = $("grelha"), sr = $("semResultados");
  if (!g) return;

  if (!lista.length) { g.innerHTML = ""; sr.hidden = false; return; }
  sr.hidden = true;

  g.innerHTML = lista.map(p => {
    const meu = utilizador && p.criadorId === utilizador.id;
    const avs = JSON.parse(localStorage.getItem("av_" + p.id) || "[]");
    const media = avs.length ? (avs.reduce((s,a) => s + a.nota, 0) / avs.length).toFixed(1) : null;
    return `<div class="produto" data-id="${p.id}">
      <div class="produto-foto">
        <img src="${esc(p.imagem)}" alt="${esc(p.nome)}" onerror="this.src='${fallback}'">
        <span class="produto-cat">${esc(p.categoria || "Outros")}</span>
      </div>
      <div class="produto-info">
        <h4>${esc(p.nome)}</h4>
        <div class="produto-preco">${kz(p.preco)}</div>
        <div class="produto-desc">${esc(p.descricao)}</div>
        <div class="produto-rodape">
          <div class="produto-vendedor"><i class="fas fa-user"></i>${esc(p.criadorNome)}${media ? ` · ⭐${media}` : ""}</div>
          <button class="btn-remover" data-id="${p.id}" ${!meu ? "disabled" : ""}><i class="fas fa-trash-alt"></i></button>
        </div>
      </div>
    </div>`;
  }).join("");

  g.querySelectorAll(".btn-remover:not([disabled])").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      if (!confirm("Remover este anúncio?")) return;
      produtos = produtos.filter(p => p.id != btn.dataset.id);
      guardarProdutos();
      $("totalProdutos").textContent = produtos.length;
      renderProdutos();
      nota("Anúncio removido.", "err");
    });
  });
  g.querySelectorAll(".produto").forEach(card => {
    card.addEventListener("click", e => {
      if (e.target.closest(".btn-remover")) return;
      abrirProduto(+card.dataset.id);
    });
  });
}

// modal produto
function abrirProduto(id) {
  const p = produtos.find(x => x.id === id); if (!p) return;
  prodAberto = p; qty = 1; corSel = ""; tamSel = ""; notaSel = 0;

  $("mFoto").src = p.imagem;
  $("mFoto").onerror = () => $("mFoto").src = fallback;
  $("mNome").textContent = p.nome;
  $("mPreco").textContent = kz(p.preco);
  $("mVendedor").innerHTML = `<i class="fas fa-user"></i> ${esc(p.criadorNome)}`;
  $("mDesc").textContent = p.descricao;
  $("mCatTag").textContent = p.categoria || "Outros";
  $("qtyNum").textContent = 1;

  const cB = $("mCoresBloco"), tB = $("mTamBloco");
  if (p.cores?.length) {
    cB.hidden = false;
    $("mCores").innerHTML = p.cores.map(c => `<button class="opt" onclick="escolherCor('${esc(c)}',this)">${esc(c)}</button>`).join("");
    $("mCorLabel").textContent = "";
  } else cB.hidden = true;

  if (p.tamanhos?.length) {
    tB.hidden = false;
    $("mTams").innerHTML = p.tamanhos.map(t => `<button class="opt" onclick="escolherTam('${esc(t)}',this)">${esc(t)}</button>`).join("");
  } else tB.hidden = true;

  renderEstrelas();

  const avs = JSON.parse(localStorage.getItem("av_" + p.id) || "[]");
  const avsB = $("mAvsBloco");
  if (avs.length) {
    avsB.hidden = false;
    $("mAvsList").innerHTML = avs.map(a => `
      <div class="av">
        <strong>${esc(a.nome)}</strong>
        <div class="av-stars">${"★".repeat(a.nota)}${"☆".repeat(5-a.nota)}</div>
        ${a.texto ? `<p>${esc(a.texto)}</p>` : ""}
      </div>`).join("");
  } else avsB.hidden = true;

  actualizarResumo();
  $("modalProduto").classList.add("visivel");
  document.body.style.overflow = "hidden";
}
function fecharProduto() {
  $("modalProduto").classList.remove("visivel");
  document.body.style.overflow = "";
  prodAberto = null;
}
function escolherCor(c, btn) {
  corSel = c;
  $("mCores").querySelectorAll(".opt").forEach(b => b.classList.remove("sel"));
  btn.classList.add("sel");
  $("mCorLabel").textContent = "Seleccionada: " + c;
  actualizarResumo();
}
function escolherTam(t, btn) {
  tamSel = t;
  $("mTams").querySelectorAll(".opt").forEach(b => b.classList.remove("sel"));
  btn.classList.add("sel");
  actualizarResumo();
}
function renderEstrelas() {
  $("mEstrelas").innerHTML = [1,2,3,4,5].map(n =>
    `<span class="estrela ${n<=notaSel?"ativa":""}" onclick="escolherEstrela(${n})">★</span>`
  ).join("");
  $("mEstrelasLabel").textContent = notaSel ? notaSel + " estrela(s)" : "Clica para avaliar";
}
function escolherEstrela(n) { notaSel = n; renderEstrelas(); }
function actualizarResumo() {
  if (!prodAberto) return;
  let txt = `Produto: <strong>${esc(prodAberto.nome)}</strong><br>`;
  if (corSel) txt += `Cor: <strong>${esc(corSel)}</strong><br>`;
  if (tamSel) txt += `Tamanho: <strong>${esc(tamSel)}</strong><br>`;
  txt += `Quantidade: <strong>${qty}</strong>`;
  $("mResumoTxt").innerHTML = txt;
  $("mTotal").textContent = kz(prodAberto.preco * qty);
}
function confirmarWA() {
  if (!prodAberto) return;
  if (!utilizador) { fecharProduto(); abrirLogin(); return; }
  if (notaSel) {
    const key = "av_" + prodAberto.id;
    const avs = JSON.parse(localStorage.getItem(key) || "[]");
    avs.push({ nome: utilizador.nome, nota: notaSel, texto: $("mComentario")?.value || "" });
    localStorage.setItem(key, JSON.stringify(avs));
  }
  const num = prodAberto.whatsapp || WA;
  const msg = `Olá! Tenho interesse em: *${prodAberto.nome}*\nPreço: *${kz(prodAberto.preco)}*${corSel?`\nCor: *${corSel}*`:""}${tamSel?`\nTamanho: *${tamSel}*`:""}\nQuantidade: *${qty}*\nTotal: *${kz(prodAberto.preco*qty)}*\nMeu nome: *${utilizador.nome}*`;
  window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, "_blank");
}

// carrinho
function addCarrinho() {
  if (!prodAberto) return;
  if (!utilizador) { fecharProduto(); abrirLogin(); return; }
  const item = carrinho.find(i => i.id===prodAberto.id && i.cor===corSel && i.tam===tamSel);
  if (item) item.qty += qty;
  else carrinho.push({ id:prodAberto.id, nome:prodAberto.nome, preco:prodAberto.preco, foto:prodAberto.imagem, cor:corSel, tam:tamSel, qty });
  actualizarBadgeCarrinho();
  nota(prodAberto.nome + " adicionado! 🛍️", "ok");
}
function actualizarBadgeCarrinho() {
  const total = carrinho.reduce((s,i) => s+i.qty, 0);
  const b = $("badgeCarrinho");
  b.textContent = total;
  b.hidden = total === 0;
}
function abrirCarrinho() {
  $("gavetaCarrinho").classList.add("aberta");
  $("overlayCarrinho").classList.add("visivel");
  document.body.style.overflow = "hidden";
  renderCarrinho();
}
function fecharCarrinho() {
  $("gavetaCarrinho").classList.remove("aberta");
  $("overlayCarrinho").classList.remove("visivel");
  document.body.style.overflow = "";
}
function renderCarrinho() {
  const itens = $("gavetaItens"), rod = $("gavetaRodape");
  if (!carrinho.length) {
    itens.innerHTML = `<div class="carrinho-vazio"><span>🛍️</span><p>Ainda não adicionaste nada</p></div>`;
    rod.hidden = true; return;
  }
  itens.innerHTML = carrinho.map((item,i) => `
    <div class="item-carrinho">
      <img src="${esc(item.foto)}" onerror="this.src='${fallback}'" alt="">
      <div class="item-info">
        <h5>${esc(item.nome)}</h5>
        <b>${kz(item.preco)}</b>
        <small>Qty: ${item.qty}${item.cor?" · "+item.cor:""}${item.tam?" · "+item.tam:""}</small>
      </div>
      <button onclick="removerCarrinho(${i})"><i class="fas fa-times"></i></button>
    </div>`).join("");
  $("totalCarrinho").textContent = kz(carrinho.reduce((s,i) => s+i.preco*i.qty, 0));
  rod.hidden = false;
}
function removerCarrinho(i) { carrinho.splice(i,1); actualizarBadgeCarrinho(); renderCarrinho(); }
function checkoutWA() {
  if (!utilizador) { fecharCarrinho(); abrirLogin(); return; }
  if (!carrinho.length) return;
  let msg = "Olá! Quero encomendar:\n\n";
  carrinho.forEach(i => msg += `• *${i.nome}* ×${i.qty} = *${kz(i.preco*i.qty)}*${i.cor?" ("+i.cor+")":""}${i.tam?" ("+i.tam+")":""}\n`);
  msg += `\n*Total: ${kz(carrinho.reduce((s,i)=>s+i.preco*i.qty,0))}*\nNome: *${utilizador.nome}*`;
  window.open(`https://wa.me/${WA}?text=${encodeURIComponent(msg)}`, "_blank");
}

// formulário venda
function setupVenda() {
  ["nProd","pProd","dProd","iProd"].forEach(id => $("" + id)?.addEventListener("input", actualizarPreview));

  $("formVenda")?.addEventListener("submit", e => {
    e.preventDefault();
    if (!utilizador) { nota("Precisas de entrar para anunciar.", "err"); abrirLogin(); return; }
    const nome = $("nProd").value.trim();
    const preco = parseFloat($("pProd").value);
    const desc = $("dProd").value.trim();
    const img = $("iProd").value.trim();
    const wa = $("wProd").value.trim();
    const cat = document.querySelector("input[name='cat']:checked")?.value || "Outros";
    if (!nome) { nota("Escreve o nome do produto.", "err"); return; }
    if (!preco || preco <= 0) { nota("Preço inválido.", "err"); return; }
    produtos.push({
      id: Date.now(), nome, preco, categoria: cat,
      descricao: desc || "Sem descrição.",
      imagem: img || fallback,
      whatsapp: wa || WA,
      criadorId: utilizador.id, criadorNome: utilizador.nome
    });
    guardarProdutos();
    $("totalProdutos").textContent = produtos.length;
    nota("Anúncio publicado! 🎉", "ok");
    $("formVenda").reset();
    setTimeout(() => irPara("comprar"), 900);
  });
}
function actualizarPreview() {
  const nome  = $("nProd")?.value || "Nome do produto";
  const preco = parseFloat($("pProd")?.value) || 0;
  const desc  = $("dProd")?.value || "Descrição...";
  const img   = $("iProd")?.value || "";
  $("prevNome").textContent  = nome;
  $("prevPreco").textContent = kz(preco);
  $("prevDesc").textContent  = desc.substring(0, 72);
  const f = $("previewFoto");
  if (img.startsWith("http")) {
    f.innerHTML = `<img src="${esc(img)}" onerror="this.parentElement.textContent='📷'" style="width:100%;height:100%;object-fit:cover">`;
  } else f.textContent = "📷";
}

// IA
async function gerarDescricao() {
  const nome  = $("nProd")?.value?.trim();
  const preco = $("pProd")?.value;
  const cat   = document.querySelector("input[name='cat']:checked")?.value || "produto";
  if (!nome) { nota("Escreve o nome do produto primeiro.", "err"); return; }
  const btn = $("btnGerarDesc"), loader = $("iaLoader");
  btn.disabled = true; loader.hidden = false;
  pushMsgIA("Gerar descrição para: \"" + nome + "\"", "user");
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: "Escreves descrições curtas e apelativas para anúncios num marketplace angolano. Português europeu. Máximo 2-3 frases. Sem emojis. Responde APENAS com a descrição.",
        messages: [{ role: "user", content: `Produto: ${nome}\nCategoria: ${cat}${preco?`\nPreço: ${preco} Kz`:""}` }]
      })
    });
    const data = await r.json();
    const texto = data.content?.[0]?.text || "";
    if (texto) {
      $("dProd").value = texto;
      actualizarPreview();
      pushMsgIA("Pronto! Podes editar à vontade. ✅", "bot");
      nota("Descrição gerada! ✨", "ok");
    }
  } catch(err) {
    pushMsgIA("Erro ao contactar a IA. Tenta novamente.", "bot");
    nota("Falha ao gerar descrição.", "err");
  } finally { btn.disabled = false; loader.hidden = true; }
}
async function enviarChat() {
  const input = $("chatInput");
  const msg = input?.value?.trim(); if (!msg) return;
  input.value = ""; pushMsgIA(msg, "user");
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: "És o assistente do marketplace Brother's Business Angola. Ajudas vendedores com dicas práticas. Respostas curtas em português europeu, máximo 3 frases.",
        messages: [{ role: "user", content: msg }]
      })
    });
    const data = await r.json();
    pushMsgIA(data.content?.[0]?.text || "Não consegui responder.", "bot");
  } catch(e) { pushMsgIA("Erro de ligação.", "bot"); }
}
function pushMsgIA(texto, tipo) {
  const box = $("chatMsgs"); if (!box) return;
  const d = document.createElement("div");
  d.className = "msg " + tipo;
  d.innerHTML = esc(texto);
  box.appendChild(d);
  box.scrollTop = box.scrollHeight;
}

// navegação
function irPara(sec) {
  document.querySelectorAll(".secao").forEach(s => s.classList.remove("ativa"));
  document.querySelectorAll(".nav-topo a").forEach(a => {
    a.classList.toggle("ativo", a.dataset.sec === sec);
  });
  $("sec-" + sec)?.classList.add("ativa");
  if (sec === "comprar") renderProdutos();
  const topo = document.querySelector("main")?.offsetTop || 0;
  window.scrollTo({ top: topo, behavior: "smooth" });
}

// menu lateral
function abrirMenu() {
  $("menuLateral").classList.add("aberto");
  $("overlayMenu").classList.add("aberto");
  document.body.style.overflow = "hidden";
}
function fecharMenu() {
  $("menuLateral").classList.remove("aberto");
  $("overlayMenu").classList.remove("aberto");
  document.body.style.overflow = "";
}

// painéis laterais
const PAINEIS = {
  sobre: {
    titulo: "Sobre nós",
    html() {
      return `
        <div class="bloco-painel">
          <div style="display:flex;gap:12px;align-items:center">
            <img src="logo-bb.png" style="width:50px;height:50px;border-radius:12px;object-fit:cover">
            <div><h4 style="margin:0">Brother's Business</h4><span class="tag-painel">Angola 🇦🇴</span></div>
          </div>
          <p>O <strong>Brother's Business</strong> é um marketplace criado para facilitar a compra e venda em Angola de forma directa, sem intermediários e sem taxas — tudo resolvido pelo WhatsApp.</p>
          <p>Acreditamos que comprar e vender não precisa de ser complicado. O nosso objectivo é ligar pessoas, não burocracias.</p>
        </div>
        <div class="bloco-painel">
          <h4>Os nossos valores</h4>
          <p>✅ Transparência total entre comprador e vendedor<br>✅ Plataforma 100% gratuita para anunciar<br>✅ Apoio à economia local angolana<br>✅ Sem comissões, sem truques</p>
        </div>
        <div class="bloco-painel">
          <h4>Contacto directo</h4>
          <p>WhatsApp: <strong>+244 954 929 881</strong></p>
        </div>`;
    }
  },
  novidades: {
    titulo: "Novidades",
    html() { return renderNovidades(false); }
  },
  apoio: {
    titulo: "Apoio ao cliente",
    html() {
      return `
        <div class="bloco-painel"><p>Estamos disponíveis para responder rapidamente.</p></div>
        <a class="apoio-link" href="https://wa.me/244954929881?text=Olá! Preciso de ajuda." target="_blank">
          <i class="fab fa-whatsapp" style="color:#25D366"></i>
          <div><strong>WhatsApp</strong><span>+244 954 929 881 · Resposta rápida</span></div>
        </a>
        <div class="apoio-link" onclick="irPara('contato');fecharPainel()">
          <i class="fas fa-envelope"></i>
          <div><strong>Formulário de mensagem</strong><span>Para questões mais detalhadas</span></div>
        </div>
        <div class="bloco-painel">
          <h4>Horário</h4>
          <p>Segunda a Domingo · 08h00 às 22h00<br>Resposta média em menos de 1 hora.</p>
        </div>
        <div class="bloco-painel">
          <h4>Como funciona?</h4>
          <p>Não intermediamos pagamentos. Toda a negociação é feita directamente entre as partes via WhatsApp. O Brother's Business é apenas o ponto de encontro.</p>
        </div>`;
    }
  },
  privacidade: {
    titulo: "Privacidade",
    html() {
      return `
        <span class="tag-painel">Última actualização: Maio 2025</span>
        <div class="bloco-painel">
          <h4>O que guardamos</h4>
          <p>Apenas o nome que introduzes voluntariamente e os anúncios que publicas. Estes dados ficam guardados localmente no teu browser — não são enviados para nenhum servidor.</p>
        </div>
        <div class="bloco-painel">
          <h4>WhatsApp</h4>
          <p>Ao confirmar interesse num produto, és redirrecionado para o WhatsApp. O conteúdo dessas conversas não nos pertence nem é armazenado.</p>
        </div>
        <div class="bloco-painel">
          <h4>Os teus dados</h4>
          <p>Podes apagar tudo a qualquer momento limpando os dados do browser. Os teus anúncios podem ser removidos directamente na plataforma.</p>
        </div>`;
    }
  },
  faq: {
    titulo: "Perguntas frequentes",
    html() {
      const perguntas = [
        ["Como publico um anúncio?", "Vai a Anunciar, preenche o nome, preço e descrição do produto e clica em Publicar. É grátis e instantâneo."],
        ["Como funciona a compra?", "Clica no produto, escolhe as opções e confirma o interesse. Serás redirrecionado para o WhatsApp do vendedor para negociar directamente."],
        ["Os meus anúncios ficam guardados?", "Sim, ficam guardados no teu dispositivo. Se limpares os dados do browser, os anúncios são removidos."],
        ["Posso anunciar qualquer produto?", "Podes anunciar produtos legais. Produtos ilegais, falsificados ou perigosos são proibidos."],
        ["Cobram alguma comissão?", "Não. O Brother's Business é 100% gratuito, sem comissões sobre vendas."],
        ["Como apago o meu anúncio?", "Na lista de produtos, aparece um ícone de lixo nos teus anúncios. Clica para remover."]
      ];
      return `
        <div class="bloco-painel"><p>As dúvidas mais comuns sobre o Brother's Business.</p></div>
        <div style="display:flex;flex-direction:column;gap:7px">
          ${perguntas.map(([p,r]) => `
            <div class="faq-item">
              <div class="faq-pergunta" onclick="toggleFaq(this)">${p}<i class="fas fa-chevron-down"></i></div>
              <div class="faq-resposta"><p>${r}</p></div>
            </div>`).join("")}
        </div>`;
    }
  },
  admin: {
    titulo: "Painel admin",
    html() {
      if (sessionStorage.getItem("bb_admin") !== "1") {
        return `
          <div class="admin-bloqueado">
            <i class="fas fa-lock"></i>
            <h4>Área restrita</h4>
            <p>Esta área é exclusiva para o administrador.</p>
            <div style="display:flex;flex-direction:column;gap:8px;text-align:left">
              <label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.08em;color:var(--txt3);font-weight:600">Palavra-passe</label>
              <input type="password" id="inputPassAdmin" class="input-admin" placeholder="••••••••">
            </div>
            <button class="btn-publicar" style="margin-top:12px;width:100%" onclick="tentarAdmin()"><i class="fas fa-unlock"></i> Entrar</button>
          </div>`;
      }
      return `
        <div class="form-admin">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
            <span class="tag-painel"><i class="fas fa-check-circle"></i> Admin activo</span>
            <button onclick="sessionStorage.removeItem('bb_admin');abrirPainel('admin')" style="background:none;border:none;color:#c95252;cursor:pointer;font-size:.8rem"><i class="fas fa-sign-out-alt"></i> Sair</button>
          </div>

          <h4><i class="fas fa-chart-line" style="color:var(--ouro)"></i> Visitas ao site</h4>
          ${renderVisitas()}

          <hr style="border-color:var(--borda);margin:4px 0">

          <h4>Publicar novidade</h4>
          <div>
            <label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.08em;color:var(--txt3);font-weight:600;display:block;margin-bottom:6px">Título</label>
            <input type="text" id="novTitulo" class="input-admin" placeholder="Ex: Nova funcionalidade disponível">
          </div>
          <div>
            <label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.08em;color:var(--txt3);font-weight:600;display:block;margin-bottom:6px">Descrição</label>
            <textarea id="novTexto" class="textarea-admin" placeholder="Descreve a novidade..."></textarea>
          </div>
          <button class="btn-publicar" onclick="publicarNovidade()"><i class="fas fa-paper-plane"></i> Publicar</button>
          <hr style="border-color:var(--borda);margin:4px 0">
          <h4>Novidades publicadas</h4>
          <div id="listaNovidadesAdmin">${renderNovidades(true)}</div>
        </div>`;
    }
  }
};

function abrirPainel(chave) {
  const p = PAINEIS[chave]; if (!p) return;
  $("painelTitulo").textContent = p.titulo;
  $("painelCorpo").innerHTML = p.html();
  $("painelLateral").classList.add("aberto");
  $("overlayPainel").classList.add("aberto");
  document.body.style.overflow = "hidden";
}
function fecharPainel() {
  $("painelLateral").classList.remove("aberto");
  $("overlayPainel").classList.remove("aberto");
  document.body.style.overflow = "";
}

// novidades / admin
function getNovidades() {
  try { return JSON.parse(localStorage.getItem("bb_novidades") || "[]"); } catch(e) { return []; }
}
function guardarNovidades(arr) { localStorage.setItem("bb_novidades", JSON.stringify(arr)); }

function renderNovidades(adminMode) {
  const novs = getNovidades();
  const defaults = [
    { id:"d1", titulo:"🚀 Lançamento do Brother's Business 2.0", data:"31 Mai 2025", texto:"Nova versão com design renovado, IA integrada para descrições automáticas, carrinho de compras e muito mais.", nova:true },
    { id:"d2", titulo:"🤖 Descrições automáticas com IA", data:"31 Mai 2025", texto:"Podes agora gerar descrições profissionais para os teus produtos em segundos usando inteligência artificial.", nova:true }
  ];
  const todos = [...novs, ...defaults];
  if (!todos.length) return `<p style="color:var(--txt2);text-align:center;padding:40px">Sem novidades ainda.</p>`;
  return `<div style="display:flex;flex-direction:column;gap:10px">${todos.map(n => `
    <div class="cartao-novidade">
      <div class="cartao-novidade-topo">
        <h5>${esc(n.titulo)}</h5>
        ${n.nova ? `<span class="tag-novo">Novo</span>` : ""}
      </div>
      <div class="data-nov"><i class="fas fa-calendar" style="color:var(--ouro);margin-right:4px"></i>${esc(n.data)}</div>
      <p>${esc(n.texto)}</p>
      ${adminMode && !n.id?.startsWith("d") ? `<button class="btn-apagar-nov" onclick="apagarNovidade('${n.id}')"><i class="fas fa-trash-alt"></i> Apagar</button>` : ""}
    </div>`).join("")}</div>`;
}

function tentarAdmin() {
  const val = $("inputPassAdmin")?.value;
  if (val === PASS_ADMIN) { sessionStorage.setItem("bb_admin","1"); abrirPainel("admin"); }
  else nota("Palavra-passe incorrecta.", "err");
}
function publicarNovidade() {
  const titulo = $("novTitulo")?.value?.trim();
  const texto  = $("novTexto")?.value?.trim();
  if (!titulo || !texto) { nota("Preenche o título e a descrição.", "err"); return; }
  const novs = getNovidades();
  const data = new Date().toLocaleDateString("pt-PT", { day:"numeric", month:"long", year:"numeric" });
  novs.unshift({ id:"n"+Date.now(), titulo, texto, data, nova:true });
  guardarNovidades(novs);
  $("listaNovidadesAdmin").innerHTML = renderNovidades(true);
  $("novTitulo").value = ""; $("novTexto").value = "";
  nota("Novidade publicada! 🎉", "ok");
}
function apagarNovidade(id) {
  if (!confirm("Apagar esta novidade?")) return;
  guardarNovidades(getNovidades().filter(n => n.id !== id));
  $("listaNovidadesAdmin").innerHTML = renderNovidades(true);
  nota("Apagada.", "err");
}

// FAQ
function toggleFaq(el) {
  const r = el.nextElementSibling;
  const aberta = r.classList.contains("aberta");
  document.querySelectorAll(".faq-pergunta").forEach(q => { q.classList.remove("aberta"); q.nextElementSibling.classList.remove("aberta"); });
  if (!aberta) { el.classList.add("aberta"); r.classList.add("aberta"); }
}

// visitas
function registarVisita() {
  const agora = new Date();
  const hoje  = agora.toISOString().slice(0,10);
  const sessKey = "bb_sess_" + hoje;
  if (sessionStorage.getItem(sessKey)) return;
  sessionStorage.setItem(sessKey, "1");

  let s = {};
  try { s = JSON.parse(localStorage.getItem("bb_visitas") || "{}"); } catch(e) {}
  s.hoje = s.hoje || {};
  s.semana = s.semana || {};
  s.mes = s.mes || {};
  s.total = (s.total || 0) + 1;
  s.historico = s.historico || [];

  const sem = semanaKey(agora);
  const mes = agora.toISOString().slice(0,7);
  s.hoje[hoje]  = (s.hoje[hoje]  || 0) + 1;
  s.semana[sem] = (s.semana[sem] || 0) + 1;
  s.mes[mes]    = (s.mes[mes]    || 0) + 1;
  s.historico.push({ ts: agora.toISOString(), dia: hoje });
  if (s.historico.length > 200) s.historico = s.historico.slice(-200);
  localStorage.setItem("bb_visitas", JSON.stringify(s));
}
function semanaKey(d) {
  const x = new Date(d);
  x.setHours(0,0,0,0);
  x.setDate(x.getDate() - x.getDay());
  return x.toISOString().slice(0,10);
}
function getVisitas() {
  let s = {};
  try { s = JSON.parse(localStorage.getItem("bb_visitas") || "{}"); } catch(e) {}
  const agora = new Date();
  return {
    hoje:   (s.hoje  && s.hoje[agora.toISOString().slice(0,10)]) || 0,
    semana: (s.semana && s.semana[semanaKey(agora)]) || 0,
    mes:    (s.mes   && s.mes[agora.toISOString().slice(0,7)]) || 0,
    total:  s.total || 0,
    dias:   s.hoje || {}
  };
}
function renderVisitas() {
  const v = getVisitas();
  const agora = new Date();
  const mesLabel = agora.toLocaleDateString("pt-PT", { month:"long", year:"numeric" });

  const dias = Array.from({ length: 7 }, (_,i) => {
    const d = new Date(agora);
    d.setDate(d.getDate() - (6-i));
    const key = d.toISOString().slice(0,10);
    return { key, count: v.dias[key] || 0, label: d.toLocaleDateString("pt-PT", { weekday:"short" }), hoje: key===agora.toISOString().slice(0,10) };
  });
  const max = Math.max(...dias.map(d=>d.count), 1);

  return `
    <div class="grelha-stats">
      <div class="cartao-stat"><b>${v.hoje}</b><small><i class="fas fa-sun"></i> Hoje</small></div>
      <div class="cartao-stat"><b>${v.semana}</b><small><i class="fas fa-calendar-week"></i> Esta semana</small></div>
      <div class="cartao-stat"><b>${v.mes}</b><small><i class="fas fa-calendar-alt"></i> ${mesLabel}</small></div>
      <div class="cartao-stat" style="border-color:rgba(201,151,58,0.28)"><b>${v.total}</b><small><i class="fas fa-users"></i> Total</small></div>
    </div>
    <div class="grafico-semana">
      <div class="label-g"><i class="fas fa-chart-bar" style="color:var(--ouro)"></i> Últimos 7 dias</div>
      <div class="barras">
        ${dias.map(d => {
          const h = Math.max((d.count/max)*100, d.count>0?8:3);
          return `<div class="barra-dia ${d.hoje?"hoje":""}">
            <span class="num">${d.count||""}</span>
            <div class="barra" style="height:${h}%;background:${d.hoje?"var(--ouro)":"rgba(201,151,58,0.3)"}"></div>
            <span class="dia-label">${d.label}</span>
          </div>`;
        }).join("")}
      </div>
    </div>
    <div class="nota-visitas"><i class="fas fa-info-circle" style="color:var(--ouro);margin-right:5px"></i>Contagem por sessão única. Dados guardados neste dispositivo.</div>
    <button class="btn-apagar-nov" onclick="if(confirm('Apagar todas as estatísticas?')){localStorage.removeItem('bb_visitas');abrirPainel('admin');nota('Estatísticas apagadas.','err')}"><i class="fas fa-trash-alt"></i> Resetar estatísticas</button>`;
}

// init
document.addEventListener("DOMContentLoaded", () => {
  registarVisita();
  carregarUtilizador();
  carregarProdutos();
  renderProdutos();
  setupVenda();

  // nav topo
  document.querySelectorAll(".nav-topo a[data-sec]").forEach(a => {
    a.addEventListener("click", e => { e.preventDefault(); irPara(a.dataset.sec); });
  });

  // filtros
  $("campoBusca")?.addEventListener("input", e => { busca = e.target.value; renderProdutos(); });
  document.querySelectorAll(".cat").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".cat").forEach(b => b.classList.remove("ativa"));
      btn.classList.add("ativa");
      categoria = btn.dataset.cat;
      renderProdutos();
    });
  });
  $("ordenacao")?.addEventListener("change", e => { ordem = e.target.value; renderProdutos(); });

  // modal produto
  $("fecharModalProd")?.addEventListener("click", fecharProduto);
  $("modalProduto")?.addEventListener("click", e => { if (e.target===$("modalProduto")) fecharProduto(); });
  $("qtyMenos")?.addEventListener("click", () => { if(qty>1){qty--;$("qtyNum").textContent=qty;actualizarResumo();} });
  $("qtyMais")?.addEventListener("click",  () => { qty++;$("qtyNum").textContent=qty;actualizarResumo(); });
  $("btnConfirmarWA")?.addEventListener("click", confirmarWA);
  $("btnAddCarrinho")?.addEventListener("click", addCarrinho);

  // login
  $("fecharModalLogin")?.addEventListener("click", fecharLogin);
  $("modalLogin")?.addEventListener("click", e => { if(e.target===$("modalLogin")) fecharLogin(); });
  $("btnEntrar")?.addEventListener("click", () => entrar($("loginNome")?.value, "manual"));
  $("loginNome")?.addEventListener("keydown", e => { if(e.key==="Enter") entrar(e.target.value,"manual"); });
  $("btnGoogle")?.addEventListener("click", () => entrar($("loginNome")?.value||"Utilizador Google","google"));
  $("btnFacebook")?.addEventListener("click", () => entrar($("loginNome")?.value||"Utilizador Facebook","facebook"));

  // carrinho
  $("btnCarrinho")?.addEventListener("click", abrirCarrinho);
  $("fecharCarrinho")?.addEventListener("click", fecharCarrinho);
  $("overlayCarrinho")?.addEventListener("click", fecharCarrinho);
  $("btnCheckout")?.addEventListener("click", checkoutWA);

  // IA
  $("btnGerarDesc")?.addEventListener("click", gerarDescricao);
  $("btnChatEnviar")?.addEventListener("click", enviarChat);
  $("chatInput")?.addEventListener("keydown", e => { if(e.key==="Enter") enviarChat(); });

  // contacto
  $("btnEnviarWA")?.addEventListener("click", () => {
    const nome = $("waNome")?.value?.trim();
    const msg  = $("waMensagem")?.value?.trim();
    if (!nome||!msg) { nota("Preenche o nome e a mensagem.", "err"); return; }
    window.open(`https://wa.me/${WA}?text=${encodeURIComponent(`Olá! Sou *${nome}*.\n\n${msg}`)}`, "_blank");
  });
});
