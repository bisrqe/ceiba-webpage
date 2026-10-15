// Sección que incrusta la versión del sitio actualmente publicada en Vercel
// (la reconstrucción en Lit / Web Components que vive en /ceiba-webpage).
const PUBLISHED_SITE_URL = "https://ceiba-webpage-mauve.vercel.app";

export default function Plataforma() {
  return (
    <section className="flex min-h-[calc(100vh-4rem)] flex-col">
      <iframe
        src={PUBLISHED_SITE_URL}
        title="Plataforma CEIBA (versión publicada)"
        className="w-full flex-1 border-0"
      />
    </section>
  );
}
