// Toast
function showToast(message = "Copiato") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => {
    toast.classList.remove("show");
  }, 1600);
}

// Copy
function copyFromSelector(selector) {
  const el = document.querySelector(selector);
  if (!el) return;
  const text = el.innerText || el.textContent || "";

  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(
      () => showToast("Copiato"),
      () => fallbackCopy(text)
    );
  } else {
    fallbackCopy(text);
  }

  function fallbackCopy(t) {
    const ta = document.createElement("textarea");
    ta.value = t;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    showToast("Copiato");
  }
}

// Events
document.querySelectorAll(".copy-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const target = btn.getAttribute("data-copy-target");
    if (target) copyFromSelector(target);
  });
});
