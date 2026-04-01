import type { Page } from "../../types";
import "./Footer.css";

interface FooterProps {
  onNavigate: (page: Page) => void;
  onRegisterOpen: () => void;
}

export default function Footer({ onNavigate, onRegisterOpen }: FooterProps) {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand-col">
          <div className="footer-brand">
            <i className="fas fa-graduation-cap" />
            STEM Tutor Finder
          </div>
          <p className="footer-desc">
            Connecting parents with qualified STEM tutors across Accra, Ghana.
          </p>
          <div className="social-links">
            {["fab fa-facebook-f","fab fa-twitter","fab fa-instagram","fab fa-linkedin-in"].map((ic) => (
              <a key={ic} href="#" aria-label={ic}>
                <i className={ic} />
              </a>
            ))}
          </div>
        </div>

        <div className="footer-col">
          <h4>Quick Links</h4>
          <ul>
            {(["home","tutors","analytics","about"] as Page[]).map((p) => (
              <li key={p}>
                <button onClick={() => onNavigate(p)}>
                  {p.charAt(0).toUpperCase() + p.slice(1).replace("tutors","Find Tutors")}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="footer-col">
          <h4>For Tutors</h4>
          <ul>
            <li><button onClick={onRegisterOpen}>Become a Tutor</button></li>
            <li><button>Tutor Resources</button></li>
            <li><button>FAQ</button></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Contact</h4>
          <ul className="footer-contact">
            <li><i className="fas fa-envelope" /> info@stemtutorfinder.com</li>
            <li><i className="fas fa-phone" /> +233 244 407 698</li>
            <li><i className="fas fa-map-marker-alt" /> Accra, Ghana</li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>
          © 2026 STEM Tutor Finder. All rights reserved.{" "}
          <a href="#">Privacy Policy</a> · <a href="#">Terms of Service</a>
        </p>
      </div>
    </footer>
  );
}
