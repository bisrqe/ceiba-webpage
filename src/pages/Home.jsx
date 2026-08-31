import { Link } from "react-router-dom";
import { pillars } from "../data/initiatives";
import { founders } from "../data/team";
import NewsletterSignup from "../components/NewsletterSignup";

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-ceiba-blue/40 blur-2xl" />
        <div className="pointer-events-none absolute -left-24 top-40 h-72 w-72 rounded-full bg-ceiba-mint/50 blur-2xl" />
        <div className="section relative grid items-center gap-12 md:grid-cols-2">
          <div>
            <span className="tag-pill">Capacitación e Incidencia en Bienestar Ambiental</span>
            <h1 className="mt-5 font-serif text-5xl font-semibold leading-[1.05] text-ceiba-ink md:text-6xl">
              Jóvenes que diseñan el futuro climático de México
            </h1>
            <p className="mt-6 max-w-lg text-lg text-ceiba-ink/70">
              Formamos a estudiantes universitarios que diseñan, prueban y
              escalan soluciones de política pública climática con impacto
              real, desde la gobernanza internacional hasta sus propios
              territorios.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/iniciativas" className="btn-primary">Conoce nuestras iniciativas</Link>
              <Link to="/blog#newsletter" className="btn-secondary">Súmate al newsletter</Link>
            </div>
          </div>
          <div className="flex justify-center">
            <img
              src="/logo-512.png"
              alt="Logo de CEIBA, una flor de cinco pétalos"
              className="w-64 drop-shadow-xl md:w-80"
            />
          </div>
        </div>
      </section>

      {/* Misión / Visión */}
      <section className="section grid gap-10 border-t border-ceiba-ink/10 md:grid-cols-2">
        <div>
          <h2 className="text-2xl font-semibold text-ceiba-green">Misión</h2>
          <p className="mt-4 text-ceiba-ink/80">
            Experimentar, desarrollar y fortalecer capacidades de incidencia
            en temas de sostenibilidad y cambio climático en estudiantes,
            mediante procesos de formación, colaboración y creación de
            iniciativas orientadas a la transformación sostenible de sus
            territorios.
          </p>
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-ceiba-pink">Visión</h2>
          <p className="mt-4 text-ceiba-ink/80">
            Convertirnos en el laboratorio de referencia para la formación de
            jóvenes universitarios que diseñan, prueban y escalan soluciones
            de política pública climática con impacto real en México.
          </p>
        </div>
      </section>

      {/* Pilares / iniciativas */}
      <section className="border-t border-ceiba-ink/10 bg-white">
        <div className="section">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold">Qué hacemos</h2>
            <p className="mt-3 text-ceiba-ink/70">
              Fortalecemos las capacidades de incidencia, articulación y
              liderazgo de la comunidad estudiantil para que participen de
              manera estratégica en la gobernanza climática, desde espacios
              internacionales hasta contextos locales y universitarios.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {pillars.map((p) => (
              <Link
                key={p.id}
                to="/iniciativas"
                className="group flex flex-col rounded-2xl border border-ceiba-ink/10 p-6 transition hover:-translate-y-1 hover:shadow-lg"
              >
                <h3 className="font-serif text-xl font-semibold text-ceiba-ink group-hover:text-ceiba-pink">
                  {p.title}
                </h3>
                <p className="mt-3 flex-1 text-sm text-ceiba-ink/70">{p.summary}</p>
                <span className="mt-4 text-sm font-semibold text-ceiba-pink">Ver más →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Equipo teaser */}
      <section className="section border-t border-ceiba-ink/10">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <h2 className="text-3xl font-semibold">Conócenos</h2>
            <p className="mt-3 max-w-md text-ceiba-ink/70">
              CEIBA nace de la convicción de que las y los jóvenes universitarios
              pueden —y deben— ser parte de la gobernanza climática.
            </p>
          </div>
          <Link to="/founders" className="btn-secondary">Conócenos</Link>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {founders.map((f) => (
            <Link
              key={f.id}
              to="/founders"
              className="flex items-center gap-4 rounded-2xl border border-ceiba-ink/10 p-5 transition hover:shadow-lg"
            >
              {f.photo ? (
                <img
                  src={f.photo}
                  alt={f.name}
                  className="h-16 w-16 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-ceiba-pink font-serif text-xl font-semibold text-white">
                  {f.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                </div>
              )}
              <div>
                <p className="font-semibold">{f.name}</p>
                <p className="text-sm text-ceiba-ink/60">{f.role}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="section border-t border-ceiba-ink/10">
        <NewsletterSignup />
      </section>
    </div>
  );
}
