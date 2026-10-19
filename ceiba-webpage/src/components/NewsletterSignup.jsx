import { useState } from "react";

// Formulario de newsletter. Por ahora solo confirma en el front-end:
// para capturar correos de verdad, conecta el <form> a un servicio como
// Formspree, Mailchimp o Buttondown y reemplaza handleSubmit.
export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sent

  function handleSubmit(e) {
    e.preventDefault();
    if (!email) return;
    setStatus("sent");
  }

  return (
    <div id="newsletter" className="rounded-3xl bg-ceiba-ink px-8 py-12 text-center text-white md:px-16">
      <h3 className="font-serif text-2xl font-semibold md:text-3xl">
        Newsletter de CEIBA
      </h3>
      <p className="mx-auto mt-3 max-w-xl text-sm text-white/70">
        Recibe cada mes las novedades de nuestros programas, convocatorias
        abiertas y las iniciativas climáticas de nuestra comunidad estudiantil.
      </p>

      {status === "sent" ? (
        <p className="mt-6 font-medium text-ceiba-mint">
          ¡Gracias por suscribirte! Muy pronto tendrás noticias de CEIBA.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mx-auto mt-6 flex max-w-md flex-col gap-3 sm:flex-row">
          <label htmlFor="newsletter-email" className="sr-only">Correo electrónico</label>
          <input
            id="newsletter-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
            className="w-full rounded-full border-0 px-5 py-3 text-sm text-ceiba-ink placeholder:text-ceiba-ink/40 focus:outline-none focus:ring-2 focus:ring-ceiba-pink"
          />
          <button type="submit" className="btn-primary shrink-0">
            Suscribirme
          </button>
        </form>
      )}
    </div>
  );
}
