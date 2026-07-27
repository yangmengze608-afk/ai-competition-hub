(() => {
  const colors = ['blue', 'green', 'purple', 'orange', 'pink'];
  const desktopPositions = [
    { x: 13, y: 23 },
    { x: 29, y: 11 },
    { x: 48, y: 18 },
    { x: 71, y: 11 },
    { x: 86, y: 27 },
    { x: 13, y: 68 },
    { x: 31, y: 82 },
    { x: 69, y: 81 },
    { x: 87, y: 67 },
    { x: 53, y: 8 },
  ];
  const mobilePositions = [
    { x: 25, y: 20 },
    { x: 72, y: 22 },
    { x: 23, y: 76 },
    { x: 72, y: 78 },
  ];

  const ENTER_MS = 850;
  const HOLD_MS = 2700;
  const EXIT_MS = 850;
  const GAP_MS = 300;

  let timers = [];
  let index = 0;
  let paused = false;
  let currentCompetition = null;

  function clearTimers() {
    timers.forEach((timer) => clearTimeout(timer));
    timers = [];
  }

  function later(fn, delay) {
    const timer = setTimeout(fn, delay);
    timers.push(timer);
    return timer;
  }

  function clearLineFocus(network) {
    network.querySelectorAll('[data-line]').forEach((line) => {
      line.classList.remove('focus-active');
    });
  }

  function focusLines(network, positionIndex) {
    clearLineFocus(network);
    network.querySelectorAll('[data-line]').forEach((line) => {
      const a = Number(line.dataset.a);
      const b = Number(line.dataset.b);
      if (a === positionIndex || b === positionIndex) {
        line.classList.add('focus-active');
      }
    });
  }

  function setup() {
    clearTimers();
    paused = false;

    const network = document.querySelector('[data-network]');
    if (!network || location.hash.slice(1).split('?')[0] !== '/') return;

    network.querySelector('[data-focus-competition]')?.remove();

    const competitions = window.AI_DATA?.competitions || [];
    if (!competitions.length) return;

    const node = document.createElement('button');
    node.type = 'button';
    node.className = 'focus-competition-node node-blue';
    node.dataset.focusCompetition = '';
    node.setAttribute('aria-live', 'polite');
    node.innerHTML = '<span class="node-dot"></span><span class="focus-competition-title" data-focus-title></span>';
    network.appendChild(node);

    const title = node.querySelector('[data-focus-title]');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function setCompetition() {
      const positions = window.innerWidth <= 720 ? mobilePositions : desktopPositions;
      const competition = competitions[index % competitions.length];
      const positionIndex = index % positions.length;
      const position = positions[positionIndex];
      const color = colors[index % colors.length];

      currentCompetition = competition;
      node.classList.remove(...colors.map((name) => `node-${name}`), 'is-visible', 'is-paused');
      node.classList.add(`node-${color}`);
      node.style.left = `${position.x}%`;
      node.style.top = `${position.y}%`;
      title.textContent = competition.title;
      focusLines(network, positionIndex);
    }

    function showNext() {
      clearTimers();
      setCompetition();

      requestAnimationFrame(() => {
        requestAnimationFrame(() => node.classList.add('is-visible'));
      });

      if (reducedMotion) return;
      later(beginExit, ENTER_MS + HOLD_MS);
    }

    function beginExit() {
      if (paused) return;
      node.classList.remove('is-visible');
      clearLineFocus(network);
      later(() => {
        index += 1;
        showNext();
      }, EXIT_MS + GAP_MS);
    }

    node.addEventListener('mouseenter', () => {
      if (reducedMotion) return;
      paused = true;
      clearTimers();
      node.classList.add('is-paused', 'is-visible');
    });

    node.addEventListener('mouseleave', () => {
      if (reducedMotion) return;
      paused = false;
      node.classList.remove('is-paused');
      later(beginExit, 1100);
    });

    node.addEventListener('click', () => {
      if (!currentCompetition) return;
      location.hash = `/competitions/${encodeURIComponent(currentCompetition.id)}`;
    });

    showNext();
  }

  window.addEventListener('DOMContentLoaded', () => setTimeout(setup, 0));
  window.addEventListener('hashchange', () => setTimeout(setup, 0));
  window.addEventListener('pagehide', clearTimers);
})();
