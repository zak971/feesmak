type SidebarRole = "OWNER" | "TEACHER";

type SidebarProps = {
  role: SidebarRole;
  active: string;
  onLogout: () => void;
  counts?: {
    students?: number;
    classes?: number;
    teachers?: number;
  };
};

type NavigationItem = {
  label: string;
  href: string;
  key: string;
  count?: number;
};

export default function Sidebar({ role, active, onLogout, counts = {} }: SidebarProps) {
  const items: NavigationItem[] = role === "OWNER"
    ? [
        { label: "Dashboard", href: "/owner", key: "dashboard" },
        { label: "Students", href: "/owner/students", key: "students", count: counts.students },
        { label: "Classes", href: "/owner/classes", key: "classes", count: counts.classes },
        { label: "Teachers", href: "/owner/teachers", key: "teachers", count: counts.teachers },
        { label: "Fees", href: "/owner/fees", key: "fees" },
        { label: "Payments", href: "/owner/payments", key: "payments" },
        { label: "Reports", href: "/owner/reports", key: "reports" }
      ]
    : [
        { label: "Dashboard", href: "/teacher", key: "dashboard" },
        { label: "My students", href: "/teacher/students", key: "students", count: counts.students },
        { label: "My classes", href: "/teacher/classes", key: "classes", count: counts.classes }
      ];

  return <aside className="owner-sidebar" aria-label={`${role.toLowerCase()} navigation`}>
    <div className="sidebar-label">{role === "OWNER" ? "Workspace" : "My workspace"}</div>
    <nav className="sidebar-nav">
      {items.map(item => <a className={`sidebar-item${active === item.key ? " active" : ""}`} href={item.href} key={item.key}>
        <span>{item.label}</span>
        {item.count !== undefined && <small>{item.count}</small>}
      </a>)}
    </nav>
    <div className="sidebar-footer">
      <div className="sidebar-label">Account</div>
      <button className="sidebar-item sidebar-button" onClick={onLogout}><span>Logout</span></button>
    </div>
  </aside>;
}
