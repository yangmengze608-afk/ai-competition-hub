(() => {
  const colors = ['blue', 'green', 'purple', 'orange', 'pink'];
  // 仅使用首屏四周的安全位置，避开顶部说明徽章、主标题、正文和搜索框。
  const desktopPositions = [
    { x: 17, y: 22 },
    { x: 83, y: 22 },
    { x: 11, y: 48 },
    { x: 89, y: 48 },
    { x: 17, y: 76 },
    { x: 83, y: 76 },
    { x: 27, y: 89 },
    { x: 73, y: 89 },
  ];
  const mobilePositions = [
    { x: 22, y: 18 },
    { x: 78, y: 80 },
    { x: 20, y: 84 },
    { x: 80, y: 18 },
  ];

  const ENTER_MS = 850;
  const HOLD_MS = 2700;
  const EXIT_MS = 850;
  const GAP_MS = 300;
  const STAGGER_MS = 1450;
  const MAX_DESKTOP_NODES = 3;
  const MAX_MOBILE_NODES = 2;

  let allTimers = [];
  let competitionCursor = 0;
  let positionCursor = 0;
  let activeStates = [];

  function later(fn, delay, state) {
    const timer = setTimeout(fn, delay);
    allTimers.push(timer);
    state?.timers.push(timer);
    return timer;
  }

  function clearStateTimers(state) {
    state.timers.forEach((timer) => clearTimeout(timer));
    state.timers = [];
  }

  function clearAllTimers() {
    allTimers.forEach((timer) => clearTimeout(timer));
    allTimers = [];
    activeStates.forEach(clearStateTimers);
  }

  function refreshLineFocus(network) {
    const visiblePositions = new Set(
      activeStates
        .filter((state) => state.node.classList.contains('is-visible'))
        .map((state) => Number(state.node.dataset.positionIndex)),
    );

    network.querySelectorAll('[data-line]').forEach((line) => {
      const a = Number(line.dataset.a);
      const b = Number(line.dataset.b);
      line.classList.toggle('focus-active', visiblePositions.has(a) || visiblePositions.has(b));
    });
  }

  function nextAvailablePosition(positions) {
    const occupied = new Set(
      activeStates
        .filter((state) => state.node.classList.contains('is-visible'))
        .map((state) => Number(state.node.dataset.positionIndex)),
    );

    for (let offset = 0; offset < positions.length; offset += 1) {
      const candidate = (positionCursor + offset) % positions.length;
      if (!occupied.has(candidate)) {
        positionCursor = candidate + 1;
        return candidate;
      }
    }

    const fallback = positionCursor % positions.length;
    positionCursor += 1;
    return fallback;
  }

  function setup() {
    clearAllTimers();
    activeStates.forEach((state) => state.node.remove());
    activeStates = [];

    const network = document.querySelector('[data-network]');
    if (!network || location.hash.slice(1).split('?')[0] !== '/') return;

    network.querySelectorAll('[data-focus-competition]').forEach((node) => node.remove());

    const competitions = window.AI_DATA?.competitions || [];
    if (!competitions.length) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const slotCount = window.innerWidth <= 720 ? MAX_MOBILE_NODES : MAX_DESKTOP_NODES;

    function createState(slotIndex) {
      const node = document.createElement('button');
      node.type = 'button';
      node.className = 'focus-competition-node node-blue';
      node.dataset.focusCompetition = String(slotIndex);
      node.setAttribute('aria-live', slotIndex === 0 ? 'polite' : 'off');
      node.innerHTML = '<span class="node-dot"></span><span class="focus-competition-title" data-focus-title></span>';
      network.appendChild(node);

      const state = {
        slotIndex,
        node,
        title: node.querySelector('[data-focus-title]'),
        timers: [],
        paused: false,
        currentCompetition: null,
      };

      function setCompetition() {
        const positions = window.innerWidth <= 720 ? mobilePositions : desktopPositions;
        const competition = competitions[competitionCursor % competitions.length];
        competitionCursor += 1;
        const positionIndex = nextAvailablePosition(positions);
        const position = positions[positionIndex];
        const color = colors[(competitionCursor + slotIndex) % colors.length];

        state.currentCompetition = competition;
        node.classList.remove(...colors.map((name) => `node-${name}`), 'is-visible', 'is-paused');
        node.classList.add(`node-${color}`);
        node.style.left = `${position.x}%`;
        node.style.top = `${position.y}%`;
        node.dataset.positionIndex = String(positionIndex);
        state.title.textContent = competition.title;
      }

      function showNext() {
        clearStateTimers(state);
        setCompetition();

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            node.classList.add('is-visible');
            refreshLineFocus(network);
          });
        });

        if (reducedMotion) return;
        later(beginExit, ENTER_MS + HOLD_MS, state);
      }

      function beginExit() {
        if (state.paused) return;
        node.classList.remove('is-visible');
        later(() => refreshLineFocus(network), EXIT_MS / 2, state);
        later(showNext, EXIT_MS + GAP_MS, state);
      }

      node.addEventListener('mouseenter', () => {
        if (reducedMotion) return;
        state.paused = true;
        clearStateTimers(state);
        node.classList.add('is-paused', 'is-visible');
        refreshLineFocus(network);
      });

      node.addEventListener('mouseleave', () => {
        if (reducedMotion) return;
        state.paused = false;
        node.classList.remove('is-paused');
        later(beginExit, 1100, state);
      });

      node.addEventListener('click', () => {
        if (!state.currentCompetition) return;
        location.hash = `/competitions/${encodeURIComponent(state.currentCompetition.id)}`;
      });

      return { state, showNext };
    }

    const slots = Array.from({ length: slotCount }, (_, slotIndex) => createState(slotIndex));
    activeStates = slots.map(({ state }) => state);

    slots.forEach(({ showNext, state }, slotIndex) => {
      if (reducedMotion) {
        showNext();
      } else {
        later(showNext, slotIndex * STAGGER_MS, state);
      }
    });
  }

  window.addEventListener('DOMContentLoaded', () => setTimeout(setup, 0));
  window.addEventListener('hashchange', () => setTimeout(setup, 0));
  window.addEventListener('pagehide', clearAllTimers);
})();
