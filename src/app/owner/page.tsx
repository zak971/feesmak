"use client";

import { useEffect, useState } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

type User = { name: string; role: "OWNER" | "TEACHER" };
type Payment = { receiptNumber: string; amount: number; method: string; paidAt: string };
type Dashboard = {
  students: number;
  classes: number;
  teachers: number;
  expected: number;
  collected: number;
  pending: number;
  todayCollection: number;
  recentPayments: Payment[];
};

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export default function OwnerDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const me = await fetch("/api/me");
      if (!me.ok) {
        window.location.href = "/login/owner";
        return;
      }

      const currentUser = (await me.json()).user as User;
      if (currentUser.role !== "OWNER") {
        window.location.href = "/";
        return;
      }

      const dashboard = await fetch("/api/dashboard");
      if (!dashboard.ok) {
        setError("Unable to load dashboard data.");
        return;
      }

      setUser(currentUser);
      setData(await dashboard.json());
    }

    load();
  }, []);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  if (!user || !data) return <main className="teacher-dashboard-loading">
    <div className="loading-dashboard-card">
      <div className="loading-dashboard-line large" />
      <div className="loading-dashboard-line" />
      <div className="loading-dashboard-block" />
    </div>
    {error && <p className="student-error">{error}</p>}
  </main>;

  const collectionProgress = data.expected ? Math.min(100, Math.round((data.collected / data.expected) * 100)) : 0;

  return <div className="dashboard-shell">
    <Header role="OWNER" userName={user.name} onLogout={signOut} />

    <div className="owner-layout">
      <Sidebar role="OWNER" active="dashboard" onLogout={signOut} counts={{ students: data.students, classes: data.classes, teachers: data.teachers }} />

      <main className="container dashboard-content">
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <div className="eyebrow">Overview</div>
          <h2 style={{ margin: "6px 0 0" }}>Good morning, {user.name.split(" ")[0]}</h2>
        </div>
        <span className="muted">Current month</span>
      </div>

      <div className="grid grid4">
        <div className="card metric-card accent"><div className="metric-label">Today&apos;s collection</div><div className="stat">{money.format(data.todayCollection)}</div></div>
        <div className="card metric-card"><div className="metric-label">Total collected</div><div className="stat">{money.format(data.collected)}</div></div>
        <div className="card metric-card warning"><div className="metric-label">Pending fees</div><div className="stat">{money.format(data.pending)}</div></div>
        <div className="card metric-card"><div className="metric-label">Expected fees</div><div className="stat">{money.format(data.expected)}</div></div>
      </div>

      <div className="dashboard-grid">
        <section className="card">
          <div className="eyebrow">Fee health</div>
          <h2 style={{ margin: "6px 0 0" }}>Collection progress</h2>
          <div className="progress-track"><div className="progress-bar" style={{ width: `${collectionProgress}%` }} /></div>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <strong>{collectionProgress}% collected</strong>
            <span className="muted">{money.format(data.pending)} remaining</span>
          </div>
        </section>
        <section className="card">
          <div className="eyebrow">Maktab snapshot</div>
          <h2 style={{ margin: "6px 0 0" }}>Your operation</h2>
          <div className="row" style={{ justifyContent: "space-between", marginTop: 16 }}><span>Students</span><strong>{data.students}</strong></div>
          <div className="row" style={{ justifyContent: "space-between", marginTop: 10 }}><span>Classes</span><strong>{data.classes}</strong></div>
          <div className="row" style={{ justifyContent: "space-between", marginTop: 10 }}><span>Teachers</span><strong>{data.teachers}</strong></div>
        </section>
      </div>

      <div className="dashboard-grid">
        <section className="card">
          <div><div className="eyebrow">Activity</div><h2 style={{ margin: "6px 0 0" }}>Recent payments</h2></div>
          {data.recentPayments.length === 0 ? <p className="empty-state">No payments recorded yet.</p> : <table style={{ marginTop: 16 }}><thead><tr><th>Receipt</th><th>Method</th><th>Amount</th></tr></thead><tbody>{data.recentPayments.map(payment => <tr key={payment.receiptNumber}><td>{payment.receiptNumber}</td><td>{payment.method.replace("_", " ")}</td><td>{money.format(payment.amount)}</td></tr>)}</tbody></table>}
        </section>
        <section className="card">
          <div className="eyebrow">Workspace</div><h2 style={{ margin: "6px 0 0" }}>Management areas</h2>
          <div className="action-list">
            <div className="action-link"><span>Students</span><strong>{data.students}</strong></div>
            <div className="action-link"><span>Classes</span><strong>{data.classes}</strong></div>
            <div className="action-link"><span>Teachers</span><strong>{data.teachers}</strong></div>
          </div>
        </section>
      </div>
      </main>
    </div>
  </div>;
}