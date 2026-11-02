"use strict";
/* 彬少AI工作台 · 生财情报 —— 前端逻辑（无依赖） */
(function(){
  var D = window.BS_DATA || { meta:{}, essence:[], fxb:[] };

  var NAV = [
    { group:'主界面', items:[ {name:'今日驾驶舱', emoji:'🏠', soon:true} ] },
    { group:'情报', items:[ {name:'生财情报', emoji:'🔥', key:'shengcai', active:true} ] },
    { group:'经营', items:[ {name:'项目中心', emoji:'🚀', soon:true}, {name:'经营账本', emoji:'💰', soon:true} ] },
    { group:'创作', items:[ {name:'内容中心', emoji:'✍️', soon:true}, {name:'闲鱼工作台', emoji:'🛒', soon:true} ] },
    { group:'知识', items:[ {name:'知识库', emoji:'📚', soon:true} ] },
    { group:'系统', items:[ {name:'系统设置', emoji:'⚙️', soon:true} ] }
  ];

  var state = { tab:'essence', q:'', tag:'', sort:'heat', tagsOpen:false };

  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, function(c){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]; }); }
  function initial(name){ var a=String(name||'?').trim(); while(a && a.charAt(0)==='-'){ a=a.slice(1); } return a.charAt(0)||'?'; }
  function fmtNum(n){ n=Number(n||0); return n>=10000 ? (n/10000).toFixed(1)+'w' : String(n); }
  function todayStr(){ var d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }

  /* ---------- 侧栏 ---------- */
  function renderSidebar(){
    var h=[];
    h.push('<div class="brand"><div class="logo">彬</div><div><div class="bt">彬少AI工作台</div><div class="bs">个人经营 · 每日精读</div></div></div>');
    NAV.forEach(function(g){
      h.push('<div class="ngl">'+esc(g.group)+'</div>');
      g.items.forEach(function(it){
        if(it.soon){ h.push('<div class="navitem soon"><span style="font-size:15px">'+it.emoji+'</span><span>'+esc(it.name)+'</span><span class="soon-tag">规划中</span></div>'); }
        else{ h.push('<div class="navitem '+(it.active?'on':'')+'" data-nav><span style="font-size:15px">'+it.emoji+'</span><span>'+esc(it.name)+'</span></div>'); }
      });
    });
    var now=new Date();
    h.push('<div class="sfoot"><div class="sd"><b>'+now.getFullYear()+'年'+(now.getMonth()+1)+'月'+now.getDate()+'日</b> · '+['周日','周一','周二','周三','周四','周五','周六'][now.getDay()]+'</div>');
    h.push('<div class="ttoggle"><button data-theme="dark" class="'+(curTheme()==='dark'?'on':'')+'">🌙 <span>深色</span></button><button data-theme="light" class="'+(curTheme()==='light'?'on':'')+'">☀️ <span>浅色</span></button></div></div>');
    var sb=document.getElementById('sidebar'); sb.innerHTML=h.join('');
    sb.querySelectorAll('[data-theme]').forEach(function(b){ b.onclick=function(){ setTheme(b.dataset.theme); }; });
    sb.querySelectorAll('.navitem.soon').forEach(function(el){ el.onclick=function(){ toast('该模块规划中，当前先完成「生财情报」'); }; });
  }
  function curTheme(){ return document.documentElement.dataset.theme || 'dark'; }
  function setTheme(t){ document.documentElement.dataset.theme=t; try{ localStorage.setItem('bs-theme',t); }catch(e){} renderSidebar(); }

  /* ---------- 顶栏 ---------- */
  function renderTopbar(){
    var d=new Date();
    var t=curTheme();
    document.getElementById('topbar').innerHTML =
      '<div class="tb-title"><h1>🔥 生财情报</h1><p>近一个月 · 精华帖拆解 & 中标机会信号</p></div>'+
      '<div class="tb-sp"></div>'+
      '<button class="tb-theme" id="tb-theme" title="切换深浅色">'+(t==='dark'?'☀️ 浅色':'🌙 深色')+'</button>'+
      '<div class="tb-date">'+d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')+'</div>';
    var tb=document.getElementById('tb-theme');
    if(tb) tb.onclick=function(){ setTheme(curTheme()==='dark'?'light':'dark'); };
  }

  /* ---------- 看板 ---------- */
  function allTags(list){
    var m={}; list.forEach(function(x){ (x.tags||[]).forEach(function(t){ m[t]=(m[t]||0)+1; }); });
    return Object.keys(m).sort(function(a,b){ return m[b]-m[a]; });
  }
  function filtered(tab){
    var src = tab==='essence' ? D.essence : D.fxb;
    var q = state.q.trim().toLowerCase();
    var tag = state.tag;
    var out = src.filter(function(x){
      if(tag && (x.tags||[]).indexOf(tag)<0) return false;
      if(!q) return true;
      var hay = [x.title,x.author,(x.tags||[]).join(' '),x.summary,x.why,x.opp,x.limit,x.next].join(' ').toLowerCase();
      return hay.indexOf(q)>=0;
    });
    out.sort(function(a,b){
      if(state.sort==='time') return (b.date||'').localeCompare(a.date||'');
      return (b.read||0)-(a.read||0);
    });
    return out;
  }

  function renderBoard(){
    var m=D.meta||{};
    var h=[];
    h.push('<section class="board-hero reveal"><div class="bh-eyebrow">生财情报 · 每日精读</div>'+
      '<h1 class="bh-title">近一个月，<span class="grad">值得动手</span>的生财信号</h1>'+
      '<p class="bh-desc">从精华区与中标区里，剔除航海报名通知、会员日/抽奖等活动，挑出真正能拆解、能上手的机会。</p>'+
      '<div class="bh-stats">'+
        '<div class="bh-stat"><b>'+(m.essenceCount||D.essence.length)+'</b><span>精华帖拆解</span></div>'+
        '<div class="bh-stat"><b>'+(m.fxbCount||D.fxb.length)+'</b><span>中标机会信号</span></div>'+
        '<div class="bh-stat"><b>'+(m.scannedEssence||'-')+'/'+(m.scannedWinBid||'-')+'</b><span>精华/中标 扫描量</span></div>'+
        '<div class="bh-stat"><b style="font-size:14px;padding-top:4px">'+(m.window||'')+'</b><span>数据窗口</span></div>'+
      '</div></section>');

    // toolbar
    h.push('<div class="toolbar">'+
      '<div class="seg">'+
        '<button data-tab="essence" class="'+(state.tab==='essence'?'on':'')+'">📚 生财精华帖</button>'+
        '<button data-tab="fxb" class="'+(state.tab==='fxb'?'on':'')+'">🧭 生财风向标</button>'+
      '</div>'+
      '<div class="tsearch"><span>🔍</span><input id="search" placeholder="搜索标题 / 作者 / 标签 / 关键词…" value="'+esc(state.q)+'"><span class="kbd">/</span></div>'+
      '<select class="tsel" id="sort"><option value="heat"'+(state.sort==='heat'?' selected':'')+'>按热度</option><option value="time"'+(state.sort==='time'?' selected':'')+'>按时间</option></select>'+
      '<span class="tcount" id="tcount"></span>'+
    '</div>');

    // tag chips（可折叠）
    var tags = allTags(state.tab==='essence'?D.essence:D.fxb);
    var open = !!state.tag || state.tagsOpen;
    h.push('<div class="tagbox">');
    h.push('<button class="tagtoggle" id="tagtoggle">');
    h.push('<span>🏷️ 标签筛选'+(state.tag?'：<b>'+esc(state.tag)+'</b>':'')+'（'+tags.length+'）</span>');
    h.push('<span class="tg-arrow '+(open?'open':'')+'">▾</span></button>');
    h.push('<div class="tagrow '+(open?'':'hidden')+'" id="tagrow">');
    h.push('<span class="tchip '+(state.tag===''?'on':'')+'" data-tag="">全部</span>');
    tags.forEach(function(t){ h.push('<span class="tchip '+(state.tag===t?'on':'')+'" data-tag="'+esc(t)+'">'+esc(t)+'</span>'); });
    h.push('</div></div>');

    h.push('<div class="list" id="list"></div>');
    h.push('<div class="empty" id="empty" style="display:none"><div class="big">🗂️</div>没有匹配的条目，换个关键词或标签试试</div>');
    document.getElementById('view').innerHTML=h.join('');

    bindToolbar();
    renderList();
  }

  function renderList(){
    var list = filtered(state.tab);
    var box = document.getElementById('list');
    var empty = document.getElementById('empty');
    document.getElementById('tcount').textContent = '共 '+list.length+' 条';
    if(!list.length){ box.innerHTML=''; empty.style.display='block'; return; }
    empty.style.display='none';
    var html = list.map(function(x){ return state.tab==='essence' ? essenceCard(x) : fxbCard(x); }).join('');
    box.innerHTML = html;
    observeReveal();
  }

  function metaLine(x){
    return '<div class="metrics">'+
      '<i>👍 <b>'+fmtNum(x.like)+'</b></i>'+
      '<i>💬 <b>'+fmtNum(x.comment)+'</b></i>'+
      '<i>👀 <b>'+fmtNum(x.read)+'</b></i>'+
    '</div>';
  }
  function tagline(x){
    return '<div class="tags">'+(x.tags||[]).map(function(t){ return '<span class="tag">'+esc(t)+'</span>'; }).join('')+'</div>';
  }
  function essenceCard(x){
    var h=[];
    h.push('<article class="ecard reveal">');
    h.push('<div class="ehead"><div class="avatar">'+esc(initial(x.author))+'</div>'+
      '<div class="who"><b>'+esc(x.author)+'</b><span>'+esc(x.date)+' · 精华帖</span></div>'+ metaLine(x) +'</div>');
    h.push('<div class="etitle"><a href="'+esc(x.url)+'" target="_blank" rel="noopener">'+esc(x.title)+'</a></div>');
    h.push(tagline(x));
    h.push('<div class="blocks">');
    h.push('<div class="blk why"><div class="lab"><span class="d"></span>为什么值得看</div><div class="txt">'+esc(x.why)+'</div></div>');
    h.push('<div class="blk opp"><div class="lab"><span class="d"></span>可拆解机会</div><div class="txt">'+esc(x.opp)+'</div></div>');
    h.push('<div class="blk limit"><div class="lab"><span class="d"></span>局限</div><div class="txt">'+esc(x.limit)+'</div></div>');
    h.push('<div class="blk next"><div class="lab"><span class="d"></span>下一步动作</div><div class="txt">'+esc(x.next)+'</div></div>');
    h.push('</div>');
    h.push('<div class="efoot"><a class="linkbtn" href="'+esc(x.url)+'" target="_blank" rel="noopener">读原文 ↗</a>'+
      '<button class="linkbtn ghost" data-copy="'+esc(x.url)+'">复制链接</button></div>');
    h.push('</article>');
    return h.join('');
  }
  function fxbCard(x){
    var h=[];
    h.push('<article class="fcard reveal">');
    h.push('<div class="fh"><div class="avatar" style="width:28px;height:28px;font-size:11px">'+esc(initial(x.author))+'</div>'+
      '<div class="who"><b>'+esc(x.author)+'</b><span>'+esc(x.date)+' · 中标信号</span></div>'+ metaLine(x) +'</div>');
    h.push('<div class="ft"><a href="'+esc(x.url)+'" target="_blank" rel="noopener">'+esc(x.title)+'</a></div>');
    h.push(tagline(x));
    h.push('<div class="summary"><div class="sl">💡 机会</div><div class="st">'+esc(x.summary)+'</div></div>');
    h.push('<div class="efoot"><a class="linkbtn ghost" href="'+esc(x.url)+'" target="_blank" rel="noopener">读原文 ↗</a></div>');
    h.push('</article>');
    return h.join('');
  }

  /* ---------- 交互 ---------- */
  function bindToolbar(){
    document.querySelectorAll('[data-tab]').forEach(function(b){ b.onclick=function(){ state.tab=b.dataset.tab; state.tag=''; state.tagsOpen=false; renderBoard(); }; });
    var s=document.getElementById('search');
    s.oninput=function(){ state.q=s.value; renderList(); };
    s.onkeydown=function(e){ if(e.key==='Escape'){ s.value=''; state.q=''; renderList(); s.blur(); } };
    document.getElementById('sort').onchange=function(e){ state.sort=e.target.value; renderList(); };
    document.querySelectorAll('[data-tag]').forEach(function(c){ c.onclick=function(){ state.tag=c.dataset.tag; renderBoard(); }; });
    var tg=document.getElementById('tagtoggle');
    if(tg) tg.onclick=function(){ state.tagsOpen=!state.tagsOpen; var row=document.getElementById('tagrow'); var ar=tg.querySelector('.tg-arrow'); if(row) row.classList.toggle('hidden', !state.tagsOpen && !state.tag); if(ar) ar.classList.toggle('open', state.tagsOpen || !!state.tag); };
    document.querySelectorAll('[data-copy]').forEach(function(b){ b.onclick=function(){ copyText(b.dataset.copy); }; });
  }

  function copyText(t){
    if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(t).then(function(){ toast('链接已复制'); },function(){ toast('复制失败'); }); }
    else { toast('请手动复制：'+t); }
  }
  var toastTimer;
  function toast(msg){ var el=document.getElementById('toast'); el.textContent=msg; el.classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(function(){ el.classList.remove('show'); }, 2000); }

  function observeReveal(){
    var els=document.querySelectorAll('.reveal:not(.in)');
    if(!('IntersectionObserver' in window)){ els.forEach(function(e){ e.classList.add('in'); }); return; }
    var io=new IntersectionObserver(function(entries){ entries.forEach(function(en){ if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); } }); }, { threshold:0.08 });
    els.forEach(function(e){ io.observe(e); });
  }

  /* ---------- 滚动 ---------- */
  function bindScroll(){
    var sp=document.getElementById('sp');
    var top=document.createElement('button'); top.className='to-top'; top.innerHTML='↑'; top.title='回到顶部';
    document.body.appendChild(top);
    top.onclick=function(){ window.scrollTo({ top:0, behavior:'smooth' }); };
    window.addEventListener('scroll', function(){
      var st=document.documentElement.scrollTop||document.body.scrollTop;
      var h=document.documentElement.scrollHeight-document.documentElement.clientHeight;
      sp.style.width=(h>0?(st/h*100):0)+'%';
      if(st>600) top.classList.add('show'); else top.classList.remove('show');
    }, { passive:true });
  }

  function bindKeys(){
    document.addEventListener('keydown', function(e){
      if(e.key==='/' && document.activeElement.tagName!=='INPUT' && document.activeElement.tagName!=='TEXTAREA'){ e.preventDefault(); var s=document.getElementById('search'); if(s) s.focus(); }
    });
  }

  /* ---------- 启动 ---------- */
  renderSidebar(); renderTopbar(); renderBoard(); bindScroll(); bindKeys(); observeReveal();
})();
