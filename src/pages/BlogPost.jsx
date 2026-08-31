import { Link, useParams, Navigate } from "react-router-dom";
import { posts } from "../data/posts";

const formatter = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "long", year: "numeric" });

export default function BlogPost() {
  const { slug } = useParams();
  const post = posts.find((p) => p.slug === slug);

  if (!post) return <Navigate to="/blog" replace />;

  return (
    <article className="section max-w-3xl">
      <Link to="/blog" className="text-sm font-semibold text-ceiba-pink">← Volver al blog</Link>
      <span className="mt-6 block text-xs font-semibold uppercase tracking-wide text-ceiba-pink">
        {formatter.format(new Date(post.date))}
      </span>
      <h1 className="mt-2 font-serif text-3xl font-semibold md:text-4xl">{post.title}</h1>
      <div className="prose prose-neutral mt-8 max-w-none whitespace-pre-line text-ceiba-ink/80">
        {post.content}
      </div>
    </article>
  );
}
