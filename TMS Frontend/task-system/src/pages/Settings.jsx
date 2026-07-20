import { useState } from "react";
import ProfileInfoTab from "../Features/settings/components/ProfileInfoTab";
import ProfileSettings from "../Features/settings/components/ProfileSettings";
import ProfileAppearanceSettings from "../Features/settings/components/ProfileAppearanceSettings";

const TABS = [
  { key: "info", label: "Info" },
  { key: "settings", label: "Settings" },
];

export default function Settings() {
  const [tab, setTab] = useState("info");

  return (
    <div>
      <h2
        className="text-4xl font-semibold text-white"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Profile
      </h2>

      <div className="flex gap-2 mt-5 mb-6 border-b border-white/10 w-full max-w-3xl mx-auto">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === key
                ? "border-orange-500 text-white"
                : "border-transparent text-white/50 hover:text-white/80"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "info" && <ProfileInfoTab />}

      {tab === "settings" && (
        <div className="flex flex-col gap-4 w-full">
          <ProfileSettings />
          <ProfileAppearanceSettings />
        </div>
      )}
    </div>
  );
}
