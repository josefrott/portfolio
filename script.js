/* ============================================
   PDF.js Integration for Portfolio PDFs
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
        // Load PDF document
        const pdf = await pdfjsLib.getDocument(pdfPath).promise;
        
        // Store state
        pdfStates.set(wrapper, {
            pdf: pdf,
            currentPage: 1,
            isRendering: false,
            totalPages: pdf.numPages
        });

        // Attach event listeners
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
 * Render single page to canvas
 */
async function renderPage(wrapper, pageNum) {
    const state = pdfStates.get(wrapper);
    if (!state) return;

    // Validate page number
    if (pageNum < 1 || pageNum > state.totalPages) return;
    if (state.isRendering) return;

    state.isRendering = true;

    try {
        const canvas = wrapper.querySelector('.pdf-canvas');
        const pageInfo = wrapper.querySelector('.pdf-page-info');
        const page = await state.pdf.getPage(pageNum);

        // Calculate viewport (responsive)
        const scale = window.innerWidth < 768 ? 1.5 : 2;
        const viewport = page.getViewport({ scale: scale });

        // Set canvas dimensions
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Render page to canvas
        const context = canvas.getContext('2d');
        const renderContext = {
            canvasContext: context,
            viewport: viewport
        };

        await page.render(renderContext).promise;

        // Update state
        state.currentPage = pageNum;
        pageInfo.textContent = `Page ${pageNum} of ${state.totalPages}`;

        // Update button states
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
    if (state) {
        renderPage(wrapper, state.currentPage - 1);
    }
}

/**
 * Navigate to next page
 */
function nextPage(wrapper) {
    const state = pdfStates.get(wrapper);
    if (state) {
        renderPage(wrapper, state.currentPage + 1);
    }
}

/**
 * Enable/Disable navigation buttons based on current page
 */
function updateButtonStates(wrapper) {
    const state = pdfStates.get(wrapper);
    const prevBtn = wrapper.querySelector('.pdf-prev-btn');
    const nextBtn = wrapper.querySelector('.pdf-next-btn');

    prevBtn.disabled = state.currentPage <= 1;
    nextBtn.disabled = state.currentPage >= state.totalPages;

    prevBtn.style.opacity = state.currentPage <= 1 ? '0.5' : '1';
    nextBtn.style.opacity = state.currentPage >= state.totalPages ? '0.5' : '1';
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

/* Right-click/Save disabled */
document.addEventListener("contextmenu", (e) => {
  if (e.target.tagName === "IMG") {
    if (
      e.target.parentElement.tagName === "BOX1" ||
      e.target.parentElement.tagName === "BOX2" ||
      e.target.parentElement.tagName === "BOX3"
    ) {
      e.preventDefault();
    }
  }
});
