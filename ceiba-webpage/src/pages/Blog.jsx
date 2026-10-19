import { Link } from "react-router-dom";
import { posts } from "../data/posts";
import NewsletterSignup from "../components/NewsletterSignup";

const formatter = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "long", year: "numeric" });

export default function Blog() {
  return (
    <div className="section">
      <span className="tag-pill">Blog &amp; newsletter</span>
      <h1 className="mt-4 font-serif text-4xl font-semibold md:text-5xl">Historias de CEIBA</h1>
      <p className="mt-4 max-w-2xl text-ceiba-ink/70">
        Novedades de nuestros programas, resultados de nuestras iniciativas y
        aprendizajes de la comunidad estudiantil de CEIBA.
      </p>

      <div className="mt-14 grid gap-8 md:grid-cols-3">
        {posts.map((post) => (
          <Link
            key={post.slug}
            to={`/blog/${post.slug}`}
            className="group flex flex-col rounded-2xl border border-ceiba-ink/10 bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg"
          >
            <span className="text-xs font-semibold uppercase tracking-wide text-ceiba-pink">
              {formatter.format(new Date(post.date))}
            </span>
            <h2 className="mt-3 font-serif text-xl font-semibold group-hover:text-ceiba-pink">
              {post.title}
            </h2>
            <p className="mt-3 flex-1 text-sm text-ceiba-ink/70">{post.excerpt}</p>
            <span className="mt-4 text-sm font-semibold text-ceiba-pink">Leer más →</span>
          </Link>
        ))}
      </div>

      <div className="mt-20">
        <NewsletterSignup />
      </div>
    </div>
  );
}
