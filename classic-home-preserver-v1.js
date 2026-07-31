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
    const classicStage = main?.querySelector('[data-classic-home]');
    if (!main || !decisionHome || !classicStage) return;

    // home-decision-v2 creates the classic stage with the original hero only.
    // Move every captured original homepage node into that same stage, preserving
    // the exact original order and the real nodes with their bound interactions.
    capturedNodes.forEach((node) => classicStage.appendChild(node));
    decisionHome.before(classicStage);
    decisionHome.dataset.classicHomeBelow = 'true';
  }

  // Loaded after commercial-app-v3 and before home-decision-v2, so the classic
  // homepage is captured after it renders and restored after the decision layer.
  window.addEventListener('DOMContentLoaded', captureClassicHome);
  window.addEventListener('hashchange', captureClassicHome);
})();
