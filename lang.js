/*
 * Езиков превключвател BG / EN за сайта на EntaChain.
 *
 * Прави три неща:
 *  1. Слага превключвател в навигацията на всяка страница.
 *  2. Помни избора в localStorage, за да не се сменя при всяко отваряне.
 *  3. При първо посещение пуска езика на браузъра: български → BG,
 *     всичко останало → EN. Само веднъж и само ако има съответна страница.
 */
(function () {
  'use strict';

  var KEY = 'enta_lang';
  var GUARD = 'lang';

  // Двойки страници: ключът е името на файла без разширение.
  var PAIRS = {
    'index': ['index.html', 'en.html'],
    'en': ['index.html', 'en.html'],
    'privacy': ['privacy.html', 'privacy-en.html'],
    'privacy-en': ['privacy.html', 'privacy-en.html'],
    'terms': ['terms.html', 'terms-en.html'],
    'terms-en': ['terms.html', 'terms-en.html'],
    'delete-account': ['delete-account.html', 'delete-account-en.html'],
    'delete-account-en': ['delete-account.html', 'delete-account-en.html']
  };

  function currentKey() {
    var file = location.pathname.split('/').pop() || 'index.html';
    return file.replace(/\.html$/, '');
  }

  function pair() {
    return PAIRS[currentKey()] || null;
  }

  function currentLang() {
    var html = document.documentElement.getAttribute('lang') || 'bg';
    return html.toLowerCase().indexOf('en') === 0 ? 'en' : 'bg';
  }

  function save(lang) {
    try { localStorage.setItem(KEY, lang); } catch (e) { /* режим инкогнито */ }
  }

  function saved() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }

  function sameHost(href) {
    var a = document.createElement('a');
    a.href = href;
    return a.host === location.host;
  }

  // 1) Автоматично пренасочване при първо посещение.
  function autoRedirect() {
    var p = pair();
    if (!p) return;
    var url = new URL(location.href);
    if (url.searchParams.get(GUARD) === '1') return; // вече сме пренасочвали
    var choice = saved();
    if (choice) {
      // Изборът на потребителя е по-важен от езика на браузъра.
      var want = choice === 'en' ? p[1] : p[0];
      if (location.pathname.split('/').pop() !== want) {
        url.pathname = url.pathname.replace(/[^/]*$/, want);
        url.searchParams.set(GUARD, '1');
        location.replace(url.toString());
      }
      return;
    }
    var nav = (navigator.language || 'bg').toLowerCase();
    var wantsEn = nav.indexOf('bg') !== 0;
    var target = wantsEn ? p[1] : p[0];
    var here = location.pathname.split('/').pop() || 'index.html';
    if (target !== here && sameHost(target)) {
      url.pathname = url.pathname.replace(/[^/]*$/, target);
      url.searchParams.set(GUARD, '1');
      location.replace(url.toString());
    }
  }

  // 2) Превключвател в навигацията.
  function buildSwitch() {
    var p = pair();
    if (!p) return;
    var nav = document.querySelector('header nav');
    if (!nav) return;

    // Махаме старите ръчни линкове "BG"/"EN", ако ги има.
    Array.prototype.slice.call(nav.querySelectorAll('a')).forEach(function (a) {
      var t = (a.textContent || '').trim().toUpperCase();
      if (t === 'BG' || t === 'EN') a.remove();
    });

    var wrap = document.createElement('span');
    wrap.className = 'lang-switch';
    wrap.setAttribute('role', 'group');
    wrap.setAttribute('aria-label', 'Language');

    [['bg', 'BG', p[0]], ['en', 'EN', p[1]]].forEach(function (item) {
      var a = document.createElement('a');
      a.href = item[2];
      a.textContent = item[1];
      a.setAttribute('hreflang', item[0]);
      if (currentLang() === item[0]) {
        a.className = 'is-active';
        a.setAttribute('aria-current', 'true');
      }
      a.addEventListener('click', function () { save(item[0]); });
      wrap.appendChild(a);
    });

    nav.appendChild(wrap);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      autoRedirect();
      buildSwitch();
    });
  } else {
    autoRedirect();
    buildSwitch();
  }
})();
