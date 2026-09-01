import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-ceiba-ink/10 bg-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="CEIBA" className="h-9 w-auto" />
            <span className="font-serif text-lg font-semibold">CEIBA</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-ceiba-ink/70">
            Capacitación e Incidencia en Bienestar Ambiental. Formamos jóvenes
            universitarios que diseñan, prueban y escalan soluciones de
            política pública climática.
          </p>
        </div>

        <div>
          <h4 className="font-sans text-sm font-semibold uppercase tracking-wide text-ceiba-ink/60">
            Explora
          </h4>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link className="hover:text-ceiba-pink" to="/founders">Founders</Link></li>
            <li><Link className="hover:text-ceiba-pink" to="/iniciativas">Iniciativas</Link></li>
            <li><Link className="hover:text-ceiba-pink" to="/blog">Blog &amp; newsletter</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-sans text-sm font-semibold uppercase tracking-wide text-ceiba-ink/60">
            Contacto
          </h4>
          <ul className="mt-3 space-y-2 text-sm text-ceiba-ink/70">
            <li>hola@ceiba.org.mx</li>
            <li className="flex gap-3 pt-1">
              <a href="#" className="hover:text-ceiba-pink" aria-label="Instagram de CEIBA">Instagram</a>
              <a href="https://www.linkedin.com/company/ceibaorg" target="_blank" rel="noopener noreferrer" className="hover:text-ceiba-pink" aria-label="LinkedIn de CEIBA">LinkedIn</a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-ceiba-ink/10 py-5 text-center text-xs text-ceiba-ink/50">
        © {new Date().getFullYear()} CEIBA. Todos los derechos reservados.
      </div>
    </footer>
  );
}
