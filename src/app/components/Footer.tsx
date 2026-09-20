type FooterProps = {
  variant?: "navigation" | "studentActions";
  active?: "dashboard" | "students";
  onLogout?: () => void;
  onAddStudent?: () => void;
};

export default function Footer({ variant = "navigation", active, onLogout, onAddStudent }: FooterProps) {
  if (variant === "studentActions") {
    return <footer className="mobile-footer student-actions-footer" aria-label="Student actions">
      <button type="button" className="mobile-footer-item student-action-primary" onClick={onAddStudent}>
        <span className="mobile-footer-icon" aria-hidden="true">+</span>
        <span>Add student</span>
      </button>
      <a className="mobile-footer-item student-action-secondary" href="/teacher/students/report">
        <span className="mobile-footer-icon" aria-hidden="true">R</span>
        <span>Class report</span>
      </a>
    </footer>;
  }

  return <footer className="mobile-footer" aria-label="Teacher mobile navigation">
    <a className={active === "dashboard" ? "mobile-footer-item active" : "mobile-footer-item"} href="/teacher">
      <span className="mobile-footer-icon" aria-hidden="true">D</span>
      <span>Dashboard</span>
    </a>
    <a className={active === "students" ? "mobile-footer-item active" : "mobile-footer-item"} href="/teacher/students">
      <span className="mobile-footer-icon" aria-hidden="true">S</span>
      <span>Students</span>
    </a>
    <button className="mobile-footer-item" onClick={onLogout}>
      <span className="mobile-footer-icon" aria-hidden="true">L</span>
      <span>Logout</span>
    </button>
  </footer>;
}
