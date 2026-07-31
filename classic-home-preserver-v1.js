(() => {
  let capturedNodes = [];

  function currentPath() {
    return location.hash.slice(1).split('?')[0] || '/';
  }

  function captureClassicHome() {
    if (currentPath() !== '/') {
      capturedNodes = [];
      return;
    }
    const main = document.querySelector('main');
    if (!main) return;
    const nodes = Array.from(main.children);
    if (!nodes.some((node) => node.classList?.contains('hero-section'))) return;
    capturedNodes = nodes;
    setTimeout(restoreClassicHome, 0);
  }

  function restoreClassicHome() {
    if (currentPath() !== '/' || !capturedNodes.length) return;
    const main = document.querySelector('main');
    const decisionHome = main?.querySelector('.decision-home');
    if (!main || !decisionHome) return;

    // home-decision-v2 previously retained only the search hero in a wrapper.
    // Remove that temporary wrapper, then restore every original homepage node
    // in its exact original order before the decision experience.
    main.querySelector('.classic-home-stage')?.remove();
    capturedNodes.forEach((node) => decisionHome.before(node));
    decisionHome.dataset.classicHomeBelow = 'true';
  }

  // Loaded after commercial-app-v3 and before home-decision-v2, so the classic
  // homepage is captured after it renders and restored after the decision layer.
  window.addEventListener('DOMContentLoaded', captureClassicHome);
  window.addEventListener('hashchange', captureClassicHome);
})();
