/* Original scores for NattsunLABO. Browser synthesis, no external audio service. */
window.ReiMusic = (() => {
  'use strict';
  const scores = {
    romance: {
      bpm: 76, name: '放課後の約束',
      chords: [[60,64,67,71],[57,60,64,67],[53,57,60,64],[55,59,62,67]],
      melody: [
        [ [76,0,1.5],[74,2,1],[72,3,1] ], [ [71,0,2],[67,2,2] ],
        [ [69,0,1],[72,1,1],[76,2,2] ], [ [74,0,3] ],
        [ [72,0,1],[76,1,1],[79,2,2] ], [ [76,0,1.5],[72,2,2] ],
        [ [69,0,2],[67,2,1],[65,3,1] ], [ [67,0,3.5] ]
      ]
    },
    fight: {
      bpm: 144, name: '月光バトル・LABO BEAT',
      chords: [[52,55,59,62],[48,52,55,59],[45,48,52,55],[47,51,54,57]],
      melody: [
        [[76,0,.5],[79,.5,.25],[83,.75,.25],[81,1,.5],[79,1.5,.5],[76,2,.5],[74,2.5,.5],[71,3,1]],
        [[72,0,.5],[76,.5,.5],[79,1,.5],[83,1.5,.5],[81,2,.5],[79,2.5,.5],[76,3,1]],
        [[69,0,.5],[72,.5,.5],[76,1,.5],[79,1.5,.5],[76,2,.5],[72,2.5,.5],[69,3,1]],
        [[71,0,.5],[75,.5,.5],[78,1,.5],[81,1.5,.5],[78,2,.5],[75,2.5,.5],[71,3,1]],
        [[83,0,.25],[81,.25,.25],[79,.5,.5],[76,1,.5],[79,1.5,.5],[83,2,1],[86,3,1]],
        [[84,0,.5],[83,.5,.5],[79,1,.5],[76,1.5,.5],[79,2,1],[72,3,1]],
        [[81,0,.5],[79,.5,.5],[76,1,.5],[72,1.5,.5],[76,2,1],[69,3,1]],
        [[78,0,.5],[81,.5,.5],[83,1,1],[78,2,.5],[75,2.5,.5],[76,3,1]]
      ]
    },
    action: {
      bpm: 116, name: '星屑ステップ',
      chords: [[62,66,69,73],[59,62,66,69],[55,59,62,66],[57,61,64,69]],
      melody: [
        [ [74,0,.5],[78,.5,.5],[81,1,1],[78,2,.5],[76,2.5,.5],[74,3,1] ],
        [ [73,0,1],[74,1,.5],[78,1.5,.5],[76,2,1],[73,3,1] ],
        [ [71,0,.5],[74,.5,.5],[78,1,1],[76,2,.5],[74,2.5,.5],[71,3,1] ],
        [ [73,0,1],[76,1,1],[81,2,1.5] ],
        [ [78,0,.5],[81,.5,.5],[86,1,1],[81,2,.5],[78,2.5,.5],[76,3,1] ],
        [ [74,0,1],[73,1,.5],[71,1.5,.5],[69,2,1],[73,3,1] ],
        [ [71,0,.5],[74,.5,.5],[78,1,1],[76,2,1],[74,3,1] ],
        [ [73,0,1],[69,1,1],[74,2,1.5] ]
      ]
    }
  };
  function create(kind) {
    const score = scores[kind] || scores.romance;
    const storageKey = 'nattsun_bgm_' + kind;
    let ctx, master, timer, next = 0, bar = 0, wanted = false, unlocked = false;
    let enabled = true, volume = .25, button, slider, output;
    const voices = new Set();
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
      if (saved && typeof saved.enabled === 'boolean') enabled = saved.enabled;
      if (saved && Number.isFinite(saved.volume)) volume = Math.max(0, Math.min(1, saved.volume));
    } catch {}
    function update() {
      if (button) { button.textContent = enabled ? 'BGM ON' : 'BGM OFF'; button.setAttribute('aria-pressed', String(enabled)); button.title = score.name; }
      if (slider) slider.value = String(Math.round(volume * 100));
      if (output) output.textContent = Math.round(volume * 100) + '%';
      if (master) master.gain.setTargetAtTime(enabled ? volume * .35 : 0, ctx.currentTime, .03);
    }
    function save() { try { localStorage.setItem(storageKey, JSON.stringify({enabled,volume})); } catch {} }
    function note(midi, at, duration, strength, type = 'sine', piano = false) {
      const freq = 440 * Math.pow(2, (midi - 69) / 12);
      const partials = piano ? [[1,1],[2,.18],[3,.055]] : [[1,1]];
      for (const [ratio,weight] of partials) {
        const osc = ctx.createOscillator(), gain = ctx.createGain();
        osc.type = type; osc.frequency.setValueAtTime(freq * ratio, at);
        gain.gain.setValueAtTime(0, at);
        gain.gain.linearRampToValueAtTime(strength * weight, at + .012);
        gain.gain.exponentialRampToValueAtTime(.0001, at + duration + .18);
        osc.connect(gain).connect(master); voices.add(osc);
        osc.onended = () => { voices.delete(osc); osc.disconnect(); gain.disconnect(); };
        osc.start(at); osc.stop(at + duration + .2);
      }
    }
    function percussion(at, strong) {
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.frequency.setValueAtTime(strong ? 115 : 900, at);
      osc.frequency.exponentialRampToValueAtTime(strong ? 45 : 340, at + .09);
      gain.gain.setValueAtTime(strong ? .22 : .035, at);
      gain.gain.exponentialRampToValueAtTime(.0001, at + .13);
      osc.connect(gain).connect(master); voices.add(osc);
      osc.onended = () => { voices.delete(osc); osc.disconnect(); gain.disconnect(); };
      osc.start(at); osc.stop(at + .15);
    }
    function scheduleBar(at) {
      const beat = 60 / score.bpm, chord = score.chords[bar % 4];
      const section = Math.floor(bar / 8) % 4;
      for (const [midi,offset,length] of score.melody[bar % 8]) {
        // A quiet reprise and octave answer vary the 32-bar loop.
        note(midi + (section === 2 ? -12 : 0), at + offset * beat, length * beat, kind==='fight'?.09:section === 1 ? .15 : .21, kind==='fight'?'sawtooth':'sine', kind!=='fight');
      }
      if(kind==='fight') {
        for(let i=0;i<16;i++){note(chord[[0,2,1,2][i%4]]+12,at+i*beat/4,beat*.12,.045,'triangle');if(i%2===0)percussion(at+i*beat/4,false);}
        for(let i=0;i<8;i++)note(chord[i%4===3?2:0]-12,at+i*beat/2,beat*.32,.18,'triangle');
        for(let i=0;i<4;i++){percussion(at+i*beat,true);if(i%2===1){percussion(at+i*beat+.015,false);percussion(at+i*beat+.045,false);}}
      } else if (kind === 'romance') {
        const pattern = [0,2,1,3,0,2,1,2];
        pattern.forEach((i,j) => note(chord[i], at + j * beat / 2, beat * .9, .09, 'sine', true));
        note(chord[0] - 24, at, beat * 3.2, .13);
      } else {
        for (let i = 0; i < 8; i++) note(chord[[0,2,1,2][i % 4]], at + i * beat / 2, beat * .32, .065, 'triangle');
        for (let i = 0; i < 4; i++) {
          note(chord[i % 2 ? 2 : 0] - 24, at + i * beat, beat * .7, .2, 'triangle');
          percussion(at + i * beat, i % 2 === 0);
          if (section !== 1) percussion(at + (i + .5) * beat, false);
        }
      }
      bar = (bar + 1) % 32;
    }
    function stop() {
      clearInterval(timer); timer = undefined;
      for (const osc of voices) { try { osc.stop(); } catch {} }
      voices.clear();
    }
    function tick() {
      if (!ctx || ctx.state !== 'running') return;
      if (next < ctx.currentTime) next = ctx.currentTime + .05;
      while (next < ctx.currentTime + .25) { scheduleBar(next); next += 4 * 60 / score.bpm; }
    }
    async function run(gesture = false) {
      if (!wanted || !enabled || document.hidden) return;
      try {
        if (!ctx) {
          if (!gesture) return;
          ctx = new (window.AudioContext || window.webkitAudioContext)();
          master = ctx.createGain(); master.connect(ctx.destination); update();
        }
        if (gesture) unlocked = true;
        if (!unlocked) return;
        if (ctx.state === 'suspended') await ctx.resume();
        if (!wanted || !enabled || document.hidden || timer !== undefined) return;
        next = ctx.currentTime + .05; tick(); timer = setInterval(tick, 100);
      } catch { if (button) button.title = '音声を再生できません。BGMボタンでもう一度お試しください。'; }
    }
    function play() { wanted = true; run(true); }
    function pause() { wanted = false; stop(); }
    function bind(b,s,o) {
      button = b; slider = s; output = o; update();
      button.onclick = () => { enabled = !enabled; if (!enabled) stop(); else run(true); update(); save(); };
      slider.addEventListener('input', () => { const value = Number(slider.value); if (Number.isFinite(value)) volume = Math.max(0,Math.min(1,value / 100)); update(); save(); });
    }
    document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else run(); });
    window.addEventListener('pagehide', stop);
    return {play,pause,bind};
  }
  return {create};
})();
