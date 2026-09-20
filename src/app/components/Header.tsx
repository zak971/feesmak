type HeaderRole = "OWNER" | "TEACHER";

type HeaderProps = {
  role: HeaderRole;
  userName?: string;
  onLogout: () => void;
};

export default function Header({ role, userName, onLogout }: HeaderProps) {
  const isOwner = role === "OWNER";

  return <header className="dashboard-header">
    <div className="dashboard-header-inner">
      <div>
        <h1>Maktab-E-Bilal</h1>
        <span className={isOwner ? "header-owner-label" : "header-teacher-label"}>
          {isOwner ? "Owner workspace" : "Teacher workspace"}
        </span>
      </div>
      <div className="row header-actions">
        {userName && <span className="header-welcome">Welcome, {userName}</span>}
        <button onClick={onLogout} className="secondary">Logout</button>
      </div>
    </div>
  </header>;
}
