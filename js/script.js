/* =========================================================================
   КРАБ-САДОВНИК — скрипты сайта
   Без сторонних библиотек — только чистый JavaScript.
   =========================================================================
   Содержание:
   1. Мобильное меню (бургер)
   2. Плавный скролл + подсветка активного пункта меню (не обязательна, но приятна)
   3. Плейсхолдеры вместо отсутствующих изображений
   4. Генератор подводных пузырьков
   5. Появление блоков при скролле (IntersectionObserver)
   6. Анимация шкалы сложности при попадании в область видимости
   7. Лёгкий параллакс краба в hero по движению мыши
   8. Год в подвале
   9. Масштабирование встроенной игры (iframe) под ширину экрана
   ========================================================================= */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- 1. МОБИЛЬНОЕ МЕНЮ ---------- */
  const burgerBtn = document.getElementById('burgerBtn');
  const mainNav = document.getElementById('mainNav');

  if (burgerBtn && mainNav) {
    burgerBtn.addEventListener('click', () => {
      const isOpen = mainNav.classList.toggle('is-open');
      burgerBtn.setAttribute('aria-expanded', String(isOpen));
      burgerBtn.setAttribute('aria-label', isOpen ? 'Закрыть меню' : 'Открыть меню');
    });

    // закрываем меню при переходе по ссылке (удобно на мобильных)
    mainNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mainNav.classList.remove('is-open');
        burgerBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- 3. ПЛЕЙСХОЛДЕРЫ ВМЕСТО ОТСУТСТВУЮЩИХ ИЗОБРАЖЕНИЙ ----------
     Если картинка, указанная в src, не загрузилась (например, вы ещё
     не положили свой файл в папку images/), вместо "битой" иконки
     браузера показываем аккуратный плейсхолдер с подписью.
     Как только вы добавите настоящий файл с тем же именем — он
     подхватится сам, ничего менять в JS не нужно.
  ------------------------------------------------------------------------ */
  document.querySelectorAll('img[data-placeholder-label]').forEach(img => {
    img.addEventListener('error', () => {
      const wrapper = document.createElement('div');
      wrapper.className = img.className + ' img-placeholder';
      wrapper.setAttribute('role', 'img');
      wrapper.setAttribute('aria-label', img.alt || img.dataset.placeholderLabel);

      const icon = document.createElement('span');
      icon.className = 'ph-icon';
      icon.textContent = img.dataset.placeholderIcon || '🖼️';

      const label = document.createElement('span');
      label.textContent = img.dataset.placeholderLabel;

      wrapper.append(icon, label);
      img.replaceWith(wrapper);
    }, { once: true });
  });

  /* ---------- 4. ГЕНЕРАТОР ПОДВОДНЫХ ПУЗЫРЬКОВ ---------- */
  const bubbleField = document.getElementById('bubbleField');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function spawnBubble() {
    if (!bubbleField) return;
    const bubble = document.createElement('span');
    bubble.className = 'bubble';

    const size = 6 + Math.random() * 22;              // размер пузырька
    const left = Math.random() * 100;                  // позиция по горизонтали
    const duration = 9 + Math.random() * 10;           // скорость всплытия
    const drift = (Math.random() - 0.5) * 120;          // случайный снос в сторону

    bubble.style.width = `${size}px`;
    bubble.style.height = `${size}px`;
    bubble.style.left = `${left}%`;
    bubble.style.setProperty('--drift', `${drift}px`);
    bubble.style.animationDuration = `${duration}s`;

    bubbleField.appendChild(bubble);
    // убираем пузырёк из DOM после того, как он "всплыл", чтобы не копить лишние узлы
    setTimeout(() => bubble.remove(), duration * 1000);
  }

  if (!prefersReducedMotion) {
    // сразу немного пузырьков, чтобы сцена не начиналась пустой
    for (let i = 0; i < 6; i++) setTimeout(spawnBubble, i * 500);
    setInterval(spawnBubble, 1400);
  }

  /* ---------- 5. ПОЯВЛЕНИЕ БЛОКОВ ПРИ СКРОЛЛЕ ---------- */
  const revealEls = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window && revealEls.length) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    revealEls.forEach(el => revealObserver.observe(el));
  } else {
    // на случай отсутствия поддержки — просто показать всё сразу
    revealEls.forEach(el => el.classList.add('is-visible'));
  }

  /* ---------- 6. АНИМАЦИЯ ШКАЛЫ СЛОЖНОСТИ ---------- */
  const gaugeFill = document.getElementById('gaugeFill');
  const gaugeEl = document.getElementById('difficultyGauge');

  if (gaugeFill && gaugeEl && 'IntersectionObserver' in window) {
    const gaugeObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // запускаем заполнение шкалы, когда блок появляется на экране
          requestAnimationFrame(() => { gaugeFill.style.width = '92%'; });
          gaugeObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });

    gaugeObserver.observe(gaugeEl);
  }

  /* ---------- 7. ЛЁГКИЙ ПАРАЛЛАКС КРАБА В HERO ---------- */
  const heroCrab = document.querySelector('.hero-crab');
  const heroSection = document.querySelector('.hero');

  if (heroCrab && heroSection && !prefersReducedMotion && window.matchMedia('(hover: hover)').matches) {
    heroSection.addEventListener('mousemove', (e) => {
      const { innerWidth, innerHeight } = window;
      const offsetX = (e.clientX / innerWidth - 0.5) * 16;
      const offsetY = (e.clientY / innerHeight - 0.5) * 16;
      heroCrab.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
    });
    heroSection.addEventListener('mouseleave', () => {
      heroCrab.style.transform = 'translate(0, 0)';
    });
  }

  /* ---------- 8. ГОД В ПОДВАЛЕ ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- 9. МАСШТАБИРОВАНИЕ ВСТРОЕННОЙ ИГРЫ ----------
     Сама игра (game/index.html) сделана под фиксированный холст
     800×450px. Чтобы она не обрезалась на маленьких экранах,
     мы не трогаем её вёрстку, а визуально масштабируем весь
     <iframe> через CSS transform: scale(), подгоняя коэффициент
     под текущую ширину контейнера.
  ------------------------------------------------------------------------ */
  const gameEmbed = document.getElementById('gameEmbed');
  const gameFrame = document.getElementById('gameFrame');
  const GAME_WIDTH = 800;
  const GAME_HEIGHT = 450;

  function scaleGameFrame() {
    if (!gameEmbed || !gameFrame) return;
    const scale = Math.min(gameEmbed.clientWidth / GAME_WIDTH, 1);
    gameFrame.style.transform = `scale(${scale})`;
    // высота обёртки подгоняется под уже отмасштабированную игру,
    // иначе под iframe остаётся пустое место
    gameEmbed.style.height = `${GAME_HEIGHT * scale}px`;
  }

  if (gameEmbed && gameFrame) {
    scaleGameFrame();
    window.addEventListener('resize', scaleGameFrame);
  }

});
