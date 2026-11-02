import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { AnimatedThemeToggler } from "@/registry/magicui/animated-theme-toggler";
import SocialCubes from "@/components/SocialCubes";
import AboutSection from "@/components/AboutSection";
import ExperienceSection from "@/components/ExperienceBook";
import WorksSection from "@/components/WorksSection";
import SkillsSection from "@/components/SkillsSection";
import ContactSection from "@/components/ContactSection";
import ScrollReveal from "@/components/ScrollReveal";
import SmoothAnchors from "@/components/SmoothAnchors";
import { PROFILE } from "@/lib/data";
import StrokeText from "@/components/ui/stroke-text";
import HeroScrollFx from "@/components/HeroScrollFx";
import HeroMotion from "@/components/HeroMotion";
import HeroAtmosphere from "@/components/HeroAtmosphere";
import HeroDustPortrait from "@/components/HeroDustPortrait";

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <div className="layout-container">
      <main id="top" className="main-wrapper hero-play">
        <HeroAtmosphere />
        {/* Background Element */}
        <div className="bg-howdy" aria-hidden="true">
          <StrokeText
            text="Howdy"
            strokeColor="var(--howdy-stroke, rgba(255, 255, 255, 0.25))"
            fillColor="var(--howdy-fill, transparent)"
            strokeWidth={1.4}
            drawDuration={1}
            fillDelay={0.1}
            stagger={0.05}
            delay={0.2}
            ease="power2.inOut"
            trigger="mount"
            replayOn="hero:replay"
            fillMode="wipe"
            fontSize="1em"
            fontFamily="var(--font-festive)"
          />
        </div>

        {/* 3D Social Cubes */}
        <SocialCubes />

        {/* Navigation */}
        <nav className="nav-container" aria-label="Primary">
          <Link href="#top" className="logo">
            Abhinand<span>.</span>
          </Link>
          <div className="nav-links">
            <Link href="#about">About</Link>
            <Link href="#experience">Journey</Link>
            <Link href="#works">Work</Link>
            <Link href="#skills">Skills</Link>
          </div>
          <div className="nav-actions">
            <AnimatedThemeToggler />
            <Link href="#contact" className="contact-btn">
              Let&apos;s talk
              <ArrowUpRight size={15} strokeWidth={1.75} aria-hidden="true" />
            </Link>
          </div>
        </nav>

        {/* Hero Editorial Section */}
        <section className="hero-editorial">
          <div className="left-content" aria-hidden="true" />

          <div className="person-container">
            <div className="person-glow"></div>
            <HeroDustPortrait src="/user5.png" alt="Abhinand" width={800} height={1200} />
          </div>

          <div className="right-content">
            <div className="hero-eyebrow">Software Engineer</div>
            <p className="description">
              <b>Based in Kerala, India.</b> Building full-stack web
              applications, cross-platform mobile experiences and API-driven
              solutions.
            </p>
            <div className="hero-ctas">
              <Link href="#works" className="hero-cta hero-cta--primary">
                Explore my work
                <ArrowRight size={15} strokeWidth={1.75} aria-hidden="true" />
              </Link>
              <a href={PROFILE.github} target="_blank" rel="noopener noreferrer" className="hero-cta hero-cta--link">
                GitHub
                <ArrowUpRight size={14} strokeWidth={1.75} aria-hidden="true" />
              </a>
            </div>
          </div>
        </section>

        <a href="#about" className="hero-scroll" aria-label="Scroll to About">
          <span>Scroll</span>
          <i aria-hidden="true" />
        </a>
      </main>

      <AboutSection />
      <ExperienceSection />
      <WorksSection />
      <SkillsSection />
      <ContactSection />
      <ScrollReveal />
      <SmoothAnchors />
      <HeroScrollFx />
      <HeroMotion />
    </div>
  );
}
