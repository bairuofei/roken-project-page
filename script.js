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
