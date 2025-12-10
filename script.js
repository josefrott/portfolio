/* ============================================
UNIVERSAL CONTENT PROTECTION
Schützt alle Bilder & PDFs vor Right-Click Download
============================================ */

/**
 * Starte Schutz SOFORT - nicht warten auf DOMContentLoaded
 */
(function initProtection() {
  /**
   * Blockiere Right-Click global
   */
  document.addEventListener('contextmenu', (e) => {
    // Erlaubt Right-Click NUR auf Input & Textarea
    const allowedTags = ['INPUT', 'TEXTAREA'];
    
    if (!allowedTags.includes(e.target.tagName)) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      showProtectionMessage(e);
      return false;
    }
  }, true);

  /**
   * Blockiere Drag & Drop für Bilder
   */
  document.addEventListener('dragstart', (e) => {
    if (e.target.tagName === 'IMG' || e.target.tagName === 'CANVAS') {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, true);

  /**
   * Blockiere DevTools
   */
  document.addEventListener('keydown', (e) => {
    const isDevToolsKey = 
      e.key === 'F12' ||
      (e.ctrlKey && e.shiftKey && e.key === 'I') ||
      (e.ctrlKey && e.shiftKey && e.key === 'C') ||
      (e.metaKey && e.altKey && e.key === 'I') ||
      (e.metaKey && e.shiftKey && e.key === 'C');

    if (isDevToolsKey) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, true);

  /**
   * Zeige Schutz-Nachricht
   */
  function showProtectionMessage(event) {
    const message = document.createElement('div');
    message.textContent = '© 2025 Josef Rott';
    message.style.cssText = `
      position: fixed;
      left: ${event.clientX}px;
      top: ${event.clientY}px;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 8px 16px;
      border-radius: 4px;
      font-size: 12px;
      pointer-events: none;
      z-index: 10000;
      animation: fadeOut 2s ease-out forwards;
      font-weight: 500;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    `;

    document.body.appendChild(message);

    // Füge Animation einmalig hinzu
    if (!document.querySelector('style[data-protection="true"]')) {
      const style = document.createElement('style');
      style.setAttribute('data-protection', 'true');
      style.textContent = `
        @keyframes fadeOut {
          0% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-30px); }
        }
      `;
      document.head.appendChild(style);
    }

    setTimeout(() => message.remove(), 2000);
  }

  console.log('✓ Content Protection aktiviert');
})(); 

/* ============================================
PDF.js Integration for Portfolio PDFs
Optimiert für scharfe Darstellung
============================================ */

// Setup PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc =
'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// State map for each PDF instance
const pdfStates = new Map();

/**
* Initialize PDF and render first page
*/
async function initializePdf(wrapper) {
const pdfPath = wrapper.querySelector('.pdf-path').value;
const container = wrapper.querySelector('.pdf-container');
const canvas = wrapper.querySelector('.pdf-canvas');
const pageInfo = wrapper.querySelector('.pdf-page-info');
const prevBtn = wrapper.querySelector('.pdf-prev-btn');
const nextBtn = wrapper.querySelector('.pdf-next-btn');

try {
// Load PDF document with optimized settings
const pdf = await pdfjsLib.getDocument({
url: pdfPath,
cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
cMapPacked: true,
}).promise;

// Store state for this PDF instance
pdfStates.set(wrapper, {
pdf: pdf,
currentPage: 1,
isRendering: false,
totalPages: pdf.numPages
});

// Attach event listeners to navigation buttons
prevBtn.addEventListener('click', () => previousPage(wrapper));
nextBtn.addEventListener('click', () => nextPage(wrapper));

// Render first page
renderPage(wrapper, 1);
} catch (error) {
console.error(`Error loading PDF (${pdfPath}):`, error);
pageInfo.textContent = 'PDF could not be loaded';
}
}

/**
* Render single page to canvas with high quality and responsive scaling
*/
async function renderPage(wrapper, pageNum) {
const state = pdfStates.get(wrapper);
if (!state) return;

// Validate page number is within range
if (pageNum < 1 || pageNum > state.totalPages) return;
if (state.isRendering) return;

state.isRendering = true;

try {
const canvas = wrapper.querySelector('.pdf-canvas');
const container = wrapper.querySelector('.pdf-container');
const pageInfo = wrapper.querySelector('.pdf-page-info');
const page = await state.pdf.getPage(pageNum);

// Get actual container width for responsive scaling
const containerWidth = container.clientWidth;

// Device Pixel Ratio für High-DPI Displays (Retina, etc.)
const devicePixelRatio = window.devicePixelRatio || 1;

// Basis-Scale basierend auf Container-Breite
let baseScale = 1.5;
if (containerWidth <= 600) {
baseScale = 1.2; // Mobile
} else if (containerWidth <= 800) {
baseScale = 1.5; // Tablet
} else {
baseScale = 2.0; // Desktop: höhere Qualität
}

// Multipliziere mit Device Pixel Ratio für echte Auflösung
const effectiveScale = baseScale * devicePixelRatio;

const viewport = page.getViewport({ scale: effectiveScale });

// Setze Canvas-Größe (in echter Pixelauflösung)
canvas.width = viewport.width;
canvas.height = viewport.height;

// Setze CSS-Größe für Display (skaliert zurück auf logische Pixel)
canvas.style.width = (viewport.width / devicePixelRatio) + 'px';
canvas.style.height = (viewport.height / devicePixelRatio) + 'px';

// Rendering Context mit Antialiasing
const context = canvas.getContext('2d', {
alpha: false,
willReadFrequently: false
});

const renderContext = {
canvasContext: context,
viewport: viewport
};

// Render PDF page to canvas
await page.render(renderContext).promise;

// Update state with current page
state.currentPage = pageNum;
pageInfo.textContent = `Seite ${pageNum} von ${state.totalPages}`;

// Update button states based on current page
updateButtonStates(wrapper);

} catch (error) {
console.error('Error rendering page:', error);
} finally {
state.isRendering = false;
}
}

/**
* Navigate to previous page
*/
function previousPage(wrapper) {
const state = pdfStates.get(wrapper);
if (state && state.currentPage > 1) {
renderPage(wrapper, state.currentPage - 1);
}
}

/**
* Navigate to next page
*/
function nextPage(wrapper) {
const state = pdfStates.get(wrapper);
if (state && state.currentPage < state.totalPages) {
renderPage(wrapper, state.currentPage + 1);
}
}

/**
* Enable or disable navigation buttons based on current page position
*/
function updateButtonStates(wrapper) {
const state = pdfStates.get(wrapper);
const prevBtn = wrapper.querySelector('.pdf-prev-btn');
const nextBtn = wrapper.querySelector('.pdf-next-btn');

const isFirstPage = state.currentPage <= 1;
const isLastPage = state.currentPage >= state.totalPages;

prevBtn.disabled = isFirstPage;
nextBtn.disabled = isLastPage;

prevBtn.style.opacity = isFirstPage ? '0.5' : '1';
nextBtn.style.opacity = isLastPage ? '0.5' : '1';
}

/**
* Initialize all PDFs when DOM is ready
*/
document.addEventListener('DOMContentLoaded', () => {
const pdfWrappers = document.querySelectorAll('.pdf-wrapper');
pdfWrappers.forEach(wrapper => {
initializePdf(wrapper);
});
});

/**
* Re-render PDFs on window resize for responsiveness
* Debounced to prevent excessive re-rendering
*/
let resizeTimeout;
window.addEventListener('resize', () => {
clearTimeout(resizeTimeout);
resizeTimeout = setTimeout(() => {
pdfStates.forEach((state, wrapper) => {
renderPage(wrapper, state.currentPage);
});
}, 250);
});