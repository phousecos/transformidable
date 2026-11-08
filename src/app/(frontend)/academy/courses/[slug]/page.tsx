// @ts-nocheck
import Link from "next/link";
import { notFound } from "next/navigation";
import { AcademyHero, AcademyRegister, AcademyShell, Arrow, JsonLd } from "../../../components/academy/AcademySections";
import { PROGRAMS, programHref } from "../../content";
import { pageMetadata } from "../../../../../lib/seo.ts";

const findProgram = (slug: string) => PROGRAMS.find((p) => p.slug === slug);

export function generateStaticParams() {
  return PROGRAMS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = findProgram(slug);
  if (!p) return {};
  const description = `${p.subtitle}. ${p.intro[0]}`;
  return pageMetadata({ title: `${p.title} | AI Governance Training`, description, path: programHref(p.slug) });
}

export default async function ProgramPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = findProgram(slug);
  if (!p) notFound();
  const i = PROGRAMS.indexOf(p);
  const others = PROGRAMS.filter((o) => o !== p);

  return (
    <AcademyShell>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Course",
          name: p.title,
          description: p.subtitle,
          provider: { "@type": "Organization", name: "Transformidable Academy" },
        }}
      />

      <AcademyHero kicker={p.eyebrow} title={p.title} seed={101 + i * 7}>
        <p className="ac-subtitle">{p.subtitle}</p>
        <dl className="ac-facts">
          <div><dt>Format</dt><dd>{p.facts.format}</dd></div>
          <div><dt>Delivery</dt><dd>{p.facts.delivery}</dd></div>
          <div><dt>Prerequisites</dt><dd>None. Each program stands on its own.</dd></div>
        </dl>
        <div className="ac-hero-cta">
          <a className="btn" href="#register">{p.closing.button} <Arrow s={14} /></a>
        </div>
      </AcademyHero>

      <section className="ac-band" aria-label="Overview">
        <div className="wrap ac-two">
          <div>
            <p className="kicker">{p.stage.name}</p>
            <p className="ac-stage-line">{p.stage.line}</p>
          </div>
          <div>
            {p.intro.map((t) => <p className="body" key={t}>{t}</p>)}
          </div>
        </div>
      </section>

      <section className="ac-band ac-band--parchment" aria-labelledby="ac-explore-h">
        <div className="wrap ac-two">
          <div>
            <h2 className="ac-h2" id="ac-explore-h">What You&rsquo;ll Explore</h2>
          </div>
          <ul className="ac-audiences">
            {p.explore.map((t) => <li key={t}>{t}</li>)}
          </ul>
        </div>
      </section>

      <section className="ac-band" aria-labelledby="ac-takeaway-h">
        <div className="wrap ac-two">
          <div>
            <h2 className="ac-h2" id="ac-takeaway-h">What You&rsquo;ll Take Away</h2>
          </div>
          <div className="ac-takeaway">
            <p className="body">{p.takeaway}</p>
            <ul className="ac-tools" aria-label="Tools participants leave with">
              {p.tools.map((t) => <li key={t}>{t}</li>)}
            </ul>
          </div>
        </div>
      </section>

      <section className="ac-band ac-band--parchment" aria-label="Who should attend and delivery">
        <div className="wrap ac-two">
          <div>
            <h2 className="ac-h3">Who Should Attend</h2>
            <p className="body">{p.attend}</p>
          </div>
          <div>
            <h2 className="ac-h3">Delivery</h2>
            {p.delivery.map((t) => <p className="body" key={t}>{t}</p>)}
            {p.note && <p className="ac-note">{p.note}</p>}
          </div>
        </div>
      </section>

      <AcademyRegister
        type="organization"
        source={programHref(p.slug)}
        program={p.program}
        kicker={p.title}
        heading={p.closing.form}
        title={p.closing.headline}
        intro={p.closing.line}
      />

      {p.individuals && (
        <section className="ac-band" aria-label="For individuals" style={{ paddingBlock: "32px" }}>
          <div className="wrap">
            <p className="ac-note" style={{ marginTop: 0 }}>
              Interested as an individual?{" "}
              <Link className="ac-inline" href={`/academy/individuals?program=${p.program}#register`}>Register your interest in an upcoming program</Link>.
            </p>
          </div>
        </section>
      )}

      <section className="ac-band" aria-labelledby="ac-others-h">
        <div className="wrap">
          <p className="kicker" id="ac-others-h">Other programs</p>
          <div className="ac-routes" style={{ marginTop: 18 }}>
            {others.map((o) => (
              <Link className="ac-route" href={programHref(o.slug)} key={o.slug}>
                <span className="ac-route-label">{o.stage.name} &middot; {o.stage.format}</span>
                <span className="ac-route-title">{o.title}</span>
                <span className="ac-route-desc">{o.stage.line}</span>
                <span className="ac-route-go">View program <Arrow /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </AcademyShell>
  );
}
