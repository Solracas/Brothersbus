// ===== CONFIGURAÇÃO DO FIREBASE =====
const firebaseConfig = {
  apiKey: "AIzaSyBYwlOypTTL8uSlUD66-g_u0xdY_hcfkKg",
  authDomain: "brothers-business.firebaseapp.com",
  projectId: "brothers-business",
  storageBucket: "brothers-business.firebasestorage.app",
  messagingSenderId: "377603907064",
  appId: "1:377603907064:web:6dcca9f6ee923c5f200a0d"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// ===== CONSTANTES =====
const WA = "244954929881";
const PASS_ADMIN = "palavrapassecj";
const ADMIN_NOME = "Administrador CJ";
const fallback = "https://images.unsplash.com/photo-1588421357574-87938a86fa28?w=400&q=60";

const FOTOS = {
  1:"https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&q=80",
  2:"https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&q=80",
  3:"https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80",
  4:"https://images.unsplash.com/photo-1551954810-43cd27cce4e8?w=600&q=80",
  5:"https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=600&q=80",
  6:"https://images.unsplash.com/photo-1593359677879-a4bb92f829e1?w=600&q=80"
};

const CATALOG_BASE = [
  {nome:"Huawei Y7 Prime",preco:37000,categoria:"Tecnologia",descricao:"Bateria 4000mAh, ecrã 6.26, Snapdragon 450, 3GB RAM.",imagem:FOTOS[1],criadorId:"admin",criadorNome:ADMIN_NOME,whatsapp:WA,aprovado:true},
  {nome:"Notebook Dell Inspiron",preco:289000,categoria:"Tecnologia",descricao:"Intel i5, 8GB RAM, SSD 256GB, ecrã 15.6.",imagem:FOTOS[2],criadorId:"admin",criadorNome:ADMIN_NOME,whatsapp:WA,aprovado:true},
  {nome:"Auscultadores Bluetooth",preco:6000,categoria:"Tecnologia",descricao:"Cancelamento de ruído, 20h bateria.",imagem:FOTOS[3],criadorId:"admin",criadorNome:ADMIN_NOME,whatsapp:WA,aprovado:true},
  {nome:"Camisa Real Madrid 2024",preco:7000,categoria:"Moda",descricao:"Tamanho XL, algodão premium.",imagem:FOTOS[4],criadorId:"admin",criadorNome:ADMIN_NOME,whatsapp:WA,aprovado:true},
  {nome:"Frigorífico Frost Free 400L",preco:140000,categoria:"Casa",descricao:"400L, acabamento inox, classe A+.",imagem:FOTOS[5],criadorId:"admin",criadorNome:ADMIN_NOME,whatsapp:WA,aprovado:true},
  {nome:"Smart TV 50 4K",preco:185000,categoria:"Casa",descricao:"4K HDR, Android TV, Wi-Fi.",imagem:FOTOS[6],criadorId:"admin",criadorNome:ADMIN_NOME,whatsapp:WA,aprovado:true}
];

const EBOOKS_DEFAULT = [
  {titulo:"Empreender em Angola",autor:"João Sebastião",preco:3500,categoria:"Negócios",descricao:"Guia prático para empreendedores angolanos.",capa:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",criadorId:"admin",criadorNome:ADMIN_NOME,whatsapp:WA},
  {titulo:"Programação Web do Zero",autor:"Carlos Mendes",preco:2500,categoria:"Tecnologia",descricao:"Aprende HTML, CSS e JavaScript.",capa:"https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&q=80",criadorId:"admin",criadorNome:ADMIN_NOME,whatsapp:WA}
];

// ===== VARIÁVEIS GLOBAIS =====
let utilizador = null;
let produtos = [];
let carrinho = [];
let busca = "", categoria = "todos", ordem = "recente";
let prodAberto = null, qty = 1, corSel = "", tamSel = "", notaSel = 0;
let buscaEbook = "", catEbook = "todos";
let ebookAberto = null;
let recaptchaVerifier = null;
let confirmationResult = null;

const $ = id => document.getElementById(id);
const esc = s => !s ? "" : String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const kz = v => Number(v).toLocaleString("pt-AO") + " Kz";

function nota(msg, tipo) {
  const el = $("notificacao");
  if(!el) return;
  el.textContent = msg;
  el.className = "notificacao visivel " + (tipo||"");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.className = "notificacao", 2800);
}

// ===== UTILIZADOR LOCAL =====
function carregarUtilizador() {
  try { const s = localStorage.getItem("bb_user"); if(s) utilizador = JSON.parse(s); } catch(e){}
  renderAuth();
}

function guardarUtilizador(u) {
  utilizador = u;
  u ? localStorage.setItem("bb_user", JSON.stringify(u)) : localStorage.removeItem("bb_user");
  renderAuth();
}

function entrar(nome, via) {
  if (!nome?.trim()) { nota("Escreve o teu nome.", "err"); return; }
  const tipo = via === "empresa" ? "empresa" : "utilizador";
  guardarUtilizador({ id:"u"+Date.now(), nome:nome.trim(), via:via||"manual", tipo });
  fecharLogin();
  nota("Bem-vindo(a), " + utilizador.nome + "! 👋", "ok");
  carregarProdutosFirebase();
}

function sair() {
  if (utilizador?.via === "firebase") {
    auth.signOut().then(() => {
      utilizador = null;
      localStorage.removeItem("bb_user");
      carrinho = [];
      actualizarBadgeCarrinho();
      renderAuth();
      carregarProdutosFirebase();
      nota("Sessão encerrada.", "ok");
    });
  } else {
    if (!confirm("Sair da conta?")) return;
    guardarUtilizador(null);
    carrinho = [];
    actualizarBadgeCarrinho();
    renderProdutos();
    nota("Sessão encerrada.", "ok");
  }
}

function renderAuth() {
  const z = $("zonaAuth"); if(!z) return;
  if (utilizador) {
    z.innerHTML = `<div class="chip-user"><i class="fas fa-user-circle"></i><span>${esc(utilizador.nome)}</span><button class="btn-mkt" onclick="abrirPainel('meumkt')"><i class="fas fa-store"></i></button><button class="btn-sair" onclick="sair()"><i class="fas fa-sign-out-alt"></i></button></div>`;
  } else {
    z.innerHTML = `<button class="btn-auth" onclick="abrirLogin('utilizador')"><i class="fas fa-user-plus"></i> Entrar</button><button class="btn-auth btn-auth-emp" onclick="abrirLogin('empresa')"><i class="fas fa-building"></i> Empresa</button>`;
  }
}

function abrirLogin(tipo) {
  const m = $("modalLogin"); if(!m) return;
  const loginTipo = $("loginTipo");
  if(loginTipo) loginTipo.value = tipo || "utilizador";
  m.style.display = "flex";
  document.body.style.overflow = "hidden";
}

function fecharLogin() {
  const modal = $("modalLogin");
  if(modal) modal.style.display = "none";
  document.body.style.overflow = "";
}

function setupTabs() {
  document.querySelectorAll(".tab-login").forEach(tab => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.tab;
      document.querySelectorAll(".tab-login").forEach(t => t.classList.remove("ativa"));
      tab.classList.add("ativa");
      document.querySelectorAll(".tab-painel").forEach(p => p.style.display = "none");
      $(`tab-${target}`).style.display = "block";
    });
  });
}

// ===== LOGIN FIREBASE =====
function processarLoginFirebase(user) {
  if (!user) return;
  utilizador = {
    id: user.uid,
    nome: user.displayName || user.email?.split('@')[0] || "Utilizador",
    email: user.email || "",
    telefone: user.phoneNumber || "",
    foto: user.photoURL || "",
    tipo: "utilizador",
    via: "firebase"
  };
  
  const adminEmails = ["administradorcj@gmail.com"];
  if (adminEmails.includes(utilizador.email)) {
    utilizador.tipo = "admin";
  }
  
  localStorage.setItem("bb_user", JSON.stringify(utilizador));
  renderAuth();
  fecharLogin();
  carregarProdutosFirebase();
  nota("Bem-vindo(a), " + utilizador.nome + "! 👋", "ok");
}

function loginGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then(result => processarLoginFirebase(result.user))
    .catch(error => {
      console.error("Erro detalhado:", error);
      if (error.code === 'auth/popup-blocked') {
        nota("O navegador bloqueou o popup. Permite popups para este site.", "err");
      } else if (error.code === 'auth/popup-closed-by-user') {
        nota("Janela de login fechada. Tenta novamente.", "err");
      } else {
        nota("Erro: " + error.message, "err");
      }
    });
}

function loginEmail() {
  const email = $("loginEmail")?.value, senha = $("loginPassword")?.value;
  if (!email || !senha) { nota("Preenche email e palavra-passe.", "err"); return; }
  auth.signInWithEmailAndPassword(email, senha).then(result => processarLoginFirebase(result.user)).catch(error => nota("Erro: " + error.message, "err"));
}

function registarUtilizadorFirebase() {
  const nome = $("regNome")?.value?.trim(), email = $("regEmail")?.value?.trim(), senha = $("regPassword")?.value, confirmar = $("regConfirmPassword")?.value;
  if (!nome) { nota("Escreve o teu nome.", "err"); return; }
  if (!email) { nota("Escreve o teu email.", "err"); return; }
  if (!senha || senha.length < 6) { nota("Palavra-passe deve ter pelo menos 6 caracteres.", "err"); return; }
  if (senha !== confirmar) { nota("As palavras-passe não coincidem.", "err"); return; }
  auth.createUserWithEmailAndPassword(email, senha).then(result => result.user.updateProfile({ displayName: nome })).then(() => processarLoginFirebase(auth.currentUser)).catch(error => nota("Erro: " + error.message, "err"));
}

function iniciarLoginTelefone() { $("modalTelefone").style.display = "flex"; document.body.style.overflow = "hidden"; }
function fecharModalTelefone() { $("modalTelefone").style.display = "none"; document.body.style.overflow = ""; }

// ===== REPOSIÇÃO DE SENHA =====
function esqueceuSenha() {
  const email = prompt("Digite o teu email para receber o link de reposição de palavra-passe:");
  
  if (!email) {
    nota("Operação cancelada.", "info");
    return;
  }
  
  if (!email.includes('@') || !email.includes('.')) {
    nota("Por favor, insere um email válido.", "err");
    return;
  }
  
  auth.sendPasswordResetEmail(email)
    .then(() => {
      nota("📧 Email de reposição enviado! Verifica a tua caixa de correio.", "ok");
    })
    .catch(error => {
      console.error("Erro ao enviar email:", error);
      
      if (error.code === 'auth/user-not-found') {
        nota("Este email não está registado. Cria uma conta primeiro.", "err");
      } else if (error.code === 'auth/too-many-requests') {
        nota("Demasiadas tentativas. Aguarda alguns minutos.", "err");
      } else {
        nota("Erro: " + error.message, "err");
      }
    });
}

// ===== FUNÇÕES DO FIRESTORE (PRODUTOS) =====
async function iniciarProdutosPadrao() {
  const snapshot = await db.collection("produtos").get();
  
  // Se já existem produtos, NÃO adiciona mais
  if (!snapshot.empty) {
    console.log("Produtos já existem (" + snapshot.size + "). Não vou adicionar duplicados.");
    return;
  }
  
  // Só adiciona se estiver vazio
  for (const p of CATALOG_BASE) {
    await db.collection("produtos").add({
      ...p,
      dataCriacao: firebase.firestore.FieldValue.serverTimestamp()
    });
  }
  console.log("Produtos padrão adicionados uma única vez!");
}

async function iniciarEbooksPadrao() {
  const snapshot = await db.collection("ebooks").get();
  if (!snapshot.empty) {
    console.log("E-books já existem. Não vou adicionar duplicados.");
    return;
  }
  for (const eb of EBOOKS_DEFAULT) {
    await db.collection("ebooks").add({...eb, dataCriacao: firebase.firestore.FieldValue.serverTimestamp()});
  }
  console.log("E-books padrão adicionados!");
}

async function carregarProdutosFirebase() {
  try {
    const snapshot = await db.collection("produtos").where("aprovado", "==", true).get();
    produtos = [];
    snapshot.forEach(doc => produtos.push({ id: doc.id, ...doc.data() }));
    renderProdutos();
    const total = $("totalProdutos");
    if(total) total.textContent = produtos.length;
  } catch(e) { console.error(e); }
}

async function publicarProdutoFirebase(produto) {
  if (!utilizador) { nota("Precisas de entrar.", "err"); return; }
  try {
    await db.collection("produtos").add({...produto, aprovado: false, dataCriacao: firebase.firestore.FieldValue.serverTimestamp(), criadorId: utilizador.id, criadorNome: utilizador.nome});
    nota("Produto enviado para aprovação! ⏳", "ok");
    return true;
  } catch(e) { nota("Erro: " + e.message, "err"); return false; }
}

async function aprovarProdutoFirebase(id) {
  try {
    await db.collection("produtos").doc(id).update({ aprovado: true });
    nota("Produto aprovado! ✅", "ok");
    carregarProdutosFirebase();
    abrirPainel("admin");
  } catch(e) { nota("Erro ao aprovar.", "err"); }
}

async function rejeitarProdutoFirebase(id) {
  if (!confirm("Rejeitar este produto?")) return;
  try {
    await db.collection("produtos").doc(id).delete();
    nota("Produto rejeitado.", "err");
    carregarProdutosFirebase();
    abrirPainel("admin");
  } catch(e) { nota("Erro ao rejeitar.", "err"); }
}

// ===== FUNÇÕES DE PEDIDOS =====
async function registarPedidoFirebase(pedido) {
  if (!utilizador) return;
  try {
    await db.collection("pedidos").add({
      ...pedido,
      compradorId: utilizador.id,
      compradorNome: utilizador.nome,
      compradorTelefone: utilizador.telefone || "Não fornecido",
      status: "pendente",
      data: firebase.firestore.FieldValue.serverTimestamp(),
      lido: false
    });
    console.log("Pedido registado no Firebase!");
  } catch(error) {
    console.error("Erro ao registar pedido:", error);
  }
}

async function verPedidosAdmin() {
  try {
    const snapshot = await db.collection("pedidos")
      .orderBy("data", "desc")
      .limit(50)
      .get();
    
    if (snapshot.empty) {
      $("painelCorpo").innerHTML = `<div class="bloco-painel"><p style="color:var(--txt2)">📭 Nenhum pedido ainda.</p><button class="btn-publicar" onclick="abrirPainel('admin')">Voltar</button></div>`;
      return;
    }
    
    let html = `<h4>📋 Pedidos recebidos (${snapshot.size})</h4><div style="display:flex;flex-direction:column;gap:10px;max-height:400px;overflow-y:auto">`;
    
    snapshot.forEach(doc => {
      const p = doc.data();
      const data = p.data?.toDate ? p.data.toDate().toLocaleString("pt-PT") : p.data || "Data desconhecida";
      html += `
        <div class="cartao-novidade">
          <div class="cartao-novidade-topo">
            <h5>${esc(p.nome)} × ${p.qty || 1}</h5>
            <span class="tag-painel" style="background:${p.status === 'pendente' ? 'rgba(201,151,58,0.15)' : 'rgba(37,211,102,0.15)'};color:${p.status === 'pendente' ? 'var(--ouro)' : '#25D366'}">${p.status || 'pendente'}</span>
          </div>
          <p><strong>${kz(p.total || p.preco * (p.qty || 1))}</strong> · ${esc(p.compradorNome)}</p>
          <div class="data-nov">${data}</div>
          <small style="color:var(--txt3)">Vendedor: ${esc(p.vendedor || "N/A")}</small>
          <div style="margin-top:8px">
            <button class="btn-publicar" style="font-size:.7rem;padding:4px 12px;width:auto;display:inline" onclick="marcarPedidoLido('${doc.id}')">✅ Marcar como visto</button>
            <button class="btn-apagar-nov" onclick="apagarPedido('${doc.id}')">🗑️ Remover</button>
          </div>
        </div>
      `;
    });
    
    html += `<button class="btn-publicar" onclick="abrirPainel('admin')">Voltar</button></div>`;
    $("painelCorpo").innerHTML = html;
    
  } catch(error) {
    console.error("Erro:", error);
    $("painelCorpo").innerHTML = `<p style="color:red">Erro ao carregar pedidos.</p>`;
  }
}

async function marcarPedidoLido(id) {
  await db.collection("pedidos").doc(id).update({ status: "visto", lido: true });
  nota("Pedido marcado como visto! ✅", "ok");
  verPedidosAdmin();
}

async function apagarPedido(id) {
  if (!confirm("Apagar este pedido?")) return;
  await db.collection("pedidos").doc(id).delete();
  nota("Pedido removido.", "err");
  verPedidosAdmin();
}

// ===== E-BOOKS FIREBASE =====
async function carregarEbooksFirebase() {
  try {
    const snapshot = await db.collection("ebooks").get();
    const ebooks = [];
    snapshot.forEach(doc => ebooks.push({ id: doc.id, ...doc.data() }));
    return ebooks;
  } catch(e) { return []; }
}

async function publicarEbookFirebase(ebook) {
  if (!utilizador) { nota("Precisas de entrar.", "err"); return; }
  try {
    await db.collection("ebooks").add({...ebook, dataCriacao: firebase.firestore.FieldValue.serverTimestamp(), criadorId: utilizador.id, criadorNome: utilizador.nome});
    nota("E-book publicado! 🎉", "ok");
    return true;
  } catch(e) { nota("Erro: " + e.message, "err"); return false; }
}

// ===== RENDER PRODUTOS =====
function renderProdutos() {
  let lista = produtos.filter(p => p.aprovado);
  if (categoria !== "todos") lista = lista.filter(p => p.categoria === categoria);
  if (busca) { const t = busca.toLowerCase(); lista = lista.filter(p => p.nome.toLowerCase().includes(t) || (p.descricao || "").toLowerCase().includes(t)); }
  if (ordem === "barato") lista.sort((a,b) => a.preco - b.preco);
  if (ordem === "caro") lista.sort((a,b) => b.preco - a.preco);
  const g = $("grelha"), sr = $("semResultados");
  if (!g) return;
  if (!lista.length) { g.innerHTML = ""; if(sr) sr.style.display = "block"; return; }
  if(sr) sr.style.display = "none";
  g.innerHTML = lista.map(p => `<div class="produto" data-id="${p.id}"><div class="produto-foto"><img src="${esc(p.imagem)}" onerror="this.src='${fallback}'"><span class="produto-cat">${esc(p.categoria||"Outros")}</span></div><div class="produto-info"><h4>${esc(p.nome)}</h4><div class="produto-preco">${kz(p.preco)}</div><div class="produto-desc">${esc(p.descricao || "").substring(0,60)}</div><div class="produto-rodape"><div class="produto-vendedor"><i class="fas fa-user"></i>${esc(p.criadorNome)}</div></div></div></div>`).join("");
  g.querySelectorAll(".produto").forEach(card => card.addEventListener("click", () => abrirProduto(card.dataset.id)));
}

// ===== MODAL PRODUTO =====
function abrirProduto(id) {
  const p = produtos.find(x => x.id === id); if(!p) return;
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
  if (cB && p.cores?.length) { 
    cB.style.display="block"; 
    $("mCores").innerHTML = p.cores.map(c=>`<button class="opt" onclick="escolherCor('${esc(c)}',this)">${esc(c)}</button>`).join(""); 
  } else if(cB) { cB.style.display="none"; }
  if (tB && p.tamanhos?.length) { 
    tB.style.display="block"; 
    $("mTams").innerHTML = p.tamanhos.map(t=>`<button class="opt" onclick="escolherTam('${esc(t)}',this)">${esc(t)}</button>`).join(""); 
  } else if(tB) { tB.style.display="none"; }
  
  renderEstrelas();
  const avs = JSON.parse(localStorage.getItem("av_"+p.id)||"[]");
  const avsB = $("mAvsBloco");
  if (avs.length && avsB) { 
    avsB.style.display="block"; 
    $("mAvsList").innerHTML = avs.map(a=>`<div class="av"><strong>${esc(a.nome)}</strong><div class="av-stars">${"★".repeat(a.nota)}${"☆".repeat(5-a.nota)}</div>${a.texto?`<p>${esc(a.texto)}</p>`:""}</div>`).join(""); 
  } else if(avsB) { avsB.style.display="none"; }
  
  actualizarResumo();
  $("modalProduto").style.display = "flex";
  document.body.style.overflow = "hidden";
}

function fecharProduto() { $("modalProduto").style.display = "none"; document.body.style.overflow = ""; prodAberto = null; }

function escolherCor(c,btn) { 
  corSel=c; 
  $("mCores").querySelectorAll(".opt").forEach(b=>b.classList.remove("sel")); 
  btn.classList.add("sel"); 
  actualizarResumo(); 
}

function escolherTam(t,btn) { 
  tamSel=t; 
  $("mTams").querySelectorAll(".opt").forEach(b=>b.classList.remove("sel")); 
  btn.classList.add("sel"); 
  actualizarResumo(); 
}

function renderEstrelas() {
  $("mEstrelas").innerHTML = [1,2,3,4,5].map(n=>`<span class="estrela ${n<=notaSel?"ativa":""}" onclick="escolherEstrela(${n})">★</span>`).join("");
  $("mEstrelasLabel").textContent = notaSel ? notaSel+" estrela(s)" : "Clica para avaliar";
}

function escolherEstrela(n) { notaSel=n; renderEstrelas(); }

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
  
  // Guardar avaliação
  if (notaSel) { 
    const key="av_"+prodAberto.id; 
    const avs=JSON.parse(localStorage.getItem(key)||"[]"); 
    avs.push({nome:utilizador.nome,nota:notaSel,texto:$("mComentario")?.value||""}); 
    localStorage.setItem(key,JSON.stringify(avs)); 
  }
  
  // Guardar pedido no Firebase (para aparecer no admin)
  registarPedidoFirebase({
    tipo: "produto",
    produtoId: prodAberto.id,
    nome: prodAberto.nome,
    preco: prodAberto.preco,
    qty: qty,
    cor: corSel || "N/A",
    tam: tamSel || "N/A",
    vendedor: prodAberto.criadorNome,
    vendedorId: prodAberto.criadorId,
    total: prodAberto.preco * qty
  });
  
  // Enviar mensagem para o WhatsApp do admin
  const msg = `🛒 NOVO PEDIDO!\n\nProduto: *${prodAberto.nome}*\nPreço: *${kz(prodAberto.preco)}*${corSel?`\nCor: *${corSel}*`:""}${tamSel?`\nTamanho: *${tamSel}*`:""}\nQuantidade: *${qty}*\nTotal: *${kz(prodAberto.preco*qty)}*\n\nCliente: *${utilizador.nome}*\nWhatsApp: *${utilizador.telefone || "Não fornecido"}*`;
  
  window.open(`https://wa.me/${WA}?text=${encodeURIComponent(msg)}`, "_blank");
}

// ===== CARRINHO =====
function addCarrinho() {
  if (!prodAberto || !utilizador) { if(!utilizador) { fecharProduto(); abrirLogin(); } return; }
  const item = carrinho.find(i => i.id === prodAberto.id);
  if (item) item.qty += qty;
  else carrinho.push({ ...prodAberto, qty: qty });
  actualizarBadgeCarrinho();
  nota(prodAberto.nome + " adicionado! 🛍️", "ok");
}

function actualizarBadgeCarrinho() {
  const total = carrinho.reduce((s,i) => s + i.qty, 0);
  const b = $("badgeCarrinho");
  if(b) { b.textContent = total; b.style.display = total === 0 ? "none" : "flex"; }
}

function abrirCarrinho() { $("gavetaCarrinho").classList.add("aberta"); $("overlayCarrinho").style.display = "block"; document.body.style.overflow = "hidden"; renderCarrinho(); }
function fecharCarrinho() { $("gavetaCarrinho").classList.remove("aberta"); $("overlayCarrinho").style.display = "none"; document.body.style.overflow = ""; }

function renderCarrinho() {
  const itens = $("gavetaItens"), rod = $("gavetaRodape");
  if (!carrinho.length) { itens.innerHTML = `<div class="carrinho-vazio"><span>🛍️</span><p>Ainda não adicionaste nada</p></div>`; if(rod) rod.style.display = "none"; return; }
  itens.innerHTML = carrinho.map((item,i) => `<div class="item-carrinho"><img src="${esc(item.imagem)}" onerror="this.src='${fallback}'"><div class="item-info"><h5>${esc(item.nome)}</h5><b>${kz(item.preco)}</b><small>Qty: ${item.qty}</small></div><button onclick="removerCarrinho(${i})"><i class="fas fa-trash-alt"></i></button></div>`).join("");
  const total = carrinho.reduce((s,i) => s + i.preco * i.qty, 0);
  $("totalCarrinho").textContent = kz(total);
  if(rod) rod.style.display = "flex";
}

function removerCarrinho(i) { carrinho.splice(i,1); actualizarBadgeCarrinho(); renderCarrinho(); }

function checkoutWA() {
  if (!utilizador) { fecharCarrinho(); abrirLogin(); return; }
  if (!carrinho.length) return;
  
  // Guardar pedidos no Firebase
  carrinho.forEach(i => {
    registarPedidoFirebase({
      tipo: "produto",
      nome: i.nome,
      preco: i.preco,
      qty: i.qty,
      total: i.preco * i.qty,
      vendedor: i.vendedor,
      vendedorId: i.criadorId
    });
  });
  
  let msg = `🛒 NOVO PEDIDO - CARRINHO!\n\n`;
  carrinho.forEach(i => msg += `• ${i.nome} ×${i.qty} = ${kz(i.preco * i.qty)}\n`);
  msg += `\n*Total: ${kz(carrinho.reduce((s,i) => s + i.preco * i.qty, 0))}*\nCliente: *${utilizador.nome}*`;
  
  window.open(`https://wa.me/${WA}?text=${encodeURIComponent(msg)}`, "_blank");
  carrinho = [];
  actualizarBadgeCarrinho();
  fecharCarrinho();
}

// ===== FORMULÁRIO VENDA =====
function setupVenda() {
  $("uploadFoto")?.addEventListener("change", e => {
    const file = e.target.files[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = ev => { $("fotoPreviewVenda").src = ev.target.result; $("fotoPreviewVenda").style.display = "block"; $("uploadLabel").textContent = "Foto seleccionada ✅"; };
    reader.readAsDataURL(file);
  });
  $("formVenda")?.addEventListener("submit", async e => {
    e.preventDefault();
    if (!utilizador) { nota("Precisas de entrar.", "err"); abrirLogin(); return; }
    const nome = $("nProd").value.trim(), preco = parseFloat($("pProd").value), desc = $("dProd").value.trim(), wa = $("whatsVendedor").value.trim(), nomeVendedor = $("nomeVendedor").value.trim(), cat = document.querySelector("input[name='cat']:checked")?.value || "Outros", fotoEl = $("fotoPreviewVenda"), imagem = (fotoEl && fotoEl.src) ? fotoEl.src : fallback;
    if (!nome || !preco || preco <= 0 || !nomeVendedor || !wa) { nota("Preenche todos os campos.", "err"); return; }
    await publicarProdutoFirebase({ nome, preco, categoria: cat, descricao: desc, imagem, whatsapp: wa.replace(/\D/g, ''), criadorNome: nomeVendedor });
    $("formVenda").reset(); $("fotoPreviewVenda").style.display = "none"; $("previewFoto").innerHTML = "📷";
    irPara("comprar");
  });
}

function actualizarPreview() {
  $("prevNome").textContent = $("nProd")?.value || "Nome do produto";
  $("prevPreco").textContent = kz(parseFloat($("pProd")?.value) || 0);
  $("prevDesc").textContent = $("dProd")?.value || "Descrição...";
  $("prevVendedor").textContent = $("nomeVendedor")?.value || "Vendedor";
  $("prevWhats").textContent = $("whatsVendedor")?.value ? `WhatsApp: ${$("whatsVendedor").value}` : "";
  const fotoEl = $("fotoPreviewVenda");
  if (fotoEl && fotoEl.src && fotoEl.style.display !== "none") $("previewFoto").innerHTML = `<img src="${fotoEl.src}" style="width:100%;height:100%;object-fit:cover">`;
}

// ===== IA =====
function gerarDescricaoLocal(nome, cat) {
  const d = { "Tecnologia": `${nome} - produto tecnológico de qualidade. Excelente custo-benefício.`, "Moda": `${nome} - peça moderna e confortável. Qualidade premium.`, "Casa": `${nome} - perfeito para sua casa. Design funcional.`, "Outros": `${nome} - produto de qualidade. Entre em contacto.` };
  return d[cat] || `${nome} - produto novo e original. Garantia de qualidade.`;
}
function gerarDescricao() {
  const nome = $("nProd")?.value?.trim(), cat = document.querySelector("input[name='cat']:checked")?.value || "Outros";
  if (!nome) { nota("Escreve o nome do produto primeiro.", "err"); return; }
  $("dProd").value = gerarDescricaoLocal(nome, cat);
  actualizarPreview();
  nota("Descrição gerada! ✨", "ok");
}

function pushMsgIA(texto, tipo) {
  const box = $("chatMsgs"); if(!box) return;
  const d = document.createElement("div"); d.className = "msg " + tipo; d.innerHTML = esc(texto);
  box.appendChild(d); box.scrollTop = box.scrollHeight;
}

function enviarChat() {
  const msg = $("chatInput")?.value?.trim(); if(!msg) return;
  $("chatInput").value = ""; pushMsgIA(msg, "user");
  setTimeout(() => {
    let r = "Podes perguntar sobre preços, como comprar, como anunciar ou como criar conta!";
    const l = msg.toLowerCase();
    if (l.includes("preço")) r = "Os preços são definidos pelos vendedores. Clica no produto para ver!";
    else if (l.includes("comprar")) r = "Clica no produto, vê os detalhes e confirma pelo WhatsApp.";
    else if (l.includes("anunciar")) r = "Vai à secção 'Anunciar' e preenche o formulário.";
    pushMsgIA(r, "bot");
  }, 500);
}

// ===== E-BOOKS RENDER =====
async function renderEbooks() {
  const ebooks = await carregarEbooksFirebase();
  let lista = ebooks;
  if (catEbook !== "todos") lista = lista.filter(e => e.categoria === catEbook);
  if (buscaEbook) { const t = buscaEbook.toLowerCase(); lista = lista.filter(e => e.titulo.toLowerCase().includes(t) || (e.autor || "").toLowerCase().includes(t)); }
  const g = $("grelhaEbooks"), sr = $("semResultadosEbook");
  if (!g) return;
  if (!lista.length) { g.innerHTML = ""; if(sr) sr.style.display = "block"; return; }
  if(sr) sr.style.display = "none";
  g.innerHTML = lista.map(eb => `<div class="cartao-ebook" data-id="${eb.id}"><div class="ebook-capa"><img src="${eb.capa || fallback}" onerror="this.src='${fallback}'"></div><div class="ebook-info"><h4>${esc(eb.titulo)}</h4><div class="ebook-preco">${kz(eb.preco)}</div><div class="ebook-autor">${eb.autor || ""}</div></div></div>`).join("");
  g.querySelectorAll(".cartao-ebook").forEach(card => card.addEventListener("click", () => abrirModalEbook(card.dataset.id)));
}

async function abrirModalEbook(id) {
  const ebooks = await carregarEbooksFirebase();
  const eb = ebooks.find(e => e.id === id);
  if (!eb) return;
  ebookAberto = eb;
  $("ebMFoto").src = eb.capa || fallback;
  $("ebMTitulo").textContent = eb.titulo;
  $("ebMPreco").textContent = kz(eb.preco);
  $("ebMAutor").innerHTML = eb.autor ? `<i class="fas fa-user"></i> ${esc(eb.autor)}` : "";
  $("ebMDesc").textContent = eb.descricao || "";
  $("modalEbook").style.display = "flex";
  document.body.style.overflow = "hidden";
}

function fecharModalEbook() { $("modalEbook").style.display = "none"; document.body.style.overflow = ""; ebookAberto = null; }

function setupEbooks() {
  $("campoBuscaEbook")?.addEventListener("input", e => { buscaEbook = e.target.value; renderEbooks(); });
  $("formEbook")?.addEventListener("submit", async e => {
    e.preventDefault();
    if (!utilizador) { nota("Precisas de entrar.", "err"); abrirLogin(); return; }
    const titulo = $("ebTitulo")?.value?.trim(), preco = parseFloat($("ebPreco")?.value), capaPreview = $("ebookCapaPreview");
    if (!titulo || !preco) { nota("Preenche título e preço.", "err"); return; }
    await publicarEbookFirebase({ titulo, preco, autor: $("ebAutor")?.value || "", categoria: $("ebCat")?.value || "Outros", descricao: $("ebDesc")?.value || "", capa: (capaPreview && capaPreview.src) ? capaPreview.src : fallback, whatsapp: $("ebWA")?.value || WA });
    $("formEbook").reset();
    $("ebookCapaPreview").style.display = "none";
    renderEbooks();
  });
  $("btnEbookWA")?.addEventListener("click", () => {
    if (!ebookAberto || !utilizador) { if(!utilizador) { fecharModalEbook(); abrirLogin(); } return; }
    window.open(`https://wa.me/${ebookAberto.whatsapp || WA}?text=${encodeURIComponent(`Olá! Tenho interesse no e-book: *${ebookAberto.titulo}* - ${kz(ebookAberto.preco)}`)}`, "_blank");
  });
}

// ===== PAINÉIS =====
function abrirPainel(chave) {
  const paineis = {
    sobre: "Brother's Business - Marketplace angolano.",
    meumkt: utilizador ? `Bem-vindo, ${utilizador.nome}!` : "Faz login.",
    admin: sessionStorage.getItem("bb_admin") === "1" ? "Painel Admin" : "Área restrita.",
    empresa: "Painel da empresa.",
    novidades: "Em breve!",
    apoio: "WhatsApp: +244 954 929 881",
    privacidade: "Dados no Firebase.",
    faq: "Dúvidas? Contacta-nos."
  };
  
  $("painelTitulo").textContent = chave;
  
  if (chave === "admin") {
    if (sessionStorage.getItem("bb_admin") === "1") {
      $("painelCorpo").innerHTML = `<div class="bloco-painel">
        <p>Bem-vindo, Admin!</p>
        <button class="btn-publicar" onclick="verPedidosAdmin()" style="margin-bottom:10px">
          <i class="fas fa-receipt"></i> Ver Pedidos
        </button>
        <button class="btn-publicar" onclick="verProdutosPendentes()">
          <i class="fas fa-hourglass-half"></i> Produtos pendentes
        </button>
        <hr style="border-color:var(--borda);margin:4px 0">
        <h4>Publicar novidade</h4>
        <input type="text" id="novTitulo" class="input-admin" placeholder="Título">
        <textarea id="novTexto" class="textarea-admin" placeholder="Descrição..."></textarea>
        <button class="btn-publicar" onclick="publicarNovidade()"><i class="fas fa-paper-plane"></i> Publicar</button>
        <hr style="border-color:var(--borda);margin:4px 0">
        <h4>Estatísticas</h4>
        ${renderVisitas()}
      </div>`;
    } else {
      $("painelCorpo").innerHTML = `<div class="admin-bloqueado"><i class="fas fa-lock"></i><h4>Área restrita</h4><p>Só o administrador tem acesso.</p><input type="password" id="inputPassAdmin" class="input-admin" placeholder="Palavra-passe"><button class="btn-publicar" onclick="tentarAdmin()">Entrar</button></div>`;
    }
  } else {
    $("painelCorpo").innerHTML = `<div class="bloco-painel"><p>${paineis[chave] || "Painel em desenvolvimento."}</p></div>`;
  }
  
  $("painelLateral").classList.add("aberto");
  $("overlayPainel").classList.add("aberto");
  document.body.style.overflow = "hidden";
}

function fecharPainel() { $("painelLateral").classList.remove("aberto"); $("overlayPainel").classList.remove("aberto"); document.body.style.overflow = ""; }

function tentarAdmin() {
  const senha = prompt("Digite a palavra-passe de admin:");
  if (senha === PASS_ADMIN) {
    sessionStorage.setItem("bb_admin", "1");
    nota("Acesso concedido! ✅", "ok");
    abrirPainel("admin");
  } else {
    nota("Palavra-passe incorreta.", "err");
  }
}

function irPara(sec) {
  document.querySelectorAll(".secao").forEach(s => s.classList.remove("ativa"));
  $("sec-" + sec)?.classList.add("ativa");
  if (sec === "comprar") carregarProdutosFirebase();
  if (sec === "ebooks") renderEbooks();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function abrirMenu() { $("menuLateral").classList.add("aberto"); $("overlayMenu").classList.add("aberto"); document.body.style.overflow = "hidden"; }
function fecharMenu() { $("menuLateral").classList.remove("aberto"); $("overlayMenu").classList.remove("aberto"); document.body.style.overflow = ""; }
function pedirPermissaoNotif() { if (!("Notification"in window)) return; Notification.requestPermission(); }

async function verProdutosPendentes() {
  const snapshot = await db.collection("produtos").where("aprovado", "==", false).get();
  let html = `<h4>Produtos pendentes (${snapshot.size})</h4>`;
  snapshot.forEach(doc => {
    const p = doc.data();
    html += `<div class="cartao-novidade">
      <h5>${esc(p.nome)}</h5>
      <p>${kz(p.preco)} - ${esc(p.criadorNome)}</p>
      ${p.imagem ? `<img src="${esc(p.imagem)}" style="width:100%;height:100px;object-fit:cover;border-radius:8px;margin:4px 0">` : ""}
      <button class="btn-publicar" onclick="aprovarProdutoFirebase('${doc.id}')">✅ Aprovar</button>
      <button class="btn-apagar-nov" onclick="rejeitarProdutoFirebase('${doc.id}')">❌ Rejeitar</button>
    </div>`;
  });
  $("painelCorpo").innerHTML = html;
}

function toggleFaq(el){const r=el.nextElementSibling,ab=r.classList.contains("aberta");document.querySelectorAll(".faq-pergunta").forEach(q=>{q.classList.remove("aberta");if(q.nextElementSibling)q.nextElementSibling.classList.remove("aberta");});if(!ab){el.classList.add("aberta");r.classList.add("aberta");}}

function getNovidades(){try{return JSON.parse(localStorage.getItem("bb_novidades")||"[]");}catch(e){return[];}}
function guardarNovidades(a){localStorage.setItem("bb_novidades",JSON.stringify(a));}
function renderNovidades(adminMode){
  const novs=getNovidades();
  const defs=[{id:"d1",titulo:"🚀 Lançamento Brother's Business 2.0",data:"31 Mai 2025",texto:"Design renovado, IA integrada, carrinho, e-books e muito mais.",nova:true},{id:"d2",titulo:"🤖 Descrições automáticas com IA",data:"31 Mai 2025",texto:"Gera descrições profissionais para os teus produtos em segundos.",nova:true}];
  const todos=[...novs,...defs];
  if(!todos.length)return`<p style="color:var(--txt2);text-align:center;padding:40px">Sem novidades.</p>`;
  return`<div style="display:flex;flex-direction:column;gap:10px">${todos.map(n=>`<div class="cartao-novidade"><div class="cartao-novidade-topo"><h5>${esc(n.titulo)}</h5>${n.nova?`<span class="tag-novo">Novo</span>`:""}</div><div class="data-nov"><i class="fas fa-calendar" style="color:var(--ouro);margin-right:4px"></i>${esc(n.data)}</div><p>${esc(n.texto)}</p>${adminMode&&!n.id?.startsWith("d")?`<button class="btn-apagar-nov" onclick="apagarNovidade('${n.id}')"><i class="fas fa-trash-alt"></i> Apagar</button>`:""}</div>`).join("")}</div>`;
}

function publicarNovidade() {
  const novTitulo = $("novTitulo");
  const novTexto = $("novTexto");
  const titulo=novTitulo?.value?.trim()||"", texto=novTexto?.value?.trim()||"";
  if(!titulo||!texto){nota("Preenche título e descrição.","err");return;}
  const novs=getNovidades(); const data=new Date().toLocaleDateString("pt-PT",{day:"numeric",month:"long",year:"numeric"});
  novs.unshift({id:"n"+Date.now(),titulo,texto,data,nova:true}); guardarNovidades(novs);
  const listaNovidadesAdmin = $("listaNovidadesAdmin");
  if(listaNovidadesAdmin) listaNovidadesAdmin.innerHTML=renderNovidades(true);
  if(novTitulo) novTitulo.value=""; 
  if(novTexto) novTexto.value=""; 
  nota("Novidade publicada! 🎉","ok");
  enviarNotificacao("Nova novidade 🔔",titulo);
}

function apagarNovidade(id){if(!confirm("Apagar?"))return;guardarNovidades(getNovidades().filter(n=>n.id!==id));const listaNovidadesAdmin = $("listaNovidadesAdmin");if(listaNovidadesAdmin) listaNovidadesAdmin.innerHTML=renderNovidades(true);nota("Apagada.","err");}

function registarVisita(){
  const agora=new Date(),hoje=agora.toISOString().slice(0,10),sessKey="bb_sess_"+hoje;
  if(sessionStorage.getItem(sessKey))return; sessionStorage.setItem(sessKey,"1");
  let s={};try{s=JSON.parse(localStorage.getItem("bb_visitas")||"{}");}catch(e){}
  s.hoje=s.hoje||{};s.semana=s.semana||{};s.mes=s.mes||{};s.total=(s.total||0)+1;s.historico=s.historico||[];
  const sem=semanaKey(agora),mes=agora.toISOString().slice(0,7);
  s.hoje[hoje]=(s.hoje[hoje]||0)+1;s.semana[sem]=(s.semana[sem]||0)+1;s.mes[mes]=(s.mes[mes]||0)+1;
  s.historico.push({ts:agora.toISOString(),dia:hoje});if(s.historico.length>200)s.historico=s.historico.slice(-200);
  localStorage.setItem("bb_visitas",JSON.stringify(s));
}

function semanaKey(d){const x=new Date(d);x.setHours(0,0,0,0);x.setDate(x.getDate()-x.getDay());return x.toISOString().slice(0,10);}

function getVisitas(){let s={};try{s=JSON.parse(localStorage.getItem("bb_visitas")||"{}");}catch(e){}const agora=new Date();return{hoje:(s.hoje&&s.hoje[agora.toISOString().slice(0,10)])||0,semana:(s.semana&&s.semana[semanaKey(agora)])||0,mes:(s.mes&&s.mes[agora.toISOString().slice(0,7)])||0,total:s.total||0,dias:s.hoje||{}};}

function renderVisitas(){
  const v=getVisitas(),agora=new Date(),mesLabel=agora.toLocaleDateString("pt-PT",{month:"long",year:"numeric"});
  const dias=Array.from({length:7},(_,i)=>{const d=new Date(agora);d.setDate(d.getDate()-(6-i));const key=d.toISOString().slice(0,10);return{key,count:v.dias[key]||0,label:d.toLocaleDateString("pt-PT",{weekday:"short"}),hoje:key===agora.toISOString().slice(0,10)};});
  const max=Math.max(...dias.map(d=>d.count),1);
  return`<div class="grelha-stats"><div class="cartao-stat"><b>${v.hoje}</b><small><i class="fas fa-sun"></i> Hoje</small></div><div class="cartao-stat"><b>${v.semana}</b><small><i class="fas fa-calendar-week"></i> Semana</small></div><div class="cartao-stat"><b>${v.mes}</b><small><i class="fas fa-calendar-alt"></i> ${mesLabel}</small></div><div class="cartao-stat" style="border-color:rgba(201,151,58,.28)"><b>${v.total}</b><small><i class="fas fa-users"></i> Total</small></div></div><div class="grafico-semana"><div class="label-g"><i class="fas fa-chart-bar" style="color:var(--ouro)"></i> Últimos 7 dias</div><div class="barras">${dias.map(d=>{const h=Math.max((d.count/max)*100,d.count>0?8:3);return`<div class="barra-dia ${d.hoje?"hoje":""}"><span class="num">${d.count||""}</span><div class="barra" style="height:${h}%;background:${d.hoje?"var(--ouro)":"rgba(201,151,58,.3)"}"></div><span class="dia-label">${d.label}</span></div>`;}).join("")}</div></div><div class="nota-visitas"><i class="fas fa-info-circle" style="color:var(--ouro);margin-right:5px"></i>Contagem por sessão. Dados guardados localmente.</div>`;
}

function enviarNotificacao(titulo,corpo){if(!("Notification"in window)||Notification.permission!=="granted")return;try{new Notification(titulo,{body:corpo});}catch(e){}}

// ===== CONTACTO =====
function setupContato() {
  $("btnEnviarWA")?.addEventListener("click", () => {
    const nome = $("waNome")?.value?.trim();
    const msg = $("waMensagem")?.value?.trim();
    if(!nome || !msg) { nota("Preenche o nome e a mensagem.", "err"); return; }
    window.open(`https://wa.me/${WA}?text=${encodeURIComponent(`Olá! Sou *${nome}*.\n\n${msg}`)}`, "_blank");
  });
}

// ===== INICIALIZAÇÃO =====
document.addEventListener("DOMContentLoaded", async () => {
  registarVisita();
  carregarUtilizador();
  setupTabs();
  setupVenda();
  setupEbooks();
  setupContato();
  
  await iniciarProdutosPadrao();
  await iniciarEbooksPadrao();
  await carregarProdutosFirebase();
  await renderEbooks();
  
  auth.onAuthStateChanged(async (user) => {
    if (user && (!utilizador || utilizador.via !== "firebase")) {
      await processarLoginFirebase(user);
      await carregarProdutosFirebase();
      await renderEbooks();
    }
  });
  
  document.querySelectorAll(".nav-topo a[data-sec]").forEach(a => a.addEventListener("click", e => { e.preventDefault(); irPara(a.dataset.sec); }));
  $("campoBusca")?.addEventListener("input", e => { busca = e.target.value; renderProdutos(); });
  $("ordenacao")?.addEventListener("change", e => { ordem = e.target.value; renderProdutos(); });
  document.querySelectorAll(".cat").forEach(btn => btn.addEventListener("click", () => { document.querySelectorAll(".cat").forEach(b => b.classList.remove("ativa")); btn.classList.add("ativa"); categoria = btn.dataset.cat; renderProdutos(); }));
  $("fecharModalProd")?.addEventListener("click", fecharProduto);
  $("modalProduto")?.addEventListener("click", e => { if(e.target === $("modalProduto")) fecharProduto(); });
  $("qtyMenos")?.addEventListener("click", () => { if(qty > 1){ qty--; $("qtyNum").textContent = qty; actualizarResumo(); } });
  $("qtyMais")?.addEventListener("click", () => { qty++; $("qtyNum").textContent = qty; actualizarResumo(); });
  $("btnConfirmarWA")?.addEventListener("click", confirmarWA);
  $("btnAddCarrinho")?.addEventListener("click", addCarrinho);
  $("fecharModalLogin")?.addEventListener("click", fecharLogin);
  $("modalLogin")?.addEventListener("click", e => { if(e.target === $("modalLogin")) fecharLogin(); });
  $("btnEntrar")?.addEventListener("click", () => entrar($("loginNome")?.value, $("loginTipo")?.value));
  $("loginNome")?.addEventListener("keydown", e => { if(e.key === "Enter") entrar(e.target.value, $("loginTipo")?.value); });
  $("btnGoogleLogin")?.addEventListener("click", loginGoogle);
  $("btnGoogleRegisto2")?.addEventListener("click", loginGoogle);
  $("btnEntrarEmail")?.addEventListener("click", loginEmail);
  $("btnRegistar")?.addEventListener("click", registarUtilizadorFirebase);
  $("btnTelefoneLogin")?.addEventListener("click", iniciarLoginTelefone);
  $("btnCarrinho")?.addEventListener("click", abrirCarrinho);
  $("fecharCarrinho")?.addEventListener("click", fecharCarrinho);
  $("overlayCarrinho")?.addEventListener("click", fecharCarrinho);
  $("btnCheckout")?.addEventListener("click", checkoutWA);
  $("btnGerarDesc")?.addEventListener("click", gerarDescricao);
  $("btnChatEnviar")?.addEventListener("click", enviarChat);
  $("chatInput")?.addEventListener("keydown", e => { if(e.key === "Enter") enviarChat(); });
  $("modalEbook")?.addEventListener("click", e => { if(e.target === $("modalEbook")) fecharModalEbook(); });
  $("btnNotifPush")?.addEventListener("click", pedirPermissaoNotif);
  
  document.addEventListener("keydown", e => {
    if(e.key === "Escape") {
      if($("modalProduto")?.style.display === "flex") fecharProduto();
      if($("modalLogin")?.style.display === "flex") fecharLogin();
      if($("modalEbook")?.style.display === "flex") fecharModalEbook();
      if($("modalTelefone")?.style.display === "flex") fecharModalTelefone();
      if($("painelLateral")?.classList.contains("aberto")) fecharPainel();
      if($("gavetaCarrinho")?.classList.contains("aberta")) fecharCarrinho();
    }
  });
});

// ===== EXPORTAR FUNÇÕES GLOBAIS =====
window.sair = sair;
window.abrirLogin = abrirLogin;
window.fecharLogin = fecharLogin;
window.fecharModalTelefone = fecharModalTelefone;
window.tentarAdmin = tentarAdmin;
window.irPara = irPara;
window.abrirMenu = abrirMenu;
window.fecharMenu = fecharMenu;
window.abrirPainel = abrirPainel;
window.fecharPainel = fecharPainel;
window.fecharProduto = fecharProduto;
window.fecharModalEbook = fecharModalEbook;
window.pedirPermissaoNotif = pedirPermissaoNotif;
window.confirmarWA = confirmarWA;
window.addCarrinho = addCarrinho;
window.abrirCarrinho = abrirCarrinho;
window.fecharCarrinho = fecharCarrinho;
window.checkoutWA = checkoutWA;
window.removerCarrinho = removerCarrinho;
window.aprovarProdutoFirebase = aprovarProdutoFirebase;
window.rejeitarProdutoFirebase = rejeitarProdutoFirebase;
window.esqueceuSenha = esqueceuSenha;
window.marcarPedidoLido = marcarPedidoLido;
window.apagarPedido = apagarPedido;
window.verPedidosAdmin = verPedidosAdmin;
window.publicarNovidade = publicarNovidade;
window.apagarNovidade = apagarNovidade;