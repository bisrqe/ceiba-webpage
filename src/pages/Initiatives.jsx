import { pillars, initiativeTypes } from "../data/initiatives";

export default function Initiatives() {
  return (
    <div className="section">
      <span className="tag-pill">Programas</span>
      <h1 className="mt-4 font-serif text-4xl font-semibold md:text-5xl">Nuestras iniciativas</h1>
      <p className="mt-4 max-w-2xl text-ceiba-ink/70">
        Fortalecemos las capacidades de incidencia, articulación y liderazgo
        de la comunidad estudiantil para que participen de manera estratégica
        y efectiva en la gobernanza climática, desde espacios internacionales
        hasta contextos locales y universitarios.
      </p>

      <div className="mt-14 space-y-10">
        {pillars.map((p, i) => (
          <article
            key={p.id}
            id={p.id}
            className="grid gap-6 rounded-3xl border border-ceiba-ink/10 bg-white p-8 md:grid-cols-[auto_1fr] md:p-10"
          >
            <span className="font-serif text-5xl font-semibold text-ceiba-mint md:text-6xl">
              0{i + 1}
            </span>
            <div>
              <h2 className="font-serif text-2xl font-semibold">{p.title}</h2>
              <p className="mt-3 text-ceiba-ink/70">{p.summary}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {p.tags.map((tag) => (
                  <span key={tag} className="tag-pill">{tag}</span>
                ))}
              </div>

              <div className="mt-6 grid gap-4 border-t border-ceiba-ink/10 pt-6 sm:grid-cols-2">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-ceiba-ink/50">
                    Público objetivo
                  </h3>
                  <p className="mt-2 text-sm text-ceiba-ink/70">{p.detail.publico}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-ceiba-ink/50">
                    En acción
                  </h3>
                  <p className="mt-2 text-sm text-ceiba-ink/70">{p.detail.ejemplo}</p>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-20">
        <h2 className="font-serif text-3xl font-semibold">Tipos de iniciativas del Programa Anual</h2>
        <p className="mt-3 max-w-2xl text-ceiba-ink/70">
          Dentro del Programa Anual, cada iniciativa se desarrolla desde uno
          de estos tres frentes.
        </p>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {initiativeTypes.map((t) => (
            <div key={t.id} className="rounded-2xl bg-ceiba-mint/60 p-6">
              <h3 className="font-serif text-lg font-semibold text-ceiba-green">{t.title}</h3>
              <p className="mt-3 text-sm text-ceiba-ink/70">{t.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
