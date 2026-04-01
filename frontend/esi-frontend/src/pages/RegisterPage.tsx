import { useState } from "react";
import type { RegisterPayload } from "../types";
import type { ApiError } from "../api/index";
import { registerUser } from "../api/index";
import { SUBJECTS, GRADES, ACADEMIC_LEVELS } from "../utils";
import "./Auth.css";

interface Props {
  onRegisterSuccess: (username: string, password: string) => void;
  onNavigate: (page: any) => void;
}

export default function RegisterPage({ onRegisterSuccess, onNavigate }: Props) {
  const [step, setStep] = useState(1);
  
  const [userType,    setUserType]    = useState<"Parent" | "Tutor">("Parent");
  const [firstName,   setFirstName]   = useState("");
  const [middleName,  setMiddleName]  = useState("");
  const [lastName,    setLastName]    = useState("");
  const [username,    setUsername]    = useState("");
  const [email,       setEmail]       = useState("");
  const [phone,       setPhone]       = useState("");
  const [location,    setLocation]    = useState("");
  const [password,    setPassword]    = useState("");
  const [confirm,     setConfirm]     = useState("");
  const [showPw,      setShowPw]      = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Parent-specific
  const [childName,  setChildName]  = useState("");
  const [childGrade, setChildGrade] = useState("");
  const [subjects,   setSubjects]   = useState<string[]>([]);

  // Tutor-specific
  const [expYears,   setExpYears]   = useState("");
  const [quals,      setQuals]      = useState("");
  const [rate,       setRate]       = useState("");
  const [subjsTeach, setSubjsTeach] = useState<string[]>([]);
  const [levels,     setLevels]     = useState<string[]>([]);
  const [bio,        setBio]        = useState("");

  // Geolocation state
  const [isLocating, setIsLocating] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [digitalAddress, setDigitalAddress] = useState("");

  const toggle = (s: string, list: string[], setter: (v: string[]) => void) =>
    setter(list.includes(s) ? list.filter((x) => x !== s) : [...list, s]);

  const passwordsMatch = password === confirm;
  const confirmTouched = confirm.length > 0;

  const switchType = (type: "Parent" | "Tutor") => {
    setUserType(type);
    setError("");
    setFieldErrors({});
  };

  const validateDigitalAddress = (address: string) => {
    // Regex for formats like GA-123-4567 or GZ-000-0000
    const regex = /^[A-Z]{2}-\d{3,4}-\d{4}$/i;
    return regex.test(address);
  };

  const getPasswordStrength = (password: string) => {
    let score = 0;

    if (!password) return { score: 0, label: "" };

    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    let label = "";
    if (score <= 2) label = "Weak";
    else if (score === 3 || score === 4) label = "Medium";
    else label = "Strong";

    return { score, label };
  };

  const { score, label } = getPasswordStrength(password);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Reverse Geocode using OpenStreetMap
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18`
          );
          const data = await res.json();
          
          // Pick the most specific name found (e.g., "Pig Farm" or "Osu")
          const detectedArea = 
            data.address?.suburb || 
            data.address?.neighbourhood || 
            data.address?.residential || 
            data.address?.town;

          if (detectedArea) {
            setLocation(detectedArea);
          } else {
            setError("Location detected, but couldn't find a neighborhood name. Please type it manually.");
          }
        } catch (err) {
          setError("Failed to resolve location name. Please try again or type manually.");
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        const msg = err.code === 1 ? "Permission denied. Please enable location access." : "Location signal too weak.";
        setError(msg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // This replaces the direct 'handleGetLocation' call in your JSX button
  const triggerLocationFlow = () => {
    setShowLocationModal(true);
  };

  // This is called when they click "Sure, Allow" in your custom modal
  const confirmLocationAccess = () => {
    setShowLocationModal(false);
    handleGetLocation(); // Now call the actual GPS function
  };

  // ── Validation Guards ────────────────────────────────────────────────────────
  
  const isStep2Valid = () => {
    return (
      firstName.trim() !== "" &&
      lastName.trim() !== "" &&
      username.trim() !== "" &&
      email.trim() !== "" &&
      phone.trim() !== "" &&
      location.trim() !== "" &&
      validateDigitalAddress(digitalAddress) && // New requirement
      password.length >= 8 &&
      passwordsMatch
    );
  };

  const nextStep = () => {
    setError("");
    setStep((prev) => prev + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const prevStep = () => {
    setError("");
    setStep((prev) => prev - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Submission ───────────────────────────────────────────────────────────────

  const handleSubmit = async (e?: React.FormEvent, skipStep3 = false) => {
    if (e) e.preventDefault();
    setError("");
    setFieldErrors({});

    // Final Tutor validation (Parents can skip)
    if (!skipStep3 && userType === "Tutor") {
      if (subjsTeach.length === 0) return setError("Please select at least one subject you teach.");
      if (levels.length === 0) return setError("Please select at least one academic level.");
      if (!expYears || !rate || !quals.trim()) return setError("Please fill out all required tutor fields.");
    }

    const payload: RegisterPayload = {
      username,
      password,
      password_confirm: confirm,
      role:             userType,
      first_name:       firstName.trim(),
      last_name:        lastName.trim(),
      email:            email.trim(),
      phone_number:     phone.trim(),
      location,
      digital_address: digitalAddress.trim(), // Add this line
    };
    if (middleName.trim()) payload.middle_name = middleName.trim();

    setLoading(true);
    try {
      await registerUser(payload);
      onRegisterSuccess(username, password);
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.fieldErrors) {
        const mapped: Record<string, string> = {};
        Object.entries(apiErr.fieldErrors).forEach(([field, msgs]) => {
          mapped[field] = Array.isArray(msgs) ? msgs[0] : String(msgs);
        });
        setFieldErrors(mapped);
        // If an error occurs, bring them back to Step 2 where basic fields are
        setStep(2); 
        setError("Please fix the errors below and try again.");
      } else {
        setError(apiErr.message ?? "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const fe = (field: string) =>
    fieldErrors[field] ? (
      <div className="auth-field-error">
        <i className="fas fa-exclamation-circle" /> {fieldErrors[field]}
      </div>
    ) : null;

  return (
    <div className="auth-page">
      <div className="auth-card auth-card--wide fade-up">
        
        <div className="auth-icon">
          <i className="fas fa-user-plus" />
        </div>
        <h2>Create Your Account</h2>
        <p>Join STEM Tutor Finder — intelligent matching for Accra families</p>

        {/* ── Stepper ─────────────────────────────────────────────────── */}
        <div className="auth-stepper">
          {[1, 2, 3].map((num) => (
            <div 
              key={num} 
              className={`stepper-item ${step === num ? "active" : ""} ${step > num ? "completed" : ""}`}
            >
              <div className="step-number">
                {step > num ? <i className="fas fa-check" /> : num}
              </div>
              <small>{num === 1 ? "Role" : num === 2 ? "Basic Info" : "Details"}</small>
            </div>
          ))}
        </div>

        {error && <div className="auth-error fade-up"><i className="fas fa-exclamation-circle" /> {error}</div>}

        {/* ── STEP 1: Role Selection ──────────────────────────────────────── */}
        {step === 1 && (
          <div className="fade-up">
            <div className="auth-type-toggle" style={{ margin: "2rem 0" }}>
              <button
                type="button"
                className={`auth-type-btn${userType === "Parent" ? " active" : ""}`}
                onClick={() => switchType("Parent")}
              >
                <i className="fas fa-user" />
                <span>I'm a Parent</span>
                <small>Find a tutor for my child</small>
              </button>
              <button
                type="button"
                className={`auth-type-btn${userType === "Tutor" ? " active" : ""}`}
                onClick={() => switchType("Tutor")}
              >
                <i className="fas fa-chalkboard-teacher" />
                <span>I'm a Tutor</span>
                <small>Offer my teaching services</small>
              </button>
            </div>
            <button type="button" className="btn btn-primary auth-submit" onClick={nextStep}>
              Next: Basic Information <i className="fas fa-arrow-right" />
            </button>
          </div>
        )}

        {/* ── STEP 2: Basic Info ──────────────────────────────────────────── */}
        {step === 2 && (
          <form className="fade-up" noValidate>
            <div className="auth-row auth-row--3">
              <div className="auth-field">
                <label><i className="fas fa-user" /> First Name *</label>
                <input type="text" required placeholder="e.g. Kofi" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                {fe("first_name")}
              </div>
              <div className="auth-field">
                <label><i className="fas fa-user" /> Middle Name</label>
                <input type="text" placeholder="Optional" value={middleName} onChange={(e) => setMiddleName(e.target.value)} />
                {fe("middle_name")}
              </div>
              <div className="auth-field">
                <label><i className="fas fa-user" /> Last Name *</label>
                <input type="text" required placeholder="e.g. Mensah" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                {fe("last_name")}
              </div>
            </div>

            <div className="auth-row">
              <div className="auth-field">
                <label><i className="fas fa-at" /> Username *</label>
                <input type="text" required placeholder="e.g. kofi_mensah" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
                {fe("username")}
              </div>
              <div className="auth-field">
                <label><i className="fas fa-envelope" /> Email *</label>
                <input type="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
                {fe("email")}
              </div>
            </div>

            <div className="auth-row">
              <div className="auth-field">
                <label><i className="fas fa-phone" /> Phone Number *</label>
                <input type="tel" required placeholder="+233 XX XXX XXXX" value={phone} onChange={(e) => setPhone(e.target.value)} />
                {fe("phone_number")}
              </div>

              <div className="auth-field">
                <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span><i className="fas fa-map-marker-alt" /> Neighborhood *</span>
                  <button 
                    type="button" 
                    onClick={triggerLocationFlow} // Triggers the "Enable Location?" modal
                    disabled={isLocating}
                    className="btn-detect-inline"
                    style={{
                      fontSize: "0.7rem",
                      padding: "4px 8px",
                      background: "var(--bg3)",
                      border: "1px solid var(--border)",
                      borderRadius: "4px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px"
                    }}
                  >
                    {isLocating ? (
                      <><i className="fas fa-spinner fa-spin" /> Locating...</>
                    ) : (
                      <><i className="fas fa-crosshairs" /> Detect Exact</>
                    )}
                  </button>
                </label>
                
                <div style={{ position: "relative" }}>
                  <input 
                    type="text" 
                    placeholder="e.g. East Legon, Shiashie..." 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                    className={error && !location ? "input-err" : ""}
                  />
                  {isLocating && <div className="input-loader-bar" />}
                </div>
                {fe("location")}
              </div>
            </div>

            {/* Digital Address Row - Required by your isStep2Valid logic */}
            <div className="auth-row">
              <div className="auth-field">
                <label><i className="fas fa-barcode" /> Ghana Post Digital Address *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. GA-123-4567" 
                  value={digitalAddress} 
                  onChange={(e) => setDigitalAddress(e.target.value.toUpperCase())} 
                />
                <small style={{ fontSize: "0.65rem", color: "var(--text3)" }}>Format: XX-000-0000</small>
                {fe("digital_address")}
              </div>
            </div>

            <div className="auth-row">
              <div className="auth-field">
                <label><i className="fas fa-lock" /> Password *</label>
                <div style={{ position: "relative" }}>
                  <input type={showPw ? "text" : "password"} required minLength={8} placeholder="Min 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" style={{ paddingRight: "2.8rem" }} />
                  <button type="button" onClick={() => setShowPw((p) => !p)} style={{ position: "absolute", right: ".75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text3)" }}>
                    <i className={`fas fa-${showPw ? "eye-slash" : "eye"}`} />
                  </button>
                </div>
                {fe("password")}
                {password && (
                  <div className="pw-strength">
                    <div className="pw-bar">
                      <div
                        className={`pw-fill strength-${score}`}
                      />
                    </div>
                    <small className={`pw-text strength-${label.toLowerCase()}`}>
                      {label}
                    </small>
                  </div>
                )}
              </div>
              <div className="auth-field">
                <label>
                  <i className="fas fa-lock" /> Confirm Password *
                  {confirmTouched && (
                    <span className={`pw-match-badge${passwordsMatch ? " ok" : " err"}`}>
                      <i className={`fas fa-${passwordsMatch ? "check" : "times"}`} /> {passwordsMatch ? " Match" : " No match"}
                    </span>
                  )}
                </label>
                <input type="password" required placeholder="Repeat password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" className={confirmTouched ? (passwordsMatch ? "input-ok" : "input-err") : ""} />
                {fe("password_confirm")}
              </div>
            </div>

            <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
              <button type="button" className="btn" onClick={prevStep} style={{ flex: 1 }}>Back</button>
              <button type="button" className="btn btn-primary" onClick={nextStep} disabled={!isStep2Valid()} style={{ flex: 2 }}>
                Next: {userType} Details <i className="fas fa-arrow-right" />
              </button>
            </div>
          </form>
        )}

        {/* ── STEP 3: Specific Info ───────────────────────────────────────── */}
        {step === 3 && (
          <form className="fade-up" onSubmit={(e) => handleSubmit(e, false)} noValidate>
            
            {userType === "Parent" && (
              <>
                <div className="auth-api-note" style={{ marginBottom: "1rem" }}>
                  <i className="fas fa-info-circle" /> Feel free to add these details now, or skip and set them up later.
                </div>
                <div className="auth-row">
                  <div className="auth-field">
                    <label><i className="fas fa-child" /> Child's Name</label>
                    <input type="text" placeholder="Optional" value={childName} onChange={(e) => setChildName(e.target.value)} />
                  </div>
                  <div className="auth-field">
                    <label><i className="fas fa-graduation-cap" /> Child's Grade</label>
                    <select value={childGrade} onChange={(e) => setChildGrade(e.target.value)}>
                      <option value="">Select grade</option>
                      {GRADES.map((g) => <option key={g}>{g}</option>)}
                    </select>
                  </div>
                </div>
                <div className="auth-field">
                  <label><i className="fas fa-book" /> Subjects Needed</label>
                  <div className="auth-pill-grid">
                    {SUBJECTS.map((s) => (
                      <button key={s} type="button" className={`auth-pill${subjects.includes(s) ? " selected" : ""}`} onClick={() => toggle(s, subjects, setSubjects)}>
                        {subjects.includes(s) && <i className="fas fa-check" />} {s}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {userType === "Tutor" && (
              <>
                <div className="auth-row">
                  <div className="auth-field">
                    <label><i className="fas fa-briefcase" /> Years of Experience *</label>
                    <input type="number" required min="0" placeholder="e.g. 5" value={expYears} onChange={(e) => setExpYears(e.target.value)} />
                  </div>
                  <div className="auth-field">
                    <label><i className="fas fa-money-bill-wave" /> Hourly Rate (GHS) *</label>
                    <input type="number" required min="20" placeholder="Min GHS 20" value={rate} onChange={(e) => setRate(e.target.value)} />
                  </div>
                </div>
                <div className="auth-field">
                  <label><i className="fas fa-certificate" /> Qualifications *</label>
                  <textarea rows={2} required placeholder="e.g. B.Ed Mathematics, University of Ghana" value={quals} onChange={(e) => setQuals(e.target.value)} />
                </div>
                <div className="auth-field">
                  <label>
                    <i className="fas fa-graduation-cap" /> Academic Levels You Teach *
                    <span className="auth-required-badge">{levels.length === 0 ? "— pick at least one" : ""}</span>
                  </label>
                  <div className="auth-pill-grid">
                    {ACADEMIC_LEVELS.map((l) => (
                      <button key={l} type="button" className={`auth-pill${levels.includes(l) ? " selected" : ""}`} onClick={() => toggle(l, levels, setLevels)}>
                        {levels.includes(l) && <i className="fas fa-check" />} {l}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="auth-field">
                  <label>
                    <i className="fas fa-book" /> Subjects You Teach *
                    <span className="auth-required-badge">{subjsTeach.length === 0 ? "— pick at least one" : ""}</span>
                  </label>
                  <div className="auth-pill-grid">
                    {SUBJECTS.map((s) => (
                      <button key={s} type="button" className={`auth-pill${subjsTeach.includes(s) ? " selected" : ""}`} onClick={() => toggle(s, subjsTeach, setSubjsTeach)}>
                        {subjsTeach.includes(s) && <i className="fas fa-check" />} {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="auth-field">
                  <label><i className="fas fa-align-left" /> Short Bio</label>
                  <textarea rows={3} placeholder="Describe your teaching style and expertise…" value={bio} onChange={(e) => setBio(e.target.value)} />
                </div>
              </>
            )}

            <div className="auth-api-note" style={{ marginTop: "1rem" }}>
              <i className="fas fa-shield-alt" />
              Your account is created securely on our server. No payment info is ever collected.
            </div>

            <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
              <button type="button" className="btn" onClick={prevStep} disabled={loading} style={{ flex: 1 }}>Back</button>
              
              {userType === "Parent" && (
                <button type="button" className="btn btn-secondary" onClick={(e) => handleSubmit(e, true)} disabled={loading} style={{ flex: 1 }}>
                  Skip & Submit
                </button>
              )}
              
              <button type="submit" className="btn btn-primary auth-submit" disabled={loading} style={{ flex: 2 }}>
                {loading 
                  ? <><i className="fas fa-spinner fa-spin" /> Creating…</> 
                  : <><i className="fas fa-check-circle" /> Complete Registration</>
                }
              </button>
            </div>
          </form>
        )}

        <p className="auth-switch" style={{ marginTop: "2rem" }}>
          Already have an account?{" "}
          <span onClick={() => onNavigate("login")}>Sign in here</span>
        </p>

      </div>
      {/* ── Location Explanation Modal ────────────────────────────────── */}
      {showLocationModal && (
        <div className="auth-modal-overlay">
          <div className="auth-modal fade-up">
            <div className="auth-modal-icon">
              <i className="fas fa-map-marker-alt" />
            </div>
            <h3>Enable Location Services?</h3>
            <p>
              To show you the best STEM tutors in your specific part of <strong>Accra</strong>, 
              we need to detect your general area. This helps us calculate commute times for home visits.
            </p>
            
            <div className="auth-modal-actions">
              <button type="button" className="btn btn-primary" onClick={confirmLocationAccess}>
                Allow Access
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowLocationModal(false)}>
                I'll type it manually
              </button>
            </div>
            
            <small className="auth-modal-note">
              <i className="fas fa-lock" /> Your location data is securely stored.
            </small>
          </div>
        </div>
      )}
    </div>

  );
}