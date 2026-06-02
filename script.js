// ===== BROTHERS 2.0 - SCRIPT COMPLETO =====

const KEY_USER = "bb_user";
const KEY_PRODUTOS = "bb_produtos";
const WHATSAPP_DEFAULT = "244954929881";

let user = null;
let produtos = [];
let carrinho = [];
let termoBusca = "";
let catAtiva = "todos";
let sortAtivo = "recente";
let produtoAtual = null;
let qty = 1;
let corSel = "";
let tamSel = "";
let estrelas = 0;

// ===== IMAGENS REAIS =====
const IMAGENS_REAIS = {
  1: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&q=80",
  2: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&q=80",
  3: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80",
  4: "https://images.unsplash.com/photo-1551954810-43cd27cce4e8?w=600&q=80",
  5: "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=600&q=80",
  6: "https://images.unsplash.com/photo-1593359677879-a4bb92f829e1?w=600&q=80"
};

// ===== PRODUTOS DEFAULT =====
const PRODUTOS_DEFAULT = [
  { id:1, nome:"Huawei Y7 Prime", preco:37000, categoria:"Tecnologia", descricao:"Bateria de 4.000 mAh, ecrã 6,26\", Snapdragon 450, 3GB RAM, 32GB armazenamento. Bom estado, sem riscos.", imagem: IMAGENS_REAIS[1], criadorId:"admin", criadorNome:"Carlos CJ", whatsapp: WHATSAPP_DEFAULT },
  { id:2, nome:"Notebook Dell Inspiron", preco:289000, categoria:"Tecnologia", descricao:"Intel i5, 8GB RAM, SSD 256GB, ecrã 15.6\". Ideal para trabalho e estudos. Carregador incluído.", imagem: IMAGENS_REAIS[2], criadorId:"admin", criadorNome:"Carlos CJ", whatsapp: WHATSAPP_DEFAULT },
  { id:3, nome:"Fone Bluetooth Premium", preco:6000, categoria:"Tecnologia", descricao:"Cancelamento de ruído activo, 20h de bateria, almofadas confortáveis para uso prolongado.", imagem: IMAGENS_REAIS[3], criadorId:"admin", criadorNome:"Carlos CJ", whatsapp: WHATSAPP_DEFAULT },
  { id:4, nome:"Camisa Real Madrid 2024", preco:7000, categoria:"Moda", descricao:"Tamanho XL, algodão premium, cor branca. Produto original com etiqueta.", imagem: IMAGENS_REAIS[4], criadorId:"admin", criadorNome:"Carlos CJ", whatsapp: WHATSAPP_DEFAULT },
  { id:5, nome:"Frigorífico Frost Free 400L", preco:140000, categoria:"Casa", descricao:"400L, acabamento inox, eficiência energética A+. Pouco uso, excelente estado.", imagem: IMAGENS_REAIS[5], criadorId:"admin", criadorNome:"MarketFlow", whatsapp: WHATSAPP_DEFAULT },
  { id:6, nome:"Smart TV 50\" 4K", preco:185000, categoria:"Casa", descricao:"4K HDR, Android TV, Wi-Fi integrado. Com controlo remoto e todos os cabos originais.", imagem: IMAGENS_REAIS[6], criadorId:"admin", criadorNome:"MarketFlow", whatsapp: WHATSAPP_DEFAULT }
];

// ===== UTILS =====
function esc(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function fmt(v) { return Number(v).toLocaleString('pt-AO') + ' Kz'; }
function toast(msg, tipo = '') {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = 'toast show ' + tipo;
  setTimeout(() => t.className = 'toast', 2800);
}

// ===== USER =====
function carregarUser() {
  try { const s = localStorage.getItem(KEY_USER); if(s) user = JSON.parse(s); } catch(e) {}
  renderAuth();
}
function salvarUser(u) {
  user = u;
  if(u) localStorage.setItem(KEY_USER, JSON.stringify(u));
  else localStorage.removeItem(KEY_USER);
  renderAuth();
}
function login(nome, metodo) {
  if(!nome || !nome.trim()) { toast('Por favor insere o teu nome.', 'error'); return; }
  salvarUser({ id:'u_'+Date.now(), nome: nome.trim(), metodo: metodo||'manual' });
  fecharLoginModal();
  toast('Bem-vindo(a), ' + user.nome + '! 👋', 'success');
  renderProdutos();
}
function logout() {
  if(!confirm('Desejas sair da tua conta?')) return;
  salvarUser(null); renderProdutos();
  toast('Sessão terminada.');
}
function renderAuth() {
  const z = document.getElementById('authZone'); if(!z) return;
  if(user) {
    z.innerHTML = `<div class="user-chip"><i class="fas fa-user-circle"></i><span>${esc(user.nome)}</span><button class="btn-logout" onclick="logout()"><i class="fas fa-sign-out-alt"></i></button></div>`;
  } else {
    z.innerHTML = `<button class="btn-auth" onclick="abrirLoginModal()"><i class="fas fa-user-plus"></i> Entrar</button>`;
  }
}

// ===== MODAIS LOGIN =====
function abrirLoginModal() {
  const m = document.getElementById('loginModal'); if(!m) return;
  m.style.display='flex'; setTimeout(()=>document.getElementById('loginName')?.focus(),100);
}
function fecharLoginModal() {
  const m = document.getElementById('loginModal'); if(m) m.style.display='none';
}

// ===== PRODUTOS =====
function carregarProdutos() {
  try {
    const s = localStorage.getItem(KEY_PRODUTOS);
    if(s) { produtos = JSON.parse(s); }
  } catch(e) {}
  if(!produtos || produtos.length === 0) {
    produtos = JSON.parse(JSON.stringify(PRODUTOS_DEFAULT));
    salvarProdutos();
  }
  atualizarStatCount();
}
function salvarProdutos() {
  try { localStorage.setItem(KEY_PRODUTOS, JSON.stringify(produtos)); } catch(e) {}
}
function atualizarStatCount() {
  const el = document.getElementById('statCount');
  if(el) el.textContent = produtos.length;
}

function renderProdutos() {
  let lista = [...produtos];
  if(catAtiva !== 'todos') lista = lista.filter(p => p.categoria === catAtiva);
  if(termoBusca) {
    const t = termoBusca.toLowerCase();
    lista = lista.filter(p => p.nome.toLowerCase().includes(t) || p.descricao.toLowerCase().includes(t));
  }
  if(sortAtivo === 'menor') lista.sort((a,b) => a.preco - b.preco);
  else if(sortAtivo === 'maior') lista.sort((a,b) => b.preco - a.preco);

  const grid = document.getElementById('productGrid');
  const empty = document.getElementById('emptyState');
  if(!grid) return;

  if(lista.length === 0) {
    grid.innerHTML = ''; empty.style.display = 'block'; return;
  }
  empty.style.display = 'none';

  grid.innerHTML = lista.map(p => {
    const isOwner = user && p.criadorId === user.id;
    const avs = JSON.parse(localStorage.getItem('av_'+p.id) || '[]');
    const avgStar = avs.length ? (avs.reduce((s,a)=>s+a.estrelas,0)/avs.length).toFixed(1) : null;
    return `
    <div class="product-card" data-id="${p.id}">
      <div class="product-img-wrap">
        <img src="${esc(p.imagem)}" alt="${esc(p.nome)}"
          onerror="this.src='https://images.unsplash.com/photo-1588421357574-87938a86fa28?w=400&q=60'">
        <div class="product-cat-tag">${esc(p.categoria||'Outros')}</div>
      </div>
      <div class="product-info">
        <h4>${esc(p.nome)}</h4>
        <div class="product-price">${fmt(p.preco)}</div>
        <div class="product-desc">${esc(p.descricao.substring(0,80))}${p.descricao.length>80?'...':''}</div>
        <div class="product-footer">
          <div class="product-seller"><i class="fas fa-user"></i>${esc(p.criadorNome)}${avgStar?` · ⭐${avgStar}`:''}</div>
          <button class="delete-btn" data-id="${p.id}" ${!isOwner?'disabled':''}>
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      </div>
    </div>`;
  }).join('');

  grid.querySelectorAll('.delete-btn:not([disabled])').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      if(confirm('Remover este anúncio?')) {
        produtos = produtos.filter(p => p.id != btn.dataset.id);
        salvarProdutos(); renderProdutos(); atualizarStatCount();
        toast('Anúncio removido.', 'error');
      }
    });
  });
  grid.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', e => {
      if(e.target.closest('.delete-btn')) return;
      abrirModalProduto(parseInt(card.dataset.id));
    });
  });
}

// ===== MODAL PRODUTO =====
function abrirModalProduto(id) {
  const p = produtos.find(x => x.id == id); if(!p) return;
  produtoAtual = p; qty=1; corSel=''; tamSel=''; estrelas=0;

  document.getElementById('mImg').src = p.imagem;
  document.getElementById('mImg').onerror = function(){ this.src='https://images.unsplash.com/photo-1588421357574-87938a86fa28?w=400&q=60'; };
  document.getElementById('mNome').textContent = p.nome;
  document.getElementById('mPreco').textContent = fmt(p.preco);
  document.getElementById('mVendedor').innerHTML = `<i class="fas fa-user"></i> ${esc(p.criadorNome)}`;
  document.getElementById('mDesc').textContent = p.descricao;
  document.getElementById('mCat').textContent = p.categoria || 'Outros';
  document.getElementById('qtyVal').textContent = 1;

  // Cores
  const coresSec = document.getElementById('mCoresSection');
  if(p.cores && p.cores.length) {
    coresSec.style.display='block';
    document.getElementById('mCores').innerHTML = p.cores.map(c =>
      `<button class="opt-btn" onclick="selecionarCor('${esc(c)}',this)">${esc(c)}</button>`
    ).join('');
    document.getElementById('mCorLabel').textContent = '';
  } else { coresSec.style.display='none'; }

  // Tamanhos
  const tamSec = document.getElementById('mTamSection');
  if(p.tamanhos && p.tamanhos.length) {
    tamSec.style.display='block';
    document.getElementById('mTams').innerHTML = p.tamanhos.map(t =>
      `<button class="opt-btn" onclick="selecionarTam('${esc(t)}',this)">${esc(t)}</button>`
    ).join('');
  } else { tamSec.style.display='none'; }

  // Estrelas
  renderEstrelas();

  // Avaliações
  const avs = JSON.parse(localStorage.getItem('av_'+p.id)||'[]');
  const avSec = document.getElementById('mAvSection');
  if(avs.length) {
    avSec.style.display='block';
    document.getElementById('mAvList').innerHTML = avs.map(a => `
      <div class="av-item">
        <strong>${esc(a.nome)}</strong>
        <div class="av-stars">${'★'.repeat(a.estrelas)}${'☆'.repeat(5-a.estrelas)}</div>
        ${a.nota?`<p>${esc(a.nota)}</p>`:''}
      </div>`).join('');
  } else { avSec.style.display='none'; }

  atualizarResumo();
  document.getElementById('prodModal').style.display='flex';
  document.body.style.overflow='hidden';
}
function fecharModalProduto() {
  document.getElementById('prodModal').style.display='none';
  document.body.style.overflow='';
  produtoAtual=null;
}
function selecionarCor(cor, btn) {
  corSel=cor;
  document.querySelectorAll('#mCores .opt-btn').forEach(b=>b.classList.remove('selected'));
  btn.classList.add('selected');
  document.getElementById('mCorLabel').textContent='Selecionada: '+cor;
  atualizarResumo();
}
function selecionarTam(tam, btn) {
  tamSel=tam;
  document.querySelectorAll('#mTams .opt-btn').forEach(b=>b.classList.remove('selected'));
  btn.classList.add('selected');
  atualizarResumo();
}
function renderEstrelas() {
  const row = document.getElementById('mStars'); if(!row) return;
  row.innerHTML = [1,2,3,4,5].map(n =>
    `<span class="star-icon ${n<=estrelas?'active':''}" onclick="selecionarEstrela(${n})">★</span>`
  ).join('');
  document.getElementById('mStarLabel').textContent = estrelas>0?`${estrelas} estrela(s)`:'Clica para avaliar';
}
function selecionarEstrela(n) { estrelas=n; renderEstrelas(); }
function atualizarResumo() {
  if(!produtoAtual) return;
  const total = produtoAtual.preco * qty;
  let txt = `Produto: <strong>${esc(produtoAtual.nome)}</strong><br>`;
  if(corSel) txt += `Cor: <strong>${esc(corSel)}</strong><br>`;
  if(tamSel) txt += `Tamanho: <strong>${esc(tamSel)}</strong><br>`;
  txt += `Quantidade: <strong>${qty}</strong>`;
  document.getElementById('mSummaryTxt').innerHTML = txt;
  document.getElementById('mTotal').textContent = fmt(total);
}
function confirmarInteresse() {
  if(!produtoAtual) return;
  if(!user) { fecharModalProduto(); abrirLoginModal(); return; }
  if(estrelas>0) {
    const key='av_'+produtoAtual.id;
    const avs=JSON.parse(localStorage.getItem(key)||'[]');
    avs.push({ nome:user.nome, estrelas, nota: document.getElementById('mNota')?.value||'' });
    localStorage.setItem(key, JSON.stringify(avs));
  }
  const num = produtoAtual.whatsapp || WHATSAPP_DEFAULT;
  let msg = `Olá! Tenho interesse no produto: *${produtoAtual.nome}*\n`;
  msg += `Preço: *${fmt(produtoAtual.preco)}*\n`;
  if(corSel) msg+=`Cor: *${corSel}*\n`;
  if(tamSel) msg+=`Tamanho: *${tamSel}*\n`;
  msg+=`Quantidade: *${qty}*\nTotal: *${fmt(produtoAtual.preco*qty)}*\nMeu nome: *${user.nome}*`;
  window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank');
}

// ===== CARRINHO =====
function adicionarAoCarrinho() {
  if(!produtoAtual) return;
  if(!user) { fecharModalProduto(); abrirLoginModal(); return; }
  const item = carrinho.find(i => i.id==produtoAtual.id && i.cor==corSel && i.tam==tamSel);
  if(item) { item.qty+=qty; }
  else { carrinho.push({ id:produtoAtual.id, nome:produtoAtual.nome, preco:produtoAtual.preco, imagem:produtoAtual.imagem, cor:corSel, tam:tamSel, qty }); }
  atualizarCartCount();
  toast(`${produtoAtual.nome} adicionado ao carrinho! 🛍️`, 'success');
}
function atualizarCartCount() {
  const total = carrinho.reduce((s,i)=>s+i.qty,0);
  const badge = document.getElementById('cartCount');
  if(badge) { badge.textContent=total; badge.style.display=total>0?'flex':'none'; }
}
function abrirCarrinho() {
  document.getElementById('cartDrawer').classList.add('open');
  document.getElementById('cartOverlay').style.display='block';
  document.body.style.overflow='hidden';
  renderCarrinho();
}
function fecharCarrinho() {
  document.getElementById('cartDrawer').classList.remove('open');
  document.getElementById('cartOverlay').style.display='none';
  document.body.style.overflow='';
}
function renderCarrinho() {
  const items = document.getElementById('cartItems');
  const foot = document.getElementById('cartFoot');
  if(!carrinho.length) {
    items.innerHTML='<div class="cart-empty"><span>🛍️</span><p>O carrinho está vazio</p></div>';
    foot.style.display='none'; return;
  }
  items.innerHTML = carrinho.map((item,i) => `
    <div class="cart-item">
      <img class="cart-item-img" src="${esc(item.imagem)}" onerror="this.src='https://images.unsplash.com/photo-1588421357574-87938a86fa28?w=100&q=60'" alt="">
      <div class="cart-item-info">
        <h5>${esc(item.nome)}</h5>
        <span>${fmt(item.preco)}</span>
        <div class="cart-item-qty">Qty: ${item.qty}${item.cor?' · '+item.cor:''}${item.tam?' · '+item.tam:''}</div>
      </div>
      <button class="cart-item-remove" onclick="removerDoCarrinho(${i})"><i class="fas fa-times"></i></button>
    </div>`).join('');
  const total = carrinho.reduce((s,i)=>s+i.preco*i.qty,0);
  document.getElementById('cartTotal').textContent = fmt(total);
  foot.style.display='flex';
}
function removerDoCarrinho(i) {
  carrinho.splice(i,1); atualizarCartCount(); renderCarrinho();
}
function checkoutCarrinho() {
  if(!user) { fecharCarrinho(); abrirLoginModal(); return; }
  if(!carrinho.length) return;
  let msg = `Olá! Gostaria de encomendar:\n\n`;
  carrinho.forEach(i => { msg+=`• *${i.nome}* x${i.qty} = *${fmt(i.preco*i.qty)}*${i.cor?' ('+i.cor+')':''}${i.tam?' ('+i.tam+')':''}\n`; });
  const total = carrinho.reduce((s,i)=>s+i.preco*i.qty,0);
  msg+=`\n*Total: ${fmt(total)}*\nMeu nome: *${user.nome}*`;
  window.open(`https://wa.me/${WHATSAPP_DEFAULT}?text=${encodeURIComponent(msg)}`, '_blank');
}

// ===== FORMULÁRIO VENDA =====
function configurarVenda() {
  const form = document.getElementById('sellForm'); if(!form) return;

  // Preview em tempo real
  ['prodName','prodPrice','prodDesc','prodImage'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', atualizarPreview);
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    if(!user) { toast('Precisas de estar logado para anunciar.', 'error'); abrirLoginModal(); return; }
    const nome = document.getElementById('prodName').value.trim();
    const preco = parseFloat(document.getElementById('prodPrice').value);
    const desc = document.getElementById('prodDesc').value.trim();
    const img = document.getElementById('prodImage').value.trim();
    const wa = document.getElementById('prodWhatsapp').value.trim();
    const cat = document.querySelector('input[name="cat"]:checked')?.value || 'Outros';
    if(!nome) { toast('Insere o nome do produto.','error'); return; }
    if(!preco || preco<=0) { toast('Insere um preço válido.','error'); return; }
    produtos.push({
      id: Date.now(), nome, preco, categoria:cat,
      descricao: desc||'Sem descrição',
      imagem: img || 'https://images.unsplash.com/photo-1588421357574-87938a86fa28?w=600&q=80',
      whatsapp: wa||WHATSAPP_DEFAULT,
      criadorId: user.id, criadorNome: user.nome
    });
    salvarProdutos(); atualizarStatCount();
    toast('Anúncio publicado com sucesso! 🎉','success');
    form.reset();
    setTimeout(()=>switchSection('comprar'),1000);
  });
}
function atualizarPreview() {
  const nome = document.getElementById('prodName')?.value||'Nome do produto';
  const preco = parseFloat(document.getElementById('prodPrice')?.value)||0;
  const desc = document.getElementById('prodDesc')?.value||'Descrição aparece aqui...';
  const img = document.getElementById('prodImage')?.value;
  document.getElementById('previewNome').textContent = nome;
  document.getElementById('previewPreco').textContent = fmt(preco);
  document.getElementById('previewDesc').textContent = desc.substring(0,80);
  const pImg = document.getElementById('previewImg');
  if(img && img.startsWith('http')) {
    pImg.innerHTML = `<img src="${esc(img)}" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.textContent='📷'">`;
  } else { pImg.textContent='📷'; }
}

// ===== IA — DESCRIÇÃO =====
async function gerarDescricaoIA() {
  const nome = document.getElementById('prodName')?.value?.trim();
  const preco = document.getElementById('prodPrice')?.value;
  const cat = document.querySelector('input[name="cat"]:checked')?.value||'produto';
  if(!nome) { toast('Escreve primeiro o nome do produto.','error'); return; }

  const btn = document.getElementById('aiDescBtn');
  const load = document.getElementById('aiLoading');
  btn.disabled=true; load.style.display='flex';
  adicionarMsgIA('Gerar descrição para: "'+nome+'" ('+cat+')', 'user');

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        model:'claude-sonnet-4-20250514',
        max_tokens:1000,
        system:`És um especialista em marketing para marketplace angolano. 
Escreve descrições de produtos em português europeu, concisas (2-3 frases), 
profissionais e atrativas. Menciona qualidade, estado e valor. Sem emojis excessivos.
Responde APENAS com a descrição, sem introduções ou explicações.`,
        messages:[{ role:'user', content:`Nome do produto: ${nome}\nCategoria: ${cat}\nPreço: ${preco?preco+' Kz':''}\n\nEscreve uma descrição apelativa.` }]
      })
    });
    const data = await resp.json();
    const texto = data.content?.[0]?.text||'';
    if(texto) {
      document.getElementById('prodDesc').value = texto;
      atualizarPreview();
      adicionarMsgIA('✅ Descrição gerada! Podes editar à vontade.','bot');
      toast('Descrição gerada pela IA! ✨','success');
    }
  } catch(err) {
    adicionarMsgIA('Erro ao contactar a IA. Tenta novamente.','bot');
    toast('Erro ao gerar descrição.','error');
  } finally { btn.disabled=false; load.style.display='none'; }
}

// ===== IA — CHAT =====
async function enviarMsgIA() {
  const input = document.getElementById('aiChatInput');
  const msg = input?.value?.trim(); if(!msg) return;
  input.value=''; adicionarMsgIA(msg,'user');

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        model:'claude-sonnet-4-20250514',
        max_tokens:1000,
        system:`És o assistente do marketplace Brother's Business Angola. 
Ajudas vendedores a criar anúncios melhores, dar dicas de preço, 
estratégias de venda e responder dúvidas. Respostas em português europeu, 
curtas e práticas. Máximo 3 frases por resposta.`,
        messages:[{ role:'user', content:msg }]
      })
    });
    const data = await resp.json();
    const texto = data.content?.[0]?.text||'Não consegui responder. Tenta novamente.';
    adicionarMsgIA(texto,'bot');
  } catch(e) {
    adicionarMsgIA('Erro de ligação. Tenta novamente.','bot');
  }
}
function adicionarMsgIA(texto, tipo) {
  const box = document.getElementById('aiChatMsgs'); if(!box) return;
  const div = document.createElement('div');
  div.className='ai-msg '+tipo; div.innerHTML=esc(texto);
  box.appendChild(div); box.scrollTop=box.scrollHeight;
}

// ===== WHATSAPP GERAL =====
function configurarWA() {
  document.getElementById('waSendBtn')?.addEventListener('click', () => {
    const nome = document.getElementById('waName')?.value?.trim();
    const msg = document.getElementById('waMsg')?.value?.trim();
    if(!nome||!msg) { toast('Preenche o nome e a mensagem.','error'); return; }
    const texto = `Olá! Meu nome é *${nome}*.\n\n${msg}`;
    window.open(`https://wa.me/${WHATSAPP_DEFAULT}?text=${encodeURIComponent(texto)}`, '_blank');
  });
}

// ===== NAVEGAÇÃO =====
function switchSection(sec) {
  ['comprar','vender','contato'].forEach(s => {
    document.getElementById(s+'Section')?.classList.remove('active');
    document.querySelector(`[data-section="${s}"]`)?.classList.remove('active');
  });
  document.getElementById(sec+'Section')?.classList.add('active');
  document.querySelector(`[data-section="${sec}"]`)?.classList.add('active');
  if(sec==='comprar') renderProdutos();
  window.scrollTo({ top: document.querySelector('.main-wrap')?.offsetTop||0, behavior:'smooth' });
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  registarVisita();
  carregarUser();
  carregarProdutos();
  renderProdutos();
  configurarVenda();
  configurarWA();

  // Nav links
  document.querySelectorAll('.nav-link[data-section]').forEach(a => {
    a.addEventListener('click', e => { e.preventDefault(); switchSection(a.dataset.section); });
  });

  // Busca
  document.getElementById('searchInput')?.addEventListener('input', e => {
    termoBusca=e.target.value; renderProdutos();
  });

  // Categorias
  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cat-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active'); catAtiva=btn.dataset.cat; renderProdutos();
    });
  });

  // Sort
  document.getElementById('sortSelect')?.addEventListener('change', e => {
    sortAtivo=e.target.value; renderProdutos();
  });

  // Modal produto
  document.getElementById('prodModalClose')?.addEventListener('click', fecharModalProduto);
  document.getElementById('prodModal')?.addEventListener('click', e => {
    if(e.target===document.getElementById('prodModal')) fecharModalProduto();
  });
  document.getElementById('qtyMinus')?.addEventListener('click', () => {
    if(qty>1){ qty--; document.getElementById('qtyVal').textContent=qty; atualizarResumo(); }
  });
  document.getElementById('qtyPlus')?.addEventListener('click', () => {
    qty++; document.getElementById('qtyVal').textContent=qty; atualizarResumo();
  });
  document.getElementById('mConfirmar')?.addEventListener('click', confirmarInteresse);
  document.getElementById('mAddCart')?.addEventListener('click', adicionarAoCarrinho);

  // Modal login
  document.getElementById('loginClose')?.addEventListener('click', fecharLoginModal);
  document.getElementById('loginModal')?.addEventListener('click', e => {
    if(e.target===document.getElementById('loginModal')) fecharLoginModal();
  });
  document.getElementById('loginEnterBtn')?.addEventListener('click', () => {
    login(document.getElementById('loginName').value, 'manual');
  });
  document.getElementById('loginName')?.addEventListener('keydown', e => {
    if(e.key==='Enter') login(e.target.value,'manual');
  });
  document.getElementById('loginGoogle')?.addEventListener('click', () => {
    login(document.getElementById('loginName').value||'Utilizador Google','google');
  });
  document.getElementById('loginFb')?.addEventListener('click', () => {
    login(document.getElementById('loginName').value||'Utilizador Facebook','facebook');
  });

  // Carrinho
  document.getElementById('cartBtn')?.addEventListener('click', abrirCarrinho);
  document.getElementById('cartClose')?.addEventListener('click', fecharCarrinho);
  document.getElementById('cartOverlay')?.addEventListener('click', fecharCarrinho);
  document.getElementById('cartCheckout')?.addEventListener('click', checkoutCarrinho);

  // IA
  document.getElementById('aiDescBtn')?.addEventListener('click', gerarDescricaoIA);
  document.getElementById('aiChatSend')?.addEventListener('click', enviarMsgIA);
  document.getElementById('aiChatInput')?.addEventListener('keydown', e => {
    if(e.key==='Enter') enviarMsgIA();
  });
});

// ===== MENU LATERAL =====
function abrirMenu() {
  document.getElementById('sideMenu').classList.add('open');
  document.getElementById('menuOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function fecharMenu() {
  document.getElementById('sideMenu').classList.remove('open');
  document.getElementById('menuOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

// ===== PAINÉIS INFORMATIVOS =====
const CONTEUDO_PAINEIS = {
  sobre: {
    titulo: 'ℹ️ Sobre Nós',
    html: `
      <div class="panel-section">
        <div style="display:flex;gap:14px;align-items:center;margin-bottom:4px">
          <img src="logo-bb.png" style="width:56px;height:56px;border-radius:14px;object-fit:cover">
          <div>
            <h4 style="margin:0">Brother's Business</h4>
            <span class="panel-tag"><i class="fas fa-map-marker-alt"></i> Angola</span>
          </div>
        </div>
        <p>O <strong>Brother's Business</strong> é um marketplace angolano criado para facilitar a compra e venda de produtos de forma simples, rápida e segura — directamente via WhatsApp.</p>
        <p>A nossa missão é conectar compradores e vendedores angolanos numa plataforma moderna, sem complicações e 100% gratuita.</p>
      </div>
      <div class="panel-section">
        <h4><i class="fas fa-star" style="color:var(--gold)"></i> Os nossos valores</h4>
        <p>✅ Transparência nas negociações<br>✅ Segurança para compradores e vendedores<br>✅ Apoio à economia local angolana<br>✅ Plataforma gratuita e acessível a todos</p>
      </div>
      <div class="panel-section">
        <h4><i class="fas fa-phone" style="color:var(--gold)"></i> Contacta-nos</h4>
        <p>WhatsApp: <strong>+244 954 929 881</strong><br>Disponível 24/7 para responder às tuas dúvidas.</p>
      </div>`
  },
  atualizacoes: {
    titulo: '🔔 Actualizações',
    html: null // gerado dinamicamente
  },
  apoio: {
    titulo: '🎧 Apoio ao Consumidor',
    html: `
      <div class="panel-section">
        <p>Estamos aqui para te ajudar! Escolhe a melhor forma de nos contactar:</p>
      </div>
      <a class="apoio-option" href="https://wa.me/244954929881?text=Olá! Preciso de ajuda com o Brother's Business." target="_blank">
        <i class="fab fa-whatsapp" style="color:#25D366"></i>
        <div><strong>WhatsApp</strong><span>Resposta rápida • +244 954 929 881</span></div>
      </a>
      <div class="apoio-option" onclick="switchSection('contato');fecharPainel()">
        <i class="fas fa-envelope"></i>
        <div><strong>Formulário de contacto</strong><span>Envia uma mensagem detalhada</span></div>
      </div>
      <div class="panel-section" style="margin-top:8px">
        <h4>Horário de apoio</h4>
        <p>🕐 Segunda a Domingo: 08h00 – 22h00<br>⚡ Resposta média: menos de 1 hora</p>
      </div>
      <div class="panel-section">
        <h4>Como funciona a plataforma?</h4>
        <p>Não fazemos intermediação de pagamentos. Toda a negociação é feita directamente entre comprador e vendedor via WhatsApp. O Brother's Business é apenas o ponto de encontro.</p>
      </div>`
  },
  politica: {
    titulo: '🔒 Política de Privacidade',
    html: `
      <div class="panel-section">
        <span class="panel-tag">Última actualização: Maio 2025</span>
        <h4>Dados que recolhemos</h4>
        <p>O Brother's Business apenas guarda os dados que introduzes voluntariamente: nome de utilizador e anúncios publicados. Estes dados ficam armazenados localmente no teu dispositivo (localStorage) e não são enviados para servidores externos.</p>
      </div>
      <div class="panel-section">
        <h4>WhatsApp</h4>
        <p>Ao clicar em "Confirmar via WhatsApp", és redirrecionado para a aplicação WhatsApp. Não armazenamos o conteúdo dessas conversas.</p>
      </div>
      <div class="panel-section">
        <h4>Cookies e rastreamento</h4>
        <p>Não utilizamos cookies de rastreamento nem partilhamos dados com terceiros para fins publicitários.</p>
      </div>
      <div class="panel-section">
        <h4>Os teus direitos</h4>
        <p>Podes apagar todos os teus dados a qualquer momento limpando os dados do browser. Os anúncios publicados podem ser eliminados directamente na plataforma.</p>
      </div>`
  },
  faq: {
    titulo: '❓ Perguntas Frequentes',
    html: `
      <div class="panel-section">
        <p>Respostas às perguntas mais comuns sobre o Brother's Business.</p>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px">
        ${[
          ['Como publico um anúncio?', 'Clica em "Vender / Anunciar" no menu, preenche os dados do produto — nome, preço, categoria e descrição — e clica em "Publicar anúncio". É gratuito e instantâneo!'],
          ['Como funciona a compra?', 'Não há carrinho de pagamento online. Ao clicar num produto e confirmar interesse, és redirrecionado para o WhatsApp do vendedor para negociar directamente.'],
          ['Os meus anúncios ficam guardados?', 'Sim, os anúncios ficam guardados no teu dispositivo. Se limpares os dados do browser, perdes os anúncios publicados.'],
          ['Posso anunciar qualquer produto?', 'Podes anunciar produtos legais e em bom estado. Produtos ilegais, falsificados ou perigosos são proibidos.'],
          ['O site cobra alguma comissão?', 'Não! O Brother\'s Business é 100% gratuito. Não cobramos nenhuma comissão sobre as vendas.'],
          ['Como posso apagar o meu anúncio?', 'Na lista de produtos, aparece um botão de lixo (🗑️) nos teus anúncios. Clica para remover.']
        ].map(([q,a]) => `
          <div class="faq-item">
            <div class="faq-q" onclick="toggleFaq(this)"><span>${q}</span><i class="fas fa-chevron-down"></i></div>
            <div class="faq-a"><p>${a}</p></div>
          </div>`).join('')}
      </div>`
  },
  admin: {
    titulo: '⚙️ Painel de Administração',
    html: null // gerado dinamicamente
  }
};

function abrirPainel(chave) {
  const painel = CONTEUDO_PAINEIS[chave];
  if(!painel) return;
  document.getElementById('infoPanelTitle').textContent = painel.titulo;

  let html = painel.html;
  if(chave === 'atualizacoes') html = gerarHtmlAtualizacoes(false);
  if(chave === 'admin') html = gerarHtmlAdmin();

  document.getElementById('infoPanelBody').innerHTML = html;
  document.getElementById('infoPanel').classList.add('open');
  document.getElementById('infoOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function fecharPainel() {
  document.getElementById('infoPanel').classList.remove('open');
  document.getElementById('infoOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

// ===== ACTUALIZAÇÕES =====
function getAtualizacoes() {
  try { return JSON.parse(localStorage.getItem('bb_updates')||'[]'); } catch(e){ return []; }
}
function salvarAtualizacoes(arr) {
  localStorage.setItem('bb_updates', JSON.stringify(arr));
}
function gerarHtmlAtualizacoes(adminMode) {
  const avs = getAtualizacoes();
  const defaultUpdates = [
    { id:'d1', titulo:'🚀 Lançamento do Brother\'s Business 2.0', data:'31 Mai 2025', texto:'Nova versão do marketplace com design premium, IA integrada para descrições automáticas, carrinho de compras e muito mais!', nova:true },
    { id:'d2', titulo:'🤖 IA integrada', data:'31 Mai 2025', texto:'Agora podes gerar descrições profissionais para os teus produtos automaticamente usando inteligência artificial.', nova:true }
  ];
  const todos = [...avs, ...defaultUpdates];
  if(!todos.length) return '<p style="color:var(--text2);text-align:center;padding:40px">Nenhuma actualização ainda.</p>';
  return `<div style="display:flex;flex-direction:column;gap:12px">${todos.map(u=>`
    <div class="update-item">
      <div class="update-item-header">
        <h5>${esc(u.titulo)}</h5>
        ${u.nova?'<span class="update-new">Novo</span>':''}
      </div>
      <div class="update-date"><i class="fas fa-calendar-alt" style="color:var(--gold);margin-right:5px"></i>${esc(u.data)}</div>
      <p style="margin-top:8px">${esc(u.texto)}</p>
      ${adminMode&&!u.id?.startsWith('d')?`<button class="admin-del-btn" onclick="eliminarUpdate('${u.id}')"><i class="fas fa-trash-alt"></i> Eliminar</button>`:''}
    </div>`).join('')}</div>`;
}

function gerarHtmlAdmin() {
  const ADMIN_PASS = 'brothers2025';
  const loggedIn = sessionStorage.getItem('bb_admin') === '1';
  if(!loggedIn) return `
    <div class="admin-locked">
      <i class="fas fa-lock"></i>
      <h4>Área Restrita</h4>
      <p>Esta área é exclusiva para o administrador do Brother's Business.</p>
      <div class="form-group" style="text-align:left">
        <label>Palavra-passe de administrador</label>
        <input type="password" id="adminPassInput" class="update-title-input" placeholder="••••••••••">
      </div>
      <button class="btn-publish" style="margin-top:12px;width:100%" onclick="tentarLoginAdmin()">
        <i class="fas fa-unlock"></i> Entrar como Admin
      </button>
    </div>`;
  return `
    <div class="admin-form">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span class="panel-tag"><i class="fas fa-check-circle"></i> Admin autenticado</span>
        <button onclick="sessionStorage.removeItem('bb_admin');abrirPainel('admin')" style="background:none;border:none;color:#e05252;cursor:pointer;font-size:0.8rem"><i class="fas fa-sign-out-alt"></i> Sair</button>
      </div>

      <h4><i class="fas fa-chart-line" style="color:var(--gold)"></i> Estatísticas de visitas</h4>
      ${gerarHtmlVisitas()}

      <hr style="border-color:var(--border);margin:4px 0">
      <h4>📝 Publicar nova actualização</h4>
      <div>
        <label>Título da actualização</label>
        <input type="text" id="updateTitle" class="update-title-input" placeholder="Ex: Nova funcionalidade adicionada">
      </div>
      <div>
        <label>Descrição</label>
        <textarea id="updateBody" class="update-body-input" placeholder="Descreve a actualização em detalhe..."></textarea>
      </div>
      <button class="btn-publish" onclick="publicarUpdate()">
        <i class="fas fa-paper-plane"></i> Publicar actualização
      </button>
      <hr style="border-color:var(--border);margin:8px 0">
      <h4>📋 Actualizações publicadas</h4>
      <div id="adminUpdatesList" class="admin-updates-list">${gerarHtmlAtualizacoes(true)}</div>
    </div>`;
}

function tentarLoginAdmin() {
  const val = document.getElementById('adminPassInput')?.value;
  if(val === 'brothers2025') {
    sessionStorage.setItem('bb_admin','1');
    abrirPainel('admin');
  } else {
    toast('Palavra-passe incorrecta.','error');
  }
}
function publicarUpdate() {
  const titulo = document.getElementById('updateTitle')?.value?.trim();
  const texto = document.getElementById('updateBody')?.value?.trim();
  if(!titulo||!texto) { toast('Preenche o título e a descrição.','error'); return; }
  const avs = getAtualizacoes();
  const data = new Date().toLocaleDateString('pt-PT',{day:'numeric',month:'long',year:'numeric'});
  avs.unshift({ id:'u_'+Date.now(), titulo, texto, data, nova:true });
  salvarAtualizacoes(avs);
  document.getElementById('adminUpdatesList').innerHTML = gerarHtmlAtualizacoes(true);
  document.getElementById('updateTitle').value='';
  document.getElementById('updateBody').value='';
  toast('Actualização publicada! 🎉','success');
}
function eliminarUpdate(id) {
  if(!confirm('Eliminar esta actualização?')) return;
  const avs = getAtualizacoes().filter(u=>u.id!==id);
  salvarAtualizacoes(avs);
  document.getElementById('adminUpdatesList').innerHTML = gerarHtmlAtualizacoes(true);
  toast('Eliminada.','error');
}

// ===== FAQ TOGGLE =====
function toggleFaq(el) {
  const a = el.nextElementSibling;
  const isOpen = a.classList.contains('open');
  document.querySelectorAll('.faq-q').forEach(q=>{ q.classList.remove('open'); q.nextElementSibling.classList.remove('open'); });
  if(!isOpen) { el.classList.add('open'); a.classList.add('open'); }
}

// ===== SISTEMA DE VISITAS =====
function registarVisita() {
  const agora = new Date();
  const hoje = agora.toISOString().slice(0, 10); // "2025-05-31"
  const semana = getSemanaKey(agora);
  const mes = agora.toISOString().slice(0, 7);   // "2025-05"

  let stats;
  try { stats = JSON.parse(localStorage.getItem('bb_visitas') || '{}'); } catch(e) { stats = {}; }

  // Evitar contar a mesma sessão mais de uma vez
  const sessaoKey = 'bb_sess_' + hoje;
  if(sessionStorage.getItem(sessaoKey)) return; // já contou nesta sessão
  sessionStorage.setItem(sessaoKey, '1');

  stats.hoje = stats.hoje || {};
  stats.semana = stats.semana || {};
  stats.mes = stats.mes || {};
  stats.total = stats.total || 0;
  stats.historico = stats.historico || [];

  stats.hoje[hoje] = (stats.hoje[hoje] || 0) + 1;
  stats.semana[semana] = (stats.semana[semana] || 0) + 1;
  stats.mes[mes] = (stats.mes[mes] || 0) + 1;
  stats.total += 1;

  // Guardar timestamp da visita (últimas 200)
  stats.historico.push({ ts: agora.toISOString(), dia: hoje });
  if(stats.historico.length > 200) stats.historico = stats.historico.slice(-200);

  localStorage.setItem('bb_visitas', JSON.stringify(stats));
}

function getSemanaKey(data) {
  const d = new Date(data);
  d.setHours(0,0,0,0);
  d.setDate(d.getDate() - d.getDay()); // início da semana (domingo)
  return d.toISOString().slice(0, 10);
}

function getEstatisticasVisitas() {
  let stats;
  try { stats = JSON.parse(localStorage.getItem('bb_visitas') || '{}'); } catch(e) { stats = {}; }

  const agora = new Date();
  const hoje = agora.toISOString().slice(0, 10);
  const semana = getSemanaKey(agora);
  const mes = agora.toISOString().slice(0, 7);

  return {
    hoje: (stats.hoje && stats.hoje[hoje]) || 0,
    semana: (stats.semana && stats.semana[semana]) || 0,
    mes: (stats.mes && stats.mes[mes]) || 0,
    total: stats.total || 0,
    historico: stats.historico || []
  };
}

function gerarHtmlVisitas() {
  const v = getEstatisticasVisitas();
  const agora = new Date();
  const mesNome = agora.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });

  // Últimos 7 dias para o mini-gráfico
  const dias = [];
  for(let i = 6; i >= 0; i--) {
    const d = new Date(agora);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    let stats;
    try { stats = JSON.parse(localStorage.getItem('bb_visitas') || '{}'); } catch(e) { stats = {}; }
    const count = (stats.hoje && stats.hoje[key]) || 0;
    const label = d.toLocaleDateString('pt-PT', { weekday: 'short' });
    dias.push({ label, count, key });
  }
  const maxDia = Math.max(...dias.map(d => d.count), 1);

  return `
    <div style="display:flex;flex-direction:column;gap:16px">
      <!-- Cards de estatísticas -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div style="background:var(--bg3);border:1px solid var(--border);border-radius:14px;padding:16px;text-align:center">
          <div style="font-size:2rem;font-weight:800;color:var(--gold);font-family:'Plus Jakarta Sans',sans-serif">${v.hoje}</div>
          <div style="color:var(--text2);font-size:0.78rem;margin-top:4px"><i class="fas fa-sun" style="color:var(--gold)"></i> Hoje</div>
        </div>
        <div style="background:var(--bg3);border:1px solid var(--border);border-radius:14px;padding:16px;text-align:center">
          <div style="font-size:2rem;font-weight:800;color:var(--gold);font-family:'Plus Jakarta Sans',sans-serif">${v.semana}</div>
          <div style="color:var(--text2);font-size:0.78rem;margin-top:4px"><i class="fas fa-calendar-week" style="color:var(--gold)"></i> Esta semana</div>
        </div>
        <div style="background:var(--bg3);border:1px solid var(--border);border-radius:14px;padding:16px;text-align:center">
          <div style="font-size:2rem;font-weight:800;color:var(--gold);font-family:'Plus Jakarta Sans',sans-serif">${v.mes}</div>
          <div style="color:var(--text2);font-size:0.78rem;margin-top:4px"><i class="fas fa-calendar-alt" style="color:var(--gold)"></i> ${mesNome}</div>
        </div>
        <div style="background:var(--bg3);border:1px solid rgba(212,168,67,0.3);border-radius:14px;padding:16px;text-align:center">
          <div style="font-size:2rem;font-weight:800;color:var(--gold);font-family:'Plus Jakarta Sans',sans-serif">${v.total}</div>
          <div style="color:var(--text2);font-size:0.78rem;margin-top:4px"><i class="fas fa-users" style="color:var(--gold)"></i> Total geral</div>
        </div>
      </div>

      <!-- Mini-gráfico de barras dos últimos 7 dias -->
      <div style="background:var(--bg3);border:1px solid var(--border);border-radius:14px;padding:16px">
        <div style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--text3);margin-bottom:14px">
          <i class="fas fa-chart-bar" style="color:var(--gold)"></i> Últimos 7 dias
        </div>
        <div style="display:flex;align-items:flex-end;gap:6px;height:80px">
          ${dias.map(d => {
            const pct = Math.max((d.count / maxDia) * 100, d.count > 0 ? 8 : 3);
            const isHoje = d.key === agora.toISOString().slice(0,10);
            return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;height:100%;justify-content:flex-end">
              <div style="font-size:0.65rem;color:${d.count>0?'var(--gold)':'var(--text3)'}">${d.count||''}</div>
              <div style="width:100%;background:${isHoje?'var(--gold)':'rgba(212,168,67,0.3)'};border-radius:5px 5px 0 0;height:${pct}%;min-height:3px;transition:height 0.3s"></div>
              <div style="font-size:0.62rem;color:${isHoje?'var(--gold)':'var(--text3)'};font-weight:${isHoje?700:400}">${d.label}</div>
            </div>`;
          }).join('')}
        </div>
      </div>

      <!-- Info adicional -->
      <div style="background:rgba(212,168,67,0.06);border:1px solid rgba(212,168,67,0.15);border-radius:12px;padding:12px 14px;font-size:0.8rem;color:var(--text2)">
        <i class="fas fa-info-circle" style="color:var(--gold);margin-right:6px"></i>
        Cada visita única por sessão é contada. Os dados ficam guardados neste dispositivo.
      </div>

      <button class="admin-del-btn" style="align-self:flex-start" onclick="if(confirm('Apagar todas as estatísticas de visitas?')){localStorage.removeItem('bb_visitas');abrirPainel('admin');toast('Estatísticas apagadas.','error')}">
        <i class="fas fa-trash-alt"></i> Resetar estatísticas
      </button>
    </div>`;
}
