import { ArrowUp, ArrowUpRight, Mail, MapPin } from "lucide-react";
import { PROFILE } from "@/lib/data";

export default function ContactSection() {
  const year = new Date().getFullYear();

  return (
    <section id="contact" className="section contact-section">
      <div className="bg-script contact-bg-script" aria-hidden="true">Hello</div>

      <div className="section-label" data-reveal>
        <span>07</span> — Contact
      </div>

      <div className="contact-hero" data-reveal>
        <p className="contact-kicker">Have an idea, a role, or just want to say hi?</p>
        <h2 className="contact-title">
          Let&apos;s build <em>something</em>
          <br />
          <span className="contact-script">together.</span>
        </h2>
        <a href={`mailto:${PROFILE.email}`} className="contact-email">
          {PROFILE.email}
          <ArrowUpRight size={28} strokeWidth={1.25} />
        </a>
      </div>

      <div className="contact-info" data-reveal>
        <div className="contact-info-item">
          <span className="contact-info-label">
            <MapPin size={14} strokeWidth={1.75} /> Based in
          </span>
          <span>{PROFILE.location}</span>
        </div>
        <div className="contact-info-item">
          <span className="contact-info-label">
            <Mail size={14} strokeWidth={1.75} /> Availability
          </span>
          <span>
            <span className="pulse-dot" /> Open to work · {PROFILE.workModes.join(" · ")}
          </span>
        </div>
        <div className="contact-info-item">
          <span className="contact-info-label">Elsewhere</span>
          <span className="contact-links">
            <a href={PROFILE.linkedin} target="_blank" rel="noopener noreferrer">
              LinkedIn
            </a>
            <a href={PROFILE.github} target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
            <a href={PROFILE.instagram} target="_blank" rel="noopener noreferrer">
              Instagram
            </a>
          </span>
        </div>
      </div>

      <footer className="site-footer">
        <span>
          © {year} {PROFILE.name}. Designed &amp; built with care.
        </span>
        <a href="#top" className="back-to-top" aria-label="Back to top">
          Back to top <ArrowUp size={14} strokeWidth={1.75} />
        </a>
      </footer>
    </section>
  );
}
