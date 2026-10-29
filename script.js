(() => {
  const menuToggle = document.getElementById("menu-toggle");
  const nav = document.getElementById("main-nav");
  if (menuToggle && nav) {
    menuToggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      menuToggle.setAttribute("aria-expanded", String(open));
      menuToggle.textContent = open ? "×" : "☰";
    });
  }

  // Visitor count is stored only in this browser; it is not shared analytics.
  const visitor = document.getElementById("visitor-count");
  if (visitor) {
    try {
      const key = "alpineAscentsVisits";
      const next = Number(localStorage.getItem(key) || 0) + 1;
      localStorage.setItem(key, String(next));
      visitor.textContent = String(next).padStart(3, "0");
    } catch (_) {
      visitor.textContent = "001";
    }
  }

  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  const ticker = document.getElementById("ticker-track");
  function updateTicker() {
    if (!ticker) return;
    const now = new Date();
    const date = now.toLocaleDateString(undefined, {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    const time = now.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    ticker.textContent = `LOCAL DATE: ${date}  •  LOCAL TIME: ${time}  •  LOCATION: ENABLE LOCATION TO DISPLAY  •  PLAN RESPONSIBLY  •  ALPINE ASCENTS  •  `;
  }
  updateTicker();
  if (ticker) window.setInterval(updateTicker, 1000);

  const form = document.getElementById("contact-form");
  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const message = document.getElementById("form-message");
      if (message)
        message.textContent =
          "Thanks! No message was sent to a server.";
      form.reset();
    });
  }

  const gallery = document.getElementById("mountain-gallery");
  const detailsRoot = document.getElementById("mountain-details");
  if (gallery || detailsRoot) loadMountainAtlas(gallery, detailsRoot);

  async function loadMountainAtlas(galleryRoot, detailsPage) {
    const status = document.getElementById("gallery-status");
    const empty = document.getElementById("gallery-empty");
    const fallbackImage =
      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 420"%3E%3Crect width="640" height="420" fill="%23e1e9eb"/%3E%3Cpath d="M0 320 178 112l104 119 83-95 275 254H0Z" fill="%2399afb4"/%3E%3Cpath d="m178 112 57 67-36-14-25 24-30-13Zm187 24 48 52-41-17-24 20-21-19Z" fill="%23f6f8f8"/%3E%3Ctext x="320" y="380" text-anchor="middle" font-family="Arial,sans-serif" font-size="17" fill="%2339515d"%3EPhoto unavailable%3C/text%3E%3C/svg%3E';
    let mountains;

    try {
      const response = await fetch("data/mountains.json");
      if (!response.ok) throw new Error("Mountain data could not be loaded.");
      mountains = await response.json();
      if (!Array.isArray(mountains) || !mountains.length)
        throw new Error("Mountain data is empty.");
    } catch (error) {
      if (galleryRoot && status)
        status.textContent =
          "Mountain profiles could not be loaded. Open this site through VS Code Live Server and try again.";
      if (detailsPage)
        showDetailsError(
          detailsPage,
          "Mountain information could not be loaded. Open this site through VS Code Live Server and try again.",
        );
      return;
    }

    const byId = new Map(mountains.map((mountain) => [mountain.id, mountain]));

    function favorites() {
      try {
        const saved = JSON.parse(
          localStorage.getItem("summitAtlasFavorites") || "[]",
        );
        return new Set(Array.isArray(saved) ? saved : []);
      } catch (_) {
        return new Set();
      }
    }

    function saveFavorites(saved) {
      try {
        localStorage.setItem(
          "summitAtlasFavorites",
          JSON.stringify([...saved]),
        );
      } catch (_) {
        if (status)
          status.textContent =
            "Browser storage is unavailable; saved peaks will not persist.";
      }
    }

    function escapeHtml(value) {
      return String(value ?? "").replace(
        /[&<>"']/g,
        (character) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          })[character],
      );
    }

    function countryLabel(mountain) {
      return Array.isArray(mountain.country)
        ? mountain.country.join(" / ")
        : mountain.country || "Unknown country";
    }

    function elevationLabel(mountain) {
      return Number.isFinite(mountain.elevationM)
        ? `${Number(mountain.elevationM).toLocaleString()} m`
        : "Elevation unknown";
    }

    function imageMarkup(mountain, alt, className = "") {
      const imageAlt = mountain.imageUrl
        ? alt
        : `${mountain.name} photo unavailable`;
      return `<img class="${className}" src="${escapeHtml(mountain.imageUrl || fallbackImage)}" data-fallback="${escapeHtml(fallbackImage)}" alt="${escapeHtml(imageAlt)}" loading="lazy" decoding="async">`;
    }

    function bindImageFallbacks(root) {
      const images = root.querySelectorAll("img[data-fallback]");
      const observer = "IntersectionObserver" in window
        ? new IntersectionObserver((entries, currentObserver) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              currentObserver.unobserve(entry.target);
              entry.target.dispatchEvent(new Event("atlas-visible"));
            });
          }, { rootMargin: "200px" })
        : null;

      images.forEach((image) => {
        let fallbackTimer;
        const useFallback = () => {
          if (image.dataset.fallbackUsed) return;
          window.clearTimeout(fallbackTimer);
          image.dataset.fallbackUsed = "true";
          image.alt = image.alt.replace(
            " mountain photograph",
            " photo unavailable",
          );
          image.src = image.dataset.fallback;
        };
        const startFallbackTimer = () => {
          fallbackTimer = window.setTimeout(() => {
            if (!image.complete || image.naturalWidth === 0) useFallback();
          }, 12000);
        };

        image.addEventListener("error", useFallback, { once: true });
        image.addEventListener(
          "load",
          () => window.clearTimeout(fallbackTimer),
          { once: true },
        );
        if (observer) {
          image.addEventListener("atlas-visible", startFallbackTimer, {
            once: true,
          });
          observer.observe(image);
        } else {
          startFallbackTimer();
        }
      });
    }

    function setupGallery() {
      const search = document.getElementById("mountain-search");
      const country = document.getElementById("country-filter");
      const range = document.getElementById("range-filter");
      const sort = document.getElementById("elevation-sort");
      const savedOnly = document.getElementById("saved-only");
      const clear = document.getElementById("clear-filters");
      const count = document.getElementById("mountain-total");
      if (count) count.textContent = String(mountains.length);

      const countries = [
        ...new Set(
          mountains
            .flatMap((mountain) =>
              Array.isArray(mountain.country)
                ? mountain.country
                : [mountain.country],
            )
            .filter(Boolean),
        ),
      ].sort();
      const ranges = [
        ...new Set(
          mountains.map((mountain) => mountain.mountainRange).filter(Boolean),
        ),
      ].sort();
      countries.forEach((value) =>
        country?.insertAdjacentHTML(
          "beforeend",
          `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`,
        ),
      );
      ranges.forEach((value) =>
        range?.insertAdjacentHTML(
          "beforeend",
          `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`,
        ),
      );

      function render() {
        const query = (search?.value || "").trim().toLocaleLowerCase();
        const selectedCountry = country?.value || "";
        const selectedRange = range?.value || "";
        const saved = favorites();
        const visible = mountains.filter((mountain) => {
          const searchable = [
            mountain.name,
            ...(mountain.alternativeNames || []),
          ]
            .join(" ")
            .toLocaleLowerCase();
          const countryMatch =
            !selectedCountry ||
            (Array.isArray(mountain.country)
              ? mountain.country
              : [mountain.country]
            ).includes(selectedCountry);
          return (
            searchable.includes(query) &&
            countryMatch &&
            (!selectedRange || mountain.mountainRange === selectedRange) &&
            (!savedOnly?.checked || saved.has(mountain.id))
          );
        });
        visible.sort((a, b) => {
          const aElevation = Number.isFinite(a.elevationM) ? a.elevationM : -1;
          const bElevation = Number.isFinite(b.elevationM) ? b.elevationM : -1;
          return sort?.value === "low"
            ? aElevation - bElevation
            : bElevation - aElevation;
        });

        galleryRoot.innerHTML = visible
          .map((mountain) => {
            const isSaved = saved.has(mountain.id);
            const storyUrl = `mountain-details.html?id=${encodeURIComponent(mountain.id)}`;
            const sourceUrl =
              mountain.imageSource || mountain.references?.[0]?.url || "#";
            return `<article class="mountain-card">
            <div class="mountain-photo">${imageMarkup(mountain, `${mountain.name} mountain photograph`)}<button class="mountain-save" type="button" data-favorite="${escapeHtml(mountain.id)}" aria-label="${isSaved ? "Remove" : "Save"} ${escapeHtml(mountain.name)} ${isSaved ? "from" : "to"} saved mountains" aria-pressed="${isSaved}">${isSaved ? "★" : "☆"}</button></div>
            <a class="mountain-card-main" href="${storyUrl}">
              <div class="mountain-meta"><span>${escapeHtml(countryLabel(mountain))}</span><strong class="mountain-elevation">${escapeHtml(elevationLabel(mountain))}</strong></div>
              <h2 class="mountain-name">${escapeHtml(mountain.name)}</h2>
              <p class="mountain-range">${escapeHtml(mountain.mountainRange || "Range unknown")}</p>
              <p class="mountain-summary">${escapeHtml(mountain.shortDescription || "Description unavailable.")}</p>
            </a>
            <div class="mountain-card-actions"><a class="mountain-read" href="${storyUrl}">Read Full Story</a><a class="mountain-location" href="${escapeHtml(mountain.googleMapsUrl || "#")}" target="_blank" rel="noopener noreferrer">View Location ↗</a></div>
            <div class="mountain-credit">Photo: <a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener noreferrer">credit &amp; license</a></div>
          </article>`;
          })
          .join("");
        bindImageFallbacks(galleryRoot);
        if (status)
          status.textContent = `${visible.length} of ${mountains.length} mountain profiles`;
        if (empty) empty.hidden = visible.length > 0;
      }

      [search, country, range, sort, savedOnly].forEach((control) => {
        control?.addEventListener(
          control === search ? "input" : "change",
          render,
        );
      });
      clear?.addEventListener("click", () => {
        if (search) search.value = "";
        if (country) country.value = "";
        if (range) range.value = "";
        if (sort) sort.value = "high";
        if (savedOnly) savedOnly.checked = false;
        render();
      });
      galleryRoot.addEventListener("click", (event) => {
        const button = event.target.closest("[data-favorite]");
        if (!button) return;
        const current = favorites();
        const id = button.dataset.favorite;
        if (current.has(id)) current.delete(id);
        else current.add(id);
        saveFavorites(current);
        render();
      });
      render();
    }

    function showDetailsError(root, message) {
      root.innerHTML = `<section class="container details-error"><p class="eyebrow dark">SUMMIT ATLAS</p><h1>Mountain not found</h1><p>${escapeHtml(message)}</p><a class="btn btn-primary" href="gallery.html">Back to Gallery</a></section>`;
    }

    function setupDetails() {
      const id = new URLSearchParams(window.location.search).get("id");
      const mountain = id && byId.get(id);
      if (!mountain) {
        showDetailsError(
          detailsPage,
          "This mountain profile is unavailable. Choose a peak from the gallery.",
        );
        return;
      }
      const firstAscent = mountain.firstAscent || {};
      const climbers = firstAscent.climbers?.length
        ? firstAscent.climbers.join(", ")
        : "Unknown";
      const date = firstAscent.date || "Unknown";
      const coordinates =
        mountain.coordinates &&
        Number.isFinite(mountain.coordinates.lat) &&
        Number.isFinite(mountain.coordinates.lon)
          ? `${mountain.coordinates.lat.toFixed(4)}, ${mountain.coordinates.lon.toFixed(4)}`
          : "Not confirmed";
      const rangeGroup = (item) => (item.mountainRange || "").split(" (")[0];
      const related = mountains
        .filter(
          (item) =>
            item.id !== mountain.id &&
            rangeGroup(item) === rangeGroup(mountain),
        )
        .slice(0, 4);
      const sourceUrl = mountain.imageSource || "#";
      const expeditionList = (mountain.notableExpeditions || [])
        .map((item) => `<li>${escapeHtml(item)}</li>`)
        .join("");
      const factList = (mountain.interestingFacts || [])
        .map((item) => `<li>${escapeHtml(item)}</li>`)
        .join("");
      const referenceList = (mountain.references || [])
        .map(
          (reference) =>
            `<li><a href="${escapeHtml(reference.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(reference.label)}</a></li>`,
        )
        .join("");

      document.title = `${mountain.name} | Summit Atlas`;
      detailsPage.innerHTML = `<section class="details-hero"><div class="container details-hero-inner">
        <div class="details-hero-copy"><p class="eyebrow">SUMMIT ATLAS / ${escapeHtml(mountain.mountainRange || "HIGH ASIA")}</p><h1>${escapeHtml(mountain.name)}</h1>
          <p class="details-alt-names">${mountain.alternativeNames?.length ? `Also known as ${escapeHtml(mountain.alternativeNames.join(", "))}` : "No alternative names confirmed"}</p>
          <div class="details-facts"><span><strong>${escapeHtml(elevationLabel(mountain))}</strong></span><span>${escapeHtml(countryLabel(mountain))}</span><span>${escapeHtml(mountain.mountainRange || "Range unknown")}</span></div>
          <p class="details-deck">${escapeHtml(mountain.shortDescription || "")}</p><a class="details-map" href="${escapeHtml(mountain.googleMapsUrl || "#")}" target="_blank" rel="noopener noreferrer">View location in Google Maps ↗</a>
        </div>
        <figure class="details-hero-photo">${imageMarkup(mountain, `${mountain.name} mountain photograph`)}<figcaption>Photo credit and license: <a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener noreferrer">Wikimedia Commons file page</a></figcaption></figure>
      </div></section>
      <div class="container details-layout"><article class="details-story">
        <section><h2>Mountain and name</h2><p>${escapeHtml(mountain.historicalStory || "Historical background unavailable.")}</p><p><strong>Geographic region:</strong> ${escapeHtml(mountain.region || "Unknown")}.</p><p><strong>Coordinates:</strong> ${escapeHtml(coordinates)}.</p><p><strong>Name origin:</strong> ${escapeHtml(mountain.nameOrigin || "Not established in the references currently listed for this profile.")}</p></section>
        <section><h2>First successful ascent</h2><p><strong>${escapeHtml(date)}</strong> · ${escapeHtml(climbers)}.</p><p>${escapeHtml(firstAscent.notes || "No verified first-ascent details are available.")}</p></section>
        <section><h2>Expeditions and historical record</h2><ul>${expeditionList || "<li>Not documented in the references listed here.</li>"}</ul></section>
        <section><h2>Terrain, conditions and safety</h2><p>${escapeHtml(mountain.climbingNotes || mountain.geography || "Terrain details are not confirmed in this dataset.")}</p><p>High-altitude climbing involves objective hazards including altitude illness, severe weather, falls, avalanches and difficult evacuation. This profile is historical information, not route advice; consult local authorities and qualified expedition professionals.</p></section>
        <section><h2>Geography and environment</h2><p>${escapeHtml(mountain.geography || "Geographic details are not available.")}</p></section>
        <section><h2>Verified facts</h2><ul>${factList || "<li>No additional facts are listed.</li>"}</ul></section>
      </article><aside class="details-sidebar"><h2>Sources &amp; image</h2><p>${escapeHtml(mountain.imageCredit || "Photographer attribution is listed on the image source page.")}</p><p>${escapeHtml(mountain.imageLicense || "Check the source page for reuse terms.")}</p><ul class="source-list">${referenceList}</ul><a class="back-gallery" href="gallery.html">← Back to Gallery</a></aside></div>
      <section class="container related-section"><div class="related-heading"><p class="eyebrow dark">NEARBY IN THE ATLAS</p><h2>Related mountain profiles</h2></div><div class="related-grid">${related.map((item) => `<a class="related-card" href="mountain-details.html?id=${encodeURIComponent(item.id)}">${imageMarkup(item, `${item.name} mountain photograph`)}<strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(elevationLabel(item))} · ${escapeHtml(item.mountainRange)}</span></a>`).join("") || "<p>No related profiles in this range.</p>"}</div></section>`;
      bindImageFallbacks(detailsPage);
    }

    if (galleryRoot) setupGallery();
    if (detailsPage) setupDetails();
  }
})();
