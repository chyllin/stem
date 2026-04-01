import type { ReactNode } from "react";

interface ModalProps {
  onClose: () => void;
  size?: "sm" | "lg";
  title?: string;
  titleIcon?: string;
  children: ReactNode;
}

export default function Modal({
  onClose,
  size = "sm",
  title,
  titleIcon,
  children,
}: ModalProps) {
  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`modal-box ${size}`}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <i className="fas fa-times" />
        </button>

        {title && (
          <div className="modal-title">
            {titleIcon && <i className={`fas ${titleIcon}`} />}
            {title}
          </div>
        )}

        {children}
      </div>
    </div>
  );
}
