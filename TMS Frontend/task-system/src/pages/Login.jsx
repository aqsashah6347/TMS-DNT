import { useEffect, useRef, useState } from "react";
import { getRandomQuote } from "quote-lib";
import LoginForm from "../Features/auth/LoginForm";
import LoginTiltCard from "../Features/auth/LoginTiltCard";

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

      {/* Card, centered directly on the Vanta background — no glass strip */}
      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <LoginTiltCard className="login-form-card relative z-[3] w-[420px] max-w-[90%] flex flex-col items-center gap-8 p-10">
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
        </LoginTiltCard>
      </div>

      {/* Motivational quote — bottom right */}
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