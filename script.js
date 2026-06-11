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

// ===== CONSTANTES (mantidas do antigo) =====
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
  {id:1,nome:"Huawei Y7 Prime",preco:37000,categoria:"Tecnologia",descricao:"Bateria 4000mAh, ecrã 6.26\", Snapdragon 450, 3GB RAM.",imagem:FOTOS[1],criadorId:"admin",criadorNome:"Carlos CJ",whatsapp:WA,aprovado:true},
  {id:2,nome:"Notebook Dell Inspiron",preco:289000,categoria:"Tecnologia",descricao:"Intel i5, 8GB RAM, SSD 256GB, ecrã 15.6\".",imagem:FOTOS[2],criadorId:"admin",criadorNome:"Carlos CJ",whatsapp:WA,aprovado:true},
  {id:3,nome:"Auscultadores Bluetooth",preco:6000,categoria:"Tecnologia",descricao:"Cancelamento de ruído, 20h bateria.",imagem:FOTOS[3],criadorId:"admin",criadorNome:"Carlos CJ",whatsapp:WA,aprovado:true},
  {id:4,nome:"Camisa Real Madrid 2024",preco:7000,categoria:"Moda",descricao:"Tamanho XL, algodão premium. Original com etiqueta.",imagem:FOTOS[4],criadorId:"admin",criadorNome:"Carlos CJ",whatsapp:WA,aprovado:true},
  {id:5,nome:"Frigorífico Frost Free 400L",preco:140000,categoria:"Casa",descricao:"400L, acabamento inox, classe energética A+.",imagem:FOTOS[5],criadorId:"admin",criadorNome:"MarketFlow",whatsapp:WA,aprovado:true},
  {id:6,nome:"Smart TV 50\" 4K",preco:185000,categoria:"Casa",descricao:"4K HDR, Android TV, Wi-Fi integrado.",imagem:FOTOS[6],criadorId:"admin",criadorNome:"MarketFlow",whatsapp:WA,aprovado:true}
];

const EBOOKS_DEFAULT = [
  {id:"eb1",titulo:"Empreender em Angola",autor:"João Sebastião",preco:3500,categoria:"Negócios",descricao:"Guia prático para abrir e gerir um negócio em Angola.",capa:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",criadorId:"admin",criadorNome:"Brother's Business",whatsapp:WA},
  {id:"eb2",titulo:"Programação Web do Zero",autor:"Carlos Mendes",preco:2500,categoria:"Tecnologia",descricao:"Aprende HTML, CSS e JavaScript com exemplos práticos.",capa:"https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&q=80",criadorId:"admin",criadorNome:"Brother's Business",whatsapp:WA}
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

// ===== INICIAR PRODUTOS PADRÃO NO FIREBASE =====
async function iniciarProdutosPadrao() {
  const snapshot = await db.collection("produtos").get();
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

async function iniciarEbooksPadrao() {
  const snapshot = await db.collection("ebooks").get();
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

// ===== FUNÇÕES DE AUTENTICAÇÃO FIREBASE =====
function processarLogin(user) {
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
  
  db.collection("utilizadores").doc(user.uid).set({
    nome: utilizador.nome,
    email: utilizador.email,
    telefone: utilizador.telefone,
    tipo: utilizador.tipo,
    ultimoLogin: firebase.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
  
  renderAuth();
  fecharLogin();
  carregarProdutosFirebase();
  carregarMensagensFirebase();
  nota("Bem-vindo(a), " + utilizador.nome + "! 👋", "ok");
}

function loginGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then(result => processarLogin(result.user))
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
    .then(result => processarLogin(result.user))
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

function registarUtilizador() {
  const nome = $("regNome")?.value?.trim();
  const email = $("regEmail")?.value?.trim();
  const telefone = $("regTelefone")?.value?.trim();
  const senha = $("regPassword")?.value;
  const confirmar = $("regConfirmPassword")?.value;
  
  if (!nome) { nota("Escreve o teu nome.", "err"); return; }
  if (!email) { nota("Escreve o teu email.", "err"); return; }
  if (!senha || senha.length < 6) { nota("Palavra-passe deve ter pelo menos 6 caracteres.", "err"); return; }
  if (senha !== confirmar) { nota("As palavras-passe não coincidem.", "err"); return; }
  
  auth.createUserWithEmailAndPassword(email, senha)
    .then(result => result.user.updateProfile({ displayName: nome }))
    .then(() => {
      const user = auth.currentUser;
      if (telefone) {
        db.collection("utilizadores").doc(user.uid).set({
          nome: nome,
          email: email,
          telefone: telefone,
          dataRegisto: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      }
      processarLogin(user);
    })
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
      processarLogin(result.user);
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
  auth.signOut().then(() => {
    utilizador = null;
    localStorage.removeItem("bb_user");
    carrinho = [];
    actualizarBadgeCarrinho();
    renderAuth();
    carregarProdutosFirebase();
    nota("Sessão encerrada.", "ok");
  });
}

function renderAuth() {
  const z = $("zonaAuth"); if(!z) return;
  
  if (utilizador) {
    z.innerHTML = `
      <div class="chip-user">
        ${utilizador.foto ? `<img src="${utilizador.foto}" style="width:28px;height:28px;border-radius:50%;object-fit:cover">` : `<i class="fas fa-user-circle"></i>`}
        <span>${esc(utilizador.nome)}</span>
        ${utilizador.tipo === 'admin' ? '<span class="tag-painel" style="font-size:.6rem; padding:2px 5px;">Admin</span>' : ''}
        <button class="btn-mkt" onclick="abrirPainel('meumkt')" title="Meu Marketplace"><i class="fas fa-store"></i></button>
        <button class="btn-sair" onclick="sair()"><i class="fas fa-sign-out-alt"></i></button>
      </div>`;
  } else {
    z.innerHTML = `
      <button class="btn-auth" onclick="abrirLogin()"><i class="fas fa-sign-in-alt"></i> Entrar / Registar</button>
      <button class="btn-auth btn-auth-emp" onclick="abrirLogin('empresa')"><i class="fas fa-building"></i> Empresa</button>`;
  }
}

function abrirLogin(tipo) {
  $("modalLogin").style.display = "flex";
  document.body.style.overflow = "hidden";
  if(tipo === "empresa") { try {
    const el = $("loginTipoLabel"); if(el) el.textContent = "Registar empresa"; } catch(e) {}
  }
}

function fecharLogin() {
  $("modalLogin").style.display = "none";
  document.body.style.overflow = "";
}

function setupTabs() {
  document.querySelectorAll(".tab-login").forEach(tab => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.tab;
      document.querySelectorAll(".tab-login").forEach(t => t.classList.remove("ativa"));
      tab.classList.add("ativa");
      document.querySelectorAll(".tab-painel").forEach(p => p.style.display = "none");
      const tabEl = document.getElementById("tab-"+target); if(tabEl) tabEl.style.display = "block";
    });
  });
}

// ===== FUNÇÕES DO FIRESTORE (PRODUTOS) =====
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

async function guardarProdutoFirebase(produto) {
  if (!utilizador) { nota("Precisas de entrar.", "err"); return null; }
  try {
    const docRef = await db.collection("produtos").add({
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
    return docRef.id;
  } catch(error) {
    nota("Erro ao publicar: " + error.message, "err");
    return null;
  }
}

async function aprovarProdutoFirebase(id) {
  try {
    await db.collection("produtos").doc(id).update({ aprovado: true });
    nota("Produto aprovado! ✅", "ok");
    enviarNotificacao("Produto aprovado! ✅", `O produto foi aprovado e está visível no marketplace.`);
    carregarProdutosFirebase();
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

async function guardarEbookFirebase(ebook) {
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

// ===== FUNÇÕES DO FIRESTORE (MENSAGENS) =====
async function carregarMensagensFirebase() {
  if (!utilizador) return [];
  try {
    const snapshot = await db.collection("mensagens")
      .where("paraId", "==", utilizador.id)
      .orderBy("data", "desc")
      .limit(100)
      .get();
    const msgs = [];
    snapshot.forEach(doc => {
      msgs.push({ id: doc.id, ...doc.data() });
    });
    return msgs;
  } catch(error) {
    return [];
  }
}

async function adicionarMensagemFirebase(paraId, paraNome, texto) {
  if (!paraId || paraId === "admin") return;
  try {
    await db.collection("mensagens").add({
      de: utilizador?.nome || "Cliente",
      deId: utilizador?.id || "anonimo",
      para: paraNome,
      paraId: paraId,
      texto: texto,
      data: firebase.firestore.FieldValue.serverTimestamp(),
      lida: false
    });
    enviarNotificacao("Nova mensagem 📩", texto.substring(0, 80));
  } catch(error) {
    console.error("Erro ao enviar mensagem:", error);
  }
}

// ===== FUNÇÕES DO FIRESTORE (PEDIDOS) =====
async function registarPedidoFirebase(pedido) {
  if (!utilizador) return;
  try {
    await db.collection("pedidos").add({
      ...pedido,
      compradorId: utilizador.id,
      compradorNome: utilizador.nome,
      compradorEmail: utilizador.email,
      data: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch(error) {
    console.error("Erro ao registar pedido:", error);
  }
}

async function getMeusPedidosFirebase() {
  if (!utilizador) return [];
  try {
    const snapshot = await db.collection("pedidos")
      .where("compradorId", "==", utilizador.id)
      .orderBy("data", "desc")
      .limit(50)
      .get();
    const pedidos = [];
    snapshot.forEach(doc => {
      pedidos.push({ id: doc.id, ...doc.data() });
    });
    return pedidos;
  } catch(error) {
    return [];
  }
}

async function getMeusAnunciosFirebase() {
  if (!utilizador) return [];
  try {
    const snapshot = await db.collection("produtos")
      .where("criadorId", "==", utilizador.id)
      .get();
    const anuncios = [];
    snapshot.forEach(doc => {
      anuncios.push({ id: doc.id, ...doc.data() });
    });
    return anuncios;
  } catch(error) {
    return [];
  }
}

async function getMeusEbooksFirebase() {
  if (!utilizador) return [];
  try {
    const snapshot = await db.collection("ebooks")
      .where("criadorId", "==", utilizador.id)
      .get();
    const ebooks = [];
    snapshot.forEach(doc => {
      ebooks.push({ id: doc.id, ...doc.data() });
    });
    return ebooks;
  } catch(error) {
    return [];
  }
}

// ===== FUNÇÕES DO FIRESTORE (NOVIDADES) =====
async function carregarNovidadesFirebase() {
  try {
    const snapshot = await db.collection("novidades")
      .orderBy("data", "desc")
      .limit(20)
      .get();
    const novidades = [];
    snapshot.forEach(doc => {
      novidades.push({ id: doc.id, ...doc.data() });
    });
    return novidades;
  } catch(error) {
    return [];
  }
}

async function publicarNovidadeFirebase(titulo, texto) {
  if (!utilizador || utilizador.tipo !== "admin") {
    nota("Apenas o admin pode publicar novidades.", "err");
    return;
  }
  try {
    await db.collection("novidades").add({
      titulo: titulo,
      texto: texto,
      data: firebase.firestore.FieldValue.serverTimestamp(),
      dataStr: new Date().toLocaleDateString("pt-PT", { day: "numeric", month: "long", year: "numeric" }),
      criadorId: utilizador.id,
      criadorNome: utilizador.nome
    });
    nota("Novidade publicada! 🎉", "ok");
    enviarNotificacao("Nova novidade 🔔", titulo);
  } catch(error) {
    nota("Erro ao publicar novidade.", "err");
  }
}

async function apagarNovidadeFirebase(id) {
  if (!confirm("Apagar esta novidade?")) return;
  try {
    await db.collection("novidades").doc(id).delete();
    nota("Novidade apagada.", "err");
  } catch(error) {
    nota("Erro ao apagar novidade.", "err");
  }
}

// ===== FUNÇÕES DE RENDER (mantidas do antigo) =====
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

function abrirProduto(id) {
  const p = produtos.find(x => x.id === id); if(!p) return;
  prodAberto = p; qty = 1; corSel = ""; tamSel = ""; notaSel = 0;
  $("mFoto").src = p.imagem; $("mFoto").onerror = () => $("mFoto").src = fallback;
  $("mNome").textContent = p.nome;
  $("mPreco").textContent = kz(p.preco);
  $("mVendedor").innerHTML = `<i class="fas fa-user"></i> ${esc(p.criadorNome)}`;
  $("mDesc").textContent = p.descricao;
  $("mCatTag").textContent = p.categoria||"Outros";
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
  $("modalProduto").style.display="flex"; document.body.style.overflow="hidden";
  
  if (p.criadorId !== "admin" && p.criadorId !== utilizador?.id) {
    adicionarMensagemFirebase(p.criadorId, p.criadorNome, `Alguém está a ver o teu produto: *${p.nome}*`);
  }
}

function fecharProduto() { $("modalProduto").style.display="none"; document.body.style.overflow=""; prodAberto=null; }

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
  if (notaSel) { 
    const key="av_"+prodAberto.id; 
    const avs=JSON.parse(localStorage.getItem(key)||"[]"); 
    avs.push({nome:utilizador.nome,nota:notaSel,texto:$("mComentario")?.value||""}); 
    localStorage.setItem(key,JSON.stringify(avs)); 
  }
  registarPedidoFirebase({ 
    tipo:"produto", 
    nome:prodAberto.nome, 
    preco:prodAberto.preco, 
    qty, 
    cor:corSel, 
    tam:tamSel, 
    vendedor:prodAberto.criadorNome,
    vendedorId:prodAberto.criadorId,
    data:new Date().toLocaleDateString("pt-PT") 
  });
  adicionarMensagemFirebase(prodAberto.criadorId, prodAberto.criadorNome, `📦 Novo interesse no produto *${prodAberto.nome}* por *${utilizador.nome}*. Qty: ${qty}. Total: ${kz(prodAberto.preco*qty)}`);
  const num = prodAberto.whatsapp||WA;
  const msg = `Olá! Tenho interesse em: *${prodAberto.nome}*\nPreço: *${kz(prodAberto.preco)}*${corSel?`\nCor: *${corSel}*`:""}${tamSel?`\nTamanho: *${tamSel}*`:""}\nQuantidade: *${qty}*\nTotal: *${kz(prodAberto.preco*qty)}*\nMeu nome: *${utilizador.nome}*`;
  window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`,"_blank");
}

// ===== FUNÇÕES DO CARRINHO =====
function addCarrinho() {
  if (!prodAberto) return;
  if (!utilizador) { fecharProduto(); abrirLogin(); return; }
  const item = carrinho.find(i => i.id===prodAberto.id && i.cor===corSel && i.tam===tamSel);
  if (item) item.qty += qty;
  else carrinho.push({
    id:prodAberto.id,
    nome:prodAberto.nome,
    preco:prodAberto.preco,
    foto:prodAberto.imagem,
    cor:corSel,
    tam:tamSel,
    qty:qty,
    vendedor:prodAberto.criadorNome,
    whatsapp:prodAberto.whatsapp||WA,
    criadorId:prodAberto.criadorId
  });
  actualizarBadgeCarrinho(); 
  nota(prodAberto.nome+" adicionado! 🛍️","ok");
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
  $("gavetaCarrinho").classList.add("aberta"); 
  $("overlayCarrinho").style.display="block";
  document.body.style.overflow="hidden"; 
  renderCarrinho();
}

function fecharCarrinho() {
  $("gavetaCarrinho").classList.remove("aberta"); 
  $("overlayCarrinho").style.display="none";
  document.body.style.overflow="";
}

function renderCarrinho() {
  const itens=$("gavetaItens"), rod=$("gavetaRodape");
  if (!carrinho.length) { 
    itens.innerHTML=`<div class="carrinho-vazio"><span>🛍️</span><p>Ainda não adicionaste nada</p></div>`; 
    if(rod) rod.style.display="none"; 
    return; 
  }
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
  $("totalCarrinho").textContent = kz(total);
  if(rod) rod.style.display="flex";
}

function alterarQtyCarrinho(i, delta) {
  carrinho[i].qty = Math.max(1, carrinho[i].qty + delta);
  actualizarBadgeCarrinho(); 
  renderCarrinho();
}

function removerCarrinho(i) { 
  carrinho.splice(i,1); 
  actualizarBadgeCarrinho(); 
  renderCarrinho(); 
}

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
  carrinho.forEach(i => registarPedidoFirebase({
    tipo:"produto",
    nome:i.nome,
    preco:i.preco,
    qty:i.qty,
    cor:i.cor,
    tam:i.tam,
    vendedor:i.vendedor,
    vendedorId:i.criadorId
  }));
  carrinho = [];
  actualizarBadgeCarrinho();
  fecharCarrinho();
}

function _enviarMsgCarrinho(v) {
  let msg = `Olá ${esc(v.nome)}! Quero encomendar:\n\n`;
  v.items.forEach(i => msg+=`• *${i.nome}* ×${i.qty} = *${kz(i.preco*i.qty)}*${i.cor?" ("+i.cor+")":""}${i.tam?" ("+i.tam+")":""}\n`);
  const total = v.items.reduce((s,i)=>s+i.preco*i.qty,0);
  msg += `\n*Total: ${kz(total)}*\nNome: *${utilizador.nome}*`;
  adicionarMensagemFirebase(v.criadorId, v.nome, `🛒 Encomenda de *${utilizador.nome}*:\n${v.items.map(i=>`• ${i.nome} ×${i.qty}`).join("\n")}\nTotal: ${kz(total)}`);
  window.open(`https://wa.me/${v.wa}?text=${encodeURIComponent(msg)}`,"_blank");
}

// ===== FORMULÁRIO VENDA =====
function setupVenda() {
  ["nProd","pProd","dProd","nomeVendedor","whatsVendedor"].forEach(id => $(id)?.addEventListener("input", actualizarPreview));

  $("uploadFoto")?.addEventListener("change", e => {
    const file = e.target.files[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      $("fotoPreviewVenda").src = ev.target.result;
      $("fotoPreviewVenda").style.display = "block";
      $("uploadLabel").textContent = "Foto seleccionada ✅";
      actualizarPreview();
    };
    reader.readAsDataURL(file);
  });

  $("formVenda")?.addEventListener("submit", async e => {
    e.preventDefault();
    if (!utilizador) { nota("Precisas de entrar para anunciar.", "err"); abrirLogin(); return; }
    
    const nome = $("nProd").value.trim();
    const preco = parseFloat($("pProd").value);
    const desc = $("dProd").value.trim();
    const wa = $("whatsVendedor").value.trim();
    const nomeVendedor = $("nomeVendedor").value.trim();
    const cat = document.querySelector("input[name='cat']:checked")?.value||"Outros";
    const fotoEl = $("fotoPreviewVenda");
    const imagem = (fotoEl && fotoEl.src && fotoEl.src !== window.location.href) ? fotoEl.src : fallback;
    
    if (!nome) { nota("Escreve o nome do produto.", "err"); return; }
    if (!preco||preco<=0) { nota("Preço inválido.", "err"); return; }
    if (!nomeVendedor) { nota("Escreve o teu nome como vendedor.", "err"); return; }
    if (!wa) { nota("Escreve o teu número de WhatsApp.", "err"); return; }
    
    const waLimpo = wa.replace(/\D/g, '');
    if(waLimpo.length < 9) { nota("Número de WhatsApp inválido.", "err"); return; }
    
    await guardarProdutoFirebase({ 
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
    $("uploadLabel").textContent="Escolher foto da galeria"; 
    $("previewFoto").innerHTML="📷";
    irPara("comprar");
  });
}

function actualizarPreview() {
  const nome = $("nProd")?.value||"Nome do produto";
  const preco = parseFloat($("pProd")?.value)||0;
  const desc = $("dProd")?.value||"Descrição...";
  const vendedor = $("nomeVendedor")?.value||"Vendedor";
  const whats = $("whatsVendedor")?.value||"";
  $("prevNome").textContent = nome;
  $("prevPreco").textContent = kz(preco);
  $("prevDesc").textContent = desc.substring(0,72);
  $("prevVendedor").textContent = vendedor;
  if($("prevWhats")) $("prevWhats").textContent = whats ? `WhatsApp: ${whats}` : "";
  const fotoEl = $("fotoPreviewVenda");
  if (fotoEl && fotoEl.src && fotoEl.style.display!=="none") {
    $("previewFoto").innerHTML = `<img src="${fotoEl.src}" style="width:100%;height:100%;object-fit:cover">`;
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
  const nome = $("nProd")?.value?.trim();
  const cat = document.querySelector("input[name='cat']:checked")?.value||"produto";
  if (!nome) { nota("Escreve o nome do produto primeiro.", "err"); return; }
  const btn=$("btnGerarDesc"), loader=$("iaLoader");
  btn.disabled=true; loader.style.display="flex";
  setTimeout(() => {
    const texto = gerarDescricaoLocal(nome, cat);
    if (texto) { $("dProd").value=texto; actualizarPreview(); nota("Descrição gerada! ✨","ok"); }
    btn.disabled=false; loader.style.display="none";
  }, 500);
}

function pushMsgIA(texto, tipo) {
  const box=$("chatMsgs"); if(!box) return;
  const d=document.createElement("div"); d.className="msg "+tipo; d.innerHTML=esc(texto);
  box.appendChild(d); box.scrollTop=box.scrollHeight;
}

function enviarChat() {
  const input=$("chatInput"); const msg=input?.value?.trim(); if(!msg) return;
  input.value=""; pushMsgIA(msg,"user");
  setTimeout(() => {
    let resposta = "";
    const msgLower = msg.toLowerCase();
    if (msgLower.includes("preço") || msgLower.includes("quanto custa")) {
      resposta = "Os preços são definidos pelos vendedores. Clica no produto para ver o preço e negociar!";
    } else if (msgLower.includes("como comprar") || msgLower.includes("comprar")) {
      resposta = "Para comprar: clica no produto, escolhe opções, adiciona ao carrinho ou confirma pelo WhatsApp.";
    } else if (msgLower.includes("anunciar") || msgLower.includes("vender")) {
      resposta = "Vai à secção 'Anunciar', preenche o formulário e publica! O anúncio aguarda aprovação do admin.";
    } else if (msgLower.includes("ebook")) {
      resposta = "Os e-books estão na secção 'E-books'. Podes publicar o teu ou adquirir os disponíveis.";
    } else {
      resposta = "Podes perguntar sobre preços, como comprar, como anunciar, e-books ou como criar conta!";
    }
    pushMsgIA(resposta, "bot");
  }, 300);
}

// ===== FUNÇÕES DE NAVEGAÇÃO =====
function irPara(sec) {
  document.querySelectorAll(".secao").forEach(s=>s.classList.remove("ativa"));
  document.querySelectorAll(".nav-topo a").forEach(a=>a.classList.toggle("ativo",a.dataset.sec===sec));
  $("sec-"+sec)?.classList.add("ativa");
  if (sec==="comprar") renderProdutos();
  if (sec==="ebooks") renderEbooks();
  window.scrollTo({top:document.querySelector("main")?.offsetTop||0,behavior:"smooth"});
}

function abrirMenu() { $("menuLateral").classList.add("aberto"); $("overlayMenu").classList.add("aberto"); document.body.style.overflow="hidden"; }
function fecharMenu() { $("menuLateral").classList.remove("aberto"); $("overlayMenu").classList.remove("aberto"); document.body.style.overflow=""; }

// ===== E-BOOKS =====
async function renderEbooks() {
  const ebooks = await carregarEbooksFirebase();
  let lista = ebooks;
  if (catEbook!=="todos") lista=lista.filter(e=>e.categoria===catEbook);
  if (buscaEbook) { const t=buscaEbook.toLowerCase(); lista=lista.filter(e=>e.titulo.toLowerCase().includes(t)||(e.autor||"").toLowerCase().includes(t)); }
  const g=$("grelhaEbooks"),sr=$("semResultadosEbook");
  if(!g) return;
  if(!lista.length){g.innerHTML="";sr.style.display="block";return;}sr.style.display="none";
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
  $("ebMFoto").src = eb.capa || fallback;
  $("ebMTitulo").textContent=eb.titulo;
  $("ebMPreco").textContent=kz(eb.preco);
  $("ebMCat").textContent=eb.categoria;
  $("ebMAutor").innerHTML=eb.autor?`<i class="fas fa-user-pen"></i> ${esc(eb.autor)}`:"";
  $("ebMDesc").textContent=eb.descricao||"";
  $("ebMMeta").innerHTML=`<span><i class="fas fa-file-pdf"></i> Formato PDF</span><span><i class="fas fa-tag"></i> ${esc(eb.categoria)}</span><span><i class="fas fa-user"></i> Vendido por ${esc(eb.criadorNome)}</span>`;
  $("modalEbook").style.display="flex";
  document.body.style.overflow="hidden";
}

function fecharModalEbook(){$("modalEbook").style.display="none";document.body.style.overflow="";ebookAberto=null;}

// ===== SETUP E-BOOKS =====
function setupEbooks() {
  $("campoBuscaEbook")?.addEventListener("input", e => { buscaEbook = e.target.value; renderEbooks(); });
  
  document.querySelectorAll(".cat-eb").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".cat-eb").forEach(b => b.classList.remove("ativa"));
      btn.classList.add("ativa");
      catEbook = btn.dataset.cat;
      renderEbooks();
    });
  });
  
  $("uploadEbookCapa")?.addEventListener("change", e => {
    const file = e.target.files[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      $("ebookCapaPreview").src = ev.target.result;
      $("ebookCapaPreview").style.display = "block";
      $("uploadEbookLabel").textContent = "Capa selecionada ✅";
    };
    reader.readAsDataURL(file);
  });
  
  $("btnGerarDescEbook")?.addEventListener("click", () => {
    const titulo = $("ebTitulo")?.value?.trim();
    if(!titulo) { nota("Escreve o título do e-book primeiro.", "err"); return; }
    const descricoes = {
      "Negócios": `📘 "${titulo}" é um guia prático para empreendedores angolanos. Aprende estratégias de negócio, gestão financeira e como expandir no mercado local.`,
      "Tecnologia": `💻 "${titulo}" aborda conceitos essenciais de tecnologia de forma simples e prática. Perfeito para iniciantes.`,
      "Saúde": `🩺 "${titulo}" traz informações valiosas sobre saúde e bem-estar. Dicas práticas para uma vida mais saudável.`,
      "Educação": `🎓 "${titulo}" é um recurso educativo completo. Ideal para estudantes e professores.`,
      "Ficção": `📖 "${titulo}" é uma obra cativante que prende o leitor do início ao fim.`,
      "Outros": `📚 "${titulo}" é um e-book exclusivo que vai transformar a tua forma de pensar.`
    };
    const cat = $("ebCat")?.value || "Outros";
    $("ebDesc").value = descricoes[cat] || descricoes["Outros"];
    nota("Descrição gerada com IA! ✨", "ok");
  });
  
  $("formEbook")?.addEventListener("submit", async e => {
    e.preventDefault();
    if(!utilizador){ nota("Precisas de entrar.", "err"); abrirLogin(); return; }
    const titulo = $("ebTitulo")?.value?.trim();
    const preco = parseFloat($("ebPreco")?.value);
    const autor = $("ebAutor")?.value?.trim();
    const cat = $("ebCat")?.value;
    const desc = $("ebDesc")?.value?.trim();
    const wa = $("ebWA")?.value?.trim();
    const capaPreview = $("ebookCapaPreview");
    let capa = "";
    if(capaPreview && capaPreview.src && capaPreview.style.display !== "none") capa = capaPreview.src;
    if(!titulo){ nota("Escreve o título.", "err"); return; }
    if(!preco || preco <= 0){ nota("Preço inválido.", "err"); return; }
    if(!cat){ nota("Escolhe uma categoria.", "err"); return; }
    if(!capa){ nota("Seleciona uma imagem de capa.", "err"); return; }
    await guardarEbookFirebase({ titulo, preco, autor, categoria:cat, descricao:desc, capa, whatsapp:wa || WA });
    $("formEbook").reset();
    $("ebookCapaPreview").style.display = "none";
    $("uploadEbookLabel").textContent = "Escolher capa da galeria";
    renderEbooks();
  });
  
  $("btnEbookWA")?.addEventListener("click", () => {
    if(!ebookAberto) return;
    if(!utilizador){ fecharModalEbook(); abrirLogin(); return; }
    registarPedidoFirebase({ 
      tipo:"ebook", 
      nome:ebookAberto.titulo, 
      preco:ebookAberto.preco, 
      qty:1, 
      vendedor:ebookAberto.criadorNome,
      vendedorId:ebookAberto.criadorId
    });
    window.open(`https://wa.me/${ebookAberto.whatsapp || WA}?text=${encodeURIComponent(`Olá! Tenho interesse no e-book:\n*${ebookAberto.titulo}*\nPreço: *${kz(ebookAberto.preco)}*\nMeu nome: *${utilizador.nome}*`)}`, "_blank");
  });
}

// ===== MEU MARKETPLACE =====
async function renderMeuMkt() {
  if (!utilizador) return `<div class="admin-bloqueado"><i class="fas fa-user-circle"></i><h4>Não identificado</h4><p>Entra na tua conta para ver o teu marketplace.</p><button class="btn-publicar" onclick="fecharPainel();abrirLogin()">Entrar</button></div>`;
  
  const pedidos = await getMeusPedidosFirebase();
  const anuncios = await getMeusAnunciosFirebase();
  const ebooks = await getMeusEbooksFirebase();
  const msgs = await carregarMensagensFirebase();
  
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
          ${msgs.map(m=>`<div class="msg-item"><div class="msg-item-remetente">${esc(m.de)}</div><p>${esc(m.texto)}</p><small>${new Date(m.data?.toDate()).toLocaleString("pt-PT")}</small></div>`).join("")}
        </div>
      </div>`:""}

      <div>
        <h4 style="font-family:'Plus Jakarta Sans',sans-serif;color:#fff;margin-bottom:10px"><i class="fas fa-receipt" style="color:var(--ouro)"></i> Histórico de pedidos</h4>
        ${pedidos.length?pedidos.map(p=>`
          <div class="cartao-novidade" style="margin-bottom:8px">
            <div class="cartao-novidade-topo"><h5>${esc(p.nome)}</h5><span class="tag-painel">${esc(p.tipo)}</span></div>
            <div class="data-nov">${p.data} · ${esc(p.vendedor)}</div>
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
  
  const anuncios = await getMeusAnunciosFirebase();
  const ebooks = await getMeusEbooksFirebase();
  const msgs = await carregarMensagensFirebase();
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
              <div class="msg-item ${m.lida?"":"msg-nao-lida"}" onclick="marcarLidaMensagem('${m.id}')">
                <div class="msg-item-remetente">${esc(m.de)} ${!m.lida?'<span class="badge" style="font-size:.58rem">Novo</span>':""}</div>
                <p>${esc(m.texto)}</p>
                <small>${new Date(m.data?.toDate()).toLocaleString("pt-PT")}</small>
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

async function marcarLidaMensagem(id) {
  if (!utilizador) return;
  await db.collection("mensagens").doc(id).update({ lida: true });
  abrirPainel("empresa");
}

// ===== NOVIDADES =====
async function renderNovidades(adminMode) {
  const novidades = await carregarNovidadesFirebase();
  if(!novidades.length) return `<p style="color:var(--txt2);text-align:center;padding:40px">Sem novidades.</p>`;
  return `<div style="display:flex;flex-direction:column;gap:10px">${novidades.map(n=>`
    <div class="cartao-novidade">
      <div class="cartao-novidade-topo"><h5>${esc(n.titulo)}</h5></div>
      <div class="data-nov"><i class="fas fa-calendar" style="color:var(--ouro);margin-right:4px"></i>${n.dataStr}</div>
      <p>${esc(n.texto)}</p>
      ${adminMode?`<button class="btn-apagar-nov" onclick="apagarNovidadeFirebase('${n.id}')"><i class="fas fa-trash-alt"></i> Apagar</button>`:""}
    </div>`).join("")}</div>`;
}

// ===== ESTATÍSTICAS =====
function getVisitas() {
  let s = {};
  try { s = JSON.parse(localStorage.getItem("bb_visitas") || "{}"); } catch(e) {}
  const agora = new Date();
  return {
    hoje: (s.hoje && s.hoje[agora.toISOString().slice(0,10)]) || 0,
    semana: (s.semana && s.semana[semanaKey(agora)]) || 0,
    mes: (s.mes && s.mes[agora.toISOString().slice(0,7)]) || 0,
    total: s.total || 0,
    dias: s.hoje || {}
  };
}

function renderVisitas() {
  const v = getVisitas(), agora = new Date(), mesLabel = agora.toLocaleDateString("pt-PT", {month:"long", year:"numeric"});
  const dias = Array.from({length:7}, (_,i) => {
    const d = new Date(agora);
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().slice(0,10);
    return { key, count: v.dias[key] || 0, label: d.toLocaleDateString("pt-PT", {weekday:"short"}), hoje: key === agora.toISOString().slice(0,10) };
  });
  const max = Math.max(...dias.map(d => d.count), 1);
  return `<div class="grelha-stats">
    <div class="cartao-stat"><b>${v.hoje}</b><small><i class="fas fa-sun"></i> Hoje</small></div>
    <div class="cartao-stat"><b>${v.semana}</b><small><i class="fas fa-calendar-week"></i> Semana</small></div>
    <div class="cartao-stat"><b>${v.mes}</b><small><i class="fas fa-calendar-alt"></i> ${mesLabel}</small></div>
    <div class="cartao-stat" style="border-color:rgba(201,151,58,.28)"><b>${v.total}</b><small><i class="fas fa-users"></i> Total</small></div>
  </div>
  <div class="grafico-semana">
    <div class="label-g"><i class="fas fa-chart-bar" style="color:var(--ouro)"></i> Últimos 7 dias</div>
    <div class="barras">${dias.map(d => {
      const h = Math.max((d.count / max) * 100, d.count > 0 ? 8 : 3);
      return `<div class="barra-dia ${d.hoje ? "hoje" : ""}">
        <span class="num">${d.count || ""}</span>
        <div class="barra" style="height:${h}%;background:${d.hoje ? "var(--ouro)" : "rgba(201,151,58,.3)"}"></div>
        <span class="dia-label">${d.label}</span>
      </div>`;
    }).join("")}</div>
  </div>
  <div class="nota-visitas"><i class="fas fa-info-circle" style="color:var(--ouro);margin-right:5px"></i>Contagem por sessão. Dados guardados localmente.</div>`;
}

// ===== PAINEL ADMIN =====
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

function tentarAdmin() { 
  const v = $("inputPassAdmin")?.value; 
  if(v === PASS_ADMIN) {
    sessionStorage.setItem("bb_admin","1");
    abrirPainel("admin");
  } else { 
    nota("Palavra-passe incorrecta.", "err"); 
  }
}

// ===== PAINÉIS =====
const PAINEIS = {
  sobre: {
    titulo: "Sobre nós",
    html() {
      return `<div class="bloco-painel"><div style="display:flex;gap:12px;align-items:center"><div style="width:50px;height:50px;background:linear-gradient(135deg,#c9973a,#e8b44e);border-radius:12px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:28px;">⬡</div><div><h4 style="margin:0">Brother's Business</h4><span class="tag-painel">Angola 🇦🇴</span></div></div><p>Marketplace angolano criado para facilitar compra e venda directamente pelo WhatsApp. 100% gratuito.</p></div>`;
    }
  },
  novidades: {
    titulo: "Novidades",
    async html() { return `<div class="bloco-painel">${await renderNovidades(false)}</div>`; }
  },
  apoio: {
    titulo: "Apoio ao cliente",
    html() { return `<div class="bloco-painel"><p>Estamos disponíveis para responder rapidamente.</p></div><a class="apoio-link" href="https://wa.me/244954929881" target="_blank"><i class="fab fa-whatsapp" style="color:#25D366"></i><div><strong>WhatsApp</strong><span>+244 954 929 881</span></div></a>`; }
  },
  privacidade: {
    titulo: "Privacidade",
    html() { return `<div class="bloco-painel"><h4>O que guardamos</h4><p>Guardamos nome, email e produtos que publicas no Firebase.</p></div><div class="bloco-painel"><h4>WhatsApp</h4><p>As conversas do WhatsApp não nos pertencem nem são armazenadas.</p></div>`; }
  },
  faq: {
    titulo: "FAQ",
    html() {
      const qs = [
        ["Como publico um anúncio?", "Vai a Anunciar, preenche os dados e publica. Fica pendente até o admin aprovar."],
        ["Como funciona a compra?", "Clica no produto, confirma interesse e és redirecionado para o WhatsApp do vendedor."],
        ["Cobram comissão?", "Não. O Brother's Business é 100% gratuito."],
        ["Como apago o meu anúncio?", "No teu Meu Marketplace ou na grelha de produtos vês os teus anúncios com botão de remover."]
      ];
      return `<div class="bloco-painel"><p>Dúvidas mais comuns.</p></div><div style="display:flex;flex-direction:column;gap:7px">${qs.map(([p,r])=>`<div class="faq-item"><div class="faq-pergunta" onclick="toggleFaq(this)">${p}<i class="fas fa-chevron-down"></i></div><div class="faq-resposta"><p>${r}</p></div></div>`).join("")}</div>`;
    }
  },
  meumkt: {
    titulo: "Meu Marketplace",
    async html() { return await renderMeuMkt(); }
  },
  empresa: {
    titulo: "Painel da Empresa",
    async html() { return await renderPainelEmpresa(); }
  },
  admin: {
    titulo: "Painel Admin",
    html() {
      if(sessionStorage.getItem("bb_admin") !== "1") {
        return `<div class="admin-bloqueado"><i class="fas fa-lock"></i><h4>Área restrita</h4><p>Só o administrador tem acesso.</p><input type="password" id="inputPassAdmin" class="input-admin" placeholder="Palavra-passe"><button class="btn-publicar" style="margin-top:12px;width:100%" onclick="tentarAdmin()">Entrar</button></div>`;
      }
      return `<div class="bloco-painel"><p>Bem-vindo, Admin!</p>${renderVisitas()}<button class="btn-publicar" onclick="verProdutosPendentes()">Ver produtos pendentes</button><hr><h4>Publicar novidade</h4><input type="text" id="novTitulo" class="input-admin" placeholder="Título"><textarea id="novTexto" class="textarea-admin" placeholder="Descrição..."></textarea><button class="btn-publicar" onclick="publicarNovidadeFirebase($('#novTitulo').value, $('#novTexto').value)">Publicar novidade</button><hr><div id="listaNovidadesAdmin">Carregando...</div></div>`;
    }
  }
};

async function abrirPainel(chave) {
  const p = PAINEIS[chave];
  if(!p) return;
  $("painelTitulo").textContent = p.titulo;
  if(typeof p.html === 'function') {
    $("painelCorpo").innerHTML = await p.html();
  } else {
    $("painelCorpo").innerHTML = p.html();
  }
  $("painelLateral").classList.add("aberto");
  $("overlayPainel").classList.add("aberto");
  document.body.style.overflow = "hidden";
  
  // Carregar novidades no admin
  if(chave === "admin" && sessionStorage.getItem("bb_admin") === "1") {
    const novidades = await renderNovidades(true);
    const listaDiv = $("listaNovidadesAdmin");
    if(listaDiv) listaDiv.innerHTML = novidades;
  }
}

function fecharPainel() {
  $("painelLateral").classList.remove("aberto");
  $("overlayPainel").classList.remove("aberto");
  document.body.style.overflow = "";
}

function toggleFaq(el) {
  const r = el.nextElementSibling;
  const ab = r.classList.contains("aberta");
  document.querySelectorAll(".faq-pergunta").forEach(q => {
    q.classList.remove("aberta");
    if(q.nextElementSibling) q.nextElementSibling.classList.remove("aberta");
  });
  if(!ab) {
    el.classList.add("aberta");
    r.classList.add("aberta");
  }
}

// ===== NOTIFICAÇÕES =====
function pedirPermissaoNotif() {
  if(!("Notification"in window)){ nota("Browser não suporta notificações.", "err"); return; }
  if(Notification.permission === "granted"){ nota("Notificações já activas! ✅", "ok"); return; }
  Notification.requestPermission().then(perm => { if(perm === "granted") nota("Notificações activadas! 🔔", "ok"); });
}

function enviarNotificacao(titulo, corpo) {
  if(!("Notification"in window) || Notification.permission !== "granted") return;
  try { new Notification(titulo, { body: corpo }); } catch(e) {}
}

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
  setupTabs();
  setupVenda();
  setupEbooks();
  setupContato();
  
  // Tentar Firebase, se falhar usa localStorage
  try {
    await iniciarProdutosPadrao();
    await iniciarEbooksPadrao();
  } catch(e) {
    console.warn("Firebase indisponível:", e.message);
    carregarProdutosLocal();
    renderEbooks();
  }
  
  // Verificar sessão do Firebase
  try { auth.onAuthStateChanged(async (user) => {
    if (user) {
      await processarLogin(user);
      await carregarProdutosFirebase();
      await renderEbooks();
    } else {
      utilizador = null;
      renderAuth();
      await carregarProdutosFirebase();
      await renderEbooks();
    }
  });
  
  // Eventos de navegação
  document.querySelectorAll(".nav-topo a[data-sec]").forEach(a => {
    a.addEventListener("click", e => { e.preventDefault(); irPara(a.dataset.sec); });
  });
  
  $("campoBusca")?.addEventListener("input", e => { busca = e.target.value; renderProdutos(); });
  $("ordenacao")?.addEventListener("change", e => { ordem = e.target.value; renderProdutos(); });
  
  document.querySelectorAll(".cat").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".cat").forEach(b => b.classList.remove("ativa"));
      btn.classList.add("ativa");
      categoria = btn.dataset.cat;
      renderProdutos();
    });
  });
  
  // Eventos dos modais
  $("fecharModalProd")?.addEventListener("click", fecharProduto);
  $("modalProduto")?.addEventListener("click", e => { if(e.target === $("modalProduto")) fecharProduto(); });
  $("qtyMenos")?.addEventListener("click", () => { if(qty > 1){ qty--; $("qtyNum").textContent = qty; actualizarResumo(); } });
  $("qtyMais")?.addEventListener("click", () => { qty++; $("qtyNum").textContent = qty; actualizarResumo(); });
  $("btnConfirmarWA")?.addEventListener("click", confirmarWA);
  $("btnAddCarrinho")?.addEventListener("click", addCarrinho);
  
  // Eventos de login
  $("fecharModalLogin")?.addEventListener("click", fecharLogin);
  $("modalLogin")?.addEventListener("click", e => { if(e.target === $("modalLogin")) fecharLogin(); });
  $("btnGoogleLogin")?.addEventListener("click", loginGoogle);
  $("btnGoogleRegisto")?.addEventListener("click", loginGoogle);
  $("btnEntrarEmail")?.addEventListener("click", loginEmail);
  $("btnRegistar")?.addEventListener("click", registarUtilizador);
  $("btnTelefoneLogin")?.addEventListener("click", iniciarLoginTelefone);
  $("btnEnviarCodigo")?.addEventListener("click", enviarCodigoSMS);
  $("btnVerificarCodigo")?.addEventListener("click", verificarCodigoSMS);
  $("btnReenviarCodigo")?.addEventListener("click", enviarCodigoSMS);
  
  // Eventos do carrinho
  $("btnCarrinho")?.addEventListener("click", abrirCarrinho);
  $("fecharCarrinho")?.addEventListener("click", fecharCarrinho);
  $("overlayCarrinho")?.addEventListener("click", fecharCarrinho);
  $("btnCheckout")?.addEventListener("click", checkoutWA);
  
  // Eventos da IA
  $("btnGerarDesc")?.addEventListener("click", gerarDescricao);
  $("btnChatEnviar")?.addEventListener("click", enviarChat);
  $("chatInput")?.addEventListener("keydown", e => { if(e.key === "Enter") enviarChat(); });
  
  // Eventos e-books
  $("modalEbook")?.addEventListener("click", e => { if(e.target === $("modalEbook")) fecharModalEbook(); });
  $("btnNotifPush")?.addEventListener("click", pedirPermissaoNotif);
  
  // Fechar modais com ESC
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
window.aprovarProdutoFirebase = aprovarProdutoFirebase;
window.rejeitarProdutoFirebase = rejeitarProdutoFirebase;
window.verProdutosPendentes = verProdutosPendentes;
window.tentarAdmin = tentarAdmin;
window.irPara = irPara;
window.abrirMenu = abrirMenu;
window.fecharMenu = fecharMenu;
window.abrirPainel = abrirPainel;
window.fecharPainel = fecharPainel;
window.fecharProduto = fecharProduto;
window.fecharModalEbook = fecharModalEbook;
window.alterarQtyCarrinho = alterarQtyCarrinho;
window.removerCarrinho = removerCarrinho;
window.removerEbookFirebase = removerEbookFirebase;
window.pedirPermissaoNotif = pedirPermissaoNotif;
window.escolherCor = escolherCor;
window.escolherTam = escolherTam;
window.escolherEstrela = escolherEstrela;
window.marcarLidaMensagem = marcarLidaMensagem;
window.publicarNovidadeFirebase = publicarNovidadeFirebase;
window.apagarNovidadeFirebase = apagarNovidadeFirebase;
// ── FALLBACK LOCAL ────────────────────────────────────────────
function carregarProdutosLocal() {
  try { const s = localStorage.getItem("bb_produtos"); if(s) produtos = JSON.parse(s); } catch(e){}
  if (!produtos.length) {
    produtos = JSON.parse(JSON.stringify(CATALOG_BASE));
    localStorage.setItem("bb_produtos", JSON.stringify(produtos));
  }
  renderProdutos();
  const el = $("totalProdutos");
  if(el) el.textContent = produtos.filter(p=>p.aprovado).length;
}

// ── EXPOR GLOBALMENTE TODAS AS FUNÇÕES INLINE ────────────────
window.irPara = typeof irPara !== "undefined" ? irPara : function(){};
window.abrirMenu = typeof abrirMenu !== "undefined" ? abrirMenu : function(){};
window.fecharMenu = typeof fecharMenu !== "undefined" ? fecharMenu : function(){};
window.abrirPainel = typeof abrirPainel !== "undefined" ? abrirPainel : function(){};
window.fecharPainel = typeof fecharPainel !== "undefined" ? fecharPainel : function(){};
window.abrirLogin = typeof abrirLogin !== "undefined" ? abrirLogin : function(){};
window.fecharLogin = typeof fecharLogin !== "undefined" ? fecharLogin : function(){};
window.sair = typeof sair !== "undefined" ? sair : function(){};
window.fecharProduto = typeof fecharProduto !== "undefined" ? fecharProduto : function(){};
window.fecharModalEbook = typeof fecharModalEbook !== "undefined" ? fecharModalEbook : function(){};
window.fecharModalTelefone = typeof fecharModalTelefone !== "undefined" ? fecharModalTelefone : function(){};
window.confirmarWA = typeof confirmarWA !== "undefined" ? confirmarWA : function(){};
window.addCarrinho = typeof addCarrinho !== "undefined" ? addCarrinho : function(){};
window.abrirCarrinho = typeof abrirCarrinho !== "undefined" ? abrirCarrinho : function(){};
window.fecharCarrinho = typeof fecharCarrinho !== "undefined" ? fecharCarrinho : function(){};
window.checkoutWA = typeof checkoutWA !== "undefined" ? checkoutWA : function(){};
window.alterarQtyCarrinho = typeof alterarQtyCarrinho !== "undefined" ? alterarQtyCarrinho : function(){};
window.removerCarrinho = typeof removerCarrinho !== "undefined" ? removerCarrinho : function(){};
window.escolherCor = typeof escolherCor !== "undefined" ? escolherCor : function(){};
window.escolherTam = typeof escolherTam !== "undefined" ? escolherTam : function(){};
window.escolherEstrela = typeof escolherEstrela !== "undefined" ? escolherEstrela : function(){};
window.pedirPermissaoNotif = typeof pedirPermissaoNotif !== "undefined" ? pedirPermissaoNotif : function(){};
window.tentarAdmin = typeof tentarAdmin !== "undefined" ? tentarAdmin : function(){};
window.aprovarProdutoFirebase = typeof aprovarProdutoFirebase !== "undefined" ? aprovarProdutoFirebase : function(){};
window.rejeitarProdutoFirebase = typeof rejeitarProdutoFirebase !== "undefined" ? rejeitarProdutoFirebase : function(){};
window.publicarNovidadeFirebase = typeof publicarNovidadeFirebase !== "undefined" ? publicarNovidadeFirebase : function(){};
window.apagarNovidadeFirebase = typeof apagarNovidadeFirebase !== "undefined" ? apagarNovidadeFirebase : function(){};
window.marcarLidaMensagem = typeof marcarLidaMensagem !== "undefined" ? marcarLidaMensagem : function(){};
window.removerEbookFirebase = typeof removerEbookFirebase !== "undefined" ? removerEbookFirebase : function(){};
window.loginEmail = typeof loginEmail !== "undefined" ? loginEmail : function(){};
window.loginGoogle = typeof loginGoogle !== "undefined" ? loginGoogle : function(){};
window.registarUtilizador = typeof registarUtilizador !== "undefined" ? registarUtilizador : function(){};
window.iniciarLoginTelefone = typeof iniciarLoginTelefone !== "undefined" ? iniciarLoginTelefone : function(){};
window.enviarCodigoSMS = typeof enviarCodigoSMS !== "undefined" ? enviarCodigoSMS : function(){};
window.verificarCodigoSMS = typeof verificarCodigoSMS !== "undefined" ? verificarCodigoSMS : function(){};
window.toggleFaq = function(el) {
  const r = el.nextElementSibling;
  const ab = r?.classList.contains("aberta");
  document.querySelectorAll(".faq-pergunta").forEach(q => {
    q.classList.remove("aberta");
    q.nextElementSibling?.classList.remove("aberta");
  });
  if(!ab) { el.classList.add("aberta"); r?.classList.add("aberta"); }
};
