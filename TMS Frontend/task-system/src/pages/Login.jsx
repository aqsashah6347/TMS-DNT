import { useEffect, useRef, useState } from "react";
import { getRandomQuote } from "quote-lib";
import LoginForm from "../Features/auth/LoginForm";
import ElectricBorder from "../components/ui/ElectricBorder";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";

export default function Login() {
  const [quote, setQuote] = useState({ text: "", author: "" });
  const vantaRef = useRef(null);
  const vantaEffect = useRef(null);

  // 3D Tilt Motion Values
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth Springs for natural 3D rotation
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [15, -15]), {
    stiffness: 300,
    damping: 30,
  });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-15, 15]), {
    stiffness: 300,
    damping: 30,
  });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  useEffect(() => {
    const q = getRandomQuote();
    setQuote({ text: q.text, author: q.author });
  }, []);

  useEffect(() => {
    if (!vantaEffect.current && vantaRef.current && window.VANTA) {
      vantaEffect.current = window.VANTA.GLOBE({
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
      {/* Vanta.GLOBE animated background */}
      <div ref={vantaRef} className="absolute inset-0 w-full h-full z-0" />

      {/* Dreams Logo — Top Left Corner */}
      <div className="absolute top-4 left-4 z-20">
        <img
          src="/dreamsLogo.png"
          alt="Dreams Logo"
          className="w-56 h-auto drop-shadow-md"
        />
      </div>

      {/* Login Form Container with 3D Tilt Wrapper */}
      <div className="absolute left-0 inset-y-0 z-10 w-[38%] min-w-[440px] flex items-center justify-center [perspective:1000px]">
        <motion.div
          className="translate-y-2 cursor-pointer"
          style={{
            rotateX,
            rotateY,
            transformStyle: "preserve-3d",
          }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          {/* ⚡ Electric Border Wrapped Box ⚡ */}
          <ElectricBorder
            color="#ff8e3f"
            speed={1.4}
            chaos={0.25}
            borderRadius={20}
            style={{
              padding: "2rem 2rem",
              background: "transparent",
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
              filter:
                "drop-shadow(0 0 15px rgba(255, 142, 63, 0.6)) drop-shadow(0 0 30px rgba(255, 142, 63, 0.3))",
            }}
          >
            {/* Perfectly Centered Container */}
            <div
              className="w-[320px] flex flex-col items-center justify-center gap-5 mx-auto"
              style={{ transform: "translateZ(30px)" }} /* Content pop-out 3D effect */
            >
              {/* Title */}
              <h2
                className="tms-login-heading text-xl md:text-2xl text-center w-full leading-tight"
                style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
              >
                Task Management System Login
              </h2>

              {/* Form */}
              <div className="w-full">
                <LoginForm />
              </div>
            </div>
          </ElectricBorder>
        </motion.div>
      </div>

      {/* Motivational quote — Bottom Right */}
      <div className="absolute bottom-8 right-8 w-96 z-10 text-right">
        <p className="text-lg leading-8 text-white/85 italic">"{quote.text}"</p>
        {quote.author && (
          <p className="text-base text-orange-400 mt-2 font-semibold">
            — {quote.author}
          </p>
        )}
      </div>
    </div>
  );
}