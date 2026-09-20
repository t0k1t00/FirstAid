// Single monochrome, stroke-based icon set for the whole app. No emoji
// anywhere in the product — every glyph below is a plain inline SVG so
// there is exactly one place to add or restyle an icon.
const PATHS = {
  home: 'M4 11.5 12 4l8 7.5 M6 10v9h12v-9',
  guide: 'M12 3v18M4 8h16M6 16h5M6 12h3',
  dashboard: 'M3.5 3.5h7v7h-7zM13.5 3.5h7v4.5h-7zM13.5 10.5h7v10h-7zM3.5 13h7v7.5h-7z',
  sources: 'M6 4h9l3 3v13H6z M9 10h6M9 13.5h6M9 17h4',
  phone: 'M6.5 4h3l1.5 4-2 1.5a11 11 0 0 0 5.5 5.5l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A16 16 0 0 1 4.5 6.2 2 2 0 0 1 6.5 4Z',
  location: 'M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21ZM12 11.5a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4Z',
  warning: 'M12 3.5 2.5 20h19L12 3.5ZM12 10v4.5M12 17.2v.1',
  activity: 'M3 12h4l2.5-7L14 19l2.5-7H21',
  navigation: 'M12 2 4 20l8-4 8 4Z',
  shieldCheck: 'M12 3 5 6v6c0 4.6 3 7.8 7 9 4-1.2 7-4.4 7-9V6ZM9 12l2 2 4-4.5',
  cloud: 'M7 18a4.2 4.2 0 0 1-.6-8.35A5.5 5.5 0 0 1 17 9c0 .1 0 .2 0 .3A3.7 3.7 0 0 1 17 18Z',
  message: 'M4 5h16v11H8l-4 4Z',
  users: 'M8.5 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.5 19c0-3 2.4-5 5-5s5 2 5 5M17 11a2.6 2.6 0 1 0 0-5.2M20.5 19c0-2.6-1.9-4.5-4-4.9',
  check: 'M4.5 12.5 9.5 17.5 19.5 6.5',
  x: 'M5 5l14 14M19 5 5 19',
  mic: 'M12 3.5a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0v-5a3 3 0 0 0-3-3ZM6.5 11a5.5 5.5 0 0 0 11 0M12 18.5V21',
  send: 'M4 12 20 4l-5 16-4-7-7-1Z',
  chevronRight: 'M9 5l7 7-7 7',
  chevronLeft: 'M15 5l-7 7 7 7',
  cluster: 'M9 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM17 12a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8ZM6.5 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM12 22a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2Z',
  trendUp: 'M4 17 10 11 14 15 20 7M20 7h-5M20 7v5',
  bleeding: 'M12 3s6 6.5 6 10.5a6 6 0 0 1-12 0C6 9.5 12 3 12 3Z',
  flame: 'M12 3s4 3.8 4 8.2A4 4 0 0 1 8 11.2C8 9 9.6 7 9.6 7A6.5 6.5 0 0 0 12 15a3 3 0 0 0 3-3c0-1.4-.8-2.4-.8-2.4C15.6 11 17 13 17 15a5 5 0 0 1-10 0C7 9.5 12 3 12 3Z',
  bone: 'M6.5 6.5a2 2 0 1 1 2.83 2.83l6.34 6.34a2 2 0 1 1-2.83 2.83l-.02-.02a2 2 0 1 1-2.83-2.83L3.65 9.32a2 2 0 1 1 2.85-2.82ZM17.5 6.5a2 2 0 1 1 2.83 2.83l-1 1M6.5 17.5l-1 1a2 2 0 1 1-2.83-2.83',
  heart: 'M12 20s-7.5-4.6-9.5-9.2C1.2 7.3 3.2 4 6.7 4c1.9 0 3.4 1 4.3 2.4C11.9 5 13.4 4 15.3 4c3.5 0 5.5 3.3 4.2 6.8C17.5 15.4 12 20 12 20Z',
  wind: 'M3 8h11a2.5 2.5 0 1 0-2.5-2.5M3 12h15a2.5 2.5 0 1 1-2.5 2.5M3 16h9a2 2 0 1 1-2 2',
  play: 'M6 4l14 8-14 8Z',
  refresh: 'M4 12a8 8 0 0 1 13.7-5.7L20 8M20 8V4M20 8h-4M20 12a8 8 0 0 1-13.7 5.7L4 16M4 16v4M4 16h4',
};

export default function Icon({ name, size = 20, strokeWidth = 1.8, className, title }) {
  const d = PATHS[name];
  if (!d) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      className={className}
      role={title ? 'img' : 'presentation'}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {title && <title>{title}</title>}
      <path
        d={d}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
