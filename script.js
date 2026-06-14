const copyButton = document.querySelector("[data-copy-target]");
const copyStatus = document.querySelector(".copy-status");

if (copyButton && copyStatus) {
  copyButton.addEventListener("click", async () => {
    const targetId = copyButton.getAttribute("data-copy-target");
    const target = targetId ? document.getElementById(targetId) : null;
    if (!target) return;

    try {
      await navigator.clipboard.writeText(target.textContent.trim());
      copyStatus.textContent = "Copied.";
    } catch {
      copyStatus.textContent = "Select the text to copy.";
    }

    window.setTimeout(() => {
      copyStatus.textContent = "";
    }, 2200);
  });
}

const siteHeader = document.querySelector(".site-header");
const navElement = document.querySelector(".site-header nav");
const navIndicator = navElement ? document.createElement("span") : null;
const readingProgress = siteHeader ? document.createElement("span") : null;
const navItems = Array.from(
  document.querySelectorAll('.site-header nav a[href^="#"]')
)
  .map((link) => {
    const id = link.getAttribute("href")?.slice(1);
    const section = id ? document.getElementById(id) : null;
    return section ? { id, link, section } : null;
  })
  .filter(Boolean);

let setActiveNavItem = () => {};
let getActiveSectionId = () => null;
let pendingNavTargetId = null;
let pendingNavUnlockTimer = null;

if (navElement && navIndicator) {
  navIndicator.className = "nav-indicator";
  navIndicator.setAttribute("aria-hidden", "true");
  navElement.prepend(navIndicator);
}

if (siteHeader && readingProgress) {
  readingProgress.className = "reading-progress";
  readingProgress.setAttribute("aria-hidden", "true");
  siteHeader.append(readingProgress);
}

const moveNavIndicator = (link) => {
  if (!navIndicator) return;

  if (!link) {
    navIndicator.style.opacity = "0";
    return;
  }

  navIndicator.style.width = `${link.offsetWidth}px`;
  navIndicator.style.height = `${link.offsetHeight}px`;
  navIndicator.style.transform = `translate3d(${link.offsetLeft}px, ${link.offsetTop}px, 0)`;
  navIndicator.style.opacity = "1";
};

const updateReadingProgress = () => {
  if (!readingProgress) return;

  const maxScroll =
    document.documentElement.scrollHeight - window.innerHeight;
  const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  readingProgress.style.transform = `scaleX(${clampedProgress})`;
};

const getHeaderOffset = () => (siteHeader ? siteHeader.offsetHeight : 0);

const scheduleNavIndicatorMove = (link) => {
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      moveNavIndicator(link);
    });
  });
};

const unlockPendingNavTarget = () => {
  pendingNavTargetId = null;

  if (pendingNavUnlockTimer) {
    window.clearTimeout(pendingNavUnlockTimer);
    pendingNavUnlockTimer = null;
  }
};

const maybeUnlockPendingNavTarget = () => {
  if (!pendingNavTargetId) return;

  const pendingItem = navItems.find(({ id }) => id === pendingNavTargetId);
  if (!pendingItem) {
    unlockPendingNavTarget();
    return;
  }

  const distanceToTarget = Math.abs(
    pendingItem.section.getBoundingClientRect().top - getHeaderOffset()
  );

  if (distanceToTarget < 18) {
    unlockPendingNavTarget();
  }
};

if (navItems.length) {

  setActiveNavItem = (activeId) => {
    let activeLink = null;

    navItems.forEach(({ id, link }) => {
      const isActive = id === activeId;
      link.classList.toggle("is-active", isActive);

      if (isActive) {
        activeLink = link;
        link.setAttribute("aria-current", "true");

        if (link.parentElement?.scrollWidth > link.parentElement.clientWidth) {
          link.scrollIntoView({
            block: "nearest",
            inline: "nearest",
          });
        }
      } else {
        link.removeAttribute("aria-current");
      }
    });

    scheduleNavIndicatorMove(activeLink);
  };

  getActiveSectionId = () => {
    const headerOffset = getHeaderOffset();
    const probeY = window.scrollY + headerOffset + 36;
    const firstSectionTop = navItems[0].section.offsetTop;
    const pageBottom =
      window.scrollY + window.innerHeight >=
      document.documentElement.scrollHeight - 2;

    if (probeY < firstSectionTop) return null;
    if (pageBottom) return navItems[navItems.length - 1].id;

    const visibleItem = navItems.reduce(
      (bestItem, item) => {
        const rect = item.section.getBoundingClientRect();
        const visibleHeight = Math.max(
          0,
          Math.min(rect.bottom, window.innerHeight) -
            Math.max(rect.top, headerOffset)
        );

        return visibleHeight > bestItem.visibleHeight
          ? { id: item.id, visibleHeight }
          : bestItem;
      },
      { id: null, visibleHeight: 0 }
    );

    if (visibleItem.visibleHeight > 80) return visibleItem.id;

    return navItems.reduce((activeId, item) => {
      return item.section.offsetTop <= probeY ? item.id : activeId;
    }, navItems[0].id);
  };

  let navFrame = null;

  const updateActiveNav = () => {
    if (navFrame) return;

    navFrame = window.requestAnimationFrame(() => {
      updateReadingProgress();
      maybeUnlockPendingNavTarget();

      if (!pendingNavTargetId) {
        setActiveNavItem(getActiveSectionId());
      }

      navFrame = null;
    });
  };

  window.addEventListener("scroll", updateActiveNav, { passive: true });
  navElement?.addEventListener("scroll", () => {
    const activeLink = navElement.querySelector("a.is-active");
    moveNavIndicator(activeLink);
  }, { passive: true });
  window.addEventListener("resize", updateActiveNav);
  updateActiveNav();
} else {
  updateReadingProgress();
  window.addEventListener("scroll", updateReadingProgress, { passive: true });
  window.addEventListener("resize", updateReadingProgress);
}

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const id = link.getAttribute("href");
    const target = id ? document.querySelector(id) : null;
    if (!target) return;
    event.preventDefault();

    const isNavLink = link.closest(".site-header nav");
    if (isNavLink && navItems.some((item) => item.id === target.id)) {
      pendingNavTargetId = target.id;

      if (pendingNavUnlockTimer) {
        window.clearTimeout(pendingNavUnlockTimer);
      }

      pendingNavUnlockTimer = window.setTimeout(() => {
        unlockPendingNavTarget();
        setActiveNavItem(getActiveSectionId());
      }, 1000);
    }

    setActiveNavItem(target.id);
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

const videoMounts = document.querySelectorAll("[data-video-group]");

const createVideoCard = (videoItem) => {
  const figure = document.createElement("figure");
  figure.className = "video-card";

  const video = document.createElement("video");
  video.src = videoItem.src;
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.preload = "metadata";
  video.controls = true;

  if (videoItem.poster) {
    video.poster = videoItem.poster;
  }

  figure.append(video);

  if (videoItem.caption) {
    const caption = document.createElement("figcaption");
    caption.textContent = videoItem.caption;
    figure.append(caption);
  }

  return figure;
};

const observeVideos = (videos) => {
  if (!("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const video = entry.target;

        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    },
    { threshold: 0.35 }
  );

  videos.forEach((video) => observer.observe(video));
};

const renderVideoFigures = async () => {
  if (!videoMounts.length) return;

  try {
    const response = await fetch("assets/videos/videos.json", { cache: "no-store" });
    if (!response.ok) {
      videoMounts.forEach((mount) => {
        mount.hidden = true;
      });
      return;
    }

    const videoGroups = await response.json();
    const renderedVideos = [];

    videoMounts.forEach((mount) => {
      const groupKey = mount.dataset.videoGroup;
      const videos = Array.isArray(videoGroups[groupKey])
        ? videoGroups[groupKey]
        : [];

      if (!videos.length) {
        mount.hidden = true;
        return;
      }

      videos.forEach((videoItem) => {
        const card = createVideoCard(videoItem);
        mount.append(card);
        renderedVideos.push(card.querySelector("video"));
      });
    });

    observeVideos(renderedVideos);
  } catch {
    videoMounts.forEach((mount) => {
      mount.hidden = true;
    });
  }
};

renderVideoFigures();
