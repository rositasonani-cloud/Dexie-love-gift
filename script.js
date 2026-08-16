// script.js — gallery, typed text, audio control, download, and world clocks
(function(){
  // --- Gallery & Typed Letter ---
  const images = [
    'assets/1.jpg',
    'assets/2.jpg',
    'assets/3.jpg',
    'assets/4.jpg'
  ];

  const captions = [
    'You + me',
    'Laughing together',
    'Resting in your arms',
    'Our little rituals'
  ];

  let idx = 0;
  const photo = document.getElementById('photo');
  const captionEl = document.getElementById('caption');
  const prev = document.getElementById('prev');
  const next = document.getElementById('next');
  const playAudioBtn = document.getElementById('playAudio');
  const bgAudio = document.getElementById('bgAudio');
  const downloadBtn = document.getElementById('download');
  const typedEl = document.getElementById('typed');
  const readBtn = document.getElementById('readLetter');
  const letterDialog = document.getElementById('letterDialog');
  const letterContent = document.getElementById('letterContent');

  function setImage(i){
    const url = images[i];
    photo.src = url;
    captionEl.textContent = captions[i] || '';
  }

  prev.addEventListener('click',()=>{ idx = (idx-1+images.length)%images.length; setImage(idx); });
  next.addEventListener('click',()=>{ idx = (idx+1)%images.length; setImage(idx); });

  // Audio handling — prompt for MP3 if not present
  function setAudioUrl(url){
    if(!url) return;
    const src = bgAudio.querySelector('source');
    if(src) src.src = url;
    else {
      const s = document.createElement('source'); s.src = url; s.type = 'audio/mpeg'; bgAudio.appendChild(s);
    }
    bgAudio.load();
  }

  playAudioBtn.addEventListener('click',async ()=>{
    const currentSrc = bgAudio.querySelector('source') && bgAudio.querySelector('source').src;
    if(!currentSrc){
      const url = prompt('Paste a direct MP3 URL you have rights to use (or upload audio/cinderella.mp3 to the repo):');
      if(url){ setAudioUrl(url); }
      else return;
    }
    try{
      if(bgAudio.paused){
        await bgAudio.play();
        playAudioBtn.textContent='Pause Music';
      } else {
        bgAudio.pause();
        playAudioBtn.textContent='Play Music';
      }
    }catch(e){
      alert('Audio playback failed due to browser autoplay policies. Click the button to allow audio.');
    }
  });

  // Typed text animation with your full love letter in a modal
  const messages = [
    'Every moment with you is my favorite.',
    'You are my home, my laughter, my calm.'
  ];

  const fullLetter = `Hey baby,\n\nI might not always say the right things, but I really want you to know that I love you, and I believe in you. I will forever support you in any decision you make in your life. I am proud of you, and I sure do long for you. We might not know each other that long, but you give me the feeling of forever since the first day we started talking, and I thank God about it. I thank God every day that I have the chance to know you in my life. Thank you for being in my life, and thank you for always trying to give me the love I deserve. I see you baby, I see you.\n\nI love you more always 🤍\n\nYours, Rosita`;

  // populate modal content
  if(letterContent) letterContent.textContent = fullLetter;
  if(readBtn){
    readBtn.addEventListener('click',()=>{
      if(letterDialog && typeof letterDialog.showModal === 'function'){ letterDialog.showModal(); }
      else alert(fullLetter);
    });
  }

  let msgIdx=0, charIdx=0;
  function typeTick(){
    const m = messages[msgIdx];
    if(typedEl) typedEl.textContent = m.slice(0,charIdx);
    charIdx++;
    if(charIdx>m.length){
      setTimeout(()=>{ msgIdx=(msgIdx+1)%messages.length; charIdx=0; },1200);
    } else setTimeout(typeTick,60);
  }
  if(typedEl) typeTick();

  // Download keepsake using html2canvas
  if(downloadBtn){
    downloadBtn.addEventListener('click',async ()=>{
      if(typeof html2canvas==='undefined'){
        await new Promise((resolve,reject)=>{
          const s=document.createElement('script');
          s.src='https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
          s.onload=resolve; s.onerror=reject; document.head.appendChild(s);
        }).catch(()=>{ alert('Could not load capture library.'); return; });
      }
      const card = document.getElementById('card');
      html2canvas(card, {useCORS:true,allowTaint:true,scale:1}).then(canvas=>{
        canvas.toBlob(blob=>{
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href=url; a.download='love-keepsake.png';
          document.body.appendChild(a); a.click(); a.remove();
          URL.revokeObjectURL(url);
        });
      }).catch(()=>alert('Capture failed. Make sure your images are hosted with CORS enabled or uploaded into the assets/ folder.'));
    });
  }

  // initial image
  if(photo) setImage(idx);

  // --- World Clocks Module (appended) ---
  (function(){
    const presetSelect = document.getElementById('presetTz');
    const addBtn = document.getElementById('addTz');
    const customInput = document.getElementById('customTz');
    const clocksEl = document.getElementById('clocks');

    const STORAGE_KEY = 'loveGiftWorldClocks';

    // Start with Berlin and Mississippi (use America/Chicago for Mississippi)
    let zones = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if(!Array.isArray(zones)){
      zones = ['Europe/Berlin','America/Chicago'];
    }

    function isValidIANA(zone){
      try{ Intl.DateTimeFormat(undefined,{timeZone:zone}); return true;}catch(e){ return false; }
    }

    function formatTimeForZone(zone, date=new Date()){
      try{
        const opts = {hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false, timeZone:zone};
        return new Intl.DateTimeFormat([],opts).format(date);
      }catch(e){ return '--:--:--'; }
    }

    function formatLongName(zone){ return zone.replace('_',' ').replace('/',' — '); }

    function renderClocks(){
      if(!clocksEl) return;
      clocksEl.innerHTML='';
      zones.forEach((zone, i)=>{
        const tile = document.createElement('div');
        tile.className='clock-tile';
        tile.dataset.zone = zone;

        const name = document.createElement('div');
        name.className='clock-name';
        name.textContent = formatLongName(zone);

        const time = document.createElement('div');
        time.className='clock-time';
        time.textContent = formatTimeForZone(zone);

        const offset = document.createElement('div');
        offset.className='clock-offset';
        offset.textContent = zone;

        const actions = document.createElement('div');
        actions.className='clock-actions';
        const remove = document.createElement('button');
        remove.textContent='Remove';
        remove.addEventListener('click', ()=>{ removeZone(i); });
        actions.appendChild(remove);

        tile.appendChild(name);
        tile.appendChild(time);
        tile.appendChild(offset);
        tile.appendChild(actions);

        clocksEl.appendChild(tile);
      });
    }

    function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(zones)); }

    function addZone(zone){
      if(!zone) return alert('Enter a time zone.');
      if(!isValidIANA(zone)) return alert('Invalid IANA time zone: ' + zone);
      if(zones.includes(zone)) return alert('Zone already added.');
      zones.push(zone);
      save(); renderClocks();
    }

    function removeZone(index){ zones.splice(index,1); save(); renderClocks(); }

    if(addBtn){
      addBtn.addEventListener('click', ()=>{
        const custom = customInput && customInput.value.trim();
        if(custom){ addZone(custom); if(customInput) customInput.value=''; }
        else { const preset = presetSelect && presetSelect.value; addZone(preset); }
      });
    }

    setInterval(()=>{
      const tiles = document.querySelectorAll('.clock-tile');
      tiles.forEach(tile=>{
        const zone = tile.dataset.zone;
        const timeEl = tile.querySelector('.clock-time');
        if(timeEl) timeEl.textContent = formatTimeForZone(zone, new Date());
      });
    },1000);

    renderClocks();
    window.worldClocks = {addZone, removeZone, zones};
  })();

})();
