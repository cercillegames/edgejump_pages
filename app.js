(function () {
  const defaultConfig = {
    pageTitle: "Game Landing Page",
    socialHandle: "CERCILLEGAMES",
    description: "Edge Jump'i kesfedin ve Google Play uzerinden hemen oynamaya baslayin.",
    posterImagePath: "assets/game-poster.webp",
    heroImagePath: "assets/game-icon.webp",
    heroImageAlt: "Edge Jump oyun uygulama ikonu",
    messengerAppId: "",
    links: [],
    analytics: {
      enabled: false,
      measurementId: ""
    }
  };

  const SHARE_ACTIONS = [
    { id: "copy", label: "Linki Kopyala", iconText: "CP" },
    { id: "x", label: "X", iconText: "X" },
    { id: "facebook", label: "Facebook", iconText: "f" },
    { id: "whatsapp", label: "WhatsApp", iconText: "WA" },
    { id: "linkedin", label: "LinkedIn", iconText: "in" },
    { id: "messenger", label: "Messenger", iconText: "M" },
    { id: "snapchat", label: "Snapchat", iconText: "SC" },
    { id: "email", label: "E-posta", iconText: "@" }
  ];

  const ALLOWED_PROTOCOLS = new Set(["https:", "mailto:"]);
  const config = mergeConfig(defaultConfig, window.siteConfig || {});
  let shareSheetState = null;

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    updateText("game-handle", resolveBrandLabel(config.socialHandle));
    updatePosterArt();
    updateGameIcon();
    renderPrimaryLink();
    updateDocumentMeta();
    enableAnalytics();
    document.addEventListener("keydown", handleGlobalKeydown);
  }

  function mergeConfig(baseConfig, inputConfig) {
    return {
      ...baseConfig,
      ...inputConfig,
      analytics: {
        ...baseConfig.analytics,
        ...(inputConfig.analytics || {})
      },
      links: Array.isArray(inputConfig.links) ? inputConfig.links : baseConfig.links
    };
  }

  function updateText(elementId, value) {
    const element = document.getElementById(elementId);
    if (!element) {
      return;
    }

    element.textContent = asText(value);
  }

  function updatePosterArt() {
    const poster = document.getElementById("poster-art");
    if (!poster) {
      return;
    }

    const posterPath = asImagePath(config.posterImagePath, defaultConfig.posterImagePath);
    poster.src = posterPath;
    updateImagePreload("poster-preload", posterPath);
  }

  function updateGameIcon() {
    const cover = document.getElementById("game-cover");
    if (!cover) {
      return;
    }

    const iconPath = asImagePath(config.heroImagePath, defaultConfig.heroImagePath);
    cover.src = iconPath;
    cover.alt = asText(config.heroImageAlt) || defaultConfig.heroImageAlt;
    updateImagePreload("icon-preload", iconPath);
  }

  function renderPrimaryLink() {
    const links = (config.links || [])
      .map(normalizeLink)
      .filter(Boolean)
      .slice(0, 12);

    const primaryLink = links.find(function (link) {
      return link.kind === "primary";
    }) || links[0] || null;

    const zone = document.getElementById("primary-link-zone");
    if (!zone) {
      return;
    }

    zone.textContent = "";
    unmountShareSheet();

    if (!primaryLink) {
      zone.hidden = true;
      return;
    }

    zone.hidden = false;

    const card = document.createElement("div");
    card.className = "cta-card";

    const anchor = document.createElement("a");
    anchor.className = "cta-card-main";
    anchor.href = primaryLink.url;
    anchor.setAttribute("aria-label", primaryLink.label);
    applyTarget(anchor, primaryLink.openInNewTab);
    wireTrackedNavigation(anchor, primaryLink);

    const icon = document.createElement("img");
    icon.className = "cta-card-art";
    icon.src = asImagePath(config.heroImagePath, defaultConfig.heroImagePath);
    icon.alt = "";
    icon.setAttribute("aria-hidden", "true");
    icon.width = 64;
    icon.height = 64;
    icon.decoding = "async";
    anchor.appendChild(icon);

    const copy = document.createElement("span");
    copy.className = "cta-card-copy";
    const label = document.createElement("span");
    label.className = "cta-card-label";
    label.textContent = primaryLink.label;
    copy.appendChild(label);
    anchor.appendChild(copy);

    const menuButton = createShareMenuButton(primaryLink);
    card.append(anchor, menuButton);
    zone.appendChild(card);

    mountShareSheet(primaryLink, menuButton);
  }

  function createShareMenuButton(primaryLink) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "cta-menu-button";
    button.setAttribute("aria-label", "Baglanti paylasma secenekleri");
    button.setAttribute("aria-haspopup", "dialog");
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-controls", "share-sheet");
    button.appendChild(createMenuDots());

    button.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      toggleShareSheet(button, primaryLink);
    });

    return button;
  }

  function createMenuDots() {
    const menu = document.createElement("span");
    menu.className = "menu-dots";
    menu.setAttribute("aria-hidden", "true");

    for (let index = 0; index < 3; index += 1) {
      menu.appendChild(document.createElement("span"));
    }

    return menu;
  }

  function createNavGlyph(symbol) {
    const glyph = document.createElement("span");
    glyph.setAttribute("aria-hidden", "true");
    glyph.textContent = symbol;
    return glyph;
  }

  function mountShareSheet(primaryLink, menuButton) {
    const backdrop = document.createElement("button");
    backdrop.type = "button";
    backdrop.className = "share-sheet-backdrop";
    backdrop.hidden = true;
    backdrop.setAttribute("aria-label", "Paylasim panelini kapat");

    const panel = document.createElement("section");
    panel.className = "share-sheet";
    panel.id = "share-sheet";
    panel.hidden = true;
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-labelledby", "share-sheet-title");

    const header = document.createElement("div");
    header.className = "share-sheet-header";

    const headingGroup = document.createElement("div");
    headingGroup.className = "share-sheet-heading-group";

    const title = document.createElement("h2");
    title.className = "share-sheet-title";
    title.id = "share-sheet-title";
    title.textContent = "Linki Paylas";
    headingGroup.appendChild(title);

    const subtitle = document.createElement("p");
    subtitle.className = "share-sheet-subtitle";
    subtitle.textContent = primaryLink.label;
    headingGroup.appendChild(subtitle);

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "share-sheet-close";
    closeButton.setAttribute("aria-label", "Paylasim panelini kapat");
    closeButton.textContent = "x";

    header.append(headingGroup, closeButton);

    const carousel = document.createElement("div");
    carousel.className = "share-sheet-carousel";

    const actionGrid = document.createElement("div");
    actionGrid.className = "share-sheet-grid";

    const prevButton = document.createElement("button");
    prevButton.type = "button";
    prevButton.className = "share-sheet-nav share-sheet-prev";
    prevButton.setAttribute("aria-label", "Onceki paylasim seceneklerini goster");
    prevButton.appendChild(createNavGlyph("<"));

    const nextButton = document.createElement("button");
    nextButton.type = "button";
    nextButton.className = "share-sheet-nav share-sheet-next";
    nextButton.setAttribute("aria-label", "Sonraki paylasim seceneklerini goster");
    nextButton.appendChild(createNavGlyph(">"));

    const status = document.createElement("p");
    status.className = "share-sheet-status";
    status.id = "share-sheet-status";
    status.setAttribute("aria-live", "polite");

    SHARE_ACTIONS.forEach(function (action) {
      actionGrid.appendChild(createShareActionButton(action, primaryLink, status));
    });

    carousel.append(actionGrid, prevButton, nextButton);
    panel.append(header, carousel, status);
    panel.setAttribute("aria-describedby", status.id);
    document.body.append(backdrop, panel);

    backdrop.addEventListener("click", closeShareSheet);
    closeButton.addEventListener("click", closeShareSheet);
    prevButton.addEventListener("click", scrollShareSheetBackward);
    nextButton.addEventListener("click", scrollShareSheetForward);
    actionGrid.addEventListener("scroll", updateShareSheetArrow, { passive: true });

    shareSheetState = {
      toggleButton: menuButton,
      backdrop: backdrop,
      panel: panel,
      carousel: carousel,
      actionGrid: actionGrid,
      subtitleNode: subtitle,
      prevButton: prevButton,
      nextButton: nextButton,
      status: status,
      firstAction: actionGrid.querySelector(".share-action"),
      closeTimerId: 0,
      currentScrollLeft: 0
    };
  }

  function unmountShareSheet() {
    if (!shareSheetState) {
      return;
    }

    clearShareSheetCloseTimer();
    if (shareSheetState.toggleButton) {
      shareSheetState.toggleButton.removeAttribute("aria-controls");
    }
    shareSheetState.backdrop.remove();
    shareSheetState.panel.remove();
    shareSheetState = null;
    document.body.classList.remove("share-sheet-open");
  }

  function createShareActionButton(action, primaryLink, statusNode) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "share-action";
    button.setAttribute("aria-label", action.label);

    const icon = document.createElement("span");
    icon.className = "share-action-icon share-action-icon-" + action.id;
    icon.textContent = action.iconText;
    icon.setAttribute("aria-hidden", "true");

    const label = document.createElement("span");
    label.className = "share-action-label";
    label.textContent = action.label;

    button.append(icon, label);

    button.addEventListener("click", function () {
      handleShareAction(action.id, primaryLink, statusNode);
    });

    return button;
  }

  function toggleShareSheet(button, primaryLink) {
    if (!shareSheetState) {
      return;
    }

    if (!shareSheetState.panel.hidden && shareSheetState.panel.classList.contains("is-open")) {
      closeShareSheet();
      return;
    }

    openShareSheet(button, primaryLink);
  }

  function openShareSheet(button, primaryLink) {
    if (!shareSheetState) {
      return;
    }

    clearShareSheetCloseTimer();
    shareSheetState.toggleButton = button;
    if (shareSheetState.subtitleNode) {
      shareSheetState.subtitleNode.textContent = primaryLink.label;
    }
    resetShareStatus(shareSheetState.status);
    if (shareSheetState.actionGrid) {
      shareSheetState.actionGrid.scrollLeft = 0;
      shareSheetState.currentScrollLeft = 0;
    }
    updateShareSheetArrow();

    shareSheetState.backdrop.hidden = false;
    shareSheetState.panel.hidden = false;
    button.setAttribute("aria-expanded", "true");
    document.body.classList.add("share-sheet-open");
    shareSheetState.panel.getBoundingClientRect();
    shareSheetState.backdrop.getBoundingClientRect();

    window.setTimeout(function () {
      if (!shareSheetState) {
        return;
      }

      shareSheetState.backdrop.classList.add("is-open");
      shareSheetState.panel.classList.add("is-open");

      window.setTimeout(function () {
        if (!shareSheetState || shareSheetState.panel.hidden) {
          return;
        }

        updateShareSheetArrow();
        focusShareAction(shareSheetState.firstAction);
      }, 40);
    }, 0);
  }

  function closeShareSheet(options) {
    if (!shareSheetState || shareSheetState.panel.hidden) {
      return;
    }

    const shouldRestoreFocus = !options || options.restoreFocus !== false;
    clearShareSheetCloseTimer();
    shareSheetState.backdrop.classList.remove("is-open");
    shareSheetState.panel.classList.remove("is-open");
    document.body.classList.remove("share-sheet-open");

    const toggleButton = shareSheetState.toggleButton;
    if (toggleButton) {
      toggleButton.setAttribute("aria-expanded", "false");
    }

    shareSheetState.closeTimerId = window.setTimeout(function () {
      if (!shareSheetState) {
        return;
      }

      shareSheetState.backdrop.hidden = true;
      shareSheetState.panel.hidden = true;
      resetShareStatus(shareSheetState.status);
      shareSheetState.closeTimerId = 0;

      if (shouldRestoreFocus && shareSheetState.toggleButton) {
        shareSheetState.toggleButton.focus({ preventScroll: true });
      }
    }, 180);
  }

  function handleGlobalKeydown(event) {
    if (event.key === "Escape") {
      closeShareSheet();
    }
  }

  function handleShareAction(actionId, primaryLink, statusNode) {
    if (actionId === "copy") {
      copyTextToClipboard(primaryLink.url)
        .then(function () {
          setShareStatus(statusNode, "Link panoya kopyalandi.");
          trackShareAction("copy", primaryLink);
        })
        .catch(function () {
          setShareStatus(statusNode, "Link kopyalanamadi. Elle kopyalamayi deneyin.", true);
        });

      return;
    }

    if (actionId === "messenger") {
      handleMessengerShare(primaryLink, statusNode);
      return;
    }

    const shareUrl = buildShareActionUrl(actionId, primaryLink);
    if (!shareUrl) {
      setShareStatus(statusNode, "Bu paylasim secenegi su anda hazir degil.", true);
      return;
    }

    if (actionId === "email") {
      window.location.href = shareUrl;
    } else {
      const popup = window.open(shareUrl, "_blank", "noopener,noreferrer");
      if (!popup) {
        setShareStatus(statusNode, "Paylasim penceresi engellendi. Tarayici izinlerini kontrol edin.", true);
        return;
      }
    }

    trackShareAction(actionId, primaryLink);
    closeShareSheet();
  }

  function handleMessengerShare(primaryLink, statusNode) {
    const appId = asText(config.messengerAppId);

    if (isLikelyMobileDevice()) {
      trackShareAction("messenger", primaryLink);
      window.location.href = "fb-messenger://share/?link=" + encodeURIComponent(primaryLink.url);
      closeShareSheet();
      return;
    }

    if (appId) {
      const sendDialogUrl =
        "https://www.facebook.com/dialog/send/?display=popup&app_id=" +
        encodeURIComponent(appId) +
        "&link=" +
        encodeURIComponent(primaryLink.url) +
        "&redirect_uri=" +
        encodeURIComponent(window.location.href);

      const popup = window.open(sendDialogUrl, "_blank", "noopener,noreferrer");
      if (!popup) {
        setShareStatus(statusNode, "Messenger penceresi engellendi. Tarayici izinlerini kontrol edin.", true);
        return;
      }

      trackShareAction("messenger", primaryLink);
      closeShareSheet();
      return;
    }

    copyTextToClipboard(primaryLink.url)
      .then(function () {
        setShareStatus(statusNode, "Messenger masaustu paylasimi icin Meta App ID gerekir. Link panoya kopyalandi.");
        trackShareAction("messenger-copy-fallback", primaryLink);
      })
      .catch(function () {
        setShareStatus(statusNode, "Messenger icin link hazirlarken bir sorun oldu.", true);
      });
  }

  function buildShareActionUrl(actionId, primaryLink) {
    const shareText = buildShareText(primaryLink);
    const combinedText = shareText ? shareText + " " + primaryLink.url : primaryLink.url;

    switch (actionId) {
      case "x":
        return (
          "https://twitter.com/intent/tweet?text=" +
          encodeURIComponent(shareText) +
          "&url=" +
          encodeURIComponent(primaryLink.url)
        );
      case "facebook":
        return "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(primaryLink.url);
      case "whatsapp":
        return "https://wa.me/?text=" + encodeURIComponent(combinedText);
      case "linkedin":
        return "https://www.linkedin.com/sharing/share-offsite/?url=" + encodeURIComponent(primaryLink.url);
      case "snapchat":
        return "https://www.snapchat.com/share?link=" + encodeURIComponent(primaryLink.url);
      case "email":
        return (
          "mailto:?subject=" +
          encodeURIComponent(shareText) +
          "&body=" +
          encodeURIComponent(shareText + "\n\n" + primaryLink.url)
        );
      default:
        return "";
    }
  }

  function buildShareText(primaryLink) {
    const brand = resolveBrandLabel(config.socialHandle);
    return [brand, primaryLink.label].filter(Boolean).join(" - ");
  }

  function setShareStatus(statusNode, message, isError) {
    if (!statusNode) {
      return;
    }

    statusNode.textContent = message;
    statusNode.classList.toggle("is-error", isError === true);
  }

  function resetShareStatus(statusNode) {
    if (!statusNode) {
      return;
    }

    statusNode.textContent = "";
    statusNode.classList.remove("is-error");
  }

  function clearShareSheetCloseTimer() {
    if (!shareSheetState || !shareSheetState.closeTimerId) {
      return;
    }

    window.clearTimeout(shareSheetState.closeTimerId);
    shareSheetState.closeTimerId = 0;
  }

  function focusShareAction(element) {
    if (!element || typeof element.focus !== "function") {
      return;
    }

    element.focus({ preventScroll: true });
  }

  function scrollShareSheetForward() {
    if (!shareSheetState || !shareSheetState.actionGrid) {
      return;
    }

    const grid = shareSheetState.actionGrid;
    const currentLeft = typeof shareSheetState.currentScrollLeft === "number" ? shareSheetState.currentScrollLeft : grid.scrollLeft;
    const maxScrollLeft = Math.max(0, grid.scrollWidth - grid.clientWidth);
    const cards = Array.prototype.slice.call(grid.children);
    const nextCard = cards.find(function (card) {
      return card.offsetLeft > currentLeft + 12;
    });
    const fallbackAmount = Math.max(grid.clientWidth * 0.72, 150);
    const targetLeft = Math.min(nextCard ? nextCard.offsetLeft : currentLeft + fallbackAmount, maxScrollLeft);

    grid.dataset.arrowAdvance = targetLeft > currentLeft ? "true" : "false";

    if (nextCard && typeof nextCard.scrollIntoView === "function") {
      nextCard.scrollIntoView({
        block: "nearest",
        inline: "start",
        behavior: "auto"
      });
    } else {
      grid.scrollLeft = targetLeft;
    }

    window.setTimeout(function () {
      updateShareSheetArrow(targetLeft);
    }, 20);
  }

  function scrollShareSheetBackward() {
    if (!shareSheetState || !shareSheetState.actionGrid) {
      return;
    }

    const grid = shareSheetState.actionGrid;
    const currentLeft = typeof shareSheetState.currentScrollLeft === "number" ? shareSheetState.currentScrollLeft : grid.scrollLeft;
    const cards = Array.prototype.slice.call(grid.children);
    const previousCards = cards.filter(function (card) {
      return card.offsetLeft < currentLeft - 12;
    });
    const previousCard = previousCards[previousCards.length - 1] || null;
    const fallbackAmount = Math.max(grid.clientWidth * 0.72, 150);
    const targetLeft = Math.max(previousCard ? previousCard.offsetLeft : currentLeft - fallbackAmount, 0);

    grid.dataset.arrowAdvance = targetLeft < currentLeft ? "true" : "false";

    if (previousCard && typeof previousCard.scrollIntoView === "function") {
      previousCard.scrollIntoView({
        block: "nearest",
        inline: "start",
        behavior: "auto"
      });
    } else {
      grid.scrollLeft = targetLeft;
    }

    window.setTimeout(function () {
      updateShareSheetArrow(targetLeft);
    }, 20);
  }

  function updateShareSheetArrow(forcedScrollLeft) {
    if (
      !shareSheetState ||
      !shareSheetState.actionGrid ||
      !shareSheetState.prevButton ||
      !shareSheetState.nextButton ||
      !shareSheetState.carousel
    ) {
      return;
    }

    const grid = shareSheetState.actionGrid;
    const prevButton = shareSheetState.prevButton;
    const nextButton = shareSheetState.nextButton;
    const currentLeft = typeof forcedScrollLeft === "number" ? forcedScrollLeft : grid.scrollLeft;
    shareSheetState.currentScrollLeft = currentLeft;
    const canScroll = grid.scrollWidth > grid.clientWidth + 8;
    const hasMoreLeft = currentLeft > 8;
    const hasMoreRight = currentLeft + grid.clientWidth < grid.scrollWidth - 8;

    prevButton.hidden = !canScroll || !hasMoreLeft;
    prevButton.disabled = !hasMoreLeft;
    prevButton.setAttribute("aria-hidden", prevButton.hidden ? "true" : "false");
    nextButton.hidden = !canScroll || !hasMoreRight;
    nextButton.disabled = !hasMoreRight;
    nextButton.setAttribute("aria-hidden", nextButton.hidden ? "true" : "false");
    shareSheetState.carousel.classList.toggle("has-prev", !prevButton.hidden);
    shareSheetState.carousel.classList.toggle("has-next", !nextButton.hidden);
  }


  function copyTextToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }

    return new Promise(function (resolve, reject) {
      const helper = document.createElement("textarea");
      helper.value = text;
      helper.setAttribute("readonly", "");
      helper.style.position = "absolute";
      helper.style.left = "-9999px";
      helper.style.top = "0";
      helper.style.opacity = "0";
      document.body.appendChild(helper);

      try {
        helper.focus({ preventScroll: true });
        helper.select();
        helper.setSelectionRange(0, helper.value.length);
        const copied = document.execCommand("copy");
        helper.remove();

        if (copied) {
          resolve();
          return;
        }
      } catch (error) {
        helper.remove();
        reject(error);
        return;
      }

      reject(new Error("copy_failed"));
    });
  }

  function isLikelyMobileDevice() {
    return /android|iphone|ipad|ipod/i.test(navigator.userAgent) || window.matchMedia("(pointer: coarse)").matches;
  }

  function normalizeLink(item, index) {
    if (!item || typeof item !== "object") {
      return null;
    }

    const label = asText(item.label);
    const url = asSafeUrl(item.url);

    if (!label || !url) {
      return null;
    }

    return {
      id: asText(item.id) || "link-" + index,
      label: label,
      url: url,
      kind: normalizeKind(item.kind, index),
      openInNewTab: item.openInNewTab === true
    };
  }

  function normalizeKind(kind, index) {
    if (kind === "primary") {
      return kind;
    }

    return index === 0 ? "primary" : "secondary";
  }

  function resolveBrandLabel(value) {
    const label = asText(value);
    if (label) {
      return label;
    }

    return "YOUR STUDIO";
  }

  function applyTarget(anchor, openInNewTab) {
    anchor.target = openInNewTab ? "_blank" : "_self";
    anchor.rel = openInNewTab ? "noopener noreferrer external" : "external";
  }

  function wireTrackedNavigation(anchor, link) {
    anchor.addEventListener("click", function () {
      trackLinkClick(link);
    });
  }

  function updateDocumentMeta() {
    const title = asText(config.pageTitle) || asText(config.socialHandle) || "Game Landing Page";
    const description = asText(config.description) || defaultConfig.description;
    const imagePath = asImagePath(config.posterImagePath || config.heroImagePath, defaultConfig.posterImagePath);

    document.title = title;
    updateMeta('meta[name="description"]', description);
    updateMeta('meta[property="og:title"]', title);
    updateMeta('meta[property="og:description"]', description);
    updateMeta('meta[property="og:image"]', imagePath);
  }

  function updateMeta(selector, value) {
    const tag = document.querySelector(selector);
    if (!tag || !value) {
      return;
    }

    tag.setAttribute("content", value);
  }

  function updateImagePreload(elementId, href) {
    const link = document.getElementById(elementId);
    if (!link || !href) {
      return;
    }

    link.setAttribute("href", href);
    const mimeType = inferImageMimeType(href);

    if (mimeType) {
      link.setAttribute("type", mimeType);
      return;
    }

    link.removeAttribute("type");
  }

  function inferImageMimeType(value) {
    const rawValue = asText(value);
    if (!rawValue) {
      return "";
    }

    const dataUrlMatch = rawValue.match(/^data:(image\/[a-z0-9.+-]+)[;,]/i);
    if (dataUrlMatch) {
      return dataUrlMatch[1].toLowerCase();
    }

    let pathname = rawValue;

    try {
      pathname = new URL(rawValue, window.location.href).pathname;
    } catch (error) {
      pathname = rawValue;
    }

    const extensionMatch = pathname.toLowerCase().match(/\.([a-z0-9]+)$/);
    if (!extensionMatch) {
      return "";
    }

    switch (extensionMatch[1]) {
      case "avif":
        return "image/avif";
      case "gif":
        return "image/gif";
      case "jpg":
      case "jpeg":
        return "image/jpeg";
      case "png":
        return "image/png";
      case "svg":
        return "image/svg+xml";
      case "webp":
        return "image/webp";
      default:
        return "";
    }
  }

  function enableAnalytics() {
    const analytics = config.analytics || {};
    const measurementId = asText(analytics.measurementId);

    if (!analytics.enabled) {
      return;
    }

    if (!/^G-[A-Z0-9]+$/i.test(measurementId)) {
      console.warn("Google Analytics acilamadi: gecersiz measurement ID.");
      return;
    }

    if (document.querySelector('script[data-ga-loader="true"]')) {
      return;
    }

    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };

    const analyticsScript = document.createElement("script");
    analyticsScript.async = true;
    analyticsScript.setAttribute("data-ga-loader", "true");
    analyticsScript.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(measurementId);
    document.head.appendChild(analyticsScript);

    window.gtag("js", new Date());
    window.gtag("config", measurementId, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    });
  }

  function trackLinkClick(item, callback) {
    if (typeof window.gtag !== "function") {
      if (typeof callback === "function") {
        callback();
      }

      return;
    }

    let callbackUsed = false;
    const safeCallback = function () {
      if (callbackUsed) {
        return;
      }

      callbackUsed = true;

      if (typeof callback === "function") {
        callback();
      }
    };

    window.gtag("event", "select_content", {
      content_type: "outbound_link",
      item_id: item.id,
      item_name: item.label,
      link_url: item.url,
      event_callback: safeCallback,
      transport_type: "beacon"
    });

    window.setTimeout(safeCallback, 700);
  }

  function trackShareAction(method, item) {
    if (typeof window.gtag !== "function") {
      return;
    }

    window.gtag("event", "share", {
      method: method,
      content_type: "outbound_link",
      item_id: item.id,
      item_name: item.label,
      link_url: item.url
    });
  }

  function asText(value) {
    return typeof value === "string" ? value.trim() : "";
  }

  function asImagePath(value, fallback) {
    if (typeof value !== "string" || !value.trim()) {
      return fallback;
    }

    const trimmed = value.trim();

    if (trimmed.startsWith("data:image/")) {
      return trimmed;
    }

    if (!trimmed.includes(":") && !trimmed.startsWith("//")) {
      return trimmed;
    }

    try {
      const parsedUrl = new URL(trimmed);

      if (parsedUrl.protocol === "https:") {
        return parsedUrl.href;
      }
    } catch (error) {
      return fallback;
    }

    return fallback;
  }

  function asSafeUrl(value) {
    if (typeof value !== "string" || !value.trim()) {
      return "";
    }

    try {
      const parsedUrl = new URL(value.trim(), window.location.origin);

      if (!ALLOWED_PROTOCOLS.has(parsedUrl.protocol)) {
        return "";
      }

      return parsedUrl.href;
    } catch (error) {
      return "";
    }
  }
})();
