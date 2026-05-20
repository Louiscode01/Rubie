// app.jsx — UI overlay for Rubie's portfolio
// Handles: bilingual content, panel open/close, language toggle, palette switcher,
// hovered-building floating label, compass widget.

const { useState, useEffect, useRef, useCallback } = React;

const PREFS_KEY = "rubie-portfolio-prefs";
const PREFS_DEFAULTS = {
  palette: "ink",
  language: "zh",
  showLabels: true,
  showCompass: true,
};

const PALETTE_OPTIONS = [
  { id: "ink",      label: { en: "Ink-wash",   zh: "水墨" }, swatch: ["#efe9df", "#2d2825", "#a53a2c"] },
  { id: "dusk",     label: { en: "Dusk",       zh: "暮色" }, swatch: ["#d97a5a", "#3a201a", "#ffba6a"] },
  { id: "research", label: { en: "Research",   zh: "研究" }, swatch: ["#f5f6f4", "#26303a", "#4a6fd0"] },
];

const BUILDING_KEYS = ["pavilion", "pond", "study", "corridor"];
const KEY_TO_SECTION = {
  pavilion: "about",
  pond: "projects",
  study: "publications",
  corridor: "contact",
};
const SECTION_TO_KEY = Object.fromEntries(
  Object.entries(KEY_TO_SECTION).map(([k, v]) => [v, k])
);

// Hook: user preferences (palette + language), persisted to localStorage so a
// returning visitor keeps the visual direction and language they last chose.
function usePrefs() {
  const [prefs, setPrefs] = useState(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(PREFS_KEY) || "{}");
      return { ...PREFS_DEFAULTS, ...saved };
    } catch (e) {
      return { ...PREFS_DEFAULTS };
    }
  });
  const setPref = useCallback((key, value) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: value };
      try { window.localStorage.setItem(PREFS_KEY, JSON.stringify(next)); } catch (e) {}
      return next;
    });
  }, []);
  return [prefs, setPref];
}

// Hook: tracks viewport size class (compact = phone/narrow tablet)
function useViewport() {
  const [v, setV] = useState({
    compact: window.innerWidth < 760,
    tiny: window.innerWidth < 480,
    width: window.innerWidth,
    height: window.innerHeight,
  });
  useEffect(() => {
    const onResize = () => setV({
      compact: window.innerWidth < 760,
      tiny: window.innerWidth < 480,
      width: window.innerWidth,
      height: window.innerHeight,
    });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return v;
}

// ── Compass widget (top-down minimap) ─────────────────────────────────────
function Compass({ scene, palette, lang, hovered, openSection, compact, tiny }) {
  // The camera marker is the only thing that changes every frame, so it is
  // positioned imperatively via a ref — the component itself re-renders only
  // when palette / lang / hovered / size change, not 60 times a second.
  const markerRef = useRef(null);
  useEffect(() => {
    if (!scene || tiny) return undefined;
    let raf;
    const tick = () => {
      const m = markerRef.current;
      if (m) {
        const a = scene.getCameraSpherical().theta;
        m.style.left = (50 + Math.sin(a) * 32) + "px";
        m.style.top = (50 + Math.cos(a) * 32) + "px";
        m.style.transform = "rotate(" + ((-a * 180 / Math.PI) + 180) + "deg)";
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [scene, tiny]);

  // Early return must come AFTER hooks so the hook count stays stable when the
  // viewport crosses the `tiny` breakpoint.
  if (tiny) return null;

  const isDark = palette === "dusk";
  const isResearch = palette === "research";
  const fg = isResearch ? "#26303a" : (isDark ? "#f5e8d8" : "#29261b");
  const bg = isResearch ? "rgba(245,246,244,.78)" : (isDark ? "rgba(36,20,16,.55)" : "rgba(250,247,240,.78)");
  const ring = isResearch ? "#4a6fd0" : (isDark ? "#ffba6a" : "rgba(41,38,27,.45)");

  // Positions of buildings on the minimap (top-down, x=right, z=down)
  // Normalize to a 100×100 px disc with origin at center
  const map = (x, z) => ({
    left: 50 + x * 3.2,
    top:  50 + z * 3.2,
  });
  const pts = {
    pavilion: map(-7, -2),
    pond:     map(1, 2),
    study:    map(8, -3),
    corridor: map(0, 7.5),
  };

  return (
    <div className="compass" style={{
      position: "fixed",
      left: compact ? 12 : 24,
      bottom: compact ? 12 : 24,
      width: 132, height: 132,
      zIndex: 30, pointerEvents: "auto", borderRadius: "50%",
      background: bg, backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
      border: `0.5px solid ${ring}`, color: fg, padding: 8,
      fontFamily: "'Cormorant Garamond', 'Noto Serif SC', serif",
      transition: "background 600ms ease, color 600ms ease, border-color 600ms ease",
      transform: compact ? "scale(0.72)" : "none",
      transformOrigin: "bottom left",
    }}>
      <div style={{ position: "relative", width: "100%", height: "100%" }}>
        {/* N indicator */}
        <div style={{
          position: "absolute", left: "50%", top: -2, transform: "translateX(-50%)",
          fontSize: 9, letterSpacing: ".2em", opacity: .7, fontFamily: "'Inter', sans-serif",
        }}>{lang === "zh" ? "北" : "N"}</div>
        <div style={{
          position: "absolute", left: "50%", bottom: -4, transform: "translateX(-50%)",
          fontSize: 9, letterSpacing: ".2em", opacity: .55, fontFamily: "'Inter', sans-serif",
        }}>{lang === "zh" ? "南" : "S"}</div>
        {/* Inner faint ring */}
        <div style={{
          position: "absolute", inset: 12, borderRadius: "50%",
          border: `0.5px dashed ${ring}`, opacity: .4,
        }}></div>
        {/* Building dots */}
        {BUILDING_KEYS.map((k) => {
          const p = pts[k];
          const isHov = hovered === k;
          return (
            <div key={k} style={{
              position: "absolute", left: p.left, top: p.top,
              width: isHov ? 10 : 6, height: isHov ? 10 : 6,
              marginLeft: isHov ? -5 : -3, marginTop: isHov ? -5 : -3,
              borderRadius: k === "pond" ? 1 : "50%",
              background: isHov ? "#a53a2c" : fg,
              opacity: isHov ? 1 : .82,
              transition: "all 180ms ease",
            }}></div>
          );
        })}
        {/* Camera position marker — placed imperatively each frame */}
        <div ref={markerRef} style={{
          position: "absolute", left: 50, top: 18,
          width: 0, height: 0, marginLeft: -4, marginTop: -4,
          borderLeft: "4px solid transparent",
          borderRight: "4px solid transparent",
          borderBottom: `7px solid ${isResearch ? "#4a6fd0" : "#a53a2c"}`,
          transformOrigin: "50% 70%",
        }}></div>
      </div>
    </div>
  );
}

// ── Floating building label ───────────────────────────────────────────────
function HoverLabel({ scene, hovered, lang, palette }) {
  const [pos, setPos] = useState({ x: 0, y: 0, show: false });
  useEffect(() => {
    if (!scene || !hovered) { setPos(p => ({ ...p, show: false })); return; }
    let raf;
    const buildPos = {
      pavilion: [-7, 3.5, -2],
      pond:     [1, 0.8, 2],
      study:    [8, 2.5, -3],
      corridor: [0, 2.5, 7.5],
    }[hovered];
    const v = new THREE.Vector3(...buildPos);
    const tick = () => {
      const p = v.clone().project(scene.camera);
      const x = (p.x * 0.5 + 0.5) * scene.container.clientWidth;
      const y = (-p.y * 0.5 + 0.5) * scene.container.clientHeight;
      setPos({ x, y, show: true });
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [scene, hovered]);

  if (!hovered || !pos.show) return null;
  const b = window.PORTFOLIO_CONTENT.buildings[hovered];
  const isResearch = palette === "research";
  const isDark = palette === "dusk";
  const accent = isResearch ? "#4a6fd0" : "#a53a2c";

  return (
    <div className="hover-label" style={{
      position: "fixed", left: pos.x, top: pos.y - 20,
      transform: "translate(-50%, -100%)",
      pointerEvents: "none", zIndex: 25,
      fontFamily: "'Cormorant Garamond', 'Noto Serif SC', serif",
      color: isDark ? "#f5e8d8" : "#1a1714",
      textAlign: "center",
      textShadow: isDark ? "0 1px 8px rgba(0,0,0,.6)" : "0 1px 8px rgba(255,255,255,.6)",
      animation: "labelFadeIn .35s ease",
    }}>
      <div style={{
        fontSize: 11, letterSpacing: ".3em", textTransform: "uppercase",
        fontFamily: "'Inter', sans-serif", opacity: .65, marginBottom: 4,
        color: accent,
      }}>
        {b.hint[lang === "zh" ? "en" : "zh"]} · {b.hint[lang]}
      </div>
      <div style={{ fontSize: 28, fontWeight: 400, lineHeight: 1 }}>
        {b.name[lang]}
      </div>
      <div style={{
        marginTop: 8, height: 1, width: 24, margin: "8px auto 0",
        background: accent, opacity: .5,
      }}></div>
      <div style={{
        marginTop: 6, fontSize: 9, letterSpacing: ".15em",
        fontFamily: "'Inter', sans-serif", opacity: .55,
      }}>
        {lang === "zh" ? "点击进入 ↓" : "click to enter ↓"}
      </div>
    </div>
  );
}

// ── Home intro card (top-left of homepage) ────────────────────────────────
function HomeIntro({ lang, palette, openSection, compact, tiny }) {
  const meta = window.PORTFOLIO_CONTENT.meta;
  const isDark = palette === "dusk";
  const isResearch = palette === "research";
  const fg = isResearch ? "#26303a" : (isDark ? "#fff5e0" : "#1a1714");
  const muted = isResearch ? "#5a6470" : (isDark ? "rgba(255,245,224,.7)" : "rgba(26,23,20,.7)");
  const accent = isResearch ? "#4a6fd0" : "#a53a2c";

  return (
    <div className="home-intro" style={{
      position: "fixed",
      left: compact ? 20 : 40,
      top: compact ? 22 : 36,
      right: compact ? 20 : "auto",
      zIndex: 20,
      maxWidth: compact ? "calc(100vw - 40px)" : 380,
      pointerEvents: "auto", color: fg,
      textShadow: isDark ? "0 1px 12px rgba(0,0,0,.4)" : "none",
    }}>
      <div style={{
        fontFamily: "'Inter', 'Noto Sans SC', sans-serif",
        fontSize: tiny ? 9 : 10, letterSpacing: ".35em", textTransform: "uppercase",
        opacity: .55, marginBottom: tiny ? 10 : 14,
      }}>
        {lang === "zh" ? "个人作品集 · MMXXVI" : "Personal Portfolio · MMXXVI"}
      </div>
      <div style={{
        fontFamily: "'Cormorant Garamond', 'Noto Serif SC', serif",
        fontSize: tiny ? 34 : (compact ? 42 : 52),
        fontWeight: 400, lineHeight: 1, letterSpacing: "-.01em",
      }}>
        {meta.name[lang]}
      </div>
      <div style={{
        marginTop: 6,
        fontFamily: "'Inter', 'Noto Sans SC', sans-serif",
        fontSize: 12, letterSpacing: ".08em", color: muted,
      }}>
        {meta.role[lang]}
      </div>
      <div style={{
        marginTop: tiny ? 14 : 18,
        paddingLeft: 14, borderLeft: `1.5px solid ${accent}`,
        fontFamily: "'Cormorant Garamond', 'Noto Serif SC', serif",
        fontStyle: lang === "en" ? "italic" : "normal",
        fontSize: tiny ? 15 : 17, lineHeight: 1.45, color: fg, opacity: .82,
        textWrap: "pretty",
        maxWidth: compact ? 420 : "none",
      }}>
        {meta.tagline[lang]}
      </div>
      {!tiny && (
        <div style={{
          marginTop: 22, fontSize: 10, letterSpacing: ".25em",
          fontFamily: "'Inter', sans-serif", textTransform: "uppercase",
          color: muted,
        }}>
          {lang === "zh"
            ? "拖动旋转 · 滚轮缩放 · 点击建筑"
            : "drag to rotate · scroll to zoom · click a building"}
        </div>
      )}
    </div>
  );
}

// ── Building shortcut nav (bottom of homepage) ────────────────────────────
function BuildingNav({ lang, palette, openSection, hovered, setHovered, compact, tiny }) {
  const isDark = palette === "dusk";
  const isResearch = palette === "research";
  const fg = isResearch ? "#26303a" : (isDark ? "#fff5e0" : "#1a1714");
  const muted = isResearch ? "#5a6470" : (isDark ? "rgba(255,245,224,.7)" : "rgba(26,23,20,.7)");
  const accent = isResearch ? "#4a6fd0" : "#a53a2c";

  return (
    <div className="building-nav" style={{
      position: "fixed",
      left: "50%",
      bottom: compact ? 18 : 28,
      transform: "translateX(-50%)",
      zIndex: 20, display: "flex", gap: 0, alignItems: "stretch",
      pointerEvents: "auto",
      fontFamily: "'Cormorant Garamond', 'Noto Serif SC', serif",
      color: fg,
      textShadow: isDark ? "0 1px 8px rgba(0,0,0,.4)" : "none",
      maxWidth: "100vw",
    }}>
      {BUILDING_KEYS.map((k, i) => {
        const b = window.PORTFOLIO_CONTENT.buildings[k];
        const isHov = hovered === k;
        return (
          <React.Fragment key={k}>
            {i > 0 && (
              <div style={{
                alignSelf: "center", width: 1,
                height: tiny ? 14 : 18,
                background: muted, opacity: .35,
                margin: tiny ? "0 12px" : (compact ? "0 16px" : "0 22px"),
              }}></div>
            )}
            <button
              onClick={() => openSection(b.key)}
              onMouseEnter={() => setHovered(k)}
              onMouseLeave={() => setHovered(null)}
              style={{
                appearance: "none", background: "transparent", border: 0,
                padding: tiny ? "6px 2px" : "8px 4px",
                cursor: "pointer", color: "inherit",
                textAlign: "center", lineHeight: 1.1,
                transform: isHov ? "translateY(-2px)" : "translateY(0)",
                transition: "transform 240ms ease",
              }}
            >
              <div style={{
                fontSize: tiny ? 16 : (compact ? 18 : 22),
                fontWeight: 400, letterSpacing: ".01em",
              }}>
                {b.name[lang]}
              </div>
              <div style={{
                marginTop: tiny ? 2 : 4,
                fontSize: tiny ? 8 : 9,
                letterSpacing: tiny ? ".2em" : ".3em",
                fontFamily: "'Inter', sans-serif", textTransform: "uppercase",
                color: isHov ? accent : muted,
                transition: "color 200ms ease",
              }}>
                {b.hint[lang === "zh" ? "en" : "zh"]}
              </div>
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Top-right controls (language toggle) ─────────────────────────────────
function TopRightBar({ lang, setLang, palette }) {
  const isDark = palette === "dusk";
  const isResearch = palette === "research";
  const fg = isResearch ? "#26303a" : (isDark ? "#fff5e0" : "#1a1714");
  const muted = isResearch ? "rgba(38,48,58,.68)" : (isDark ? "rgba(255,245,224,.7)" : "rgba(26,23,20,.66)");
  const accent = isResearch ? "#4a6fd0" : "#a53a2c";

  return (
    <div style={{
      position: "fixed", right: 32, top: 36, zIndex: 22,
      display: "flex", gap: 18, alignItems: "center",
      pointerEvents: "auto", color: fg,
      fontFamily: "'Inter', 'Noto Sans SC', sans-serif",
      fontSize: 12, letterSpacing: ".06em",
      textShadow: isDark ? "0 1px 8px rgba(0,0,0,.4)" : "none",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <button onClick={() => setLang("zh")} style={{
          appearance: "none", background: "transparent", border: 0,
          padding: 2, cursor: "pointer",
          color: lang === "zh" ? fg : muted,
          fontFamily: "'Noto Serif SC', serif", fontSize: 15,
          fontWeight: lang === "zh" ? 600 : 400,
          borderBottom: lang === "zh" ? `1px solid ${accent}` : "1px solid transparent",
        }}>中</button>
        <span style={{ opacity: .35 }}>/</span>
        <button onClick={() => setLang("en")} style={{
          appearance: "none", background: "transparent", border: 0,
          padding: 2, cursor: "pointer",
          color: lang === "en" ? fg : muted,
          fontFamily: "'Cormorant Garamond', serif", fontSize: 16,
          fontStyle: "italic",
          fontWeight: lang === "en" ? 600 : 400,
          borderBottom: lang === "en" ? `1px solid ${accent}` : "1px solid transparent",
        }}>En</button>
      </div>
    </div>
  );
}

// ── Section overlay (slides up from bottom; scene visible at top) ─────────
function SectionPanel({ section, lang, palette, close, openSection, compact, tiny }) {
  const isDark = palette === "dusk";
  const isResearch = palette === "research";
  const bg = isResearch
    ? "rgba(245,246,244,.95)"
    : (isDark ? "rgba(28,18,14,.92)" : "rgba(250,247,240,.95)");
  const fg = isResearch ? "#1a2028" : (isDark ? "#fff5e0" : "#1a1714");
  const muted = isResearch ? "#5a6470" : (isDark ? "rgba(255,245,224,.7)" : "rgba(26,23,20,.7)");
  const accent = isResearch ? "#4a6fd0" : "#a53a2c";
  const border = isResearch ? "rgba(38,48,58,.12)" : (isDark ? "rgba(255,245,224,.15)" : "rgba(26,23,20,.1)");
  const hPad = tiny ? 18 : (compact ? 24 : 40);
  const sceneTop = tiny ? "20vh" : (compact ? "24vh" : "30vh");

  // One-shot slide-up entry: start translated, then drop to 0 after mount
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setEntered(true), 50);
    return () => clearTimeout(t1);
  }, []);

  // Close on ESC
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  // Focus management: move focus into the panel on open, trap Tab within it,
  // and restore focus to whatever was focused before, on close.
  const panelRef = useRef(null);
  useEffect(() => {
    const prevFocus = document.activeElement;
    const panel = panelRef.current;
    if (panel) panel.focus();
    const onKey = (e) => {
      if (e.key !== "Tab" || !panel) return;
      const sel = 'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])';
      const els = Array.prototype.slice.call(panel.querySelectorAll(sel))
        .filter((el) => el.offsetParent !== null);
      if (!els.length) return;
      const first = els[0], last = els[els.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === panel)) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault(); first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (prevFocus && typeof prevFocus.focus === "function") prevFocus.focus();
    };
  }, []);

  return (
    <div className="panel-overlay" style={{
      position: "fixed", inset: 0, zIndex: 50, pointerEvents: "none",
      display: "flex", flexDirection: "column",
    }}>
      {/* Top dim layer (the part where the scene shows through) */}
      <div
        onClick={close}
        style={{
          flex: `0 0 ${sceneTop}`, pointerEvents: "auto", cursor: "pointer",
          background: isDark
            ? "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.18) 100%)"
            : "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.04) 100%)",
        }}
      />
      {/* Panel sliding up */}
      <div className="panel-card" ref={panelRef} tabIndex={-1}
        role="dialog" aria-modal="true"
        aria-label={(window.PORTFOLIO_CONTENT[section] && window.PORTFOLIO_CONTENT[section].title[lang]) || section}
        style={{
        flex: "1 1 auto", pointerEvents: "auto", background: bg, color: fg, outline: "none",
        backdropFilter: "blur(16px) saturate(140%)",
        WebkitBackdropFilter: "blur(16px) saturate(140%)",
        borderTop: `0.5px solid ${border}`,
        boxShadow: "0 -16px 60px rgba(0,0,0,.15)",
        overflow: "hidden", display: "flex", flexDirection: "column",
        position: "relative",
        transform: entered ? "translateY(0)" : "translateY(100%)",
        opacity: entered ? 1 : 0,
        transition: "transform 600ms cubic-bezier(.2,.8,.2,1), opacity 400ms ease",
      }}>
        {/* Section tab strip + close button */}
        <div style={{
          padding: `${tiny ? 14 : 18}px ${hPad}px 0`,
          display: "flex", justifyContent: "space-between",
          alignItems: "center", borderBottom: `0.5px solid ${border}`,
          gap: 16, flexWrap: "wrap",
        }}>
          <div style={{
            display: "flex", gap: 0, alignItems: "stretch", flexWrap: "wrap",
            overflowX: tiny ? "auto" : "visible",
            scrollbarWidth: "none", maxWidth: "100%",
          }}>
            {BUILDING_KEYS.map((k) => {
              const b = window.PORTFOLIO_CONTENT.buildings[k];
              const isActive = b.key === section;
              return (
                <button key={k}
                  onClick={() => openSection(b.key)}
                  style={{
                    appearance: "none", background: "transparent", border: 0,
                    padding: "10px 0 16px 0",
                    marginRight: tiny ? 18 : 24,
                    cursor: "pointer", color: isActive ? fg : muted,
                    fontFamily: "'Cormorant Garamond', 'Noto Serif SC', serif",
                    fontSize: tiny ? 15 : 17, fontWeight: 400, lineHeight: 1,
                    borderBottom: isActive ? `1.5px solid ${accent}` : "1.5px solid transparent",
                    marginBottom: -1,
                    display: "flex", flexDirection: "column", alignItems: "flex-start",
                    gap: 3, whiteSpace: "nowrap",
                  }}>
                  <span>{b.name[lang]}</span>
                  <span style={{
                    fontSize: 9, letterSpacing: ".25em", textTransform: "uppercase",
                    fontFamily: "'Inter', sans-serif",
                    color: isActive ? accent : muted, opacity: .8,
                  }}>
                    {b.hint[lang === "zh" ? "en" : "zh"]}
                  </span>
                </button>
              );
            })}
          </div>
          <button onClick={close} style={{
            appearance: "none", background: "transparent", border: `0.5px solid ${border}`,
            color: fg, cursor: "pointer",
            padding: tiny ? "6px 10px" : "8px 14px", borderRadius: 999,
            fontFamily: "'Inter', sans-serif",
            fontSize: tiny ? 10 : 11, letterSpacing: ".15em",
            textTransform: "uppercase", marginBottom: 12, whiteSpace: "nowrap",
          }}>
            ← {tiny ? (lang === "zh" ? "返回" : "back") : (lang === "zh" ? "返回园林" : "back to garden")}
          </button>
        </div>

        {/* Scrollable content */}
        <div style={{
          flex: 1, overflowY: "auto",
          padding: `${tiny ? 28 : 44}px ${hPad}px ${tiny ? 56 : 80}px`,
          scrollbarWidth: "thin",
        }}>
          {section === "about"        && <AboutContent lang={lang} muted={muted} accent={accent} border={border} compact={compact} tiny={tiny} />}
          {section === "projects"     && <ProjectsContent lang={lang} muted={muted} accent={accent} border={border} compact={compact} tiny={tiny} />}
          {section === "publications" && <PublicationsContent lang={lang} muted={muted} accent={accent} border={border} compact={compact} tiny={tiny} />}
          {section === "contact"      && <ContactContent lang={lang} muted={muted} accent={accent} border={border} compact={compact} tiny={tiny} />}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle, lang, accent, muted, compact, tiny }) {
  return (
    <div style={{ marginBottom: tiny ? 24 : 36 }}>
      <div style={{
        fontFamily: "'Inter', 'Noto Sans SC', sans-serif",
        fontSize: 10, letterSpacing: ".35em", textTransform: "uppercase",
        color: accent, marginBottom: tiny ? 10 : 14,
      }}>
        {subtitle}
      </div>
      <div style={{
        fontFamily: "'Cormorant Garamond', 'Noto Serif SC', serif",
        fontSize: tiny ? 38 : (compact ? 46 : 56),
        fontWeight: 400, lineHeight: 1, letterSpacing: "-.01em",
      }}>
        {title}
      </div>
    </div>
  );
}

function AboutContent({ lang, muted, accent, border, compact, tiny }) {
  const a = window.PORTFOLIO_CONTENT.about;
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <SectionHeader
        title={a.title[lang]}
        subtitle={a.subtitle[lang]}
        accent={accent} muted={muted} lang={lang}
        compact={compact} tiny={tiny}
      />
      <div style={{
        display: "grid",
        gridTemplateColumns: compact ? "1fr" : "180px 1.7fr 1fr",
        gap: compact ? 28 : 48,
        alignItems: "start",
      }}>
        {/* Portrait slot */}
        <div style={{
          width: compact ? 140 : 180,
          height: compact ? 140 : 180,
          marginBottom: compact ? 4 : 0,
        }}>
          <image-slot
            id="rubie-portrait"
            shape="rounded"
            radius="4"
            placeholder={lang === "zh" ? "拖入照片" : "drop portrait"}
            style={{ width: "100%", height: "100%", display: "block" }}
          ></image-slot>
        </div>
        <div style={{
          fontFamily: "'Cormorant Garamond', 'Noto Serif SC', serif",
          fontSize: tiny ? 16 : 19, lineHeight: 1.65, textWrap: "pretty",
        }}>
          {a.bio[lang].map((para, i) => (
            <p key={i} style={{ margin: "0 0 1.1em 0" }}>{para}</p>
          ))}
        </div>
        <div>
          <div style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 10, letterSpacing: ".3em", textTransform: "uppercase",
            color: muted, marginBottom: 14,
          }}>
            {lang === "zh" ? "档案" : "Facts"}
          </div>
          <div style={{
            display: "flex", flexDirection: "column", gap: 16,
          }}>
            {a.affiliations[lang].map(([k, v], i) => (
              <div key={i} style={{
                paddingBottom: 14, borderBottom: `0.5px solid ${border}`,
              }}>
                <div style={{
                  fontFamily: "'Inter', 'Noto Sans SC', sans-serif",
                  fontSize: 10, letterSpacing: ".2em", textTransform: "uppercase",
                  color: muted, marginBottom: 4,
                }}>{k}</div>
                <div style={{
                  fontFamily: "'Cormorant Garamond', 'Noto Serif SC', serif",
                  fontSize: 17, lineHeight: 1.35,
                }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProjectsContent({ lang, muted, accent, border, compact, tiny }) {
  const p = window.PORTFOLIO_CONTENT.projects;
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <SectionHeader title={p.title[lang]} subtitle={p.subtitle[lang]} accent={accent} muted={muted} lang={lang} compact={compact} tiny={tiny} />
      <p style={{
        fontFamily: "'Cormorant Garamond', 'Noto Serif SC', serif",
        fontSize: tiny ? 16 : 19, lineHeight: 1.6, maxWidth: 640,
        margin: "0 0 40px 0", textWrap: "pretty",
      }}>{p.intro[lang]}</p>
      <div className="projects-grid" style={{
        display: "grid",
        gridTemplateColumns: tiny ? "1fr" : `repeat(auto-fill, minmax(${compact ? 240 : 280}px, 1fr))`,
        gap: tiny ? 24 : 32,
      }}>
        {p.items.map((it, i) => (
          <div key={i} className="project-card" style={{
            display: "flex", flexDirection: "column", gap: 12,
          }}>
            {/* Media slot — drag your project image/screenshot here */}
            <div style={{
              width: "100%", aspectRatio: "4 / 3", marginBottom: 6,
              position: "relative",
            }}>
              <image-slot
                id={`rubie-${it.slot}`}
                shape="rounded"
                radius="4"
                placeholder={lang === "zh" ? "拖入项目图片" : "drop project image"}
                style={{ width: "100%", height: "100%", display: "block" }}
              ></image-slot>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div style={{
                fontFamily: "'Inter', 'Noto Sans SC', sans-serif",
                fontSize: 10, letterSpacing: ".25em", textTransform: "uppercase",
                color: accent,
              }}>{it.kind[lang]}</div>
              <div style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 11, color: muted, fontVariantNumeric: "tabular-nums",
              }}>{it.year}</div>
            </div>
            <div style={{
              fontFamily: "'Cormorant Garamond', 'Noto Serif SC', serif",
              fontSize: 24, lineHeight: 1.15, fontWeight: 400, letterSpacing: "-.005em",
            }}>{it.title[lang]}</div>
            <div style={{
              fontFamily: "'Cormorant Garamond', 'Noto Serif SC', serif",
              fontSize: 15, lineHeight: 1.55, color: muted, textWrap: "pretty",
            }}>{it.blurb[lang]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PublicationsContent({ lang, muted, accent, border, compact, tiny }) {
  const p = window.PORTFOLIO_CONTENT.publications;
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <SectionHeader title={p.title[lang]} subtitle={p.subtitle[lang]} accent={accent} muted={muted} lang={lang} compact={compact} tiny={tiny} />
      <div style={{
        display: "grid",
        gridTemplateColumns: tiny ? "1fr" : `repeat(auto-fill, minmax(${compact ? 360 : 440}px, 1fr))`,
        gap: tiny ? 24 : 32,
      }}>
        {p.items.map((it, i) => (
          <article key={i} style={{
            paddingTop: 22, borderTop: `0.5px solid ${border}`,
            display: "flex", flexDirection: "column", gap: 12,
          }}>
            <div style={{ display: "flex", gap: 14, alignItems: "baseline" }}>
              <div style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 11, letterSpacing: ".15em", color: accent,
                fontVariantNumeric: "tabular-nums",
              }}>{it.year}</div>
              <div style={{
                fontFamily: "'Inter', 'Noto Sans SC', sans-serif",
                fontSize: 10, letterSpacing: ".25em", textTransform: "uppercase",
                color: muted,
              }}>{it.venue[lang]}</div>
            </div>
            <div style={{
              fontFamily: "'Cormorant Garamond', 'Noto Serif SC', serif",
              fontSize: 22, lineHeight: 1.25, fontWeight: 400, letterSpacing: "-.005em",
              textWrap: "balance",
            }}>{it.title[lang]}</div>
            <div style={{
              fontFamily: "'Inter', sans-serif", fontSize: 11.5, color: muted,
              fontStyle: lang === "en" ? "italic" : "normal",
            }}>{it.authors}</div>
            <div style={{
              marginTop: 6, paddingLeft: 14, borderLeft: `1.5px solid ${border}`,
              fontFamily: "'Cormorant Garamond', 'Noto Serif SC', serif",
              fontSize: 14.5, lineHeight: 1.55, color: muted, textWrap: "pretty",
            }}>
              {it.abstract[lang]}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function ContactContent({ lang, muted, accent, border, compact, tiny }) {
  const co = window.PORTFOLIO_CONTENT.contact;
  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <SectionHeader title={co.title[lang]} subtitle={co.subtitle[lang]} accent={accent} muted={muted} lang={lang} compact={compact} tiny={tiny} />
      <p style={{
        fontFamily: "'Cormorant Garamond', 'Noto Serif SC', serif",
        fontSize: tiny ? 17 : 21, lineHeight: 1.55, maxWidth: 640,
        margin: tiny ? "0 0 28px 0" : "0 0 48px 0", textWrap: "pretty",
      }}>{co.invitation[lang]}</p>
      <div style={{
        display: "grid",
        gridTemplateColumns: tiny ? "1fr" : `repeat(auto-fill, minmax(${compact ? 240 : 280}px, 1fr))`,
        gap: tiny ? 20 : 28,
      }}>
        {co.channels.map((ch, i) => {
          const value = typeof ch.value === "string" ? ch.value : ch.value[lang];
          return (
            <div key={i} style={{
              paddingTop: 14, borderTop: `0.5px solid ${border}`,
              display: "flex", flexDirection: "column", gap: 6,
            }}>
              <div style={{
                fontFamily: "'Inter', 'Noto Sans SC', sans-serif",
                fontSize: 10, letterSpacing: ".3em", textTransform: "uppercase",
                color: muted,
              }}>{ch.label[lang]}</div>
              <div style={{
                fontFamily: "'Cormorant Garamond', 'Noto Serif SC', serif",
                fontSize: 19, lineHeight: 1.3, wordBreak: "break-word",
              }}>{value}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Palette switcher (visible control for the three visual directions) ────
// Replaces the design-tool Tweaks panel: a small floating control, bottom-right,
// so visitors can move between Ink-wash / Dusk / Research themselves.
function PaletteSwitcher({ palette, setPalette, lang, compact, tiny }) {
  const isDark = palette === "dusk";
  const isResearch = palette === "research";
  const fg = isResearch ? "#26303a" : (isDark ? "#f5e8d8" : "#29261b");
  const bg = isResearch
    ? "rgba(245,246,244,.82)"
    : (isDark ? "rgba(36,20,16,.6)" : "rgba(250,247,240,.82)");
  const ring = isResearch
    ? "rgba(74,111,208,.5)"
    : (isDark ? "rgba(255,186,106,.45)" : "rgba(41,38,27,.3)");
  const accent = isResearch ? "#4a6fd0" : (isDark ? "#ffba6a" : "#a53a2c");

  const swatches = (
    <div style={{ display: "flex", gap: 7 }}>
      {PALETTE_OPTIONS.map((p) => {
        const active = palette === p.id;
        return (
          <button key={p.id}
            onClick={() => setPalette(p.id)}
            title={p.label[lang]}
            aria-label={p.label[lang]}
            aria-pressed={active}
            style={{
              appearance: "none", cursor: "pointer", padding: 0,
              width: tiny ? 46 : 54,
              background: "transparent",
              border: `1.5px solid ${active ? accent : "transparent"}`,
              borderRadius: 7, overflow: "hidden",
              display: "flex", flexDirection: "column",
              transform: active ? "translateY(-2px)" : "none",
              transition: "transform 200ms ease, border-color 200ms ease, opacity 200ms ease",
              opacity: active ? 1 : .72,
            }}>
            <div style={{ display: "flex", height: tiny ? 15 : 18 }}>
              {p.swatch.map((s, i) => (
                <div key={i} style={{ flex: 1, background: s }}></div>
              ))}
            </div>
            <div style={{
              fontFamily: "'Inter', 'Noto Sans SC', sans-serif",
              fontSize: 8.5, letterSpacing: ".03em",
              textAlign: "center", padding: "3px 1px", whiteSpace: "nowrap",
              color: active ? accent : fg,
              fontWeight: active ? 600 : 400,
            }}>{p.label[lang]}</div>
          </button>
        );
      })}
    </div>
  );

  const shell = {
    position: "fixed", zIndex: 30, pointerEvents: "auto",
    background: bg, color: fg,
    backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
    border: `0.5px solid ${ring}`, borderRadius: 12,
    transition: "background 600ms ease, color 600ms ease, border-color 600ms ease",
  };

  // Compact: a centered strip just above the building nav, so it never
  // collides with the bottom-centered navigation on narrow screens.
  if (compact) {
    return (
      <div className="palette-switcher" style={{
        ...shell,
        left: "50%",
        bottom: tiny ? 78 : 92,
        transform: "translateX(-50%)",
        padding: "7px 9px",
      }}>
        {swatches}
      </div>
    );
  }

  // Desktop: a labelled card anchored bottom-right.
  return (
    <div className="palette-switcher" style={{
      ...shell,
      right: 24, bottom: 24,
      display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end",
      padding: "10px 12px",
    }}>
      <div style={{
        fontFamily: "'Inter', 'Noto Sans SC', sans-serif",
        fontSize: 9, letterSpacing: ".25em", textTransform: "uppercase",
        opacity: .6,
      }}>
        {lang === "zh" ? "视觉方向" : "Visual direction"}
      </div>
      {swatches}
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────
function App() {
  const [tweaks, setTweak] = usePrefs();
  const lang = tweaks.language;
  const palette = tweaks.palette;
  const viewport = useViewport();
  const { compact, tiny } = viewport;

  const [scene, setScene] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [section, setSection] = useState(null);
  const containerRef = useRef(null);

  // Init Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;
    if (!window.THREE) {
      console.error("THREE.js failed to load — the 3D garden cannot start.");
      return;
    }
    const s = new window.GardenScene(containerRef.current);
    s.on("hover", (b) => setHovered(b));
    s.on("click", (b) => {
      const section = KEY_TO_SECTION[b];
      if (section) setSection(section);
    });
    setScene(s);
  }, []);

  // Apply palette to scene
  useEffect(() => {
    if (scene) scene.setPalette(palette);
  }, [scene, palette]);

  // Camera control: when section closes, reset; when changes, fly to new building
  useEffect(() => {
    if (!scene) return;
    if (section === null) {
      scene.resetCamera();
    } else {
      const key = SECTION_TO_KEY[section];
      if (key) scene._flyToBuilding(key);
    }
  }, [scene, section]);

  // Pause the 3D render loop while a section panel covers the scene.
  useEffect(() => {
    if (scene) scene.setPaused(section !== null);
  }, [scene, section]);

  const openSection = useCallback((s) => setSection(s), []);
  const closeSection = useCallback(() => setSection(null), []);

  // Set CSS variable for body background based on palette (avoid white flash before scene loads)
  useEffect(() => {
    const pal = window.GARDEN_PALETTES[palette];
    document.body.style.background = pal.sky[1];
    document.body.style.color = palette === "dusk" ? "#fff5e0" : "#1a1714";
  }, [palette]);

  // Keep the document language in sync so assistive tech and search engines
  // read the page in the language actually being shown.
  useEffect(() => {
    document.documentElement.lang = lang === "zh" ? "zh-Hans" : "en";
  }, [lang]);

  const showLabels = tweaks.showLabels !== false;
  const showCompass = tweaks.showCompass !== false;

  return (
    <React.Fragment>
      <div ref={containerRef} className="scene-container" style={{
        position: "fixed", inset: 0, zIndex: 1,
      }}></div>

      {/* Homepage overlay (hidden when panel open) */}
      <div style={{
        opacity: section === null ? 1 : 0,
        transition: "opacity .4s ease",
        pointerEvents: section === null ? "auto" : "none",
      }}>
        <HomeIntro lang={lang} palette={palette} openSection={openSection}
          compact={compact} tiny={tiny} />
        <BuildingNav lang={lang} palette={palette} openSection={openSection}
          hovered={hovered} setHovered={setHovered}
          compact={compact} tiny={tiny} />
        <PaletteSwitcher palette={palette}
          setPalette={(p) => setTweak("palette", p)}
          lang={lang} compact={compact} tiny={tiny} />
      </div>

      {/* Persistent UI */}
      <TopRightBar lang={lang} setLang={(l) => setTweak("language", l)}
        palette={palette} />

      {showLabels && section === null && !compact && (
        <HoverLabel scene={scene} hovered={hovered} lang={lang} palette={palette} />
      )}
      {showCompass && (
        <Compass scene={scene} palette={palette} lang={lang}
          hovered={hovered} openSection={openSection}
          compact={compact} tiny={tiny} />
      )}

      {/* Section panel */}
      {section && (
        <SectionPanel
          section={section} lang={lang} palette={palette}
          close={closeSection} openSection={openSection}
          compact={compact} tiny={tiny}
        />
      )}
    </React.Fragment>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
