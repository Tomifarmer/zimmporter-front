import CookieManager from "@/components/CookieManager";

import "./SettingsPage.css";

export default function SettingsPage() {
  return (
    <div className="settings-page">
      <h2 className="settings-page-title">Settings</h2>
      <CookieManager />
    </div>
  );
}
