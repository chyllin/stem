import type { Notification } from "../../types";

const ICONS: Record<Notification["type"], string> = {
  success: "fa-check-circle",
  error:   "fa-exclamation-circle",
  info:    "fa-info-circle",
};

export default function NotifToast({ notif }: { notif: Notification }) {
  return (
    <div className={`notif ${notif.type}`}>
      <i className={`fas ${ICONS[notif.type]}`} />
      <span>{notif.message}</span>
    </div>
  );
}