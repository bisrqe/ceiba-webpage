import { founders } from "../data/team";

export default function Founders() {
  return (
    <div className="section">
      <span className="tag-pill">Quiénes somos</span>
      <h1 className="mt-4 font-serif text-4xl font-semibold md:text-5xl">Founders</h1>
      <p className="mt-4 max-w-2xl text-ceiba-ink/70">
        CEIBA fue fundada por dos universitarios convencidos de que la
        próxima generación de tomadores de decisión climática ya está en las
        aulas — solo necesita las herramientas, la red y el espacio para
        actuar.
      </p>

      <div className="mt-14 grid gap-10 md:grid-cols-2">
        {founders.map((f) => (
          <div key={f.id} className="rounded-3xl border border-ceiba-ink/10 bg-white p-8">
            {f.photo ? (
              <img
                src={f.photo}
                alt={f.name}
                className="h-40 w-40 rounded-2xl object-cover"
              />
            ) : (
              <div className="flex h-40 w-40 items-center justify-center rounded-2xl bg-ceiba-pink font-serif text-4xl font-semibold text-white">
                {f.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
              </div>
            )}
            <h2 className="mt-6 font-serif text-2xl font-semibold">{f.name}</h2>
            <p className="mt-1 text-sm font-medium uppercase tracking-wide text-ceiba-pink">
              {f.role}
            </p>
            <p className="mt-4 text-ceiba-ink/70">{f.bio}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
