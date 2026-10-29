type IconName = "home" | "clients" | "users" | "calendar" | "kitchen" | "building" | "menu" | "logout" | "arrow" | "search" | "phone" | "mail" | "message" | "map" | "edit" | "clock";

const paths: Record<IconName, React.ReactNode> = {
  home: <><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v10h13V10M9 20v-6h6v6"/></>,
  clients: <><circle cx="9" cy="8" r="3"/><path d="M3.5 20c.5-4 2.3-6 5.5-6s5 2 5.5 6M16 5.5a3 3 0 0 1 0 5.8M16.5 14c2.4.4 3.7 2.4 4 5"/></>,
  users: <><circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2.5 20c.5-4 2.3-6 5.5-6s5 2 5.5 6M14 15c3.5-.5 6 1.3 6.5 5"/></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/></>,
  kitchen: <><path d="M4 4h16v16H4zM4 11h16M10 4v16"/><path d="M6.5 7.5h1M12.5 7.5h1M12.5 14.5h1"/></>,
  building: <><path d="M4 21V5l8-3v19M12 8h8v13M2 21h20"/><path d="M7 7h2M7 11h2M7 15h2M15 12h2M15 16h2"/></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16"/>,
  logout: <><path d="M10 5H5v14h5M14 8l4 4-4 4M8 12h10"/></>,
  arrow: <path d="m9 18 6-6-6-6"/>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
  phone: <path d="M6.6 3.5 9 8l-2 1.7c1.2 2.7 3.4 4.9 6.2 6.2L15 14l4.5 2.4-.6 4c-.1.8-.8 1.4-1.6 1.4C9.2 21.2 2.8 14.8 2.2 6.7c-.1-.8.5-1.5 1.3-1.6z"/>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></>,
  message: <><path d="M20 15a4 4 0 0 1-4 4H8l-5 3 1.5-5A7 7 0 0 1 3 12V8a4 4 0 0 1 4-4h9a4 4 0 0 1 4 4z"/><path d="M8 10h8M8 14h5"/></>,
  map: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15M15 6v15"/></>,
  edit: <><path d="m14 5 5 5M4 20l4.5-1 10-10a2 2 0 0 0-5-5l-10 10z"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
};

export default function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}
