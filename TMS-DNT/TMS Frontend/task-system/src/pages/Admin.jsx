import { Cat } from "lucide-react"; // Assuming you are using lucide-react or a similar package

export default function Access() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center text-white">
      <Cat className="w-16 h-16 text-orange-500 mb-4" fill="currentColor" />
      <h2
        className="text-4xl font-semibold"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Coming Soon
      </h2>
      <p className="text-white/60 mt-2 text-sm">
        We are working on bringing you the new access management features.
      </p>
    </div>
  );
}
