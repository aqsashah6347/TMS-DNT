import LoginForm from "../Features/auth/LoginForm";
import tms from "../assets/tms.png";

export default function Login() {
  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden flex items-center justify-center bg-[#0d0c10] text-white">
      
      {/* Dynamic Background Glows */}
      <div className="absolute -top-20 -left-20 w-[600px] h-[600px] bg-gradient-to-br from-[#e57d25]/25 via-[#8a3e14]/15 to-transparent rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-[500px] h-[500px] bg-[#d96a21]/15 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute inset-0 opacity-15 pointer-events-none" style={{ backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px)`, backgroundSize: '24px 24px' }} />

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

      {/* Main Container - Exact Combined Bounding Box */}
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