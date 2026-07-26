const cssTokenMap = {
  "--color-ink": "color.neutral.foreground.primary",
  "--color-ink-soft": "color.neutral.foreground.secondary",
  "--color-paper": "color.neutral.background.canvas",
  "--color-cloud": "color.neutral.background.subtle",
  "--color-mist": "color.neutral.background.tinted",
  "--color-line": "color.neutral.stroke.default",
  "--color-pine": "color.brand.primary.default",
  "--color-pine-dark": "color.brand.primary.hover",
  "--color-pine-light": "color.brand.primary.subtle",
  "--color-coral": "color.brand.accent.default",
  "--color-coral-dark": "color.brand.accent.strong",
  "--color-coral-on-dark": "color.brand.accent.onDark",
  "--color-coral-light": "color.brand.accent.subtle",
  "--color-sun": "color.brand.highlight.default",
  "--color-sky": "color.support.sky",
  "--color-danger": "color.semantic.danger.foreground",
  "--color-danger-light": "color.semantic.danger.subtle",
  "--font-editorial": "font.family.editorial",
  "--font-functional": "font.family.functional",
  "--radius-control": "radius.control",
  "--radius-surface": "radius.surface",
};

function getToken(tokens, path) {
  return path.split(".").reduce((value, key) => value?.[key], tokens)?.$value;
}

function applyTokens(tokens) {
  const root = document.documentElement;
  Object.entries(cssTokenMap).forEach(([property, path]) => {
    const value = getToken(tokens, path);
    if (value !== undefined) root.style.setProperty(property, value);
  });

  root.style.setProperty(
    "--shadow-low",
    shadowToCss(getToken(tokens, "shadow.low"))
  );
  root.style.setProperty(
    "--shadow-medium",
    shadowToCss(getToken(tokens, "shadow.medium"))
  );
  document.getElementById("token-version").textContent =
    `${tokens.meta.status} · ${tokens.meta.version}`;
}

function shadowToCss(shadow) {
  return `${shadow.offsetX} ${shadow.offsetY} ${shadow.blur} ${shadow.spread} ${shadow.color}`;
}

const colorGroups = [
  {
    title: "Brand",
    note: "Identity and interactive emphasis",
    tokens: [
      ["Pine", "color.brand.primary.default"],
      ["Pine dark", "color.brand.primary.hover"],
      ["Pine subtle", "color.brand.primary.subtle"],
      ["Heritage orange", "color.brand.accent.default"],
      ["Heritage orange strong", "color.brand.accent.strong"],
      ["Heritage orange on dark", "color.brand.accent.onDark"],
      ["Heritage orange subtle", "color.brand.accent.subtle"],
      ["Sun", "color.brand.highlight.default"],
    ],
  },
  {
    title: "Neutral",
    note: "Structure, content, and quiet surfaces",
    tokens: [
      ["Ink", "color.neutral.foreground.primary"],
      ["Ink soft", "color.neutral.foreground.secondary"],
      ["Canvas", "color.neutral.background.canvas"],
      ["Cloud", "color.neutral.background.subtle"],
      ["Mist", "color.neutral.background.tinted"],
      ["Line", "color.neutral.stroke.default"],
    ],
  },
  {
    title: "Semantic & map",
    note: "State and spatial meaning",
    tokens: [
      ["Sky", "color.support.sky"],
      ["Danger", "color.semantic.danger.foreground"],
      ["Route", "color.map.route"],
      ["Result", "color.map.result"],
      ["Selected", "color.map.selected"],
      ["Search area", "color.map.searchArea"],
    ],
  },
];

function renderColors(tokens) {
  const container = document.getElementById("color-groups");
  colorGroups.forEach((group) => {
    const section = document.createElement("section");
    section.className = "color-group";
    section.innerHTML = `<div class="color-group-heading"><h3>${group.title}</h3><p>${group.note}</p></div>`;
    const swatches = document.createElement("div");
    swatches.className = "swatch-grid";

    group.tokens.forEach(([label, path]) => {
      const value = getToken(tokens, path);
      const description =
        path.split(".").reduce((item, key) => item?.[key], tokens)
          ?.$description || "";
      const swatch = document.createElement("article");
      swatch.className = "swatch";
      swatch.innerHTML = `
        <div class="swatch-color" style="background:${value}"></div>
        <div class="swatch-meta"><strong>${label}</strong><code>${value}</code><small>${path}</small><p>${description}</p></div>`;
      swatches.appendChild(swatch);
    });
    section.appendChild(swatches);
    container.appendChild(section);
  });
}

function renderSpacing(tokens) {
  const container = document.getElementById("spacing-scale");
  Object.entries(tokens.space).forEach(([name, token]) => {
    if (name === "0") return;
    const item = document.createElement("div");
    item.className = "space-token";
    item.innerHTML = `<code>space.${name}</code><span style="width:${token.$value}"></span><small>${token.$value}</small>`;
    container.appendChild(item);
  });
}

function initializeInteractions() {
  document.querySelectorAll(".category-button").forEach((button) => {
    button.addEventListener("click", () => {
      document
        .querySelectorAll(".category-button")
        .forEach((item) => item.classList.remove("selected"));
      button.classList.add("selected");
    });
  });

  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((item) => {
        item.classList.toggle("active", item === tab);
        item.setAttribute("aria-selected", String(item === tab));
      });
    });
  });

  initializeSectionNavigation();
}

function initializeSectionNavigation() {
  const navigation = document.querySelector(".side-nav");
  const links = [...document.querySelectorAll(".side-nav a[href^='#']")];
  const sections = links
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);
  let frameRequested = false;
  let activeSectionId = "";

  const setActiveSection = (sectionId) => {
    if (activeSectionId === sectionId) return;
    activeSectionId = sectionId;
    let activeLink;

    links.forEach((link) => {
      const active = link.getAttribute("href") === `#${sectionId}`;
      link.classList.toggle("active", active);
      if (active) {
        activeLink = link;
        link.setAttribute("aria-current", "location");
      } else link.removeAttribute("aria-current");
    });

    if (activeLink && window.matchMedia("(max-width: 920px)").matches) {
      const centeredPosition =
        activeLink.offsetLeft -
        (navigation.clientWidth - activeLink.offsetWidth) / 2;
      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      navigation.scrollTo({
        left: centeredPosition,
        behavior: reducedMotion ? "auto" : "smooth",
      });
    }
  };

  const updateFromScroll = () => {
    const compact = window.matchMedia("(max-width: 920px)").matches;
    const activationLine = compact ? 152 : 108;
    let activeSection = sections[0];

    sections.forEach((section) => {
      if (section.getBoundingClientRect().top <= activationLine) {
        activeSection = section;
      }
    });

    const atPageEnd =
      window.innerHeight + window.scrollY >=
      document.documentElement.scrollHeight - 4;
    if (atPageEnd) activeSection = sections.at(-1);
    if (activeSection) setActiveSection(activeSection.id);
    frameRequested = false;
  };

  const requestUpdate = () => {
    if (frameRequested) return;
    frameRequested = true;
    window.requestAnimationFrame(updateFromScroll);
  };

  links.forEach((link) => {
    link.addEventListener("click", () => {
      setActiveSection(link.getAttribute("href").slice(1));
    });
  });

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
  updateFromScroll();
}

async function initialize() {
  try {
    const response = await fetch("../tokens/jauntdetour.tokens.json?v=0.2.1");
    if (!response.ok)
      throw new Error(`Token request failed: ${response.status}`);
    const tokens = await response.json();
    applyTokens(tokens);
    renderColors(tokens);
    renderSpacing(tokens);
  } catch (error) {
    document.getElementById("token-version").textContent = "Tokens unavailable";
    document.getElementById("color-groups").innerHTML =
      `<p class="load-error">${error.message}. Serve the repository over HTTP instead of opening this file directly.</p>`;
  }

  initializeInteractions();
  window.lucide?.createIcons({ attrs: { "aria-hidden": "true" } });
}

initialize();
