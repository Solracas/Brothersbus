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
