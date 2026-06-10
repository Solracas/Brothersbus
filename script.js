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
const fallback = "https://images.unsplash.com/photo-1588421357574-87938a86fa28?w=400&q=60";

function nota(msg, tipo) {
  const el = $("notificacao");
  if(!el) return;
  el.textContent = msg;
  el.className = "notificacao visivel " + (tipo||"");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.className = "notificacao", 2800);
}

// ===== FUNÇÕES DE AUTH =====
function processarLogin(user) {
  if (!user) return;
  
  utilizador = {
    id: user.uid,
    nome: user.displayName || user.email?.split('@')[0] || "Utilizador",
    email: user.email || "",
    telefone: user.phoneNumber || "",
    foto: user.photoURL || "",
    tipo: "utilizador"
  };
  
  // Verificar se é admin (adiciona os teus emails aqui)
  const adminEmails = ["admin@brothers.ao", "carlosjoaquimc5@gmail.com"];
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
  carregarDados();
  nota("Bem-vindo(a), " + utilizador.nome + "! 👋", "ok");
}

function loginGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then(result => processarLogin(result.user))
    .catch(error => nota("Erro Google: " + error.message, "err"));
}

function loginFacebook() {
  const provider = new firebase.auth.FacebookAuthProvider();
  auth.signInWithPopup(provider)
    .then(result => processarLogin(result.user))
    .catch(error => nota("Erro Facebook: " + error.message, "err"));
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
      console.error(error);
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
    carregarDados();
    nota("Sessão encerrada.", "ok");
  });
}

function renderAuth() {
  const z = $("zonaAuth");
  if(!z) return;
  
  if (utilizador) {
    z.innerHTML = `
      <div class="chip-user">
        ${utilizador.foto ? `<img src="${utilizador.foto}" style="width:28px;height:28px;border-radius:50%;object-fit:cover">` : `<i class="fas fa-user-circle"></i>`}
        <span>${esc(utilizador.nome)}</span>
        ${utilizador.tipo === 'admin' ? '<span class="tag-painel" style="font-size:.6rem; padding:2px 5px;">Admin</span>' : ''}
        <button class="btn-sair" onclick="sair()"><i class="fas fa-sign-out-alt"></i></button>
      </div>`;
  } else {
    z.innerHTML = `
      <button class="btn-auth" onclick="abrirLogin()"><i class="fas fa-sign-in-alt"></i> Entrar / Registar</button>
    `;
  }
}

function abrirLogin() {
  $("modalLogin").style.display = "flex";
  document.body.style.overflow = "hidden";
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
      $(`tab-${target}`).style.display = "block";
    });
  });
}

// ===== FUNÇÕES DO FIRESTORE =====
async function carregarProdutos() {
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

async function carregarEbooks() {
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

async function publicarProdutoFirebase(produto) {
  if (!utilizador) { nota("Precisas de entrar.", "err"); return null; }
  try {
    await db.collection("produtos").add({
      ...produto,
      aprovado: false,
      dataCriacao: firebase.firestore.FieldValue.serverTimestamp(),
      criadorId: utilizador.id,
      criadorNome: utilizador.nome,
      criadorEmail: utilizador.email
    });
    nota("Produto enviado para aprovação! ⏳", "ok");
    return true;
  } catch(error) {
    nota("Erro ao publicar: " + error.message, "err");
    return false;
  }
}

async function aprovarProdutoFirebase(id) {
  if (!utilizador || utilizador.tipo !== 'admin') return;
  try {
    await db.collection("produtos").doc(id).update({ aprovado: true });
    nota("Produto aprovado! ✅", "ok");
    carregarProdutos();
  } catch(error) {
    nota("Erro ao aprovar.", "err");
  }
}

async function rejeitarProdutoFirebase(id) {
  if (!utilizador || utilizador.tipo !== 'admin') return;
  try {
    await db.collection("produtos").doc(id).delete();
    nota("Produto rejeitado.", "err");
    carregarProdutos();
  } catch(error) {
    nota("Erro ao rejeitar.", "err");
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
    return true;
  } catch(error) {
    nota("Erro ao publicar e-book.", "err");
    return false;
  }
}

async function registarPedido(pedido) {
  if (!utilizador) return;
  try {
    await db.collection("pedidos").add({
      ...pedido,
      compradorId: utilizador.id,
      compradorNome: utilizador.nome,
      data: new Date().toISOString()
    });
  } catch(error) {
    console.error("Erro ao registar pedido:", error);
  }
}

async function carregarDados() {
  await carregarProdutos();
  renderProdutos();
}

// ===== FUNÇÕES DO CARRINHO =====
function actualizarBadgeCarrinho() {
  const total = carrinho.reduce((s,i)=>s+i.qty,0);
  const b = $("badgeCarrinho");
  if(b) {
    b.textContent = total;
    b.style.display = total === 0 ? "none" : "flex";
  }
}

function addCarrinho() {
  if (!prodAberto) return;
  if (!utilizador) { fecharProduto(); abrirLogin(); return; }
  const item = carrinho.find(i => i.id===prodAberto.id && i.cor===corSel && i.tam===tamSel);
  if (item) item.qty += qty;
  else carrinho.push({id:prodAberto.id,nome:prodAberto.nome,preco:prodAberto.preco,foto:prodAberto.imagem,cor:corSel,tam:tamSel,qty,vendedor:prodAberto.criadorNome,whatsapp:prodAberto.whatsapp||WA,criadorId:prodAberto.criadorId});
  actualizarBadgeCarrinho(); nota(prodAberto.nome+" adicionado! 🛍️","ok");
}

function abrirCarrinho() {
  $("gavetaCarrinho").classList.add("aberta"); $("overlayCarrinho").style.display="block";
  document.body.style.overflow="hidden"; renderCarrinho();
}

function fecharCarrinho() {
  $("gavetaCarrinho").classList.remove("aberta"); $("overlayCarrinho").style.display="none";
  document.body.style.overflow="";
}

function renderCarrinho() {
  const itens=$("gavetaItens"), rod=$("gavetaRodape");
  if (!carrinho.length) { itens.innerHTML=`<div class="carrinho-vazio"><span>🛍️</span><p>Ainda não adicionaste nada</p></div>`; rod.style.display="none"; return; }
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
  rod.style.display="flex";
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
  vendedores.forEach(v => {
    let msg = `Olá ${esc(v.nome)}! Quero encomendar:\n\n`;
    v.items.forEach(i => msg+=`• *${i.nome}* ×${i.qty} = *${kz(i.preco*i.qty)}*${i.cor?" ("+i.cor+")":""}${i.tam?" ("+i.tam+")":""}\n`);
    const total = v.items.reduce((s,i)=>s+i.preco*i.qty,0);
    msg += `\n*Total: ${kz(total)}*\nNome: *${utilizador.nome}*`;
    window.open(`https://wa.me/${v.wa}?text=${encodeURIComponent(msg)}`,"_blank");
    v.items.forEach(i => registarPedido({tipo:"produto",nome:i.nome,preco:i.preco,qty:i.qty,cor:i.cor,tam:i.tam,vendedor:i.vendedor}));
  });
  carrinho = [];
  actualizarBadgeCarrinho();
  fecharCarrinho();
}

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
          <div class="produto-vendedor"><i class="fas fa-user"></i>${esc(p.criadorNome)}</div>
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

// ===== ABRIR PRODUTO MODAL =====
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
  actualizarResumo();
  $("modalProduto").style.display="flex"; document.body.style.overflow="hidden";
}

function fecharProduto() { $("modalProduto").style.display="none"; document.body.style.overflow=""; prodAberto=null; }

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
  registarPedido({ tipo:"produto", nome:prodAberto.nome, preco:prodAberto.preco, qty, cor:corSel, tam:tamSel, vendedor:prodAberto.criadorNome });
  const num = prodAberto.whatsapp||WA;
  const msg = `Olá! Tenho interesse em: *${prodAberto.nome}*\nPreço: *${kz(prodAberto.preco)}*${corSel?`\nCor: *${corSel}*`:""}${tamSel?`\nTamanho: *${tamSel}*`:""}\nQuantidade: *${qty}*\nTotal: *${kz(prodAberto.preco*qty)}*\nMeu nome: *${utilizador.nome}*`;
  window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`,"_blank");
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
  const ebooks = await carregarEbooks();
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
          ${meu?`<button class="btn-remover" onclick="event.stopPropagation();removerEbook('${eb.id}')"><i class="fas fa-trash-alt"></i></button>`:""}
        </div>
      </div>
    </div>`;
  }).join("");
  g.querySelectorAll(".cartao-ebook").forEach(card=>{card.addEventListener("click",e=>{if(e.target.closest(".btn-remover"))return;abrirModalEbook(card.dataset.ebid);});});
}

async function abrirModalEbook(id) {
  const ebooks = await carregarEbooks();
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
async function removerEbook(id){if(!confirm("Remover?"))return;await db.collection("ebooks").doc(id).delete();renderEbooks();nota("E-book removido.","err");}

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
    
    await publicarProdutoFirebase({ nome, preco, categoria:cat, descricao:desc||"Sem descrição.", imagem, whatsapp:waLimpo, criadorNome:nomeVendedor });
    $("formVenda").reset(); $("fotoPreviewVenda").style.display="none"; $("uploadLabel").textContent="Escolher foto da galeria"; $("previewFoto").innerHTML="📷";
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
    if (msgLower.includes("preço") || msgLower.includes("quanto custa")) resposta = "Os preços são definidos pelos vendedores. Clica no produto para ver o preço e negociar!";
    else if (msgLower.includes("como comprar") || msgLower.includes("comprar")) resposta = "Para comprar: clica no produto, escolhe opções, adiciona ao carrinho ou confirma pelo WhatsApp.";
    else if (msgLower.includes("anunciar") || msgLower.includes("vender")) resposta = "Vai à secção 'Anunciar', preenche o formulário e publica! O anúncio aguarda aprovação do admin.";
    else if (msgLower.includes("ebook")) resposta = "Os e-books estão na secção 'E-books'. Podes publicar o teu ou adquirir os disponíveis.";
    else resposta = "Podes perguntar sobre preços, como comprar, como anunciar, e-books ou como criar conta!";
    pushMsgIA(resposta, "bot");
  }, 300);
}

// ===== PAINÉIS =====
const PAINEIS = {
  sobre:{titulo:"Sobre nós",html(){return `<div class="bloco-painel"><div style="display:flex;gap:12px;align-items:center"><div style="width:50px;height:50px;background:linear-gradient(135deg,#c9973a,#e8b44e);border-radius:12px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:28px;">⬡</div><div><h4 style="margin:0">Brother's Business</h4><span class="tag-painel">Angola 🇦🇴</span></div></div><p>Marketplace angolano criado para facilitar compra e venda directamente pelo WhatsApp. 100% gratuito.</p></div>`;}},
  novidades:{titulo:"Novidades",html(){return `<div class="bloco-painel"><p>✨ Site atualizado com login via Google, Facebook, Telefone e Email!</p><p>📱 Agora podes publicar produtos e e-books que ficam visíveis para todos.</p></div>`;}},
  apoio:{titulo:"Apoio ao cliente",html(){return `<div class="bloco-painel"><p>Estamos disponíveis para responder rapidamente.</p></div><a class="apoio-link" href="https://wa.me/244954929881" target="_blank"><i class="fab fa-whatsapp" style="color:#25D366"></i><div><strong>WhatsApp</strong><span>+244 954 929 881</span></div></a>`;}},
  privacidade:{titulo:"Privacidade",html(){return `<div class="bloco-painel"><h4>O que guardamos</h4><p>Guardamos nome, email e produtos que publicas no Firebase.</p></div>`;}},
  faq:{titulo:"FAQ",html(){return `<div class="bloco-painel"><p>Dúvidas? Contacta-nos pelo WhatsApp!</p></div>`;}},
  meumkt:{titulo:"Meu Marketplace",html(){if(!utilizador)return `<div class="admin-bloqueado"><i class="fas fa-user-circle"></i><h4>Não identificado</h4><p>Entra na tua conta para ver o teu marketplace.</p><button class="btn-publicar" onclick="fecharPainel();abrirLogin()">Entrar</button></div>`;return `<div class="bloco-painel"><p>Bem-vindo ao teu marketplace, ${esc(utilizador.nome)}!</p><p>Os teus anúncios aparecem na página principal após aprovação do admin.</p></div>`;}},
  empresa:{titulo:"Painel da Empresa",html(){if(!utilizador)return `<div class="admin-bloqueado"><i class="fas fa-building"></i><h4>Não identificado</h4><p>Entra como empresa para ver este painel.</p><button class="btn-publicar" onclick="fecharPainel();abrirLogin()">Entrar</button></div>`;return `<div class="bloco-painel"><p>Painel da empresa em desenvolvimento.</p></div>`;}},
  admin:{titulo:"Painel Admin",html(){
    if(sessionStorage.getItem("bb_admin")!=="1")return `<div class="admin-bloqueado"><i class="fas fa-lock"></i><h4>Área restrita</h4><p>Só o administrador tem acesso.</p><input type="password" id="inputPassAdmin" class="input-admin" placeholder="Palavra-passe"><button class="btn-publicar" style="margin-top:12px;width:100%" onclick="tentarAdmin()">Entrar</button></div>`;
    return `<div class="bloco-painel"><p>Bem-vindo, Admin!</p><button class="btn-publicar" onclick="verProdutosPendentes()">Ver produtos pendentes</button></div>`;
  }}
};

async function verProdutosPendentes() {
  const snapshot = await db.collection("produtos").where("aprovado", "==", false).get();
  let html = `<h4>Produtos pendentes (${snapshot.size})</h4>`;
  snapshot.forEach(doc => {
    const p = doc.data();
    html += `<div class="cartao-novidade"><h5>${esc(p.nome)}</h5><p>${kz(p.preco)} - ${esc(p.criadorNome)}</p><button class="btn-publicar" onclick="aprovarProdutoFirebase('${doc.id}')">Aprovar</button> <button class="btn-apagar-nov" onclick="rejeitarProdutoFirebase('${doc.id}')">Rejeitar</button></div>`;
  });
  $("painelCorpo").innerHTML = html;
}

function tentarAdmin() { const v=$("inputPassAdmin")?.value; if(v==="brothers2025"){sessionStorage.setItem("bb_admin","1");abrirPainel("admin");}else nota("Palavra-passe incorrecta.","err"); }
function abrirPainel(chave) { const p=PAINEIS[chave]; if(!p) return; $("painelTitulo").textContent=p.titulo; $("painelCorpo").innerHTML=p.html(); $("painelLateral").classList.add("aberto"); $("overlayPainel").classList.add("aberto"); document.body.style.overflow="hidden"; }
function fecharPainel(){ $("painelLateral").classList.remove("aberto"); $("overlayPainel").classList.remove("aberto"); document.body.style.overflow=""; }

// ===== NOTIFICAÇÕES =====
function pedirPermissaoNotif(){
  if(!("Notification"in window)){nota("Browser não suporta notificações.","err");return;}
  if(Notification.permission==="granted"){nota("Notificações já activas! ✅","ok");return;}
  Notification.requestPermission().then(perm=>{if(perm==="granted")nota("Notificações activadas! 🔔","ok");});
}

// ===== INICIALIZAÇÃO =====
const WA = "244954929881";

document.addEventListener("DOMContentLoaded", () => {
  setupTabs();
  setupVenda();
  
  // Verificar sessão do Firebase
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      await processarLogin(user);
      await carregarDados();
    } else {
      utilizador = null;
      renderAuth();
      await carregarProdutos();
    }
  });
  
  // Eventos
  $("btnGoogleLogin")?.addEventListener("click", loginGoogle);
  $("btnGoogleRegisto")?.addEventListener("click", loginGoogle);
  $("btnFacebookLogin")?.addEventListener("click", loginFacebook);
  $("btnFacebookRegisto")?.addEventListener("click", loginFacebook);
  $("btnEntrarEmail")?.addEventListener("click", loginEmail);
  $("btnRegistar")?.addEventListener("click", registarUtilizador);
  $("btnTelefoneLogin")?.addEventListener("click", iniciarLoginTelefone);
  $("btnEnviarCodigo")?.addEventListener("click", enviarCodigoSMS);
  $("btnVerificarCodigo")?.addEventListener("click", verificarCodigoSMS);
  $("btnReenviarCodigo")?.addEventListener("click", enviarCodigoSMS);
  $("fecharModalLogin")?.addEventListener("click", fecharLogin);
  $("modalLogin")?.addEventListener("click", e => { if(e.target === $("modalLogin")) fecharLogin(); });
  $("modalTelefone")?.addEventListener("click", e => { if(e.target === $("modalTelefone")) fecharModalTelefone(); });
  $("fecharModalProd")?.addEventListener("click", fecharProduto);
  $("modalProduto")?.addEventListener("click", e => { if(e.target === $("modalProduto")) fecharProduto(); });
  $("qtyMenos")?.addEventListener("click", () => { if(qty>1){qty--;$("qtyNum").textContent=qty;actualizarResumo();}});
  $("qtyMais")?.addEventListener("click", () => { qty++;$("qtyNum").textContent=qty;actualizarResumo();});
  $("btnConfirmarWA")?.addEventListener("click", confirmarWA);
  $("btnAddCarrinho")?.addEventListener("click", addCarrinho);
  $("btnCarrinho")?.addEventListener("click", abrirCarrinho);
  $("fecharCarrinho")?.addEventListener("click", fecharCarrinho);
  $("overlayCarrinho")?.addEventListener("click", fecharCarrinho);
  $("btnCheckout")?.addEventListener("click", checkoutWA);
  $("btnGerarDesc")?.addEventListener("click", gerarDescricao);
  $("btnChatEnviar")?.addEventListener("click", enviarChat);
  $("chatInput")?.addEventListener("keydown", e => { if(e.key==="Enter") enviarChat(); });
  $("campoBusca")?.addEventListener("input", e => { busca = e.target.value; renderProdutos(); });
  $("ordenacao")?.addEventListener("change", e => { ordem = e.target.value; renderProdutos(); });
  $("campoBuscaEbook")?.addEventListener("input", e => { buscaEbook = e.target.value; renderEbooks(); });
  document.querySelectorAll(".cat").forEach(btn => { btn.addEventListener("click", () => { document.querySelectorAll(".cat").forEach(b=>b.classList.remove("ativa")); btn.classList.add("ativa"); categoria=btn.dataset.cat; renderProdutos(); }); });
  document.querySelectorAll(".cat-eb").forEach(btn => { btn.addEventListener("click", () => { document.querySelectorAll(".cat-eb").forEach(b=>b.classList.remove("ativa")); btn.classList.add("ativa"); catEbook=btn.dataset.cat; renderEbooks(); }); });
  document.querySelectorAll(".nav-topo a[data-sec]").forEach(a => { a.addEventListener("click", e => { e.preventDefault(); irPara(a.dataset.sec); }); });
  
  // Upload e-book
  $("uploadEbookCapa")?.addEventListener("change", e => {
    const file = e.target.files[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = ev => { $("ebookCapaPreview").src = ev.target.result; $("ebookCapaPreview").style.display = "block"; $("uploadEbookLabel").textContent = "Capa selecionada ✅"; };
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
    await publicarEbookFirebase({ titulo, preco, autor, categoria:cat, descricao:desc, capa, whatsapp:wa || WA });
    $("formEbook").reset();
    $("ebookCapaPreview").style.display = "none";
    $("uploadEbookLabel").textContent = "Escolher capa da galeria";
    renderEbooks();
  });
  
  $("btnEbookWA")?.addEventListener("click", () => {
    if(!ebookAberto) return;
    if(!utilizador){ fecharModalEbook(); abrirLogin(); return; }
    registarPedido({ tipo:"ebook", nome:ebookAberto.titulo, preco:ebookAberto.preco, qty:1, vendedor:ebookAberto.criadorNome });
    window.open(`https://wa.me/${ebookAberto.whatsapp || WA}?text=${encodeURIComponent(`Olá! Tenho interesse no e-book:\n*${ebookAberto.titulo}*\nPreço: *${kz(ebookAberto.preco)}*\nMeu nome: *${utilizador.nome}*`)}`, "_blank");
  });
  
  $("btnEnviarWA")?.addEventListener("click", () => {
    const nome = $("waNome")?.value?.trim();
    const msg = $("waMensagem")?.value?.trim();
    if(!nome || !msg){ nota("Preenche o nome e a mensagem.", "err"); return; }
    window.open(`https://wa.me/${WA}?text=${encodeURIComponent(`Olá! Sou *${nome}*.\n\n${msg}`)}`, "_blank");
  });
  
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

// Exportar funções globais
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
window.removerEbook = removerEbook;
window.pedirPermissaoNotif = pedirPermissaoNotif;