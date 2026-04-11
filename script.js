// script.js - Versão completa e funcional

const KEY_USER = "brothers_user";
const KEY_PRODUTOS = "brothers_produtos";

let usuarioLogado = null;
let produtos = [];
let termoBusca = "";
let produtoAtual = null;
let qtdAtual = 1;
let corSelecionada = "";
let tamanhoSelecionado = "";
let estrelaSelecionada = 0;

// ====================== UTILITÁRIOS ======================
function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatarPreco(valor) {
  return Number(valor).toLocaleString('pt-AO') + ' Kz';
}

// ====================== USUÁRIO ======================
function carregarUsuarioSessao() {
  try {
    const stored = localStorage.getItem(KEY_USER);
    if (stored) usuarioLogado = JSON.parse(stored);
  } catch(e) { usuarioLogado = null; }
  atualizarInterfaceUsuario();
}

function salvarUsuarioSessao(user) {
  usuarioLogado = user;
  if (user) {
    localStorage.setItem(KEY_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(KEY_USER);
  }
  atualizarInterfaceUsuario();
}

function fazerLogin(nome, metodo) {
  if (!nome || !nome.trim()) {
    alert("Por favor, informe seu nome.");
    return false;
  }
  const user = { id: "user_" + Date.now(), nome: nome.trim(), metodo: metodo || "manual" };
  salvarUsuarioSessao(user);
  fecharModal();
  alert("Bem-vindo(a), " + user.nome + "!");
  renderizarProdutos();
  return true;
}

function fazerLogout() {
  if (confirm("Deseja sair da sua conta?")) {
    salvarUsuarioSessao(null);
    renderizarProdutos();
  }
}

function atualizarInterfaceUsuario() {
  const authArea = document.getElementById("authArea");
  if (!authArea) return;

  if (usuarioLogado) {
    authArea.innerHTML = `
      <div class="user-info">
        <i class="fas fa-user-circle"></i>
        <span>${escapeHtml(usuarioLogado.nome)}</span>
        <button class="btn-logout" id="logoutBtn"><i class="fas fa-sign-out-alt"></i> Sair</button>
      </div>`;
    document.getElementById("logoutBtn").onclick = fazerLogout;
  } else {
    authArea.innerHTML = `<button class="btn-outline" id="btnAbrirModal"><i class="fas fa-user-plus"></i> Entrar / Cadastrar</button>`;
    document.getElementById("btnAbrirModal").onclick = abrirModal;
  }
}

// ====================== MODAL LOGIN ======================
function abrirModal() {
  const modal = document.getElementById("modalLogin");
  if (modal) modal.style.display = "flex";
}

function fecharModal() {
  const modal = document.getElementById("modalLogin");
  if (modal) modal.style.display = "none";
}

// ====================== PRODUTOS ======================
function inicializarProdutos() {
  try {
    const stored = localStorage.getItem(KEY_PRODUTOS);
    if (stored) produtos = JSON.parse(stored);
  } catch(e) { produtos = []; }

  if (produtos.length === 0) {
    produtos = [
      { id: 1, nome: "Huawei Y7 prime", preco: 37000, descricao: "Bateria de 4.000 mAh, ecrã 6,26\", Snapdragon 450, 3GB RAM, 32GB armazenamento. Bom estado.", imagem: "assets/tele.jpeg", criadorId: "admin", criadorNome: "Carlos CJ", whatsapp: "244954929881" },
      { id: 2, nome: "Notebook Dell Inspiron", preco: 289000, descricao: "i5, 8GB RAM, SSD 256GB, 15.6 polegadas. Ideal para trabalho e estudos.", imagem: "assets/pc.jpeg", criadorId: "admin", criadorNome: "Carlos CJ", whatsapp: "244954929881" },
      { id: 3, nome: "Fone Bluetooth", preco: 6000, descricao: "Cancelamento de ruído, 20h de bateria, confortável para uso prolongado.", imagem: "assets/fones.jpeg", criadorId: "admin", criadorNome: "Carlos CJ", whatsapp: "244954929881" },
      { id: 4, nome: "Camisa desportiva Real Madrid", preco: 7000, descricao: "Tamanho XL, algodão, cor branca. Produto original.", imagem: "assets/cami.webp", criadorId: "admin", criadorNome: "Carlos CJ", whatsapp: "244954929881" },
      { id: 5, nome: "Geladeira Frost Free", preco: 140000, descricao: "400L, inox, eficiente. Pouco uso, excelente estado.", imagem: "assets/gela.jpeg", criadorId: "admin", criadorNome: "MarketFlow", whatsapp: "244954929881" },
      { id: 6, nome: "Smart TV 50\"", preco: 185000, descricao: "4K HDR, Android TV. Com controlo remoto e todos os cabos.", imagem: "assets/tele2.jpeg", criadorId: "admin", criadorNome: "MarketFlow", whatsapp: "244954929881" }
    ];
    salvarProdutos();
  }
}

function salvarProdutos() {
  try {
    localStorage.setItem(KEY_PRODUTOS, JSON.stringify(produtos));
  } catch(e) { console.error("Erro ao salvar produtos:", e); }
}

function adicionarProduto(nome, preco, descricao, imagem, whatsapp) {
  if (!usuarioLogado) {
    alert("Você precisa estar logado para anunciar.");
    return false;
  }
  produtos.push({
    id: Date.now(),
    nome: nome.trim(),
    preco: parseFloat(preco),
    descricao: descricao.trim() || "Sem descrição",
    imagem: imagem.trim() || "https://cdn-icons-png.flaticon.com/512/2331/2331949.png",
    whatsapp: (whatsapp || "244954929881").trim(),
    criadorId: usuarioLogado.id,
    criadorNome: usuarioLogado.nome
  });
  salvarProdutos();
  return true;
}

function excluirProduto(idProduto) {
  if (!usuarioLogado) { alert("Você precisa estar logado."); return false; }
  const index = produtos.findIndex(p => p.id == idProduto);
  if (index === -1) return false;
  if (produtos[index].criadorId !== usuarioLogado.id) {
    alert("Você só pode excluir seus próprios anúncios.");
    return false;
  }
  produtos.splice(index, 1);
  salvarProdutos();
  renderizarProdutos();
  return true;
}

function renderizarProdutos() {
  const filtrados = produtos.filter(prod =>
    prod.nome.toLowerCase().includes(termoBusca.toLowerCase()) ||
    prod.descricao.toLowerCase().includes(termoBusca.toLowerCase())
  );

  const container = document.getElementById("productList");
  const noProducts = document.getElementById("noProductsMsg");
  if (!container || !noProducts) return;

  if (filtrados.length === 0) {
    container.innerHTML = "";
    noProducts.style.display = "block";
    return;
  }

  noProducts.style.display = "none";
  container.innerHTML = filtrados.map(prod => {
    const isOwner = usuarioLogado && prod.criadorId === usuarioLogado.id;
    return `
      <div class="product-card" data-id="${prod.id}">
        <div class="product-img">
          <img src="${prod.imagem}" alt="${escapeHtml(prod.nome)}" onerror="this.src='https://cdn-icons-png.flaticon.com/512/1046/1046784.png'">
        </div>
        <div class="product-info">
          <h4>${escapeHtml(prod.nome)}</h4>
          <div class="price">${formatarPreco(prod.preco)}</div>
          <div class="desc">${escapeHtml(prod.descricao.substring(0, 70))}${prod.descricao.length > 70 ? '...' : ''}</div>
          <div class="seller"><i class="fas fa-user"></i> ${escapeHtml(prod.criadorNome)}</div>
          <button class="delete-btn" data-id="${prod.id}" ${!isOwner ? 'disabled' : ''}>
            <i class="fas fa-trash-alt"></i> Remover
          </button>
        </div>
      </div>`;
  }).join('');

  document.querySelectorAll('.delete-btn:not([disabled])').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm("Tem certeza que deseja remover este produto?")) {
        excluirProduto(parseInt(btn.dataset.id));
      }
    });
  });

  document.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.delete-btn')) return;
      abrirModalProduto(parseInt(card.dataset.id));
    });
  });
}

// ====================== MODAL PRODUTO ======================
function abrirModalProduto(idProduto) {
  const prod = produtos.find(p => p.id == idProduto);
  if (!prod) return;

  produtoAtual = prod;
  qtdAtual = 1;
  corSelecionada = "";
  tamanhoSelecionado = "";
  estrelaSelecionada = 0;

  document.getElementById("mpImg").src = prod.imagem;
  document.getElementById("mpImg").onerror = function() {
    this.src = 'https://cdn-icons-png.flaticon.com/512/1046/1046784.png';
  };
  document.getElementById("mpNome").textContent = prod.nome;
  document.getElementById("mpPreco").textContent = formatarPreco(prod.preco);
  document.getElementById("mpVendedor").innerHTML = `<i class="fas fa-user"></i> ${escapeHtml(prod.criadorNome)}`;
  document.getElementById("mpDesc").textContent = prod.descricao;
  document.getElementById("mpQtyVal").textContent = "1";

  // Cores (apenas para roupas)
  const temCores = prod.nome.toLowerCase().includes("camisa") || prod.nome.toLowerCase().includes("roupa");
  const coresSection = document.getElementById("mpCorSection");
  if (temCores) {
    coresSection.style.display = "block";
    const cores = ["Branco", "Preto", "Azul", "Vermelho"];
    document.getElementById("mpCores").innerHTML = cores.map(c =>
      `<button class="color-btn" onclick="selecionarCor('${c}', this)">${c}</button>`
    ).join('');
    document.getElementById("mpCorLabel").textContent = "Nenhuma selecionada";
  } else {
    coresSection.style.display = "none";
  }

  // Tamanhos (apenas para roupas)
  const temTamanhos = temCores;
  const tamanhosSection = document.getElementById("mpTamanhoSection");
  if (temTamanhos) {
    tamanhosSection.style.display = "block";
    const tamanhos = ["P", "M", "G", "XL", "XXL"];
    document.getElementById("mpTamanhos").innerHTML = tamanhos.map(t =>
      `<button class="size-btn" onclick="selecionarTamanho('${t}', this)">${t}</button>`
    ).join('');
  } else {
    tamanhosSection.style.display = "none";
  }

  // Estrelas
  renderizarEstrelas();

  // Avaliações anteriores
  const avaliacoes = JSON.parse(localStorage.getItem("av_" + prod.id) || "[]");
  const avSection = document.getElementById("mpAvaliacoesSection");
  const avList = document.getElementById("mpAvaliacoesList");
  if (avaliacoes.length > 0) {
    avSection.style.display = "block";
    avList.innerHTML = avaliacoes.map(av => `
      <div class="avaliacao-item">
        <strong>${escapeHtml(av.nome)}</strong>
        <span>${'★'.repeat(av.estrelas)}${'☆'.repeat(5 - av.estrelas)}</span>
        ${av.nota ? `<p>${escapeHtml(av.nota)}</p>` : ''}
      </div>`).join('');
  } else {
    avSection.style.display = "none";
  }

  atualizarResumo();

  const modal = document.getElementById("modalProduto");
  modal.style.display = "flex";
}

function fecharModalProduto() {
  const modal = document.getElementById("modalProduto");
  if (modal) modal.style.display = "none";
  produtoAtual = null;
}

function selecionarCor(cor, btn) {
  corSelecionada = cor;
  document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  document.getElementById("mpCorLabel").textContent = "Selecionada: " + cor;
  atualizarResumo();
}

function selecionarTamanho(tamanho, btn) {
  tamanhoSelecionado = tamanho;
  document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  atualizarResumo();
}

function renderizarEstrelas() {
  const starsRow = document.getElementById("mpStars");
  if (!starsRow) return;
  starsRow.innerHTML = [1,2,3,4,5].map(n =>
    `<span class="star ${n <= estrelaSelecionada ? 'active' : ''}" onclick="selecionarEstrela(${n})">★</span>`
  ).join('');
  document.getElementById("mpStarLabel").textContent =
    estrelaSelecionada > 0 ? `Você avaliou: ${estrelaSelecionada} estrela(s)` : "Clique para avaliar";
}

function selecionarEstrela(n) {
  estrelaSelecionada = n;
  renderizarEstrelas();
}

function atualizarResumo() {
  if (!produtoAtual) return;
  const total = produtoAtual.preco * qtdAtual;
  let resumo = `Produto: <strong>${escapeHtml(produtoAtual.nome)}</strong><br>`;
  if (corSelecionada) resumo += `Cor: <strong>${corSelecionada}</strong><br>`;
  if (tamanhoSelecionado) resumo += `Tamanho: <strong>${tamanhoSelecionado}</strong><br>`;
  resumo += `Quantidade: <strong>${qtdAtual}</strong>`;
  document.getElementById("mpResumoTexto").innerHTML = resumo;
  document.getElementById("mpTotal").textContent = formatarPreco(total);
}

function confirmarInteresse() {
  if (!produtoAtual) return;

  if (!usuarioLogado) {
    fecharModalProduto();
    abrirModal();
    return;
  }

  // Salvar avaliação se deu estrelas
  if (estrelaSelecionada > 0) {
    const key = "av_" + produtoAtual.id;
    const avaliacoes = JSON.parse(localStorage.getItem(key) || "[]");
    avaliacoes.push({
      nome: usuarioLogado.nome,
      estrelas: estrelaSelecionada,
      nota: document.getElementById("mpNotaTexto")?.value || ""
    });
    localStorage.setItem(key, JSON.stringify(avaliacoes));
  }

  const numero = produtoAtual.whatsapp || "244954929881";
  let msg = `Olá! Tenho interesse no produto: *${produtoAtual.nome}*\n`;
  msg += `Preço: *${formatarPreco(produtoAtual.preco)}*\n`;
  if (corSelecionada) msg += `Cor: *${corSelecionada}*\n`;
  if (tamanhoSelecionado) msg += `Tamanho: *${tamanhoSelecionado}*\n`;
  msg += `Quantidade: *${qtdAtual}*\n`;
  msg += `Total: *${formatarPreco(produtoAtual.preco * qtdAtual)}*\n`;
  msg += `Meu nome: *${usuarioLogado.nome}*`;

  window.open(`https://wa.me/${numero}?text=${encodeURIComponent(msg)}`, '_blank');
}

// ====================== FORMULÁRIO DE VENDA ======================
function configurarFormularioVenda() {
  const form = document.getElementById("sellProductForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    if (!usuarioLogado) {
      alert("Precisas de estar logado para anunciar um produto.");
      abrirModal();
      return;
    }

    const nome = document.getElementById("prodName")?.value || "";
    const preco = document.getElementById("prodPrice")?.value || "";
    const descricao = document.getElementById("prodDesc")?.value || "";
    const imagem = document.getElementById("prodImage")?.value || "";

    if (!nome.trim() || !preco) {
      alert("Preenche pelo menos o nome e o preço do produto.");
      return;
    }
    if (isNaN(parseFloat(preco)) || parseFloat(preco) <= 0) {
      alert("Insere um preço válido.");
      return;
    }

    adicionarProduto(nome, preco, descricao, imagem, "244954929881");
    alert("Produto anunciado com sucesso!");
    form.reset();
    document.getElementById("btnComprarMode")?.click();
  });
}

// ====================== WHATSAPP GERAL ======================
function configurarWhatsApp() {
  const btn = document.getElementById("whatsappBtn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    const nome = document.getElementById("whatsappName")?.value?.trim() || "";
    const msg = document.getElementById("whatsappMsg")?.value?.trim() || "";
    if (!nome || !msg) {
      alert("Por favor, preenche o nome e a mensagem.");
      return;
    }
    const texto = `Olá! Meu nome é *${nome}*.\n\n${msg}`;
    window.open(`https://wa.me/244954929881?text=${encodeURIComponent(texto)}`, '_blank');
  });
}

// ====================== INICIALIZAÇÃO ======================
document.addEventListener("DOMContentLoaded", () => {
  carregarUsuarioSessao();
  inicializarProdutos();
  renderizarProdutos();
  configurarFormularioVenda();
  configurarWhatsApp();

  // Modal login — fechar
  document.getElementById("closeModal")?.addEventListener("click", fecharModal);
  document.getElementById("modalLogin")?.addEventListener("click", (e) => {
    if (e.target === document.getElementById("modalLogin")) fecharModal();
  });

  // Login pelo nome
  document.getElementById("loginGoogleBtn")?.addEventListener("click", () => {
    const nome = document.getElementById("loginNome")?.value;
    fazerLogin(nome || "Utilizador Google", "google");
  });
  document.getElementById("loginFacebookBtn")?.addEventListener("click", () => {
    const nome = document.getElementById("loginNome")?.value;
    fazerLogin(nome || "Utilizador Facebook", "facebook");
  });
  document.getElementById("loginNome")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") fazerLogin(e.target.value, "manual");
  });

  // Modal produto — fechar
  document.getElementById("mpClose")?.addEventListener("click", fecharModalProduto);
  document.getElementById("modalProduto")?.addEventListener("click", (e) => {
    if (e.target === document.getElementById("modalProduto")) fecharModalProduto();
  });

  // Quantidade
  document.getElementById("mpQtyMenos")?.addEventListener("click", () => {
    if (qtdAtual > 1) { qtdAtual--; document.getElementById("mpQtyVal").textContent = qtdAtual; atualizarResumo(); }
  });
  document.getElementById("mpQtyMais")?.addEventListener("click", () => {
    qtdAtual++; document.getElementById("mpQtyVal").textContent = qtdAtual; atualizarResumo();
  });

  // Confirmar interesse
  document.getElementById("mpConfirmar")?.addEventListener("click", confirmarInteresse);

  // Abas
  document.getElementById("btnComprarMode")?.addEventListener("click", () => {
    document.getElementById("comprarSection").style.display = "block";
    document.getElementById("venderSection").style.display = "none";
    document.getElementById("btnComprarMode").classList.add("active");
    document.getElementById("btnVenderMode").classList.remove("active");
    renderizarProdutos();
  });

  document.getElementById("btnVenderMode")?.addEventListener("click", () => {
    document.getElementById("comprarSection").style.display = "none";
    document.getElementById("venderSection").style.display = "block";
    document.getElementById("btnVenderMode").classList.add("active");
    document.getElementById("btnComprarMode").classList.remove("active");
  });

  // Busca
  document.getElementById("searchInput")?.addEventListener("input", (e) => {
    termoBusca = e.target.value;
    renderizarProdutos();
  });

  // Forçar aba Comprar no início
  document.getElementById("btnComprarMode")?.click();
});
