import ProfileSettings from "../features/settings/components/ProfileSettings";
import PasswordSettings from "../features/settings/components/PasswordSettings";
import TwoFactorSettings from "../features/settings/components/TwoFactorSettings";

export default function Settings() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-dark mb-6">Settings</h2>
      <div className="flex flex-col gap-4">
        <ProfileSettings />
        <PasswordSettings />
        <TwoFactorSettings />
      </div>
    </div>
  );
}
