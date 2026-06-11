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

// ===== TESTE DE CARREGAMENTO =====
console.log("🚀 Script carregado com sucesso!");
alert("JavaScript está a funcionar! Firebase conectado.");

// ===== VARIÁVEIS =====
let utilizador = null;
let produtos = [];

const WA = "244954929881";
const fallback = "https://images.unsplash.com/photo-1588421357574-87938a86fa28?w=400&q=60";

const $ = id => document.getElementById(id);

function nota(msg, tipo) {
  const el = $("notificacao");
  if(!el) return;
  el.textContent = msg;
  el.className = "notificacao visivel " + (tipo||"");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.className = "notificacao", 2800);
}

// ===== CARREGAR PRODUTOS =====
async function carregarProdutos() {
  const g = $("grelha");
  if(g) g.innerHTML = `<div class="loading-produtos"><div class="spinner"></div><p>A carregar produtos...</p></div>`;
  
  try {
    const snapshot = await db.collection("produtos").where("aprovado", "==", true).get();
    produtos = [];
    snapshot.forEach(doc => {
      produtos.push({ id: doc.id, ...doc.data() });
    });
    
    console.log("Produtos carregados:", produtos.length);
    renderProdutos();
    
    const totalEl = $("totalProdutos");
    if(totalEl) totalEl.textContent = produtos.length;
  } catch(error) {
    console.error("Erro:", error);
    if(g) g.innerHTML = `<p style="color:red">Erro ao carregar produtos: ${error.message}</p>`;
  }
}

function renderProdutos() {
  const g = $("grelha");
  if(!g) return;
  
  if(produtos.length === 0) {
    g.innerHTML = `<div class="sem-resultados"><span>📦</span><h3>Nada por aqui</h3><p>Experimenta outra categoria ou sê o primeiro a anunciar.</p></div>`;
    return;
  }
  
  g.innerHTML = produtos.map(p => `
    <div class="produto" data-id="${p.id}">
      <div class="produto-foto">
        <img src="${p.imagem || fallback}" alt="${p.nome}" onerror="this.src='${fallback}'">
        <span class="produto-cat">${p.categoria || "Outros"}</span>
      </div>
      <div class="produto-info">
        <h4>${p.nome}</h4>
        <div class="produto-preco">${Number(p.preco).toLocaleString("pt-AO")} Kz</div>
        <div class="produto-desc">${p.descricao?.substring(0, 60) || ""}</div>
        <div class="produto-rodape">
          <div class="produto-vendedor"><i class="fas fa-user"></i>${p.criadorNome || "Vendedor"}</div>
        </div>
      </div>
    </div>
  `).join("");
  
  g.querySelectorAll(".produto").forEach(card => {
    card.addEventListener("click", () => {
      nota("Funcionalidade em desenvolvimento! 🔧", "ok");
    });
  });
}

// ===== LOGIN =====
function abrirLogin() {
  $("modalLogin").style.display = "flex";
  document.body.style.overflow = "hidden";
}

function fecharLogin() {
  $("modalLogin").style.display = "none";
  document.body.style.overflow = "";
}

function renderAuth() {
  const z = $("zonaAuth");
  if(!z) return;
  
  if(utilizador) {
    z.innerHTML = `<div class="chip-user"><i class="fas fa-user-circle"></i><span>${utilizador.nome}</span><button class="btn-sair" onclick="sair()"><i class="fas fa-sign-out-alt"></i></button></div>`;
  } else {
    z.innerHTML = `<button class="btn-auth" onclick="abrirLogin()"><i class="fas fa-sign-in-alt"></i> Entrar</button>`;
  }
}

function loginSimples() {
  const nome = prompt("Digite o teu nome:");
  if(nome && nome.trim()) {
    utilizador = { id: "user_" + Date.now(), nome: nome.trim() };
    localStorage.setItem("bb_user", JSON.stringify(utilizador));
    renderAuth();
    fecharLogin();
    nota("Bem-vindo(a), " + nome + "! 👋", "ok");
  }
}

function sair() {
  utilizador = null;
  localStorage.removeItem("bb_user");
  renderAuth();
  nota("Sessão encerrada.", "ok");
}

// ===== NAVEGAÇÃO =====
function irPara(sec) {
  document.querySelectorAll(".secao").forEach(s => s.classList.remove("ativa"));
  $("sec-" + sec)?.classList.add("ativa");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function abrirMenu() {
  $("menuLateral")?.classList.add("aberto");
  $("overlayMenu")?.classList.add("aberto");
  document.body.style.overflow = "hidden";
}

function fecharMenu() {
  $("menuLateral")?.classList.remove("aberto");
  $("overlayMenu")?.classList.remove("aberto");
  document.body.style.overflow = "";
}

function abrirPainel(chave) {
  nota("Painel em desenvolvimento: " + chave, "info");
}

function fecharPainel() {
  $("painelLateral")?.classList.remove("aberto");
  $("overlayPainel")?.classList.remove("aberto");
}

function tentarAdmin() {
  const senha = prompt("Digite a palavra-passe de admin:");
  if(senha === "brothers2025") {
    sessionStorage.setItem("bb_admin", "1");
    nota("Admin ativado! ✅", "ok");
  } else {
    nota("Palavra-passe incorreta.", "err");
  }
}

function fecharModalTelefone() {
  $("modalTelefone").style.display = "none";
}

function pedirPermissaoNotif() {
  if(!("Notification"in window)){ nota("Browser não suporta notificações.", "err"); return; }
  if(Notification.permission === "granted"){ nota("Notificações já activas! ✅", "ok"); return; }
  Notification.requestPermission().then(perm => { if(perm === "granted") nota("Notificações activadas! 🔔", "ok"); });
}

function fecharModalEbook() {
  $("modalEbook").style.display = "none";
}

function removerEbookFirebase() {
  nota("Funcionalidade em desenvolvimento", "info");
}

function marcarLidaMensagem() {
  nota("Funcionalidade em desenvolvimento", "info");
}

function publicarNovidadeFirebase() {
  nota("Funcionalidade em desenvolvimento", "info");
}

function apagarNovidadeFirebase() {
  nota("Funcionalidade em desenvolvimento", "info");
}

// ===== INICIALIZAÇÃO =====
document.addEventListener("DOMContentLoaded", async () => {
  console.log("DOM carregado!");
  
  // Carregar utilizador do localStorage
  try {
    const saved = localStorage.getItem("bb_user");
    if(saved) utilizador = JSON.parse(saved);
    renderAuth();
  } catch(e) {}
  
  // Carregar produtos
  await carregarProdutos();
  
  // Eventos
  $("btnEntrarEmail")?.addEventListener("click", loginSimples);
  $("fecharModalLogin")?.addEventListener("click", fecharLogin);
  $("modalLogin")?.addEventListener("click", e => { if(e.target === $("modalLogin")) fecharLogin(); });
  
  // Botões de navegação
  document.querySelectorAll(".nav-topo a[data-sec]").forEach(a => {
    a.addEventListener("click", e => { e.preventDefault(); irPara(a.dataset.sec); });
  });
  
  // Filtros
  $("campoBusca")?.addEventListener("input", e => {
    const busca = e.target.value.toLowerCase();
    const lista = produtos.filter(p => p.nome.toLowerCase().includes(busca));
    const g = $("grelha");
    if(g) g.innerHTML = lista.map(p => `<div class="produto"><div class="produto-foto"><img src="${p.imagem || fallback}"></div><div class="produto-info"><h4>${p.nome}</h4><div class="produto-preco">${Number(p.preco).toLocaleString("pt-AO")} Kz</div></div></div>`).join("");
  });
  
  console.log("✅ Site inicializado!");
});

// Exportar funções globais
window.irPara = irPara;
window.abrirMenu = abrirMenu;
window.fecharMenu = fecharMenu;
window.abrirPainel = abrirPainel;
window.fecharPainel = fecharPainel;
window.abrirLogin = abrirLogin;
window.fecharLogin = fecharLogin;
window.sair = sair;
window.tentarAdmin = tentarAdmin;
window.fecharModalTelefone = fecharModalTelefone;
window.pedirPermissaoNotif = pedirPermissaoNotif;
window.fecharModalEbook = fecharModalEbook;
window.removerEbookFirebase = removerEbookFirebase;
window.marcarLidaMensagem = marcarLidaMensagem;
window.publicarNovidadeFirebase = publicarNovidadeFirebase;
window.apagarNovidadeFirebase = apagarNovidadeFirebase;