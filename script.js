const LINK_CONFIG = {
    cv: "https://example.com/naty-cv.pdf",
    blog: "https://example.com/blog",
    instagram: "https://instagram.com/",
    facebook: "https://facebook.com/",
    contactEmail: "mailto:booking@natycontorsion.com"
};

const videoCards = Array.from(document.querySelectorAll(".video-card"));
const modal = document.getElementById("video-modal");
const modalPlayer = document.getElementById("modal-video-player");
const closeButton = document.getElementById("video-modal-close");
const desktopHoverQuery = window.matchMedia("(hover: hover) and (pointer: fine)");

function wireConfiguredLinks() {
    const links = document.querySelectorAll(".js-config-link[data-link-key]");
    links.forEach((link) => {
        const key = link.dataset.linkKey;
        const mappedUrl = LINK_CONFIG[key];
        if (!mappedUrl) return;
        link.href = mappedUrl;
    });
}

function pauseAllPreviews() {
    videoCards.forEach((card) => {
        const preview = card.querySelector(".preview-video");
        card.classList.remove("playing");
        if (!preview) return;
        if (preview.dataset.isExternal === "true") return;
        preview.pause();
        preview.currentTime = 0;
    });
}

function toYouTubeEmbedUrl(url) {
    try {
        const parsed = new URL(url);
        if (parsed.hostname.includes("youtu.be")) {
            const id = parsed.pathname.replace("/", "");
            return id ? `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&rel=0` : "";
        }
        if (parsed.hostname.includes("youtube.com")) {
            const id = parsed.searchParams.get("v");
            return id ? `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&rel=0` : "";
        }
        return "";
    } catch {
        return "";
    }
}

function openModal(videoSrc) {
    if (!modal || !modalPlayer) return;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    const embedUrl = toYouTubeEmbedUrl(videoSrc);
    modalPlayer.src = embedUrl || videoSrc;
}

function closeModal() {
    if (!modal || !modalPlayer) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    modalPlayer.src = "";
}

function setupVideoCards() {
    videoCards.forEach((card) => {
        const preview = card.querySelector(".preview-video");
        const source = card.dataset.videoSrc;
        if (!preview || !source) return;
        const isYouTubeVideo = Boolean(toYouTubeEmbedUrl(source));
        if (isYouTubeVideo) {
            preview.dataset.isExternal = "true";
        }
        card.addEventListener("mouseenter", () => {
            if (!desktopHoverQuery.matches) return;
            if (isYouTubeVideo) return;
            preview.play().then(() => {
                card.classList.add("playing");
            }).catch(() => {});
        });
        card.addEventListener("mouseleave", () => {
            if (!desktopHoverQuery.matches) return;
            if (isYouTubeVideo) return;
            preview.pause();
            preview.currentTime = 0;
            card.classList.remove("playing");
        });
        card.addEventListener("click", () => {
            pauseAllPreviews();
            openModal(source);
        });
    });
}

function setupModalCloseBehavior() {
    if (closeButton) {
        closeButton.addEventListener("click", closeModal);
    }
    if (modal) {
        modal.addEventListener("click", (event) => {
            if (event.target === modal) {
                closeModal();
            }
        });
    }
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && modal?.classList.contains("is-open")) {
            closeModal();
        }
    });
}

function setupSmoothAnchorScroll() {
    const hashLinks = document.querySelectorAll('a[href^="#"]');
    hashLinks.forEach((link) => {
        link.addEventListener("click", (event) => {
            const targetId = link.getAttribute("href");
            if (!targetId || targetId === "#") return;
            const target = document.querySelector(targetId);
            if (!target) return;
            event.preventDefault();
            target.scrollIntoView({ behavior: "smooth", block: "start" });
            history.replaceState(null, "", targetId);
        });
    });
}

function setupRevealAnimations() {
    const revealEls = document.querySelectorAll(".reveal");
    if (!revealEls.length) return;
    const observer = new IntersectionObserver((entries, currentObserver) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-visible");
            currentObserver.unobserve(entry.target);
        });
    }, {
        threshold: 0.16,
        rootMargin: "0px 0px -5% 0px"
    });
    revealEls.forEach((section) => observer.observe(section));
}

wireConfiguredLinks();
setupVideoCards();
setupModalCloseBehavior();
setupSmoothAnchorScroll();
setupRevealAnimations();
