/**
 * Task Manager - Client Side Interactivity
 * Features:
 *  - Real-time client side search & filter for task cards
 *  - Live character counters for Title & Description inputs
 *  - URL-based Toast notifications (?created=true / ?deleted=true)
 *  - Clipboard copy functionality on Task Detail view
 *  - Confirmation modal for task deletion
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Toast Notification Handler (Reads query params)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('created')) {
    showToast('Task created and saved to .txt successfully!', 'success');
    // Clean URL query param without reloading
    window.history.replaceState({}, document.title, window.location.pathname);
  } else if (urlParams.has('deleted')) {
    showToast('Task file deleted successfully.', 'info');
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  // 2. Real-time Search Filter on Home Page
  const searchInput = document.getElementById('taskSearch');
  if (searchInput) {
    const cards = document.querySelectorAll('.task-card');
    const noResultsMsg = document.getElementById('noSearchResults');
    const statsCount = document.getElementById('statsCount');

    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      let visibleCount = 0;

      cards.forEach((card) => {
        const title = card.getAttribute('data-title') || '';
        const preview = card.getAttribute('data-preview') || '';

        if (title.includes(query) || preview.includes(query)) {
          card.style.display = 'flex';
          visibleCount++;
        } else {
          card.style.display = 'none';
        }
      });

      if (statsCount) {
        statsCount.textContent = visibleCount;
      }

      if (noResultsMsg) {
        noResultsMsg.style.display = (visibleCount === 0 && cards.length > 0) ? 'block' : 'none';
      }
    });
  }

  // 3. Live Character Counters on Create Page
  const titleInput = document.getElementById('taskTitle');
  const titleCounter = document.getElementById('titleCounter');
  if (titleInput && titleCounter) {
    titleInput.addEventListener('input', () => {
      titleCounter.textContent = `${titleInput.value.length} / 80`;
    });
  }

  const descInput = document.getElementById('taskDescription');
  const descCounter = document.getElementById('descCounter');
  if (descInput && descCounter) {
    descInput.addEventListener('input', () => {
      descCounter.textContent = `${descInput.value.length} chars`;
    });
  }

  // 4. Form Validation feedback on Create Task
  const createTaskForm = document.getElementById('createTaskForm');
  if (createTaskForm) {
    createTaskForm.addEventListener('submit', (e) => {
      const title = titleInput ? titleInput.value.trim() : '';
      const desc = descInput ? descInput.value.trim() : '';

      if (!title || !desc) {
        e.preventDefault();
        showToast('Please fill in both the title and description.', 'error');
        if (!title && titleInput) titleInput.focus();
        else if (!desc && descInput) descInput.focus();
      }
    });
  }

  // 5. Copy Task Content Button on Detail Page
  const copyBtn = document.getElementById('copyTaskBtn');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const title = document.querySelector('.detail-title')?.innerText || '';
      const desc = document.querySelector('.detail-description')?.innerText || '';
      const fullText = `Title: ${title}\n\nDescription:\n${desc}`;

      navigator.clipboard.writeText(fullText).then(() => {
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = '<span>&#10003; Copied!</span>';
        copyBtn.classList.add('btn-primary');
        setTimeout(() => {
          copyBtn.innerHTML = originalText;
          copyBtn.classList.remove('btn-primary');
        }, 2000);
      }).catch(err => {
        console.error('Failed to copy: ', err);
      });
    });
  }
});

/**
 * Displays a non-intrusive floating toast notification
 */
function showToast(message, type = 'success') {
  // Remove existing toast if present
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  
  let icon = '&#10004;'; // checkmark
  if (type === 'error') icon = '&#9888;';
  if (type === 'info') icon = '&#9432;';

  toast.innerHTML = `
    <span style="font-size: 1.2rem; line-height: 1;">${icon}</span>
    <span style="font-weight: 500;">${message}</span>
  `;

  if (type === 'error') {
    toast.style.borderColor = 'var(--danger-border)';
    toast.style.background = '#2a1215';
  }

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
