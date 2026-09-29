/* Chain Reaction: ask Claude. Where this page runs on claude.ai, each
   chapter ends with a box for questions about its discovery, answered by
   Claude from the chapter's own text. Anywhere else (a saved copy, another
   host, or a viewer without access) the boxes never appear. */
(function () {
  'use strict';

  const PH = window.PH;

  const SUGGEST = {
    galileo: ['Why does a feather fall slowly on Earth?', 'Did Galileo really drop balls from the tower?'],
    newton: ['If the Moon is falling, why doesn\'t it get closer?', 'What is the difference between mass and weight?'],
    faraday: ['How does a power station spin its magnets?', 'Why does a faster magnet make more electricity?'],
    maxwell: ['Why can\'t sound travel through space?', 'Why can we only see a small part of the spectrum?'],
    curie: ['Is radiation always dangerous?', 'How does carbon dating work?'],
    einstein: ['Would I age slower on a fast train?', 'Why can\'t anything go faster than light?'],
    rutherford: ['If atoms are empty, why can\'t I walk through a wall?', 'What is inside the nucleus?'],
    bohr: ['Why does each element glow in different colors?', 'How do we know what stars are made of?'],
    debroglie: ['Am I a wave too?', 'How can one electron go through both slits?'],
    raman: ['Why is the sea blue?', 'How does a Raman scanner spot fake medicine?'],
    meitner: ['How does a nuclear power station stay safe?', 'Why didn\'t Lise Meitner get the Nobel Prize?'],
    ligo: ['How can a laser measure something smaller than a proton?', 'What does a black hole collision sound like?']
  };

  // Codes that mean asking can't work in this view at all.
  const GONE = ['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed', 'session_expired'];

  function chapterText(ch) {
    const bits = [];
    const h = ch.querySelector('h2');
    bits.push(ch.dataset.year + ' · ' + ch.dataset.name + ' · "' + (h ? h.textContent.trim() : '') + '"');
    ch.querySelectorAll('.main .story p, .main .quote p').forEach(function (p) { bits.push(p.textContent.trim()); });
    const cap = ch.querySelector('.fig figcaption');
    if (cap) bits.push('The page\'s experiment: ' + cap.textContent.trim());
    const set = Array.from(ch.querySelectorAll('.links li')).map(function (li) { return '- ' + li.textContent.replace(/\s+/g, ' ').trim(); });
    if (set.length) bits.push('What it set off:\n' + set.join('\n'));
    ch.querySelectorAll('.cost p, .aside p').forEach(function (p) { bits.push(p.textContent.trim()); });
    return bits.join('\n\n').slice(0, 6000);
  }

  function prompt(ch, question) {
    return 'You are the friendly guide on "Chain Reaction", a school website about twelve discoveries in physics. ' +
      'A reader, probably 12 to 16 years old, is on the chapter below and has asked a question.\n\n' +
      'Answer in plain, warm English in at most 120 words. Be accurate. If something is uncertain or disputed, say so. ' +
      'Do not invent quotes, names or numbers. If the question is not about physics, science or this chapter, reply in one friendly sentence and suggest a question about the chapter. ' +
      'Reply with plain text only: no markdown, no headings, no bullet symbols.\n\n' +
      'CHAPTER\n' + chapterText(ch) + '\n\nQUESTION\n' + question;
  }

  function build(sample) {
    const blocks = [];
    let gone = false;

    function hideAll() {
      gone = true;
      blocks.forEach(function (b) { b.remove(); });
    }

    document.querySelectorAll('.chapter').forEach(function (ch) {
      const main = ch.querySelector('.main');
      if (!main) return;
      const id = ch.id;
      const who = ch.dataset.name.replace(/\s*\(.*\)/, '');
      const sec = document.createElement('section');
      sec.className = 'ask';
      sec.setAttribute('aria-labelledby', 'ask-' + id + '-t');
      sec.innerHTML =
        '<p class="label ask-kicker" id="ask-' + id + '-t">Still curious? Ask Claude<span class="sr-only"></span></p>' +
        '<form class="ask-form">' +
          '<label class="sr-only" for="ask-' + id + '"></label>' +
          '<input id="ask-' + id + '" type="text" maxlength="300" autocomplete="off" enterkeyhint="send">' +
          '<button class="btn btn--solid ask-go" type="submit">Ask</button>' +
          '<button class="btn ask-stop" type="button" hidden>Stop</button>' +
        '</form>' +
        '<p class="ask-chips"></p>' +
        '<div class="ask-out" aria-live="polite"></div>' +
        '<p class="ask-foot">Answers are written by Claude, an AI, from this chapter. They can be wrong, so check anything important.</p>';
      const input = sec.querySelector('input');
      input.placeholder = 'Ask anything about ' + (id === 'ligo' ? 'LIGO' : who.split(' ').slice(-1)[0]) + '\'s discovery';
      sec.querySelector('label').textContent = 'Your question about ' + who + '\'s discovery';
      sec.querySelector('.ask-kicker .sr-only').textContent = ' about ' + who;
      const chips = sec.querySelector('.ask-chips');
      (SUGGEST[id] || []).concat(['Explain it like I\'m 10']).forEach(function (q) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'chip ask-chip';
        b.textContent = q;
        b.addEventListener('click', function () {
          input.value = q;
          ask();
        });
        chips.appendChild(b);
      });
      const out = sec.querySelector('.ask-out');
      const go = sec.querySelector('.ask-go');
      const stopBtn = sec.querySelector('.ask-stop');
      let ctl = null;

      async function ask() {
        const q = input.value.trim();
        if (!q || gone || ctl) return;
        ctl = new AbortController();
        go.disabled = true;
        stopBtn.hidden = false;
        out.textContent = '';
        const qEl = document.createElement('p');
        qEl.className = 'ask-q';
        qEl.textContent = q;
        const aEl = document.createElement('p');
        aEl.className = 'ask-a is-thinking';
        aEl.textContent = 'Thinking…';
        out.setAttribute('aria-busy', 'true');
        out.append(qEl, aEl);
        try {
          await sample(prompt(ch, q), {
            modelTier: 'quick',
            signal: ctl.signal,
            onText: function (u) {
              aEl.classList.remove('is-thinking');
              aEl.textContent = u.text;
            }
          });
        } catch (e) {
          const code = e && e.code;
          if (GONE.indexOf(code) >= 0) {
            hideAll();
            return;
          }
          aEl.classList.remove('is-thinking');
          if (code === 'refused') aEl.textContent = 'Claude couldn\'t answer that one. Try asking it another way.';
          else if (code === 'cancelled') aEl.textContent = (e.text || '') + (e.text ? ' …' : 'Stopped.');
          else if (code === 'rate_limited') aEl.textContent = (e.text ? e.text + '\n\n' : '') + 'That\'s a lot of questions at once. Try again in a minute.';
          else aEl.textContent = (e && e.text ? e.text + '\n\n' : '') + 'Something went wrong. Try asking again.';
        } finally {
          out.removeAttribute('aria-busy');
          ctl = null;
          go.disabled = false;
          stopBtn.hidden = true;
        }
      }

      sec.querySelector('form').addEventListener('submit', function (e) {
        e.preventDefault();
        ask();
      });
      stopBtn.addEventListener('click', function () { if (ctl) ctl.abort(); });
      main.appendChild(sec);
      blocks.push(sec);
    });
  }

  PH.initAsk = function () {
    if (!window.claude || typeof window.claude.use !== 'function') return;
    window.claude.use('sample').then(function (sample) {
      if (typeof sample === 'function') build(sample);
    }).catch(function () { /* no asking here */ });
  };
})();
