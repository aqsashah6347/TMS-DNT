import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";

export default function TwoFactorSettings() {
  const [enabled, setEnabled] = useState(true);

  return (
    <Card className="p-6 max-w-md flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center">
          <ShieldCheck size={18} className="text-dark" />
        </div>
        <div>
          <p className="text-sm font-medium text-dark">
            Two-Factor Authentication
          </p>
          <p className="text-xs text-muted">
            {enabled ? "Enabled" : "Disabled"} for your account
          </p>
        </div>
      </div>
      <Button
        variant={enabled ? "danger" : "primary"}
        onClick={() => setEnabled(!enabled)}
      >
        {enabled ? "Disable" : "Enable"}
      </Button>
    </Card>
  );
}
