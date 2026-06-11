// ===== CONFIGURAÇÃO DO FIREBASE =====
const firebaseConfig = {
  apiKey: "AIzaSyBYwlOypTTL8uSlUD66-g_u0xdY_hcfkKg",
  authDomain: "brothers-business.firebaseapp.com",
  projectId: "brothers-business",
  storageBucket: "brothers-business.firebasestorage.app",
  messagingSenderId: "377603907064",
  appId: "1:377603907064:web:6dcca9f6ee923c5f200a0d"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// ===== CONSTANTES =====
const WA = "244954929881";
const PASS_ADMIN = "brothers2025";
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
  {nome:"Huawei Y7 Prime",preco:37000,categoria:"Tecnologia",descricao:"Bateria 4000mAh, ecrã 6.26, Snapdragon 450, 3GB RAM.",imagem:FOTOS[1],criadorId:"admin",criadorNome:"Carlos CJ",whatsapp:WA,aprovado:true},
  {nome:"Notebook Dell Inspiron",preco:289000,categoria:"Tecnologia",descricao:"Intel i5, 8GB RAM, SSD 256GB, ecrã 15.6.",imagem:FOTOS[2],criadorId:"admin",criadorNome:"Carlos CJ",whatsapp:WA,aprovado:true},
  {nome:"Auscultadores Bluetooth",preco:6000,categoria:"Tecnologia",descricao:"Cancelamento de ruído, 20h bateria.",imagem:FOTOS[3],criadorId:"admin",criadorNome:"Carlos CJ",whatsapp:WA,aprovado:true},
  {nome:"Camisa Real Madrid 2024",preco:7000,categoria:"Moda",descricao:"Tamanho XL, algodão premium. Original com etiqueta.",imagem:FOTOS[4],criadorId:"admin",criadorNome:"Carlos CJ",whatsapp:WA,aprovado:true},
  {nome:"Frigorífico Frost Free 400L",preco:140000,categoria:"Casa",descricao:"400L, acabamento inox, classe energética A+.",imagem:FOTOS[5],criadorId:"admin",criadorNome:"MarketFlow",whatsapp:WA,aprovado:true},
  {nome:"Smart TV 50 4K",preco:185000,categoria:"Casa",descricao:"4K HDR, Android TV, Wi-Fi integrado.",imagem:FOTOS[6],criadorId:"admin",criadorNome:"MarketFlow",whatsapp:WA,aprovado:true}
];

const EBOOKS_DEFAULT = [
  {titulo:"Empreender em Angola",autor:"João Sebastião",preco:3500,categoria:"Negócios",descricao:"Guia prático para abrir e gerir um negócio em Angola.",capa:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",criadorId:"admin",criadorNome:"Brother's Business",whatsapp:WA},
  {titulo:"Programação Web do Zero",autor:"Carlos Mendes",preco:2500,categoria:"Tecnologia",descricao:"Aprende HTML, CSS e JavaScript com exemplos práticos.",capa:"https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&q=80",criadorId:"admin",criadorNome:"Brother's Business",whatsapp:WA}
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
const esc = s => !s ? "" : String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const kz = v => Number(v).toLocaleString("pt-AO") + " Kz";

function nota(msg, tipo) {
  const el = $("notificacao");
  if(!el) return;
  el.textContent = msg;
  el.className = "notificacao visivel " + (tipo||"");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.className = "notificacao", 2800);
}

// ===== FUNÇÕES DE UTILIZADOR (localStorage para preferências) =====
function carregarUtilizador() {
  try { const s = localStorage.getItem("bb_user"); if(s) utilizador = JSON.parse(s); } catch(e){}
  renderAuth();
}

function guardarUtilizador(u) {
  utilizador = u;
  u ? localStorage.setItem("bb_user", JSON.stringify(u)) : localStorage.removeItem("bb_user");
  renderAuth();
}

// ===== LOGIN SIMPLES (sem Firebase) =====
function entrar(nome, via) {
  if (!nome?.trim()) { nota("Escreve o teu nome.", "err"); return; }
  const tipo = via === "empresa" ? "empresa" : "utilizador";
  guardarUtilizador({ id:"u"+Date.now(), nome:nome.trim(), via:via||"manual", tipo });
  fecharLogin();
  nota("Bem-vindo(a), " + utilizador.nome + "! 👋", "ok");
  carregarProdutosFirebase();
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
  
  const adminEmails = ["admin@brothers.ao", "carlos@gmail.com"];
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
    .catch(error => nota("Erro Google: " + error.message, "err"));
}

function loginEmail() {
  const email = $("loginEmail")?.value;
  const senha = $("loginPassword")?.value;
  if (!email || !senha) {
    nota("Preenche email e palavra-passe.", "err");
    return;
  }
  
  auth.signInWithEmailAndPassword(email, senha)
    .then(result => processarLoginFirebase(result.user))
    .catch(error => {
      if (error.code === 'auth/user-not-found') {
        nota("Utilizador não encontrado. Cria uma conta primeiro.", "err");
      } else if (error.code === 'auth/wrong-password') {
        nota("Palavra-passe incorrecta.", "err");
      } else {
        nota("Erro: " + error.message, "err");
      }
    });
}

function registarUtilizadorFirebase() {
  const nome = $("regNome")?.value?.trim();
  const email = $("regEmail")?.value?.trim();
  const senha = $("regPassword")?.value;
  const confirmar = $("regConfirmPassword")?.value;
  
  if (!nome) { nota("Escreve o teu nome.", "err"); return; }
  if (!email) { nota("Escreve o teu email.", "err"); return; }
  if (!senha || senha.length < 6) { nota("Palavra-passe deve ter pelo menos 6 caracteres.", "err"); return; }
  if (senha !== confirmar) { nota("As palavras-passe não coincidem.", "err"); return; }
  
  auth.createUserWithEmailAndPassword(email, senha)
    .then(result => result.user.updateProfile({ displayName: nome }))
    .then(() => processarLoginFirebase(auth.currentUser))
    .catch(error => {
      if (error.code === 'auth/email-already-in-use') {
        nota("Este email já está registado. Faz login.", "err");
      } else {
        nota("Erro: " + error.message, "err");
      }
    });
}

function iniciarLoginTelefone() {
  $("telefoneStep1").style.display = "block";
  $("telefoneStep2").style.display = "none";
  $("modalTelefone").style.display = "flex";
  document.body.style.overflow = "hidden";
  
  if (!recaptchaVerifier) {
    recaptchaVerifier = new firebase.auth.RecaptchaVerifier('btnEnviarCodigo', {
      size: 'invisible',
      callback: () => {}
    });
  }
}

function enviarCodigoSMS() {
  const phoneNumber = $("phoneNumber")?.value?.trim();
  if (!phoneNumber) {
    nota("Escreve o número de telefone.", "err");
    return;
  }
  
  let numeroFormatado = phoneNumber;
  if (!phoneNumber.startsWith('+')) {
    numeroFormatado = '+244' + phoneNumber.replace(/\D/g, '');
  }
  
  auth.signInWithPhoneNumber(numeroFormatado, recaptchaVerifier)
    .then(result => {
      confirmationResult = result;
      $("telefoneStep1").style.display = "none";
      $("telefoneStep2").style.display = "block";
      nota("Código SMS enviado! 📱", "ok");
    })
    .catch(error => {
      nota("Erro ao enviar SMS: " + error.message, "err");
      if (recaptchaVerifier) recaptchaVerifier.render();
    });
}

function verificarCodigoSMS() {
  const code = $("verificationCode")?.value?.trim();
  if (!code) {
    nota("Escreve o código recebido.", "err");
    return;
  }
  
  confirmationResult.confirm(code)
    .then(result => {
      fecharModalTelefone();
      processarLoginFirebase(result.user);
    })
    .catch(error => {
      nota("Código inválido. Tenta novamente.", "err");
    });
}

function fecharModalTelefone() {
  $("modalTelefone").style.display = "none";
  document.body.style.overflow = "";
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
    nota("Sessão encerrada.");
  }
}

function renderAuth() {
  const z = $("zonaAuth"); if(!z) return;
  
  if (utilizador) {
    z.innerHTML = `
      <div class="chip-user">
        ${utilizador.foto ? `<img src="${utilizador.foto}" style="width:28px;height:28px;border-radius:50%;object-fit:cover">` : `<i class="fas fa-${utilizador.tipo==='empresa'?'building':'user-circle'}"></i>`}
        <span>${esc(utilizador.nome)}</span>
        ${utilizador.tipo === 'admin' ? '<span class="tag-painel" style="font-size:.6rem; padding:2px 5px;">Admin</span>' : ''}
        <button class="btn-mkt" onclick="abrirPainel('meumkt')" title="Meu Marketplace"><i class="fas fa-store"></i></button>
        <button class="btn-sair" onclick="sair()"><i class="fas fa-sign-out-alt"></i></button>
      </div>`;
  } else {
    z.innerHTML = `
      <button class="btn-auth" onclick="abrirLogin('utilizador')"><i class="fas fa-user-plus"></i> Entrar</button>
      <button class="btn-auth btn-auth-emp" onclick="abrirLogin('empresa')"><i class="fas fa-building"></i> Empresa</button>`;
  }
}

function abrirLogin(tipo) {
  const m = $("modalLogin"); if(!m) return;
  const loginTipo = $("loginTipo");
  const loginTipoLabel = $("loginTipoLabel");
  if(loginTipo) loginTipo.value = tipo || "utilizador";
  if(loginTipoLabel) loginTipoLabel.textContent = tipo === "empresa" ? "Registar empresa" : "Entrar como utilizador";
  m.style.display = "flex";
  document.body.style.overflow = "hidden";
  const loginNome = $("loginNome");
  if(loginNome) setTimeout(() => loginNome.focus(), 80);
}

function fecharLogin() {
  const modalLogin = $("modalLogin");
  if(modalLogin) modalLogin.style.display = "none";
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

// ===== FUNÇÕES DO FIRESTORE (PRODUTOS - PARTILHADOS) =====
async function iniciarProdutosPadraoFirebase() {
  const snapshot = await db.collection("produtos").limit(1).get();
  if (snapshot.empty) {
    for (const p of CATALOG_BASE) {
      await db.collection("produtos").add({
        ...p,
        dataCriacao: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
    console.log("Produtos padrão adicionados ao Firebase!");
  }
}

async function iniciarEbooksPadraoFirebase() {
  const snapshot = await db.collection("ebooks").limit(1).get();
  if (snapshot.empty) {
    for (const eb of EBOOKS_DEFAULT) {
      await db.collection("ebooks").add({
        ...eb,
        dataCriacao: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
    console.log("E-books padrão adicionados ao Firebase!");
  }
}

async function carregarProdutosFirebase() {
  try {
    const snapshot = await db.collection("produtos").where("aprovado", "==", true).get();
    produtos = [];
    snapshot.forEach(doc => {
      produtos.push({ id: doc.id, ...doc.data() });
    });
    renderProdutos();
    const totalProdutos = $("totalProdutos");
    if(totalProdutos) totalProdutos.textContent = produtos.length;
  } catch(error) {
    console.error("Erro ao carregar produtos:", error);
    produtos = [];
    renderProdutos();
  }
}

async function publicarProdutoFirebase(produto) {
  if (!utilizador) { nota("Precisas de entrar.", "err"); return null; }
  try {
    await db.collection("produtos").add({
      ...produto,
      aprovado: false,
      dataCriacao: firebase.firestore.FieldValue.serverTimestamp(),
      criadorId: utilizador.id,
      criadorNome: utilizador.nome,
      criadorEmail: utilizador.email,
      whatsapp: produto.whatsapp || WA
    });
    nota("Produto enviado para aprovação! ⏳", "ok");
    enviarNotificacao("Anúncio em análise ⏳", `"${produto.nome}" foi enviado e aguarda aprovação.`);
    return true;
  } catch(error) {
    nota("Erro ao publicar: " + error.message, "err");
    return false;
  }
}

async function aprovarProdutoFirebase(id) {
  try {
    await db.collection("produtos").doc(id).update({ aprovado: true });
    nota("Produto aprovado! ✅", "ok");
    enviarNotificacao("Produto aprovado! ✅", `O produto foi aprovado e está visível no marketplace.`);
    carregarProdutosFirebase();
    abrirPainel("admin");
  } catch(error) {
    nota("Erro ao aprovar.", "err");
  }
}

async function rejeitarProdutoFirebase(id) {
  if (!confirm("Rejeitar e remover este produto?")) return;
  try {
    const doc = await db.collection("produtos").doc(id).get();
    const produto = doc.data();
    if (produto && produto.criadorId) {
      const key = "bb_msgs_" + produto.criadorId;
      const msgs = JSON.parse(localStorage.getItem(key) || "[]");
      msgs.unshift({
        id: "m" + Date.now(),
        de: "Admin",
        texto: `❌ O teu produto *${produto.nome}* não foi aprovado. Contacta-nos para mais informações.`,
        data: new Date().toLocaleString("pt-PT"),
        lida: false
      });
      localStorage.setItem(key, JSON.stringify(msgs));
    }
    await db.collection("produtos").doc(id).delete();
    nota("Produto rejeitado e removido.", "err");
    carregarProdutosFirebase();
    abrirPainel("admin");
  } catch(error) {
    nota("Erro ao rejeitar.", "err");
  }
}

// ===== FUNÇÕES DO FIRESTORE (E-BOOKS) =====
async function carregarEbooksFirebase() {
  try {
    const snapshot = await db.collection("ebooks").get();
    const ebooks = [];
    snapshot.forEach(doc => {
      ebooks.push({ id: doc.id, ...doc.data() });
    });
    return ebooks;
  } catch(error) {
    return [];
  }
}

async function publicarEbookFirebase(ebook) {
  if (!utilizador) { nota("Precisas de entrar.", "err"); return false; }
  try {
    await db.collection("ebooks").add({
      ...ebook,
      dataCriacao: firebase.firestore.FieldValue.serverTimestamp(),
      criadorId: utilizador.id,
      criadorNome: utilizador.nome
    });
    nota("E-book publicado! 🎉", "ok");
    enviarNotificacao("Novo e-book! 📚", ebook.titulo + " — " + kz(ebook.preco));
    return true;
  } catch(error) {
    nota("Erro ao publicar e-book.", "err");
    return false;
  }
}

async function removerEbookFirebase(id) {
  if (!confirm("Remover este e-book?")) return;
  try {
    await db.collection("ebooks").doc(id).delete();
    nota("E-book removido.", "err");
    renderEbooks();
  } catch(error) {
    nota("Erro ao remover e-book.", "err");
  }
}

// ===== FUNÇÕES DE MENSAGENS =====
function getMensagensUtilizador() { if(!utilizador)return []; try{return JSON.parse(localStorage.getItem("bb_msgs_"+utilizador.id)||"[]");}catch(e){return[];} }

function adicionarMensagemEmpresa(criadorId, criadorNome, texto) {
  if (!criadorId||criadorId==="admin") return;
  const key="bb_msgs_empresa_"+criadorId;
  const msgs=JSON.parse(localStorage.getItem(key)||"[]");
  msgs.unshift({id:"m"+Date.now(),de:"Cliente",para:criadorNome,texto,data:new Date().toLocaleString("pt-PT"),lida:false});
  localStorage.setItem(key,JSON.stringify(msgs.slice(0,200)));
  enviarNotificacao("Nova mensagem 📩",texto.substring(0,80));
}

function getMensagensEmpresa() { if(!utilizador)return []; try{return JSON.parse(localStorage.getItem("bb_msgs_empresa_"+utilizador.id)||"[]");}catch(e){return[];} }

// ===== FUNÇÕES DE PEDIDOS =====
function registarPedido(p) {
  if (!utilizador) return;
  const key="bb_pedidos_"+utilizador.id;
  const pedidos=JSON.parse(localStorage.getItem(key)||"[]");
  pedidos.unshift({...p,id:"ped"+Date.now()});
  localStorage.setItem(key,JSON.stringify(pedidos.slice(0,100)));
}

function getMeusPedidos() { if(!utilizador) return []; try{return JSON.parse(localStorage.getItem("bb_pedidos_"+utilizador.id)||"[]");}catch(e){return[];} }
function getMeusAnuncios() { if(!utilizador) return []; return produtos.filter(p=>p.criadorId===utilizador.id); }
async function getMeusEbooks() { if(!utilizador) return []; const ebooks = await carregarEbooksFirebase(); return ebooks.filter(e=>e.criadorId===utilizador.id); }

// ===== RENDER PRODUTOS =====
function renderProdutos() {
  let lista = produtos.filter(p => p.aprovado);
  if (categoria !== "todos") lista = lista.filter(p => p.categoria === categoria);
  if (busca) { const t = busca.toLowerCase(); lista = lista.filter(p => p.nome.toLowerCase().includes(t) || p.descricao.toLowerCase().includes(t)); }
  if (ordem === "barato") lista.sort((a,b) => a.preco - b.preco);
  if (ordem === "caro")   lista.sort((a,b) => b.preco - a.preco);

  const g = $("grelha"), sr = $("semResultados");
  if (!g) return;
  if (!lista.length) { g.innerHTML=""; if(sr) sr.style.display="block"; return; }
  if(sr) sr.style.display="none";

  g.innerHTML = lista.map(p => {
    const meu = utilizador && p.criadorId === utilizador.id;
    const avs = JSON.parse(localStorage.getItem("av_"+p.id)||"[]");
    const media = avs.length ? (avs.reduce((s,a)=>s+a.nota,0)/avs.length).toFixed(1) : null;
    return `<div class="produto" data-id="${p.id}">
      <div class="produto-foto">
        <img src="${esc(p.imagem)}" alt="${esc(p.nome)}" onerror="this.src='${fallback}'">
        <span class="produto-cat">${esc(p.categoria||"Outros")}</span>
      </div>
      <div class="produto-info">
        <h4>${esc(p.nome)}</h4>
        <div class="produto-preco">${kz(p.preco)}</div>
        <div class="produto-desc">${esc(p.descricao)}</div>
        <div class="produto-rodape">
          <div class="produto-vendedor"><i class="fas fa-user"></i>${esc(p.criadorNome)}${media?` · ⭐${media}`:""}</div>
          ${meu?`<button class="btn-remover" data-id="${p.id}"><i class="fas fa-trash-alt"></i></button>`:""}
        </div>
      </div>
    </div>`;
  }).join("");

  g.querySelectorAll(".btn-remover").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      if (!confirm("Remover este anúncio?")) return;
      db.collection("produtos").doc(btn.dataset.id).delete();
      produtos = produtos.filter(p => p.id != btn.dataset.id);
      renderProdutos();
      nota("Anúncio removido.", "err");
    });
  });
  g.querySelectorAll(".produto").forEach(card => {
    card.addEventListener("click", e => { if(e.target.closest(".btn-remover")) return; abrirProduto(card.dataset.id); });
  });
}

// ===== MODAL PRODUTO =====
function abrirProduto(id) {
  const p = produtos.find(x => x.id === id); if(!p) return;
  prodAberto = p; qty = 1; corSel = ""; tamSel = ""; notaSel = 0;
  const mFoto = $("mFoto");
  if(mFoto) {
    mFoto.src = p.imagem; 
    mFoto.onerror = () => mFoto.src = fallback;
  }
  const mNome = $("mNome");
  if(mNome) mNome.textContent = p.nome;
  const mPreco = $("mPreco");
  if(mPreco) mPreco.textContent = kz(p.preco);
  const mVendedor = $("mVendedor");
  if(mVendedor) mVendedor.innerHTML = `<i class="fas fa-user"></i> ${esc(p.criadorNome)}`;
  const mDesc = $("mDesc");
  if(mDesc) mDesc.textContent = p.descricao;
  const mCatTag = $("mCatTag");
  if(mCatTag) mCatTag.textContent = p.categoria||"Outros";
  const qtyNum = $("qtyNum");
  if(qtyNum) qtyNum.textContent = 1;
  const cB = $("mCoresBloco"), tB = $("mTamBloco");
  if (cB && p.cores?.length) { 
    cB.style.display="block"; 
    const mCores = $("mCores");
    if(mCores) mCores.innerHTML = p.cores.map(c=>`<button class="opt" onclick="escolherCor('${esc(c)}',this)">${esc(c)}</button>`).join(""); 
    const mCorLabel = $("mCorLabel");
    if(mCorLabel) mCorLabel.textContent="";
  } else if(cB) { cB.style.display="none"; }
  if (tB && p.tamanhos?.length) { 
    tB.style.display="block"; 
    const mTams = $("mTams");
    if(mTams) mTams.innerHTML = p.tamanhos.map(t=>`<button class="opt" onclick="escolherTam('${esc(t)}',this)">${esc(t)}</button>`).join(""); 
  } else if(tB) { tB.style.display="none"; }
  renderEstrelas();
  const avs = JSON.parse(localStorage.getItem("av_"+p.id)||"[]");
  const avsB = $("mAvsBloco");
  if (avs.length && avsB) { 
    avsB.style.display="block"; 
    const mAvsList = $("mAvsList");
    if(mAvsList) mAvsList.innerHTML = avs.map(a=>`<div class="av"><strong>${esc(a.nome)}</strong><div class="av-stars">${"★".repeat(a.nota)}${"☆".repeat(5-a.nota)}</div>${a.texto?`<p>${esc(a.texto)}</p>`:""}</div>`).join(""); 
  } else if(avsB) { avsB.style.display="none"; }
  actualizarResumo();
  const modalProduto = $("modalProduto");
  if(modalProduto) {
    modalProduto.style.display="flex"; 
    document.body.style.overflow="hidden";
  }
  if (p.criadorId !== "admin" && p.criadorId !== utilizador?.id) adicionarMensagemEmpresa(p.criadorId, p.criadorNome, `Alguém está a ver o teu produto: *${p.nome}*`);
}

function fecharProduto() { 
  const modalProduto = $("modalProduto");
  if(modalProduto) modalProduto.style.display="none"; 
  document.body.style.overflow=""; 
  prodAberto=null; 
}

function escolherCor(c,btn) { 
  corSel=c; 
  const mCores = $("mCores");
  if(mCores) mCores.querySelectorAll(".opt").forEach(b=>b.classList.remove("sel")); 
  btn.classList.add("sel"); 
  const mCorLabel = $("mCorLabel");
  if(mCorLabel) mCorLabel.textContent="Seleccionada: "+c; 
  actualizarResumo(); 
}

function escolherTam(t,btn) { 
  tamSel=t; 
  const mTams = $("mTams");
  if(mTams) mTams.querySelectorAll(".opt").forEach(b=>b.classList.remove("sel")); 
  btn.classList.add("sel"); 
  actualizarResumo(); 
}

function renderEstrelas() {
  const mEstrelas = $("mEstrelas");
  if(mEstrelas) {
    mEstrelas.innerHTML = [1,2,3,4,5].map(n=>`<span class="estrela ${n<=notaSel?"ativa":""}" onclick="escolherEstrela(${n})">★</span>`).join("");
  }
  const mEstrelasLabel = $("mEstrelasLabel");
  if(mEstrelasLabel) mEstrelasLabel.textContent = notaSel ? notaSel+" estrela(s)" : "Clica para avaliar";
}

function escolherEstrela(n) { notaSel=n; renderEstrelas(); }

function actualizarResumo() {
  if (!prodAberto) return;
  let txt = `Produto: <strong>${esc(prodAberto.nome)}</strong><br>`;
  if (corSel) txt += `Cor: <strong>${esc(corSel)}</strong><br>`;
  if (tamSel) txt += `Tamanho: <strong>${esc(tamSel)}</strong><br>`;
  txt += `Quantidade: <strong>${qty}</strong>`;
  const mResumoTxt = $("mResumoTxt");
  if(mResumoTxt) mResumoTxt.innerHTML = txt;
  const mTotal = $("mTotal");
  if(mTotal) mTotal.textContent = kz(prodAberto.preco * qty);
}

function confirmarWA() {
  if (!prodAberto) return;
  if (!utilizador) { fecharProduto(); abrirLogin(); return; }
  if (notaSel) { const key="av_"+prodAberto.id; const avs=JSON.parse(localStorage.getItem(key)||"[]"); avs.push({nome:utilizador.nome,nota:notaSel,texto:$("mComentario")?.value||""}); localStorage.setItem(key,JSON.stringify(avs)); }
  registarPedido({ tipo:"produto", nome:prodAberto.nome, preco:prodAberto.preco, qty, cor:corSel, tam:tamSel, vendedor:prodAberto.criadorNome, data:new Date().toLocaleDateString("pt-PT") });
  adicionarMensagemEmpresa(prodAberto.criadorId, prodAberto.criadorNome, `📦 Novo interesse no produto *${prodAberto.nome}* por *${utilizador.nome}*. Qty: ${qty}. Total: ${kz(prodAberto.preco*qty)}`);
  const num = prodAberto.whatsapp||WA;
  const msg = `Olá! Tenho interesse em: *${prodAberto.nome}*\nPreço: *${kz(prodAberto.preco)}*${corSel?`\nCor: *${corSel}*`:""}${tamSel?`\nTamanho: *${tamSel}*`:""}\nQuantidade: *${qty}*\nTotal: *${kz(prodAberto.preco*qty)}*\nMeu nome: *${utilizador.nome}*`;
  window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`,"_blank");
}

// ===== CARRINHO =====
function addCarrinho() {
  if (!prodAberto) return;
  if (!utilizador) { fecharProduto(); abrirLogin(); return; }
  const item = carrinho.find(i => i.id===prodAberto.id && i.cor===corSel && i.tam===tamSel);
  if (item) item.qty += qty;
  else carrinho.push({id:prodAberto.id,nome:prodAberto.nome,preco:prodAberto.preco,foto:prodAberto.imagem,cor:corSel,tam:tamSel,qty,vendedor:prodAberto.criadorNome,whatsapp:prodAberto.whatsapp||WA,criadorId:prodAberto.criadorId});
  actualizarBadgeCarrinho(); nota(prodAberto.nome+" adicionado! 🛍️","ok");
}

function actualizarBadgeCarrinho() {
  const total = carrinho.reduce((s,i)=>s+i.qty,0);
  const b = $("badgeCarrinho"); 
  if(b) {
    b.textContent=total; 
    b.style.display=total===0?"none":"flex";
  }
}

function abrirCarrinho() {
  const gavetaCarrinho = $("gavetaCarrinho");
  const overlayCarrinho = $("overlayCarrinho");
  if(gavetaCarrinho) gavetaCarrinho.classList.add("aberta"); 
  if(overlayCarrinho) overlayCarrinho.style.display="block";
  document.body.style.overflow="hidden"; 
  renderCarrinho();
}

function fecharCarrinho() {
  const gavetaCarrinho = $("gavetaCarrinho");
  const overlayCarrinho = $("overlayCarrinho");
  if(gavetaCarrinho) gavetaCarrinho.classList.remove("aberta"); 
  if(overlayCarrinho) overlayCarrinho.style.display="none";
  document.body.style.overflow="";
}

function renderCarrinho() {
  const itens=$("gavetaItens"), rod=$("gavetaRodape");
  if (!itens) return;
  if (!carrinho.length) { itens.innerHTML=`<div class="carrinho-vazio"><span>🛍️</span><p>Ainda não adicionaste nada</p></div>`; if(rod) rod.style.display="none"; return; }
  itens.innerHTML = carrinho.map((item,i) => `
    <div class="item-carrinho">
      <img src="${esc(item.foto)}" onerror="this.src='${fallback}'" alt="">
      <div class="item-info">
        <h5>${esc(item.nome)}</h5>
        <b>${kz(item.preco)}</b>
        <small>Qty: ${item.qty}${item.cor?" · "+item.cor:""}${item.tam?" · "+item.tam:""}</small>
        <small class="item-vendedor">Vendedor: ${esc(item.vendedor)}</small>
      </div>
      <div class="item-acoes">
        <div class="item-qty-ctrl">
          <button onclick="alterarQtyCarrinho(${i},-1)">−</button>
          <span>${item.qty}</span>
          <button onclick="alterarQtyCarrinho(${i},1)">+</button>
        </div>
        <button class="item-remover" onclick="removerCarrinho(${i})"><i class="fas fa-times"></i></button>
      </div>
    </div>`).join("");
  const total = carrinho.reduce((s,i)=>s+i.preco*i.qty,0);
  const totalCarrinho = $("totalCarrinho");
  if(totalCarrinho) totalCarrinho.textContent = kz(total);
  if(rod) rod.style.display="flex";
}

function alterarQtyCarrinho(i, delta) {
  carrinho[i].qty = Math.max(1, carrinho[i].qty + delta);
  actualizarBadgeCarrinho(); renderCarrinho();
}

function removerCarrinho(i) { carrinho.splice(i,1); actualizarBadgeCarrinho(); renderCarrinho(); }

function checkoutWA() {
  if (!utilizador) { fecharCarrinho(); abrirLogin(); return; }
  if (!carrinho.length) return;
  const porVendedor = {};
  carrinho.forEach(i => {
    const key = i.whatsapp||WA;
    if (!porVendedor[key]) porVendedor[key] = { nome:i.vendedor, items:[], wa:key, criadorId:i.criadorId };
    porVendedor[key].items.push(i);
  });
  const vendedores = Object.values(porVendedor);
  if (vendedores.length === 1) {
    _enviarMsgCarrinho(vendedores[0]);
  } else {
    const opcoes = vendedores.map((v,i)=>`${i+1}. ${v.nome} (${v.items.length} produto(s))`).join("\n");
    const escolha = prompt(`Tens produtos de ${vendedores.length} vendedores:\n${opcoes}\n\nEscreve o número do vendedor para contactar primeiro (ou 0 para todos):`, "0");
    if (escolha === "0") { vendedores.forEach(v => setTimeout(()=>_enviarMsgCarrinho(v), 400)); }
    else { const idx = parseInt(escolha)-1; if (vendedores[idx]) _enviarMsgCarrinho(vendedores[idx]); }
  }
  carrinho.forEach(i => registarPedido({tipo:"produto",nome:i.nome,preco:i.preco,qty:i.qty,cor:i.cor,tam:i.tam,vendedor:i.vendedor,data:new Date().toLocaleDateString("pt-PT")}));
}

function _enviarMsgCarrinho(v) {
  let msg = `Olá ${esc(v.nome)}! Quero encomendar:\n\n`;
  v.items.forEach(i => msg+=`• *${i.nome}* ×${i.qty} = *${kz(i.preco*i.qty)}*${i.cor?" ("+i.cor+")":""}${i.tam?" ("+i.tam+")":""}\n`);
  const total = v.items.reduce((s,i)=>s+i.preco*i.qty,0);
  msg += `\n*Total: ${kz(total)}*\nNome: *${utilizador.nome}*`;
  adicionarMensagemEmpresa(v.criadorId, v.nome, `🛒 Encomenda de *${utilizador.nome}*:\n${v.items.map(i=>`• ${i.nome} ×${i.qty}`).join("\n")}\nTotal: ${kz(total)}`);
  window.open(`https://wa.me/${v.wa}?text=${encodeURIComponent(msg)}`,"_blank");
}

// ===== FORMULÁRIO VENDA =====
function setupVenda() {
  ["nProd","pProd","dProd","nomeVendedor","whatsVendedor"].forEach(id => $(id)?.addEventListener("input", actualizarPreview));

  const uploadFoto = $("uploadFoto");
  if(uploadFoto) {
    uploadFoto.addEventListener("change", e => {
      const file = e.target.files[0];
      if(!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        const fotoPreviewVenda = $("fotoPreviewVenda");
        if(fotoPreviewVenda) {
          fotoPreviewVenda.src = ev.target.result;
          fotoPreviewVenda.style.display = "block";
        }
        const uploadLabel = $("uploadLabel");
        if(uploadLabel) uploadLabel.textContent = "Foto seleccionada ✅";
        actualizarPreview();
      };
      reader.readAsDataURL(file);
    });
  }

  const formVenda = $("formVenda");
  if(formVenda) {
    formVenda.addEventListener("submit", async e => {
      e.preventDefault();
      if (!utilizador) { nota("Precisas de entrar para anunciar.", "err"); abrirLogin(); return; }
      
      const nome = $("nProd").value.trim();
      const preco = parseFloat($("pProd").value);
      const desc = $("dProd").value.trim();
      const wa = $("whatsVendedor").value.trim();
      const nomeVendedor = $("nomeVendedor").value.trim();
      const catRadio = document.querySelector("input[name='cat']:checked");
      const cat = catRadio ? catRadio.value : "Outros";
      const fotoEl = $("fotoPreviewVenda");
      const imagem = (fotoEl && fotoEl.src && fotoEl.src !== window.location.href) ? fotoEl.src : fallback;
      
      if (!nome) { nota("Escreve o nome do produto.", "err"); return; }
      if (!preco || preco <= 0) { nota("Preço inválido.", "err"); return; }
      if (!nomeVendedor) { nota("Escreve o teu nome como vendedor.", "err"); return; }
      if (!wa) { nota("Escreve o teu número de WhatsApp.", "err"); return; }
      
      const waLimpo = wa.replace(/\D/g, '');
      if(waLimpo.length < 9) { nota("Número de WhatsApp inválido.", "err"); return; }
      
      await publicarProdutoFirebase({ 
        nome, 
        preco, 
        categoria: cat, 
        descricao: desc || "Sem descrição.", 
        imagem, 
        whatsapp: waLimpo, 
        criadorNome: nomeVendedor 
      });
      
      $("formVenda").reset(); 
      $("fotoPreviewVenda").style.display="none"; 
      $("uploadLabel").textContent="Escolher foto ou tirar foto"; 
      $("previewFoto").innerHTML="📷";
      irPara("comprar");
    });
  }
}

function actualizarPreview() {
  const nProd = $("nProd");
  const pProd = $("pProd");
  const dProd = $("dProd");
  const nomeVendedor = $("nomeVendedor");
  const whatsVendedor = $("whatsVendedor");
  
  const nome = nProd?.value || "Nome do produto";
  const preco = parseFloat(pProd?.value) || 0;
  const desc = dProd?.value || "Descrição...";
  const vendedor = nomeVendedor?.value || "Vendedor";
  const whats = whatsVendedor?.value || "";
  
  const prevNome = $("prevNome");
  const prevPreco = $("prevPreco");
  const prevDesc = $("prevDesc");
  const prevVendedor = $("prevVendedor");
  const prevWhats = $("prevWhats");
  
  if(prevNome) prevNome.textContent = nome;
  if(prevPreco) prevPreco.textContent = kz(preco);
  if(prevDesc) prevDesc.textContent = desc.substring(0, 72);
  if(prevVendedor) prevVendedor.textContent = vendedor;
  if(prevWhats && whats) prevWhats.textContent = `WhatsApp: ${whats}`;
  
  const fotoEl = $("fotoPreviewVenda");
  const previewFoto = $("previewFoto");
  if(fotoEl && fotoEl.src && fotoEl.style.display !== "none" && previewFoto) {
    previewFoto.innerHTML = `<img src="${fotoEl.src}" style="width:100%;height:100%;object-fit:cover">`;
  }
}

// ===== IA LOCAL =====
function gerarDescricaoLocal(nome, cat) {
  const descricoes = {
    "Tecnologia": `${nome} - produto tecnológico de qualidade. Com garantia e suporte. Excelente custo-benefício para o mercado angolano.`,
    "Moda": `${nome} - peça moderna e confortável. Ideal para o dia a dia. Qualidade premium e estilo único.`,
    "Casa": `${nome} - perfeito para sua casa. Design funcional e durável. Aproveite esta oportunidade!`,
    "Veículos": `${nome} - veículo em excelente estado. Revisões em dia, documentação regularizada. Agende uma visita!`,
    "Desporto": `${nome} - equipamento esportivo de alta performance. Ideal para treinos e competições.`,
    "Outros": `${nome} - produto de qualidade. Entre em contacto para mais informações e negociação.`
  };
  return descricoes[cat] || `${nome} - produto novo e original. Garantia de qualidade. Preço negociável.`;
}

async function gerarDescricao() {
  const nProd = $("nProd");
  const nome = nProd?.value?.trim();
  const catRadio = document.querySelector("input[name='cat']:checked");
  const cat = catRadio ? catRadio.value : "produto";
  if (!nome) { nota("Escreve o nome do produto primeiro.", "err"); return; }
  const btn=$("btnGerarDesc");
  const loader=$("iaLoader");
  if(btn) btn.disabled=true;
  if(loader) loader.style.display="flex";
  pushMsgIA(`Gerar descrição para: "${nome}"`, "user");
  
  setTimeout(() => {
    const texto = gerarDescricaoLocal(nome, cat);
    const dProd = $("dProd");
    if (texto && dProd) { 
      dProd.value=texto; 
      actualizarPreview(); 
      pushMsgIA("Pronto! ✅ Descrição gerada com sucesso.","bot"); 
      nota("Descrição gerada! ✨","ok"); 
    }
    if(btn) btn.disabled=false; 
    if(loader) loader.style.display="none";
  }, 500);
}

function pushMsgIA(texto, tipo) {
  const box=$("chatMsgs"); if(!box) return;
  const d=document.createElement("div"); d.className="msg "+tipo; d.innerHTML=esc(texto);
  box.appendChild(d); box.scrollTop=box.scrollHeight;
}

function enviarChat() {
  const chatInput = $("chatInput");
  const msg = chatInput?.value?.trim(); 
  if(!msg) return;
  if(chatInput) chatInput.value=""; 
  pushMsgIA(msg,"user");
  
  setTimeout(() => {
    let resposta = "";
    const msgLower = msg.toLowerCase();
    if (msgLower.includes("preço") || msgLower.includes("quanto custa")) {
      resposta = "Os preços são definidos pelos vendedores. Clica no produto para ver o preço e negociar!";
    } else if (msgLower.includes("como comprar") || msgLower.includes("comprar")) {
      resposta = "Para comprar: clica no produto, escolhe opções (se houver), adiciona ao carrinho ou confirma pelo WhatsApp.";
    } else if (msgLower.includes("anunciar") || msgLower.includes("vender")) {
      resposta = "Vai à secção 'Anunciar', preenche o formulário e publica! O anúncio aguarda aprovação do admin.";
    } else if (msgLower.includes("ebook") || msgLower.includes("e-book")) {
      resposta = "Os e-books estão na secção 'E-books'. Podes publicar o teu ou adquirir os disponíveis.";
    } else if (msgLower.includes("conta") || msgLower.includes("login") || msgLower.includes("entrar")) {
      resposta = "Clica em 'Entrar' no canto superior direito, escreve o teu nome e pronto!";
    } else {
      resposta = "Podes perguntar sobre preços, como comprar, como anunciar, e-books ou como criar conta! Estou aqui para ajudar.";
    }
    pushMsgIA(resposta, "bot");
  }, 300);
}

// ===== NAVEGAÇÃO =====
function irPara(sec) {
  document.querySelectorAll(".secao").forEach(s=>s.classList.remove("ativa"));
  document.querySelectorAll(".nav-topo a").forEach(a=>a.classList.toggle("ativo",a.dataset.sec===sec));
  const secEl = $("sec-"+sec);
  if(secEl) secEl.classList.add("ativa");
  if (sec==="comprar") carregarProdutosFirebase();
  if (sec==="ebooks") renderEbooks();
  const main = document.querySelector("main");
  window.scrollTo({top:main?.offsetTop||0,behavior:"smooth"});
}

function abrirMenu() { 
  const menuLateral = $("menuLateral");
  const overlayMenu = $("overlayMenu");
  if(menuLateral) menuLateral.classList.add("aberto"); 
  if(overlayMenu) overlayMenu.classList.add("aberto"); 
  document.body.style.overflow="hidden"; 
}

function fecharMenu() { 
  const menuLateral = $("menuLateral");
  const overlayMenu = $("overlayMenu");
  if(menuLateral) menuLateral.classList.remove("aberto"); 
  if(overlayMenu) overlayMenu.classList.remove("aberto"); 
  document.body.style.overflow=""; 
}

// ===== E-BOOKS =====
async function renderEbooks() {
  const ebooks = await carregarEbooksFirebase();
  let lista = ebooks;
  if (catEbook!=="todos") lista=lista.filter(e=>e.categoria===catEbook);
  if (buscaEbook) { const t=buscaEbook.toLowerCase(); lista=lista.filter(e=>e.titulo.toLowerCase().includes(t)||(e.autor||"").toLowerCase().includes(t)); }
  const g=$("grelhaEbooks"),sr=$("semResultadosEbook");
  if(!g) return;
  if(!lista.length){g.innerHTML="";if(sr)sr.style.display="block";return;}if(sr)sr.style.display="none";
  g.innerHTML=lista.map(eb=>{
    const meu=utilizador&&eb.criadorId===utilizador.id;
    return `<div class="cartao-ebook" data-ebid="${eb.id}">
      <div class="ebook-capa">
        ${eb.capa?`<img src="${esc(eb.capa)}" alt="" onerror="this.style.display='none'">`:`<span class="ebook-capa-placeholder">📖</span>`}
        <span class="ebook-cat-tag">${esc(eb.categoria)}</span>
      </div>
      <div class="ebook-info">
        <h4>${esc(eb.titulo)}</h4>
        <div class="ebook-autor">${eb.autor?`<i class="fas fa-user-pen"></i> ${esc(eb.autor)}`:""}</div>
        <div class="ebook-preco">${kz(eb.preco)}</div>
        <div class="ebook-rodape">
          <div class="ebook-formato"><i class="fas fa-file-pdf"></i> PDF</div>
          ${meu?`<button class="btn-remover" onclick="event.stopPropagation();removerEbookFirebase('${eb.id}')"><i class="fas fa-trash-alt"></i></button>`:""}
        </div>
      </div>
    </div>`;
  }).join("");
  g.querySelectorAll(".cartao-ebook").forEach(card=>{card.addEventListener("click",e=>{if(e.target.closest(".btn-remover"))return;abrirModalEbook(card.dataset.ebid);});});
}

async function abrirModalEbook(id) {
  const ebooks = await carregarEbooksFirebase();
  const eb = ebooks.find(e=>e.id===id);
  if(!eb) return;
  ebookAberto=eb;
  const ebMFoto = $("ebMFoto");
  if(ebMFoto) {
    if(eb.capa){ebMFoto.src=eb.capa;ebMFoto.onerror=()=>ebMFoto.src=fallback;}else ebMFoto.src=fallback;
  }
  const ebMTitulo = $("ebMTitulo");
  const ebMPreco = $("ebMPreco");
  const ebMCat = $("ebMCat");
  const ebMAutor = $("ebMAutor");
  const ebMDesc = $("ebMDesc");
  const ebMMeta = $("ebMMeta");
  if(ebMTitulo) ebMTitulo.textContent=eb.titulo;
  if(ebMPreco) ebMPreco.textContent=kz(eb.preco);
  if(ebMCat) ebMCat.textContent=eb.categoria;
  if(ebMAutor) ebMAutor.innerHTML=eb.autor?`<i class="fas fa-user-pen"></i> ${esc(eb.autor)}`:"";
  if(ebMDesc) ebMDesc.textContent=eb.descricao||"";
  if(ebMMeta) ebMMeta.innerHTML=`<span><i class="fas fa-file-pdf"></i> Formato PDF</span><span><i class="fas fa-tag"></i> ${esc(eb.categoria)}</span><span><i class="fas fa-user"></i> Vendido por ${esc(eb.criadorNome)}</span>`;
  const modalEbook = $("modalEbook");
  if(modalEbook) {
    modalEbook.style.display="flex"; 
    document.body.style.overflow="hidden";
  }
}

function fecharModalEbook(){
  const modalEbook = $("modalEbook");
  if(modalEbook) modalEbook.style.display="none";
  document.body.style.overflow="";
  ebookAberto=null;
}

function setupEbooks() {
  const campoBuscaEbook = $("campoBuscaEbook");
  if(campoBuscaEbook) {
    campoBuscaEbook.addEventListener("input", e => { buscaEbook = e.target.value; renderEbooks(); });
  }
  
  document.querySelectorAll(".cat-eb").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".cat-eb").forEach(b => b.classList.remove("ativa"));
      btn.classList.add("ativa");
      catEbook = btn.dataset.cat;
      renderEbooks();
    });
  });
  
  const uploadEbookCapa = $("uploadEbookCapa");
  if(uploadEbookCapa) {
    uploadEbookCapa.addEventListener("change", e => {
      const file = e.target.files[0];
      if(!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        const preview = $("ebookCapaPreview");
        if(preview) {
          preview.src = ev.target.result;
          preview.style.display = "block";
        }
        const uploadLabel = $("uploadEbookLabel");
        if(uploadLabel) uploadLabel.textContent = "Capa selecionada ✅";
      };
      reader.readAsDataURL(file);
    });
  }
  
  const btnGerarDescEbook = $("btnGerarDescEbook");
  if(btnGerarDescEbook) {
    btnGerarDescEbook.addEventListener("click", () => gerarDescricaoEbook());
  }
  
  const formEbook = $("formEbook");
  if(formEbook) {
    formEbook.addEventListener("submit", async e => {
      e.preventDefault();
      if(!utilizador) { nota("Precisas de entrar.", "err"); abrirLogin(); return; }
      
      const titulo = $("ebTitulo")?.value?.trim() || "";
      const preco = parseFloat($("ebPreco")?.value) || 0;
      const autor = $("ebAutor")?.value?.trim() || "";
      const cat = $("ebCat")?.value || "";
      const desc = $("ebDesc")?.value?.trim() || "";
      const wa = $("ebWA")?.value?.trim() || "";
      
      const capaPreview = $("ebookCapaPreview");
      let capa = "";
      if(capaPreview && capaPreview.src && capaPreview.style.display !== "none") {
        capa = capaPreview.src;
      }
      
      if(!titulo) { nota("Escreve o título.", "err"); return; }
      if(!preco || preco <= 0) { nota("Preço inválido.", "err"); return; }
      if(!cat) { nota("Escolhe uma categoria.", "err"); return; }
      if(!capa) { nota("Seleciona uma imagem de capa.", "err"); return; }
      
      await publicarEbookFirebase({ titulo, preco, autor, categoria:cat, descricao:desc, capa, whatsapp:wa || WA });
      $("formEbook").reset();
      $("ebookCapaPreview").style.display = "none";
      $("uploadEbookLabel").textContent = "Escolher capa ou tirar foto";
      renderEbooks();
    });
  }
  
  const btnEbookWA = $("btnEbookWA");
  if(btnEbookWA) {
    btnEbookWA.addEventListener("click", () => {
      if(!ebookAberto) return;
      if(!utilizador) { fecharModalEbook(); abrirLogin(); return; }
      registarPedido({ tipo: "ebook", nome: ebookAberto.titulo, preco: ebookAberto.preco, qty: 1, vendedor: ebookAberto.criadorNome, data: new Date().toLocaleDateString("pt-PT") });
      const msg = `Olá! Tenho interesse no e-book:\n*${ebookAberto.titulo}*\nPreço: *${kz(ebookAberto.preco)}*\nMeu nome: *${utilizador.nome}*`;
      window.open(`https://wa.me/${ebookAberto.whatsapp || WA}?text=${encodeURIComponent(msg)}`, "_blank");
    });
  }
  
  const modalEbook = $("modalEbook");
  if(modalEbook) {
    modalEbook.addEventListener("click", e => { if(e.target === modalEbook) fecharModalEbook(); });
  }
}

function gerarDescricaoEbook() {
  const titulo = $("ebTitulo")?.value?.trim();
  const cat = $("ebCat")?.value || "geral";
  
  if(!titulo) { nota("Escreve o título do e-book primeiro.", "err"); return; }
  
  const btn = $("btnGerarDescEbook");
  const loader = $("iaLoaderEbook");
  if(btn) btn.disabled = true;
  if(loader) loader.style.display = "flex";
  
  setTimeout(() => {
    let descricao = "";
    const catLower = cat.toLowerCase();
    
    if(catLower.includes("negócio") || catLower.includes("business")) {
      descricao = `📘 "${titulo}" é um guia prático para empreendedores angolanos. Aprende estratégias de negócio, gestão financeira e como expandir no mercado local. Ideal para quem quer iniciar ou fortalecer o seu negócio.`;
    } else if(catLower.includes("tecnologia")) {
      descricao = `💻 "${titulo}" aborda conceitos essenciais de tecnologia de forma simples e prática. Perfeito para iniciantes e profissionais que desejam atualizar conhecimentos. Inclui exemplos reais e exercícios.`;
    } else if(catLower.includes("saúde")) {
      descricao = `🩺 "${titulo}" traz informações valiosas sobre saúde e bem-estar. Escrito por especialistas, oferece dicas práticas para uma vida mais saudável.`;
    } else if(catLower.includes("educação")) {
      descricao = `🎓 "${titulo}" é um recurso educativo completo. Ideal para estudantes e professores. Conteúdo actualizado e de fácil compreensão.`;
    } else if(catLower.includes("ficção")) {
      descricao = `📖 "${titulo}" é uma obra cativante que prende o leitor do início ao fim. Personagens bem construídos e uma história envolvente.`;
    } else {
      descricao = `📚 "${titulo}" é um e-book exclusivo que vai transformar a tua forma de pensar. Adquira já e tenha acesso a conteúdo de qualidade.`;
    }
    
    const ebDesc = $("ebDesc");
    if(ebDesc) ebDesc.value = descricao;
    nota("Descrição gerada com IA! ✨", "ok");
    
    if(btn) btn.disabled = false;
    if(loader) loader.style.display = "none";
  }, 500);
}

// ===== MEU MARKETPLACE =====
async function renderMeuMkt() {
  if (!utilizador) return `<div class="admin-bloqueado"><i class="fas fa-user-circle"></i><h4>Não identificado</h4><p>Entra na tua conta para ver o teu marketplace.</p><button class="btn-publicar" onclick="fecharPainel();abrirLogin()">Entrar</button></div>`;
  
  const pedidos = getMeusPedidos();
  const anuncios = getMeusAnuncios();
  const ebooks = await getMeusEbooks();
  const msgs = getMensagensUtilizador();
  
  return `
    <div style="display:flex;flex-direction:column;gap:20px">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div class="cartao-stat"><b>${pedidos.length}</b><small><i class="fas fa-receipt"></i> Pedidos</small></div>
        <div class="cartao-stat"><b>${anuncios.length}</b><small><i class="fas fa-tag"></i> Anúncios</small></div>
        <div class="cartao-stat"><b>${anuncios.filter(p=>p.aprovado).length}</b><small><i class="fas fa-check-circle" style="color:#25D366"></i> Aprovados</small></div>
        <div class="cartao-stat"><b>${anuncios.filter(p=>!p.aprovado).length}</b><small><i class="fas fa-clock" style="color:var(--ouro)"></i> Pendentes</small></div>
      </div>

      ${msgs.length?`
      <div>
        <h4 style="font-family:'Plus Jakarta Sans',sans-serif;color:#fff;margin-bottom:10px"><i class="fas fa-envelope" style="color:var(--ouro)"></i> Mensagens</h4>
        <div style="display:flex;flex-direction:column;gap:8px;max-height:200px;overflow-y:auto">
          ${msgs.map(m=>`<div class="msg-item"><div class="msg-item-remetente">${esc(m.de)}</div><p>${esc(m.texto)}</p><small>${esc(m.data)}</small></div>`).join("")}
        </div>
      </div>`:""}

      <div>
        <h4 style="font-family:'Plus Jakarta Sans',sans-serif;color:#fff;margin-bottom:10px"><i class="fas fa-receipt" style="color:var(--ouro)"></i> Histórico de pedidos</h4>
        ${pedidos.length?pedidos.map(p=>`
          <div class="cartao-novidade" style="margin-bottom:8px">
            <div class="cartao-novidade-topo"><h5>${esc(p.nome)}</h5><span class="tag-painel">${esc(p.tipo)}</span></div>
            <div class="data-nov">${esc(p.data)} · ${esc(p.vendedor)}</div>
            <p>${kz(p.preco)} × ${p.qty||1} = <strong style="color:var(--ouro)">${kz(p.preco*(p.qty||1))}</strong></p>
          </div>`).join(""):`<p style="color:var(--txt2);font-size:.87rem">Nenhum pedido ainda.</p>`}
      </div>

      <div>
        <h4 style="font-family:'Plus Jakarta Sans',sans-serif;color:#fff;margin-bottom:10px"><i class="fas fa-tag" style="color:var(--ouro)"></i> Os meus anúncios</h4>
        ${anuncios.length?anuncios.map(p=>`
          <div class="cartao-novidade" style="margin-bottom:8px">
            <div class="cartao-novidade-topo"><h5>${esc(p.nome)}</h5><span class="tag-painel" style="background:${p.aprovado?"rgba(37,211,102,0.15)":"rgba(201,151,58,0.15)"};border-color:${p.aprovado?"#25D366":"var(--ouro)"});color:${p.aprovado?"#25D366":"var(--ouro)"}">${p.aprovado?"✅ Aprovado":"⏳ Pendente"}</span></div>
            <p style="color:var(--txt2);font-size:.85rem">${kz(p.preco)} · ${esc(p.categoria)}</p>
          </div>`).join(""):`<p style="color:var(--txt2);font-size:.87rem">Nenhum anúncio publicado.</p>`}
      </div>
    </div>`;
}

// ===== PAINEL EMPRESA =====
async function renderPainelEmpresa() {
  if (!utilizador) return `<div class="admin-bloqueado"><i class="fas fa-building"></i><h4>Não identificado</h4><p>Entra como empresa para ver este painel.</p><button class="btn-publicar" onclick="fecharPainel();abrirLogin('empresa')">Entrar como Empresa</button></div>`;
  if(utilizador.tipo!=="empresa") return `<div class="admin-bloqueado"><i class="fas fa-building"></i><h4>Conta de empresa necessária</h4><p>Este painel é exclusivo para contas de empresa.</p></div>`;
  
  const anuncios = getMeusAnuncios();
  const ebooks = await getMeusEbooks();
  const msgs = getMensagensEmpresa();
  const naoLidas = msgs.filter(m=>!m.lida).length;
  
  return `
    <div style="display:flex;flex-direction:column;gap:20px">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div class="cartao-stat"><b>${anuncios.filter(p=>p.aprovado).length}</b><small><i class="fas fa-store"></i> Produtos activos</small></div>
        <div class="cartao-stat"><b>${anuncios.filter(p=>!p.aprovado).length}</b><small><i class="fas fa-clock" style="color:var(--ouro)"></i> Aguardam aprovação</small></div>
        <div class="cartao-stat"><b>${ebooks.length}</b><small><i class="fas fa-book"></i> E-books</small></div>
        <div class="cartao-stat" style="border-color:${naoLidas?"rgba(201,151,58,0.4)":"var(--borda)"}"><b>${naoLidas}</b><small><i class="fas fa-envelope" style="color:var(--ouro)"></i> Novas msgs</small></div>
      </div>

      <div>
        <h4 style="font-family:'Plus Jakarta Sans',sans-serif;color:#fff;margin-bottom:10px"><i class="fas fa-envelope" style="color:var(--ouro)"></i> Caixa de mensagens</h4>
        ${msgs.length?`
          <div style="display:flex;flex-direction:column;gap:8px;max-height:280px;overflow-y:auto">
            ${msgs.map((m,i)=>`
              <div class="msg-item ${m.lida?"":"msg-nao-lida"}" onclick="marcarLida(${i})">
                <div class="msg-item-remetente">${esc(m.de)} ${!m.lida?'<span class="badge" style="font-size:.58rem">Novo</span>':""}</div>
                <p>${esc(m.texto)}</p>
                <small>${esc(m.data)}</small>
              </div>`).join("")}
          </div>`:`<p style="color:var(--txt2);font-size:.87rem">Sem mensagens ainda.</p>`}
      </div>

      <div>
        <h4 style="font-family:'Plus Jakarta Sans',sans-serif;color:#fff;margin-bottom:10px"><i class="fas fa-tag" style="color:var(--ouro)"></i> Os meus produtos</h4>
        ${anuncios.length?anuncios.map(p=>`
          <div class="cartao-novidade" style="margin-bottom:8px">
            <div class="cartao-novidade-topo"><h5>${esc(p.nome)}</h5><span class="tag-painel" style="color:${p.aprovado?"#25D366":"var(--ouro)"};">${p.aprovado?"✅ Activo":"⏳ Aguarda"}</span></div>
            <p style="color:var(--txt2);font-size:.85rem">${kz(p.preco)} · ${esc(p.categoria)}</p>
          </div>`).join(""):`<p style="color:var(--txt2);font-size:.87rem">Nenhum produto publicado.</p>`}
      </div>
    </div>`;
}

function marcarLida(i) {
  if (!utilizador) return;
  const key="bb_msgs_empresa_"+utilizador.id;
  const msgs=JSON.parse(localStorage.getItem(key)||"[]");
  if (msgs[i]) { msgs[i].lida=true; localStorage.setItem(key,JSON.stringify(msgs)); }
  abrirPainel("empresa");
}

// ===== NOVIDADES =====
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

// ===== ESTATÍSTICAS DE VISITAS =====
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

// ===== PAINEL ADMIN =====
function tentarAdmin() { const v=$("inputPassAdmin")?.value; if(v===PASS_ADMIN){sessionStorage.setItem("bb_admin","1");abrirPainel("admin");}else nota("Palavra-passe incorrecta.","err"); }

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

// ===== PAINÉIS =====
const PAINEIS = {
  sobre:{titulo:"Sobre nós",html(){return `<div class="bloco-painel"><div style="display:flex;gap:12px;align-items:center"><div style="width:50px;height:50px;background:linear-gradient(135deg,#c9973a,#e8b44e);border-radius:12px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:28px;">⬡</div><div><h4 style="margin:0">Brother's Business</h4><span class="tag-painel">Angola 🇦🇴</span></div></div><p>Marketplace angolano criado para facilitar compra e venda directamente pelo WhatsApp. 100% gratuito.</p></div>`;}},
  novidades:{titulo:"Novidades",html(){return renderNovidades(false);}},
  apoio:{titulo:"Apoio ao cliente",html(){return `<div class="bloco-painel"><p>Estamos disponíveis para responder rapidamente.</p></div><a class="apoio-link" href="https://wa.me/244954929881" target="_blank"><i class="fab fa-whatsapp" style="color:#25D366"></i><div><strong>WhatsApp</strong><span>+244 954 929 881</span></div></a><div class="apoio-link" onclick="irPara('contato');fecharPainel()"><i class="fas fa-envelope"></i><div><strong>Formulário</strong><span>Para questões detalhadas</span></div></div>`;}},
  privacidade:{titulo:"Privacidade",html(){return `<span class="tag-painel">Maio 2025</span><div class="bloco-painel"><h4>O que guardamos</h4><p>Apenas o teu nome e anúncios. Ficam no teu browser — não enviamos para servidores externos.</p></div><div class="bloco-painel"><h4>WhatsApp</h4><p>As conversas do WhatsApp não nos pertencem nem são armazenadas.</p></div>`;}},
  faq:{titulo:"FAQ",html(){const qs=[["Como publico um anúncio?","Vai a Anunciar, preenche os dados e publica. Fica pendente até o admin aprovar."],["Como funciona a compra?","Clica no produto, confirma interesse e és redirrecionado para o WhatsApp do vendedor."],["Cobram comissão?","Não. O Brother's Business é 100% gratuito."],["Como apago o meu anúncio?","No teu Meu Marketplace ou na grelha de produtos vês os teus anúncios com botão de remover."]];return `<div class="bloco-painel"><p>Dúvidas mais comuns.</p></div><div style="display:flex;flex-direction:column;gap:7px">${qs.map(([p,r])=>`<div class="faq-item"><div class="faq-pergunta" onclick="toggleFaq(this)">${p}<i class="fas fa-chevron-down"></i></div><div class="faq-resposta"><p>${r}</p></div></div>`).join("")}</div>`;}},
  meumkt:{titulo:"Meu Marketplace",async html(){return await renderMeuMkt();}},
  empresa:{titulo:"Painel da Empresa",async html(){return await renderPainelEmpresa();}},
  admin:{titulo:"Painel Admin",html(){
    if(sessionStorage.getItem("bb_admin")!=="1")return `<div class="admin-bloqueado"><i class="fas fa-lock"></i><h4>Área restrita</h4><p>Só o administrador tem acesso.</p><div style="display:flex;flex-direction:column;gap:8px;text-align:left"><label style="font-size:.75rem;text-transform:uppercase;color:var(--txt3);font-weight:600">Palavra-passe</label><input type="password" id="inputPassAdmin" class="input-admin" placeholder="••••••••"></div><button class="btn-publicar" style="margin-top:12px;width:100%" onclick="tentarAdmin()"><i class="fas fa-unlock"></i> Entrar</button></div>`;
    return `<div class="form-admin">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
        <span class="tag-painel"><i class="fas fa-check-circle"></i> Admin activo</span>
        <button onclick="sessionStorage.removeItem('bb_admin');abrirPainel('admin')" style="background:none;border:none;color:#c95252;cursor:pointer;font-size:.8rem"><i class="fas fa-sign-out-alt"></i> Sair</button>
      </div>
      <h4><i class="fas fa-chart-line" style="color:var(--ouro)"></i> Estatísticas</h4>
      ${renderVisitas()}
      <hr style="border-color:var(--borda);margin:4px 0">
      <h4><i class="fas fa-hourglass-half" style="color:var(--ouro)"></i> Produtos pendentes de aprovação</h4>
      <button class="btn-publicar" onclick="verProdutosPendentes()">Ver produtos pendentes</button>
      <hr style="border-color:var(--borda);margin:4px 0">
      <h4><i class="fas fa-envelope" style="color:var(--ouro)"></i> Mensagens recebidas</h4>
      <div id="msgsAdmin">Carregando...</div>
      <hr style="border-color:var(--borda);margin:4px 0">
      <h4>Publicar novidade</h4>
      <div><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.08em;color:var(--txt3);font-weight:600;display:block;margin-bottom:6px">Título</label><input type="text" id="novTitulo" class="input-admin" placeholder="Ex: Nova funcionalidade"></div>
      <div><label style="font-size:.75rem;text-transform:uppercase;letter-spacing:.08em;color:var(--txt3);font-weight:600;display:block;margin-bottom:6px">Descrição</label><textarea id="novTexto" class="textarea-admin" placeholder="Descreve a novidade..."></textarea></div>
      <button class="btn-publicar" onclick="publicarNovidade()"><i class="fas fa-paper-plane"></i> Publicar</button>
      <hr style="border-color:var(--borda);margin:4px 0">
      <h4>Novidades publicadas</h4>
      <div id="listaNovidadesAdmin">${renderNovidades(true)}</div>
      <button class="btn-apagar-nov" onclick="if(confirm('Apagar estatísticas?')){localStorage.removeItem('bb_visitas');abrirPainel('admin');nota('Apagadas.','err')}"><i class="fas fa-trash-alt"></i> Resetar estatísticas</button>
    </div>`;
  }}
};

function abrirPainel(chave) {
  const p = PAINEIS[chave];
  if(!p) return;
  const painelTitulo = $("painelTitulo");
  const painelCorpo = $("painelCorpo");
  if(painelTitulo) painelTitulo.textContent = p.titulo;
  
  if(typeof p.html === 'function') {
    const result = p.html();
    if(result && typeof result.then === 'function') {
      result.then(html => { if(painelCorpo) painelCorpo.innerHTML = html; });
    } else {
      if(painelCorpo) painelCorpo.innerHTML = result;
    }
  } else {
    if(painelCorpo) painelCorpo.innerHTML = p.html();
  }
  
  const painelLateral = $("painelLateral");
  const overlayPainel = $("overlayPainel");
  if(painelLateral) painelLateral.classList.add("aberto");
  if(overlayPainel) overlayPainel.classList.add("aberto");
  document.body.style.overflow = "hidden";
  
  // Carregar mensagens do admin
  if(chave === "admin" && sessionStorage.getItem("bb_admin") === "1") {
    const msgsAdmin = JSON.parse(localStorage.getItem("bb_msgs_admin") || "[]");
    const msgsDiv = $("msgsAdmin");
    if(msgsDiv) {
      if(msgsAdmin.length) {
        msgsDiv.innerHTML = `<div style="display:flex;flex-direction:column;gap:8px;max-height:200px;overflow-y:auto">${msgsAdmin.map(m=>`<div class="msg-item"><div class="msg-item-remetente">${esc(m.de)}</div><p>${esc(m.texto)}</p><small>${esc(m.data)}</small></div>`).join("")}</div>`;
      } else {
        msgsDiv.innerHTML = `<p style="color:var(--txt2);font-size:.87rem">Sem mensagens.</p>`;
      }
    }
  }
}

function fecharPainel(){
  const painelLateral = $("painelLateral");
  const overlayPainel = $("overlayPainel");
  if(painelLateral) painelLateral.classList.remove("aberto");
  if(overlayPainel) overlayPainel.classList.remove("aberto");
  document.body.style.overflow = "";
}

function toggleFaq(el){const r=el.nextElementSibling,ab=r.classList.contains("aberta");document.querySelectorAll(".faq-pergunta").forEach(q=>{q.classList.remove("aberta");if(q.nextElementSibling)q.nextElementSibling.classList.remove("aberta");});if(!ab){el.classList.add("aberta");r.classList.add("aberta");}}

// ===== NOTIFICAÇÕES =====
function pedirPermissaoNotif(){
  if(!("Notification"in window)){nota("Browser não suporta notificações.","err");return;}
  if(Notification.permission==="denied"){nota("Notificações bloqueadas nas definições do browser.","err");return;}
  if(Notification.permission==="granted"){nota("Notificações já activas! ✅","ok");actualizarBtnNotif();return;}
  Notification.requestPermission().then(perm=>{if(perm==="granted"){nota("Notificações activadas! 🔔","ok");actualizarBtnNotif();enviarNotificacao("Brother's Business","Notificações activadas! 🎉");}else{nota("Permissão negada.","err");actualizarBtnNotif();}});
}

function actualizarBtnNotif(){const btn=$("btnNotifPush");if(!btn)return;if(!("Notification"in window)){btn.style.display="none";return;}if(Notification.permission==="granted"){btn.classList.add("ativo");btn.classList.remove("negado");btn.title="Notificações activas ✅";}else if(Notification.permission==="denied"){btn.classList.add("negado");btn.classList.remove("ativo");btn.title="Notificações bloqueadas";}else{btn.classList.remove("ativo","negado");btn.title="Activar notificações";}}

function enviarNotificacao(titulo,corpo){if(!("Notification"in window)||Notification.permission!=="granted")return;try{new Notification(titulo,{body:corpo});}catch(e){}}

// ===== CONTACTO =====
function setupContato(){
  const btnEnviarWA = $("btnEnviarWA");
  if(btnEnviarWA) {
    btnEnviarWA.addEventListener("click",()=>{
      const waNome = $("waNome");
      const waMensagem = $("waMensagem");
      const nome=waNome?.value?.trim()||"", msg=waMensagem?.value?.trim()||"";
      if(!nome||!msg){nota("Preenche o nome e a mensagem.","err");return;}
      const msgs=JSON.parse(localStorage.getItem("bb_msgs_admin")||"[]");
      msgs.unshift({id:"m"+Date.now(),de:nome,texto:msg,data:new Date().toLocaleString("pt-PT")});
      localStorage.setItem("bb_msgs_admin",JSON.stringify(msgs.slice(0,100)));
      window.open(`https://wa.me/${WA}?text=${encodeURIComponent(`Olá! Sou *${nome}*.\n\n${msg}`)}`,"_blank");
    });
  }
}

// ===== INICIALIZAÇÃO =====
document.addEventListener("DOMContentLoaded", async () => {
  registarVisita();
  carregarUtilizador();
  setupTabs();
  setupVenda();
  setupEbooks();
  setupContato();
  actualizarBtnNotif();
  
  // Inicializar Firebase com produtos padrão
  await iniciarProdutosPadraoFirebase();
  await iniciarEbooksPadraoFirebase();
  
  // Carregar produtos do Firebase
  await carregarProdutosFirebase();
  await renderEbooks();
  
  // Verificar sessão do Firebase (login opcional)
  auth.onAuthStateChanged(async (user) => {
    if (user && (!utilizador || utilizador.via !== "firebase")) {
      await processarLoginFirebase(user);
      await carregarProdutosFirebase();
      await renderEbooks();
    }
  });
  
  // Eventos de navegação
  document.querySelectorAll(".nav-topo a[data-sec]").forEach(a=>{a.addEventListener("click",e=>{e.preventDefault();irPara(a.dataset.sec);});});
  
  const campoBusca = $("campoBusca");
  if(campoBusca) {
    campoBusca.addEventListener("input",e=>{busca=e.target.value;renderProdutos();});
  }
  
  document.querySelectorAll(".cat").forEach(btn=>{btn.addEventListener("click",()=>{document.querySelectorAll(".cat").forEach(b=>b.classList.remove("ativa"));btn.classList.add("ativa");categoria=btn.dataset.cat;renderProdutos();});});
  
  const ordenacao = $("ordenacao");
  if(ordenacao) {
    ordenacao.addEventListener("change",e=>{ordem=e.target.value;renderProdutos();});
  }

  const fecharModalProd = $("fecharModalProd");
  if(fecharModalProd) fecharModalProd.addEventListener("click",fecharProduto);
  
  const modalProduto = $("modalProduto");
  if(modalProduto) modalProduto.addEventListener("click",e=>{if(e.target===modalProduto)fecharProduto();});
  
  const qtyMenos = $("qtyMenos");
  const qtyMais = $("qtyMais");
  if(qtyMenos) qtyMenos.addEventListener("click",()=>{if(qty>1){qty--;const qtyNum = $("qtyNum");if(qtyNum) qtyNum.textContent=qty;actualizarResumo();}});
  if(qtyMais) qtyMais.addEventListener("click",()=>{qty++;const qtyNum = $("qtyNum");if(qtyNum) qtyNum.textContent=qty;actualizarResumo();});
  
  const btnConfirmarWA = $("btnConfirmarWA");
  if(btnConfirmarWA) btnConfirmarWA.addEventListener("click",confirmarWA);
  
  const btnAddCarrinho = $("btnAddCarrinho");
  if(btnAddCarrinho) btnAddCarrinho.addEventListener("click",addCarrinho);

  const fecharModalLogin = $("fecharModalLogin");
  if(fecharModalLogin) fecharModalLogin.addEventListener("click",fecharLogin);
  
  const modalLogin = $("modalLogin");
  if(modalLogin) modalLogin.addEventListener("click",e=>{if(e.target===modalLogin)fecharLogin();});
  
  const btnEntrar = $("btnEntrar");
  if(btnEntrar) btnEntrar.addEventListener("click",()=>entrar($("loginNome")?.value,$("loginTipo")?.value));
  
  const loginNome = $("loginNome");
  if(loginNome) loginNome.addEventListener("keydown",e=>{if(e.key==="Enter")entrar(e.target.value,$("loginTipo")?.value);});
  
  const btnGoogle = $("btnGoogle");
  if(btnGoogle) btnGoogle.addEventListener("click",()=>entrar($("loginNome")?.value||"Utilizador Google","google"));
  
  const btnFacebook = $("btnFacebook");
  if(btnFacebook) btnFacebook.addEventListener("click",()=>entrar($("loginNome")?.value||"Utilizador Facebook","facebook"));
  
  // Eventos Firebase
  const btnGoogleLogin = $("btnGoogleLogin");
  if(btnGoogleLogin) btnGoogleLogin.addEventListener("click", loginGoogle);
  
  const btnGoogleRegisto2 = $("btnGoogleRegisto2");
  if(btnGoogleRegisto2) btnGoogleRegisto2.addEventListener("click", loginGoogle);
  
  const btnEntrarEmail = $("btnEntrarEmail");
  if(btnEntrarEmail) btnEntrarEmail.addEventListener("click", loginEmail);
  
  const btnRegistar = $("btnRegistar");
  if(btnRegistar) btnRegistar.addEventListener("click", registarUtilizadorFirebase);
  
  const btnTelefoneLogin = $("btnTelefoneLogin");
  if(btnTelefoneLogin) btnTelefoneLogin.addEventListener("click", iniciarLoginTelefone);
  
  const btnEnviarCodigo = $("btnEnviarCodigo");
  if(btnEnviarCodigo) btnEnviarCodigo.addEventListener("click", enviarCodigoSMS);
  
  const btnVerificarCodigo = $("btnVerificarCodigo");
  if(btnVerificarCodigo) btnVerificarCodigo.addEventListener("click", verificarCodigoSMS);
  
  const btnReenviarCodigo = $("btnReenviarCodigo");
  if(btnReenviarCodigo) btnReenviarCodigo.addEventListener("click", enviarCodigoSMS);

  const btnCarrinho = $("btnCarrinho");
  if(btnCarrinho) btnCarrinho.addEventListener("click",abrirCarrinho);
  
  const fecharCarrinhoBtn = $("fecharCarrinho");
  if(fecharCarrinhoBtn) fecharCarrinhoBtn.addEventListener("click",fecharCarrinho);
  
  const overlayCarrinho = $("overlayCarrinho");
  if(overlayCarrinho) overlayCarrinho.addEventListener("click",fecharCarrinho);
  
  const btnCheckout = $("btnCheckout");
  if(btnCheckout) btnCheckout.addEventListener("click",checkoutWA);

  const btnGerarDesc = $("btnGerarDesc");
  if(btnGerarDesc) btnGerarDesc.addEventListener("click",gerarDescricao);
  
  const btnChatEnviar = $("btnChatEnviar");
  if(btnChatEnviar) btnChatEnviar.addEventListener("click",enviarChat);
  
  const chatInput = $("chatInput");
  if(chatInput) chatInput.addEventListener("keydown",e=>{if(e.key==="Enter")enviarChat();});

  const modalEbook = $("modalEbook");
  if(modalEbook) modalEbook.addEventListener("click",e=>{if(e.target===modalEbook)fecharModalEbook();});
  
  const btnNotifPush = $("btnNotifPush");
  if(btnNotifPush) btnNotifPush.addEventListener("click", pedirPermissaoNotif);
  
  document.addEventListener("keydown", function(e) {
    if (e.key === "Escape") {
      const modalProduto = $("modalProduto");
      const modalLogin = $("modalLogin");
      const modalEbook = $("modalEbook");
      const modalTelefone = $("modalTelefone");
      const painelLateral = $("painelLateral");
      const gavetaCarrinho = $("gavetaCarrinho");
      
      if(modalProduto && modalProduto.style.display === "flex") fecharProduto();
      if(modalLogin && modalLogin.style.display === "flex") fecharLogin();
      if(modalEbook && modalEbook.style.display === "flex") fecharModalEbook();
      if(modalTelefone && modalTelefone.style.display === "flex") fecharModalTelefone();
      if(painelLateral && painelLateral.classList.contains("aberto")) fecharPainel();
      if(gavetaCarrinho && gavetaCarrinho.classList.contains("aberta")) fecharCarrinho();
    }
  });
});

// ===== EXPORTAR FUNÇÕES GLOBAIS =====
window.marcarLida = marcarLida;
window.apagarNovidade = apagarNovidade;
window.publicarNovidade = publicarNovidade;
window.aprovarProdutoFirebase = aprovarProdutoFirebase;
window.rejeitarProdutoFirebase = rejeitarProdutoFirebase;
window.tentarAdmin = tentarAdmin;
window.fecharModalEbook = fecharModalEbook;
window.escolherCor = escolherCor;
window.escolherTam = escolherTam;
window.escolherEstrela = escolherEstrela;
window.alterarQtyCarrinho = alterarQtyCarrinho;
window.removerCarrinho = removerCarrinho;
window.removerEbookFirebase = removerEbookFirebase;
window.sair = sair;
window.abrirLogin = abrirLogin;
window.fecharLogin = fecharLogin;
window.fecharModalTelefone = fecharModalTelefone;
window.irPara = irPara;
window.abrirMenu = abrirMenu;
window.fecharMenu = fecharMenu;
window.abrirPainel = abrirPainel;
window.fecharPainel = fecharPainel;
window.fecharProduto = fecharProduto;
window.pedirPermissaoNotif = pedirPermissaoNotif;
window.confirmarWA = confirmarWA;
window.addCarrinho = addCarrinho;
window.abrirCarrinho = abrirCarrinho;
window.fecharCarrinho = fecharCarrinho;
window.checkoutWA = checkoutWA;
window.verProdutosPendentes = verProdutosPendentes;