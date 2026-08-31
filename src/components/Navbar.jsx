import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Inicio" },
  { to: "/founders", label: "Founders" },
  { to: "/iniciativas", label: "Iniciativas" },
  { to: "/blog", label: "Blog" },
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-ceiba-ink/10 bg-ceiba-cream/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <NavLink to="/" className="flex items-center gap-3">
          <img src="/logo.png" alt="CEIBA" className="h-10 w-auto" />
          <span className="font-serif text-xl font-semibold tracking-tight text-ceiba-ink">
            CEIBA
          </span>
        </NavLink>

        <ul className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={link.to === "/"}
                className={({ isActive }) =>
                  `font-sans text-sm font-medium transition hover:text-ceiba-pink ${
                    isActive ? "text-ceiba-pink" : "text-ceiba-ink"
                  }`
                }
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <NavLink to="/blog#newsletter" className="btn-primary hidden text-sm md:inline-flex">
          Súmate al newsletter
        </NavLink>

        {/* Mobile nav */}
        <div className="flex gap-4 md:hidden">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                `font-sans text-xs font-medium ${isActive ? "text-ceiba-pink" : "text-ceiba-ink"}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </header>
  );
}
