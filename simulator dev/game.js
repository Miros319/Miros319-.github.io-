const crab = document.getElementById('crab');
const seaweeds = document.querySelectorAll('.seaweed');
const gameContainer = document.getElementById('game');

let crabX = 100;
let crabY = 80; 
let speed = 5;
const baseSpeed = 5;

// нужны реальные размеры картинки краба, чтобы границы считались правильно
let crabHeight = crab.offsetHeight || 80;
let crabWidth = crab.offsetWidth || 80;
crab.addEventListener('load', () => {
  crabHeight = crab.offsetHeight || crabHeight;
  crabWidth = crab.offsetWidth || crabWidth;
});

// ---------------- СОХРАНЕНИЕ ПРОГРЕССА ----------------

const SAVE_KEY = 'crabGarden_leafCount';
let leafCount = Number(localStorage.getItem(SAVE_KEY)) || 0;
const leafValue = document.getElementById('leaf-value');
leafValue.textContent = leafCount;

// центральная функция изменения листиков: обновляет UI и сохраняет в localStorage
function addLeaves(amount) {
  leafCount += amount;
  leafValue.textContent = leafCount;
  localStorage.setItem(SAVE_KEY, leafCount);
}

// пытается потратить листики; возвращает true при успехе, false если не хватает
function spendLeaves(amount) {
  if (leafCount < amount) return false;
  leafCount -= amount;
  leafValue.textContent = leafCount;
  localStorage.setItem(SAVE_KEY, leafCount);
  return true;
}

let gamePaused = false;
let canTrim = true;

// ---------------- ВОДОРОСЛИ ----------------

seaweeds.forEach((sw, index) => {
  sw.style.position = 'absolute';
  sw.style.height = '60px';
  sw.style.left = (30 + index * 120) + 'px';
  sw.style.bottom = '0px';
});

// проверяет, находится ли краб достаточно близко к объекту (с запасом margin)
function isNear(a, b, margin = 30) {
  const r1 = a.getBoundingClientRect();
  const r2 = b.getBoundingClientRect();

  return !(
    r1.right + margin < r2.left ||
    r1.left - margin > r2.right ||
    r1.bottom + margin < r2.top ||
    r1.top - margin > r2.bottom
  );
}

seaweeds.forEach(sw => {
  sw.addEventListener('click', () => {
    if (!canTrim || gamePaused) return;
    if (!isNear(crab, sw)) return; // краб должен быть рядом с водорослью

    let h = parseInt(sw.style.height);

    if (h > 60) {
      h -= 20;
      sw.style.height = h + 'px';

      addLeaves(doubleLeafActive ? 2 : 1);
    }
  });
});

setInterval(() => {
  if (gamePaused) return;

  seaweeds.forEach(sw => {
    let h = parseInt(sw.style.height);
    const maxH = Number(sw.dataset.height) || 180;

    if (h < maxH) {
      h += 5;
      if (h > maxH) h = maxH;
      sw.style.height = h + 'px';
    }
  });
}, 1000);

// ---------------- УПРАВЛЕНИЕ КРАБОМ ----------------

const keys = {};

window.addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;
});

window.addEventListener('keyup', e => {
  keys[e.key.toLowerCase()] = false;
});

function updateCrab() {
  if (gamePaused) {
    requestAnimationFrame(updateCrab);
    return;
  }

  if (keys['arrowleft'] || keys['a']) crabX -= speed;
  if (keys['arrowright'] || keys['d']) crabX += speed;

  if (keys['arrowup'] || keys['w']) crabY += speed;
  if (keys['arrowdown'] || keys['s']) crabY -= speed;

  // верхняя граница: bottom (80 + crabY) не должен выталкивать краба за пределы #game
  const maxCrabY = gameContainer.clientHeight - crabHeight - 90;
  const maxCrabX = gameContainer.clientWidth - crabWidth;

  crabX = Math.max(0, Math.min(maxCrabX, crabX));
  crabY = Math.max(-60, Math.min(maxCrabY, crabY));

  crab.style.left = crabX + 'px';
  crab.style.bottom = (80 + crabY) + 'px';

  requestAnimationFrame(updateCrab);
}

updateCrab();

// ---------------- ЕЖИ ----------------

const urchin1 = document.getElementById('urchin1');
const urchin2 = document.getElementById('urchin2');

function spawnUrchin(urchin, index) {
  const seaweedArray = Array.from(seaweeds);
  const target = seaweedArray[index % seaweedArray.length];

  const x = target.offsetLeft + target.offsetWidth / 2 - 35;

  urchin.style.left = x + 'px';
  urchin.style.display = 'block';

  let biteInterval = setInterval(() => {
    if (urchin.style.display === 'none') {
      clearInterval(biteInterval);
      return;
    }

    if (gamePaused) return;

    let h = parseInt(target.style.height);

    // ❗ ЩИТ БЛОКИРУЕТ УКУС
    if (shieldActive) return;

    if (h > 60) {
      h -= 20;
      if (h < 60) h = 60;
      target.style.height = h + 'px';
    }
  }, 4000);
}

setTimeout(() => spawnUrchin(urchin1, 0), 20000);
setTimeout(() => spawnUrchin(urchin2, 1), 30000);

// ---------------- НАРАСТАЮЩАЯ СЛОЖНОСТЬ ----------------
// каждые 30 секунд игры крюк и кит становятся чуть быстрее (до предела)
setInterval(() => {
  if (gamePaused || gameOver) return;
  hookSpeed = Math.min(hookSpeed + 0.25, 7);
  whaleSpeed = Math.min(whaleSpeed + 0.15, 4.5);
}, 30000);

function isTouching(a, b) {
  const r1 = a.getBoundingClientRect();
  const r2 = b.getBoundingClientRect();

  return !(
    r1.right < r2.left ||
    r1.left > r2.right ||
    r1.bottom < r2.top ||
    r1.top > r2.bottom
  );
}

let canRepel = false;

window.addEventListener('keydown', e => {
  if (e.key.toLowerCase() === 'q') canRepel = true;
});

window.addEventListener('keyup', e => {
  if (e.key.toLowerCase() === 'q') canRepel = false;
});

function repelUrchin(urchin, index) {
  urchin.style.display = 'none';

  const respawnTime = 20000 + Math.random() * 20000;

  setTimeout(() => {
    if (!gamePaused) spawnUrchin(urchin, index);
    else setTimeout(() => spawnUrchin(urchin, index), 1000);
  }, respawnTime);
}

// ❗ ПОЛНОСТЬЮ ИСПРАВЛЕННЫЙ БЛОК СТОЛКНОВЕНИЙ
setInterval(() => {
  if (gamePaused) return;

  // ёж №1
  if (urchin1.style.display !== 'none') {
    if (isTouching(crab, urchin1)) {

      // 1. Q работает ВСЕГДА
      if (canRepel) {
        repelUrchin(urchin1, 0);
        return;
      }

      // 2. щит блокирует укус
      if (shieldActive) return;
    }
  }

  // ёж №2
  if (urchin2.style.display !== 'none') {
    if (isTouching(crab, urchin2)) {

      if (canRepel) {
        repelUrchin(urchin2, 1);
        return;
      }

      if (shieldActive) return;
    }
  }

}, 100);

// ---------------- КИТ ----------------

const whale = document.getElementById('whale');

let whaleDirection = 1;
let whaleSpeed = 2;
let whaleDisabled = false;

setInterval(() => {
  if (gamePaused) return;

  let x = whale.offsetLeft;
  x += whaleSpeed * whaleDirection;

  if (x > 800 - whale.width) whaleDirection = -1;
  if (x < 0) whaleDirection = 1;

  whale.style.left = x + 'px';
}, 20);

setInterval(() => {
  if (gamePaused) return;

  if (isTouching(crab, whale)) {

    if (shieldActive) return;

    if (!whaleDisabled) {
      whaleDisabled = true;
      canTrim = false;

      setTimeout(() => {
        canTrim = true;
        whaleDisabled = false;
      }, 5000);
    }
  }

}, 100);

// ---------------- МАГАЗИН ----------------

const shopBtn = document.getElementById('shop-button');
const shopOverlay = document.getElementById('shop-overlay');
const shopWindow = document.getElementById('shop-window');

let shopOpen = false;

function pauseGame() { gamePaused = true; }
function resumeGame() { gamePaused = false; }

shopBtn.addEventListener('click', () => {
  if (!shopOpen) {
    shopOverlay.style.display = 'block';
    shopWindow.style.display = 'flex';
    shopOpen = true;
    pauseGame();
    updateShopUI();
  } else {
    shopOverlay.style.display = 'none';
    shopWindow.style.display = 'none';
    shopOpen = false;
    resumeGame();
  }
});

shopOverlay.addEventListener('click', () => {
  shopOverlay.style.display = 'none';
  shopWindow.style.display = 'none';
  shopOpen = false;
  resumeGame();
});

// ---------------- ОБНОВЛЕНИЕ UI МАГАЗИНА ----------------
// показывает, что можно купить, а что уже активно, обновляется раз в секунду
const shopWrappers = {
  'speed-boost-wrapper': { cost: 30, isActive: () => speedBoostActive },
  'double-leaf-boost-wrapper': { cost: 50, isActive: () => doubleLeafActive },
  'auto-trim-boost-wrapper': { cost: 70, isActive: () => autoTrimActive },
  'shield-boost-wrapper': { cost: 40, isActive: () => shieldActive },
  'boot-boost-wrapper': { cost: 35, isActive: () => bootActive },
};

function updateShopUI() {
  Object.entries(shopWrappers).forEach(([id, info]) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle('active', info.isActive());
    el.classList.toggle('disabled', !info.isActive() && leafCount < info.cost);
  });
}

setInterval(() => {
  if (shopOpen) updateShopUI();
}, 500);

// ---------------- БУСТЕРЫ ----------------

let speedBoostActive = false;
const speedBoost = document.getElementById('speed-boost');

speedBoost.addEventListener('click', () => {
  if (speedBoostActive) return;
  if (!spendLeaves(30)) return;

  speedBoostActive = true;
  speed = baseSpeed * 2;
});

let doubleLeafActive = false;
let doubleLeafTimeout = null;
const doubleLeafBoost = document.getElementById('double-leaf-boost');

doubleLeafBoost.addEventListener('click', () => {
  if (!spendLeaves(50)) return;

  doubleLeafActive = true;

  if (doubleLeafTimeout) clearTimeout(doubleLeafTimeout);

  doubleLeafTimeout = setTimeout(() => {
    doubleLeafActive = false;
  }, 10 * 60 * 1000);
});

let autoTrimActive = false;
let autoTrimInterval = null;
let autoTrimTimeout = null;
const autoTrimBoost = document.getElementById('auto-trim-boost');

autoTrimBoost.addEventListener('click', () => {
  if (!spendLeaves(70)) return;

  autoTrimActive = true;

  if (autoTrimInterval) clearInterval(autoTrimInterval);
  if (autoTrimTimeout) clearTimeout(autoTrimTimeout);

  autoTrimInterval = setInterval(() => {
    if (gamePaused) return;

    const seaweedArray = Array.from(seaweeds);
    const target = seaweedArray[Math.floor(Math.random() * seaweedArray.length)];

    let h = parseInt(target.style.height);

    if (h > 60) {
      target.style.height = (h - 20) + 'px';
      addLeaves(doubleLeafActive ? 2 : 1);
    }
  }, 2000);

  autoTrimTimeout = setTimeout(() => {
    autoTrimActive = false;
    clearInterval(autoTrimInterval);
  }, 10 * 60 * 1000);
});

let shieldActive = false;
let shieldTimeout = null;
const shieldBoost = document.getElementById('shield-boost');

shieldBoost.addEventListener('click', () => {
  if (!spendLeaves(40)) return;

  shieldActive = true;
  crab.classList.add("crab-shield");

  if (shieldTimeout) clearTimeout(shieldTimeout);

  shieldTimeout = setTimeout(() => {
    shieldActive = false;
    crab.classList.remove("crab-shield");
  }, 3 * 60 * 1000);
});
const hook = document.getElementById('hook');

let hookX = 200;
let hookDirection = 1;
let hookSpeed = 3;

let hookY = 0;
let hookVerticalDirection = 1;
let hookVerticalSpeed = 1.5;
const hookMinY = 0;
const hookMaxY = 300; // крюк опускается в нижнюю часть экрана, где обычно плавает краб

let gameOver = false;
setInterval(() => {
  if (gamePaused || gameOver) return;

  hookX += hookSpeed * hookDirection;
  if (hookX > 740) hookDirection = -1;
  if (hookX < 0) hookDirection = 1;
  hook.style.left = hookX + 'px';

  hookY += hookVerticalSpeed * hookVerticalDirection;
  if (hookY > hookMaxY) hookVerticalDirection = -1;
  if (hookY < hookMinY) hookVerticalDirection = 1;
  hook.style.top = hookY + 'px';
}, 20);
setInterval(() => {
  if (gamePaused || gameOver) return;

if (isTouching(crab, hook)) {

    // ботинок спасает краба
    if (bootActive) {
        console.log("Краб коснулся крюка, но ботинок спас его!");
        return;
    }

    // иначе — смерть
    gameOver = true;
    gamePaused = true;

    console.log("Игра окончена — крюк поймал краба!");
    crab.style.filter = "grayscale(100%)";
    showGameOver();
}


}, 50);

// ---------------- GAME OVER / РЕСТАРТ ----------------

const gameOverOverlay = document.getElementById('game-over-overlay');
const restartBtn = document.getElementById('restart-btn');

function showGameOver() {
  gameOverOverlay.style.display = 'flex';
}

function restartGame() {
  gameOver = false;
  gamePaused = false;

  crab.style.filter = '';
  crabX = 100;
  crabY = 80;

  hookX = 200;
  hookY = 0;
  hookDirection = 1;
  hookSpeed = 3;
  hookVerticalDirection = 1;

  whaleSpeed = 2;
  whaleDirection = 1;

  gameOverOverlay.style.display = 'none';
}

restartBtn.addEventListener('click', restartGame);
let bootActive = false;
let bootTimeout = null;

const bootBoost = document.getElementById('boot-boost');

bootBoost.addEventListener('click', () => {
  if (!spendLeaves(35)) {
    console.log("Недостаточно листиков для ботинка");
    return;
  }

  console.log("Ботинок активирован на 2 минуты");

  bootActive = true;

  // удаляем старый ботинок, если он был
  const oldBoot = document.getElementById("hook-boot-img");
  if (oldBoot) oldBoot.remove();

  // создаём новый ботинок
  const bootImg = document.createElement("img");
  bootImg.src = "./img/boot.png";
  bootImg.classList.add("hook-boot");
  bootImg.id = "hook-boot-img";
console.log("Создаю ботинок:", bootImg);
console.log("Крюк:", hook);

  // прикрепляем ботинок к крюку
  hook.appendChild(bootImg);
console.log("Дети крюка:", hook.children);

  // сбрасываем старый таймер
  if (bootTimeout) clearTimeout(bootTimeout);

  // отключаем ботинок через 2 минуты
  bootTimeout = setTimeout(() => {
    bootActive = false;

    const b = document.getElementById("hook-boot-img");
    if (b) b.remove();

    console.log("Ботинок исчез — крюк снова опасен");
  }, 2 * 60 * 1000);
});


const bgMusic = document.getElementById('bg-music'); 
const soundBtn = document.getElementById('sound-button'); 
const soundIcon = document.getElementById('sound-icon'); 
let musicOn = false; 
soundBtn.addEventListener('click', () => { musicOn = !musicOn; 
  if (musicOn) { bgMusic.volume = 0.4; bgMusic.play(); 
    soundIcon.src = './img/sound-on.png'; 
  } else { bgMusic.pause(); 
    soundIcon.src = './img/sound-off.png'; } });