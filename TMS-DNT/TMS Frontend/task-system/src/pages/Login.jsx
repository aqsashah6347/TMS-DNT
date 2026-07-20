import { useEffect, useRef, useState } from "react";
import { getRandomQuote } from "quote-lib";
import LoginForm from "../features/auth/LoginForm";

export default function Login() {
  const [quote, setQuote] = useState({ text: "", author: "" });
  const vantaRef = useRef(null);
  const vantaEffect = useRef(null);

  useEffect(() => {
    const q = getRandomQuote();
    setQuote({ text: q.text, author: q.author });
  }, []);

  useEffect(() => {
    if (!vantaEffect.current && vantaRef.current && window.VANTA) {
      vantaEffect.current = window.VANTA.NET({
        el: vantaRef.current,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.0,
        minWidth: 200.0,
        scale: 1.0,
        scaleMobile: 1.0,
        color: 0xff8e3f,
        backgroundColor: 0x1c1e20,
      });
    }
    return () => {
      if (vantaEffect.current) {
        vantaEffect.current.destroy();
        vantaEffect.current = null;
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden">
      {/* Vanta.NET animated background (full page) */}
      <div ref={vantaRef} className="absolute inset-0 w-full h-full z-0" />

      {/* Hidden SVG filter driving the liquid-glass distortion */}
      <svg style={{ display: "none" }}>
        <filter
          id="login-glass-distort"
          x="0%"
          y="0%"
          width="100%"
          height="100%"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.008 0.008"
            numOctaves="2"
            seed="92"
            result="noise"
          />
          <feGaussianBlur in="noise" stdDeviation="0.02" result="blur" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="blur"
            scale="77"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </svg>

      {/* Horizontal glass strip, centered vertically across the full width */}
      <div className="login-glass-wrapper absolute left-0 right-0 top-1/2 -translate-y-1/2 z-10 w-full h-[440px] max-h-[80vh] flex items-center justify-center">
        <div className="login-glass-tint" />
        <div className="login-glass-shine" />

        {/* Grey blurred card holding the form, centered in the strip */}
        <div className="login-form-card relative z-[3] w-[420px] max-w-[90%] flex flex-col items-center gap-8 p-10">
          <div className="flex flex-col items-center gap-3">
            <img src="/dreamsLogo.png" alt="DreamsLogo" className="w-44 h-auto" />
          <h2
  className="tms-login-heading text-2xl mt-2"
  style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
>
  TMS Login
</h2>
          </div>

          <div className="w-full">
            <LoginForm />
          </div>
        </div>
      </div>

      {/* Motivational quote — bottom right, outside the strip */}
      <div className="absolute bottom-8 right-8 w-96 z-10 text-right">
        <p className="text-lg leading-8 text-white/85 italic">
          "{quote.text}"
        </p>
        {quote.author && (
          <p className="text-base text-orange-400 mt-2 font-semibold">
            — {quote.author}
          </p>
        )}
      </div>
    </div>
  );
}