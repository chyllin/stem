import "./Pages.css";

export default function AboutPage() {
  return (
    <div className="fade-up">
      <div className="about-wrap">
        <div className="about-hero-card">
          <h1>About STEM Tutor Finder</h1>
          <p>Revolutionising STEM education in Ghana through intelligent tutor matching</p>
        </div>

        <div className="about-content">
          <div className="about-sect">
            <h2>Our Mission</h2>
            <p>
              To make quality STEM education accessible to every child in Ghana by
              connecting parents with qualified, verified tutors through an intelligent,
              transparent platform.
            </p>
          </div>

          <div className="about-sect">
            <h2>The Problem We're Solving</h2>
            <p>
              Parents of primary and junior high school pupils in Ghana struggle to find
              qualified and reliable STEM tutors for in-person private lessons. Traditional
              methods — word-of-mouth, social media ads, or general agencies — don't
              guarantee tutor quality, transparency, or suitability for a child's needs.
            </p>
          </div>

          <div className="about-sect">
            <h2>Our Solution</h2>
            <p>A smart, structured, and transparent AI-powered platform that:</p>
            <ul className="about-list">
              {[
                "Uses intelligent matching algorithms based on subject, location, availability, and qualifications",
                "Provides comprehensive tutor verification and background checks",
                "Features parent-driven rating systems for accountability",
                "Focuses exclusively on STEM education for basic schools (Primary 4 – JHS 3)",
                "Offers detailed performance analytics and tracking",
              ].map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="about-sect">
            <h2>Subjects We Cover</h2>
            <div className="about-subj-items">
              {[
                ["fa-calculator",       "Mathematics"],
                ["fa-flask",            "Integrated Science"],
                ["fa-laptop-code",      "ICT/Computing (Coding / Robotics)"],
                ["fa-drafting-compass", "Basic Design & Technology"],
              ].map(([icon, name]) => (
                <div key={name} className="about-subj-item">
                  <i className={`fas ${icon}`} />
                  <span>{name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="about-sect">
            <h2>Coverage Area</h2>
            <p>
              Currently serving the Greater Accra region with plans to expand nationwide.
              Our focus on in-person tutoring ensures personalised, effective learning
              experiences.
            </p>
          </div>

          <div className="about-sect">
            <h2>Contact Us</h2>
            <ul className="contact-list">
              <li><i className="fas fa-envelope" /> info@stemtutorfinder.com</li>
              <li><i className="fas fa-phone" /> +233 244 407 698</li>
              <li><i className="fas fa-map-marker-alt" /> Accra, Ghana</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
