const revealElements = document.querySelectorAll('.reveal');
const trackedSections = [...document.querySelectorAll('.tracked-section')];
const scrollMapItems = [...document.querySelectorAll('.scroll-map-item')];
const pointChips = [...document.querySelectorAll('.point-chip')];
const topicModal = document.querySelector('#topic-modal');
const topicModalFrame = document.querySelector('.topic-modal-frame');
const topicModalTitle = document.querySelector('#topic-modal-title');
const topicModalDescription = document.querySelector('#topic-modal-description');
const topicModalImage = document.querySelector('#topic-modal-image');
const scrollProgress = document.querySelector('.scroll-progress');
const exploreSection = document.querySelector('#explore');
const root = document.documentElement;

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.16,
    rootMargin: '0px 0px -8% 0px',
  }
);

revealElements.forEach((element) => {
  revealObserver.observe(element);
});

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

// Replace these with your actual image paths for the popup right-side images.
const POPUP_IMAGES = {
  campus: 'assets/unlock-campus.jpg',
  simulative: 'assets/unlock-simulative.jpg',
  alumni: 'assets/unlock-alumni.jpg',
};

const unlockContentMap = {
  campus: {
    title: 'Campus Walkthrough',
    description:
      'Explore classrooms, corridors, and core facilities with the same overall flow as the real campus, so visitors can understand how daily school life moves through the building.',
    image: POPUP_IMAGES.campus,
  },
  simulative: {
    title: 'Simulative Environment',
    description:
      'The world is built to recreate atmosphere and spatial feeling, giving a practical sense of scale and movement that static photos cannot communicate.',
    image: POPUP_IMAGES.simulative,
  },
  alumni: {
    title: "Alumni's Memory",
    description:
      'Alumni and current students can revisit familiar places, reconnect with shared memories, and pass down campus stories through an accessible digital world.',
    image: POPUP_IMAGES.alumni,
  },
};

const setUnlockContent = (key, triggerElement = null) => {
  const content = unlockContentMap[key];
  if (!content || !topicModal || !topicModalTitle || !topicModalDescription || !topicModalImage) return;

  topicModalTitle.textContent = content.title;
  topicModalDescription.textContent = content.description;
  topicModalImage.style.backgroundImage = `url("${content.image}")`;

  if (topicModalFrame && triggerElement instanceof HTMLElement) {
    const triggerRect = triggerElement.getBoundingClientRect();
    const triggerCenterX = triggerRect.left + triggerRect.width / 2;
    const triggerCenterY = triggerRect.top + triggerRect.height / 2;
    const viewportCenterX = window.innerWidth / 2;
    const viewportCenterY = window.innerHeight / 2;
    const fromX = triggerCenterX - viewportCenterX;
    const fromY = triggerCenterY - viewportCenterY;
    const fromScale = clamp(triggerRect.width / window.innerWidth, 0.18, 0.42);
    topicModalFrame.style.setProperty('--modal-from-x', `${fromX.toFixed(1)}px`);
    topicModalFrame.style.setProperty('--modal-from-y', `${fromY.toFixed(1)}px`);
    topicModalFrame.style.setProperty('--modal-from-scale', `${fromScale.toFixed(3)}`);
  } else if (topicModalFrame) {
    topicModalFrame.style.setProperty('--modal-from-x', '0px');
    topicModalFrame.style.setProperty('--modal-from-y', '20px');
    topicModalFrame.style.setProperty('--modal-from-scale', '0.92');
  }

  topicModal.classList.remove('is-open');
  topicModal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  requestAnimationFrame(() => {
    topicModal.classList.add('is-open');
  });

  pointChips.forEach((chip) => {
    chip.classList.toggle('is-active', chip.dataset.key === key);
  });
};

const closeTopicModal = () => {
  if (!topicModal) return;
  topicModal.classList.remove('is-open');
  topicModal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  pointChips.forEach((chip) => chip.classList.remove('is-active'));
};

const updateVideoDarkness = () => {
  const scrollY = window.scrollY || window.pageYOffset;
  const fallbackDistance = Math.max((document.documentElement.scrollHeight - window.innerHeight) * 0.55, 1);
  const targetY = exploreSection
    ? Math.max(exploreSection.getBoundingClientRect().top + scrollY, 1)
    : fallbackDistance;
  const darkness = clamp(scrollY / targetY, 0, 1);
  root.style.setProperty('--scroll-darkness', darkness.toFixed(3));
};

const updatePageProgress = () => {
  const scrollY = window.scrollY || window.pageYOffset;
  const maxScrollable = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
  const progress = clamp(scrollY / maxScrollable, 0, 1);
  root.style.setProperty('--page-progress', progress.toFixed(3));
};

const updateScrollHighlights = () => {
  if (!trackedSections.length) return;

  const viewportHeight = window.innerHeight;
  const progresses = trackedSections.map((section) => {
    const rect = section.getBoundingClientRect();
    const start = viewportHeight * 0.82;
    const end = viewportHeight * 0.22;
    const distance = rect.height + (start - end);
    const progress = clamp((start - rect.top) / distance, 0, 1);
    section.style.setProperty('--title-progress', progress.toFixed(3));
    return progress;
  });

  const activationLine = viewportHeight * 0.45;
  let activeIndex = -1;
  trackedSections.forEach((section, index) => {
    const rect = section.getBoundingClientRect();
    if (rect.top <= activationLine) {
      activeIndex = index;
    }
  });

  scrollMapItems.forEach((item, index) => {
    const progress = progresses[index] ?? 0;
    item.style.setProperty('--item-progress', progress.toFixed(3));
    item.classList.toggle('is-active', index === activeIndex);
  });
};

const updateOnScroll = () => {
  updateVideoDarkness();
  updatePageProgress();
  updateScrollHighlights();
};

let uiFrameId = 0;
const scheduleUiUpdate = () => {
  if (uiFrameId) return;
  uiFrameId = requestAnimationFrame(() => {
    uiFrameId = 0;
    updateOnScroll();
  });
};

const scrollToProgress = (progress) => {
  const maxScrollable = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
  const targetY = progress * maxScrollable;
  window.scrollTo({ top: targetY, behavior: 'auto' });
  root.style.setProperty('--page-progress', clamp(progress, 0, 1).toFixed(3));
};

updateScrollHighlights();
updateVideoDarkness();
updatePageProgress();
window.addEventListener('scroll', scheduleUiUpdate, { passive: true });
window.addEventListener('resize', updateOnScroll);

pointChips.forEach((chip) => {
  chip.addEventListener('click', () => {
    setUnlockContent(chip.dataset.key, chip);
  });
});

scrollMapItems.forEach((item) => {
  item.addEventListener('click', () => {
    scrollMapItems.forEach((other) => other.classList.remove('is-active'));
    item.classList.add('is-active');
  });
});

topicModal?.addEventListener('click', (event) => {
  if (!(event.target instanceof HTMLElement)) return;
  if (event.target.dataset.modalClose === 'true') {
    closeTopicModal();
  }
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeTopicModal();
  }
});

if (scrollProgress) {
  let isProgressDragging = false;
  let progressRect = null;

  const refreshProgressRect = () => {
    progressRect = scrollProgress.getBoundingClientRect();
  };

  const progressFromPointer = (clientY) => {
    if (!progressRect) refreshProgressRect();
    if (!progressRect) return 0;
    return clamp((clientY - progressRect.top) / progressRect.height, 0, 1);
  };

  scrollProgress.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    isProgressDragging = true;
    refreshProgressRect();
    scrollProgress.setPointerCapture(event.pointerId);
    scrollToProgress(progressFromPointer(event.clientY));
  });

  scrollProgress.addEventListener('pointermove', (event) => {
    if (!isProgressDragging) return;
    scrollToProgress(progressFromPointer(event.clientY));
  });

  const stopProgressDragging = (event) => {
    if (!isProgressDragging) return;
    isProgressDragging = false;
    if (scrollProgress.hasPointerCapture(event.pointerId)) {
      scrollProgress.releasePointerCapture(event.pointerId);
    }
  };

  scrollProgress.addEventListener('pointerup', stopProgressDragging);
  scrollProgress.addEventListener('pointercancel', stopProgressDragging);
  window.addEventListener('resize', refreshProgressRect);
}
