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

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const id = link.getAttribute("href");
    const target = id ? document.querySelector(id) : null;
    if (!target) return;
    event.preventDefault();
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

const renderVideoRails = async () => {
  if (!videoMounts.length) return;

  try {
    const response = await fetch("assets/videos/videos.json");
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

      const rail = document.createElement("div");
      rail.className = "video-rail";
      rail.setAttribute("aria-label", `${groupKey} videos`);

      videos.forEach((videoItem) => {
        const card = createVideoCard(videoItem);
        rail.append(card);
        renderedVideos.push(card.querySelector("video"));
      });

      mount.append(rail);
    });

    observeVideos(renderedVideos);
  } catch {
    videoMounts.forEach((mount) => {
      mount.hidden = true;
    });
  }
};

renderVideoRails();
