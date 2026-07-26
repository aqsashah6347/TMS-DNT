import { useState, useEffect, useRef } from "react";
import { getRandomQuote } from "quote-lib";
import LoginForm from "../Features/auth/LoginForm";
import tms from "../assets/tms.png";

// Loads a script tag once and resolves when it's actually ready.
// Caches the in-flight promise per src so concurrent callers (e.g. React
// StrictMode double-invoking effects in dev) await the SAME load event
// instead of one of them resolving early just because the <script> tag
// already exists in the DOM but hasn't finished loading yet.
const scriptLoadPromises = {};

function loadScript(src) {
  if (scriptLoadPromises[src]) {
    return scriptLoadPromises[src];
  }

  scriptLoadPromises[src] = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);

    if (existing) {
      // Tag exists but we don't know if it already finished loading —
      // if it's marked done, resolve now; otherwise wait for its load event.
      if (existing.dataset.loaded === "true") {
        resolve();
      } else {
        existing.addEventListener("load", resolve);
        existing.addEventListener("error", reject);
      }
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = reject;
    document.body.appendChild(script);
  });

  return scriptLoadPromises[src];
}

export default function Login() {
  const [quote, setQuote] = useState(null);

  const topRightRef = useRef(null);
  const bottomLeftRef = useRef(null);
  const topRightEffect = useRef(null);
  const bottomLeftEffect = useRef(null);

  useEffect(() => {
    setQuote(getRandomQuote());
  }, []);

  // Load THREE.js + Vanta.NET, then mount two tiny corner instances
  useEffect(() => {
    let cancelled = false;

    async function initVanta() {
      try {
     if (!window.THREE) {
  await loadScript(
    "https://cdnjs.cloudflare.com/ajax/libs/three.js/r121/three.min.js"
  );
}
if (!window.VANTA) {
  await loadScript(
    "https://cdn.jsdelivr.net/npm/vanta@0.5.21/dist/vanta.net.min.js"
  );
}
        if (cancelled || !window.VANTA || typeof window.VANTA.NET !== "function") {
          if (!cancelled) {
            console.error("Vanta loaded but VANTA.NET is not available — check three.js/vanta version compatibility.");
          }
          return;
        }

        const sharedOptions = {
          mouseControls: false, // corner accent shouldn't react to cursor
          touchControls: false,
          gyroControls: false,
          minHeight: 200.0,
          minWidth: 200.0,
          scale: 1.0,
          scaleMobile: 1.0,
          backgroundAlpha: 0, // transparent canvas background
          color: 0xfb923c, // theme accent orange
          points: 8.0,
          maxDistance: 18.0,
          spacing: 16.0,
          showDots: true,
        };

        if (topRightRef.current && !topRightEffect.current) {
          topRightEffect.current = window.VANTA.NET({
            el: topRightRef.current,
            ...sharedOptions,
          });
        }

        if (bottomLeftRef.current && !bottomLeftEffect.current) {
          bottomLeftEffect.current = window.VANTA.NET({
            el: bottomLeftRef.current,
            ...sharedOptions,
          });
        }
      } catch (err) {
        console.error("Vanta failed to load:", err);
      }
    }

    initVanta();

    return () => {
      cancelled = true;
      if (topRightEffect.current) {
        topRightEffect.current.destroy();
        topRightEffect.current = null;
      }
      if (bottomLeftEffect.current) {
        bottomLeftEffect.current.destroy();
        bottomLeftEffect.current = null;
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden flex items-center justify-center bg-black text-white">

      {/* Corner Vanta Accent — Top Right */}
      <div
        className="fixed pointer-events-none"
        style={{
          top: "-220px",
          right: "-220px",
          width: "460px",
          height: "460px",
          opacity: 0.07,
          zIndex: 5,
          overflow: "hidden",
        }}
      >
        <div ref={topRightRef} className="w-full h-full" />
      </div>

      {/* Corner Vanta Accent — Bottom Left */}
      <div
        className="fixed pointer-events-none"
        style={{
          bottom: "-220px",
          left: "-220px",
          width: "460px",
          height: "460px",
          opacity: 0.07,
          zIndex: 5,
          overflow: "hidden",
        }}
      >
        <div ref={bottomLeftRef} className="w-full h-full" />
      </div>

      {/* Top Left Logo */}
      <div className="absolute top-6 left-6 z-40 flex items-center gap-3">
        <img
          src="/dreamsLogo.png"
          alt="Dreams Network"
          className="h-17 w-auto object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
        />
      </div>

      {/* Bottom Right Motivational Quote */}
      {quote && (
        <div className="fixed bottom-6 right-6 z-40 max-w-[340px] text-right pointer-events-none">
          <p className="text-sm text-[#f5e4d8]/90 italic leading-snug drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">
            "{quote.text}"
          </p>
          <p className="text-xs text-[#e57d25] mt-1 font-semibold tracking-wide">
            — {quote.author}
          </p>
        </div>
      )}

      {/* Solid Black Background */}
      <div className="absolute inset-0 bg-black" />
      
      {/* Subtle Soft Highlights */}
      <div className="absolute -top-32 -left-32 w-[700px] h-[700px] bg-gradient-to-r from-transparent via-[#e57d25]/5 to-transparent rounded-full blur-[100px] rotate-45 pointer-events-none" />
      <div className="absolute top-1/4 right-[-10%] w-[600px] h-[600px] bg-gradient-to-l from-transparent via-black to-transparent rounded-full blur-[120px] -rotate-12 pointer-events-none" />
      
      {/* Light Vignette & Subtle Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(0,0,0,0.8),transparent_85%)] pointer-events-none" />
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px)`, backgroundSize: '24px 24px' }} />

      {/* Snake Animation Styles */}
      <style>{`
        @keyframes snakeMove {
          0% {
            stroke-dashoffset: 0;
          }
          100% {
            stroke-dashoffset: -100;
          }
        }
        .snake-line {
          stroke-dasharray: 35 65;
          animation: snakeMove 8s linear infinite;
          will-change: stroke-dashoffset;
        }
      `}</style>

      {/* Main Container - Restored to original styling without the outer outline */}
      <div className="relative w-[676px] h-[450px] flex items-center">
        
        {/* Left Side: Form Card */}
        <div className="absolute left-0 top-[45px] w-[580px] h-[360px] rounded-[32px] bg-[#e57d25]/05 backdrop-blur-md border border-[#e57d25]/25 pt-8 pb-8 pl-12 pr-44 shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(229,125,37,0.15)] flex flex-col justify-center items-start z-10">
          
          <h2 className="text-2xl font-bold text-white text-left mb-6 tracking-wide w-full max-w-[280px]">
            TMS Login
          </h2>

          {/* Login Form */}
          <LoginForm />
        </div>

        {/* Right Side: Floating Image Card */}
        <div className="absolute right-0 top-0 w-[330px] h-[450px] rounded-[38px] overflow-hidden bg-[#0d0c10] shadow-[0_25px_60px_rgba(0,0,0,0.9)] z-20 border border-[#e57d25]/30 flex items-center justify-center flex-shrink-0">
          <img
            src={tms}
            alt="tms-pic"
            className="w-full h-full object-contain scale-110 rounded-[30px]"
          />
          <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-[#e57d25]/20 to-transparent blur-md pointer-events-none" />
        </div>

        {/* Outer Snake Path Line SVG */}
        <svg
          className="absolute inset-0 w-[676px] h-[450px] pointer-events-none z-30 overflow-visible"
          viewBox="0 0 676 450"
        >
          <path
            pathLength="100"
            d="
              M 32 45 
              L 346 45 
              L 346 38 
              A 38 38 0 0 1 384 0 
              L 638 0 
              A 38 38 0 0 1 676 38 
              L 676 412 
              A 38 38 0 0 1 638 450 
              L 384 450 
              A 38 38 0 0 1 346 412 
              L 346 405 
              L 32 405 
              A 32 32 0 0 1 0 373 
              L 0 77 
              A 32 32 0 0 1 32 45 
              Z
            "
            fill="none"
            stroke="#e57d25"
            strokeWidth="3"
            strokeLinecap="round"
            className="snake-line filter drop-shadow-[0_0_8px_#e57d25]"
          />
        </svg>

      </div>

    </div>
  );
}