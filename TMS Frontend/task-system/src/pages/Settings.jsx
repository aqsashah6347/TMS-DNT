import ProfileSettings from "../features/settings/components/ProfileSettings";
import PasswordSettings from "../features/settings/components/PasswordSettings";
import TwoFactorSettings from "../features/settings/components/TwoFactorSettings";

export default function Settings() {
  return (
    <div>
      <h2
        className="text-4xl font-semibold text-white"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Settings
      </h2>
      <div className="flex flex-col gap-4 w-full">
        <ProfileSettings />
        <PasswordSettings />
        <TwoFactorSettings />
      </div>
    </div>
  );
}
