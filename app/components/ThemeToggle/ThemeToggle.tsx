"use client";

import { styled } from "@linaria/react";
import { Theme } from "@/lib/theme";
import { useThemeToggle } from "./hooks";

const SunIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="m4.93 4.93 1.41 1.41" />
    <path d="m17.66 17.66 1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="m6.34 17.66-1.41 1.41" />
    <path d="m19.07 4.93-1.41 1.41" />
  </svg>
);

const MoonIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const SystemIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="4" width="18" height="12" rx="2" />
    <path d="M8 20h8" />
    <path d="M12 16v4" />
  </svg>
);

const OPTION_ICONS: Record<Theme, () => React.ReactElement> = {
  [Theme.Light]: SunIcon,
  [Theme.System]: SystemIcon,
  [Theme.Dark]: MoonIcon,
};

export default function ThemeToggle() {
  const { theme, setTheme, options } = useThemeToggle();

  return (
    <Wrapper>
      <Group role="radiogroup" aria-label="Color theme">
        {options.map(({ value, label }) => {
          const active = theme === value;
          const Icon = OPTION_ICONS[value];
          return (
            <Option
              key={value}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={`${label} theme`}
              title={`${label} theme`}
              data-active={active ? "true" : "false"}
              data-track-theme={value}
              onClick={() => setTheme(value)}
            >
              <Icon />
            </Option>
          );
        })}
      </Group>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  z-index: 50;
`;

const Group = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 4px;
  border-radius: 999px;
  background: var(--dropdown-bg);
  border: 1px solid var(--dropdown-border);
  box-shadow: var(--dropdown-shadow);
`;

const Option = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--foreground);
  opacity: 0.65;
  cursor: pointer;
  transition: background 0.15s ease, opacity 0.15s ease;

  &:hover {
    opacity: 1;
    background: var(--subtle);
  }

  &[data-active="true"] {
    background: var(--subtle);
    opacity: 1;
    color: var(--primary);
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;
