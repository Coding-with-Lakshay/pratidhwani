import { useTheme, type ThemeMode } from "../hooks/useTheme";

const labels: Record<ThemeMode, string> = {
  light: "Light",
  dark: "Dark",
  "hc-light": "High contrast (light)",
  "hc-dark": "High contrast (dark)",
};

const glyphs: Record<ThemeMode, string> = {
  light: "◐",
  dark: "◑",
  "hc-light": "◇",
  "hc-dark": "◆",
};

export function ThemeToggle() {
  const { theme, cycle } = useTheme();
  return (
    <button
      type="button"
      className="btn"
      onClick={cycle}
      aria-label={`Theme: ${labels[theme]}. Activate to cycle theme.`}
      title={`Theme: ${labels[theme]}`}
    >
      <span aria-hidden="true" className="font-mono">{glyphs[theme]}</span>
      <span className="hidden sm:inline">{labels[theme]}</span>
    </button>
  );
}
