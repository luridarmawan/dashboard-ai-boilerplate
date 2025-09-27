import { useOnlineStatus } from "../../services/onlineStatusService";
// 🟢 Online || 🔴 Offline

export default function OnlineStatus() {
  const isOnline = useOnlineStatus();

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500">
        {isOnline ? "" : "🔴 Offline"}
      </span>
    </div>
  );
}
