import React from "react";
import { cn } from "@/lib/utils";

/**
 * Lightweight device frames in the spirit of Magic UI's device mocks —
 * plain HTML/CSS (no images or iframes) so they can host live, animated UI.
 * All frame dimensions are in `em`; set `font-size` on the frame to scale it
 * (give `Safari` an explicit width — its height follows from its aspect ratio).
 */

type FrameProps = {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

export function Safari({ url = "", children, className, style }: FrameProps & { url?: string }) {
  return (
    <div className={cn("dm-safari", className)} style={style}>
      <div className="dm-safari-bar" aria-hidden="true">
        <div className="dm-safari-lights">
          <i />
          <i />
          <i />
        </div>
        <div className="dm-safari-url">
          <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="2.2">
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
          {url}
        </div>
        <div className="dm-safari-actions">
          <i />
          <i />
        </div>
      </div>
      <div className="dm-screen dm-safari-screen">{children}</div>
    </div>
  );
}

function StatusIcons() {
  return (
    <span className="dm-status-icons">
      <i className="dm-signal">
        <b />
        <b />
        <b />
        <b />
      </i>
      <i className="dm-battery" />
    </span>
  );
}

export function Iphone({ children, className, style }: FrameProps) {
  return (
    <div className={cn("dm-phone dm-iphone", className)} style={style}>
      <span className="dm-btn dm-btn--action" aria-hidden="true" />
      <span className="dm-btn dm-btn--vol-up" aria-hidden="true" />
      <span className="dm-btn dm-btn--vol-down" aria-hidden="true" />
      <span className="dm-btn dm-btn--power" aria-hidden="true" />
      <div className="dm-screen dm-phone-screen">
        <div className="dm-status" aria-hidden="true">
          <span>9:41</span>
          <span className="dm-island" />
          <StatusIcons />
        </div>
        {children}
        <span className="dm-home-bar" aria-hidden="true" />
      </div>
    </div>
  );
}

export function Android({ children, className, style }: FrameProps) {
  return (
    <div className={cn("dm-phone dm-android", className)} style={style}>
      <span className="dm-btn dm-btn--vol-up" aria-hidden="true" />
      <span className="dm-btn dm-btn--power" aria-hidden="true" />
      <div className="dm-screen dm-phone-screen">
        <div className="dm-status" aria-hidden="true">
          <span>12:30</span>
          <span className="dm-punch" />
          <StatusIcons />
        </div>
        {children}
        <span className="dm-home-bar" aria-hidden="true" />
      </div>
    </div>
  );
}
