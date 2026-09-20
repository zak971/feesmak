"use client";

import { useEffect, useMemo, useState } from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

type User = {
  name: string;
  role: "OWNER" | "TEACHER";
};

type Payment = {
  receiptNumber: string;
  amount: number;
  method: string;
  paidAt: string;
};

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

const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function TeacherDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const me = await fetch("/api/me");

        if (!me.ok) {
          window.location.href = "/login/teacher";
          return;
        }

        const currentUser = (await me.json()).user as User;

        if (currentUser.role !== "TEACHER") {
          window.location.href = "/owner";
          return;
        }

        const dashboard = await fetch("/api/dashboard");

        if (!dashboard.ok) {
          setError("Unable to load dashboard data.");
          return;
        }

        setUser(currentUser);
        setData(await dashboard.json());
      } catch {
        setError("Unable to load dashboard data.");
      }
    }

    load();
  }, []);

  async function signOut() {
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    window.location.href = "/login";
  }

  const collectionProgress = useMemo(() => {
    if (!data?.expected) return 0;

    return Math.min(
      100,
      Math.round((data.collected / data.expected) * 100)
    );
  }, [data]);

  if (!user || !data) {
    return (
      <main className="teacher-dashboard-loading">
        <div className="loading-dashboard-card">
          <div className="loading-dashboard-line large" />
          <div className="loading-dashboard-line" />
          <div className="loading-dashboard-block" />
        </div>

        {error && <p className="student-error">{error}</p>}
      </main>
    );
  }

  const firstName = user.name.split(" ")[0];

  return (
    <div className="dashboard-shell teacher-dashboard-page">
      <Header
        role="TEACHER"
        userName={user.name}
        onLogout={signOut}
      />

      <div className="owner-layout">
        <Sidebar
          role="TEACHER"
          active="dashboard"
          onLogout={signOut}
          counts={{
            students: data.students,
            classes: data.classes,
          }}
        />

        <main className="container dashboard-content teacher-dashboard-content">
          {/* Welcome */}
          <section className="teacher-welcome">
            <div>
              <div className="eyebrow">Teacher dashboard</div>

              <h1>
                Assalamualaikum, {firstName}
              </h1>

              <p>
                Here is your class overview for this month.
              </p>
            </div>

            <div className="current-month-badge">
              Current month
            </div>
          </section>

          {/* Main stats */}
          <section className="teacher-stats">
            <div className="teacher-stat-card primary">
              <div className="teacher-stat-top">
                <span>My students</span>

                <span className="teacher-stat-icon">
                  👤
                </span>
              </div>

              <strong>{data.students}</strong>

              <small>
                Students in your class
              </small>
            </div>

            <div className="teacher-stat-card">
              <div className="teacher-stat-top">
                <span>Expected fees</span>

                <span className="teacher-stat-icon">
                  ₹
                </span>
              </div>

              <strong>
                {money.format(data.expected)}
              </strong>

              <small>
                This month
              </small>
            </div>

            <div className="teacher-stat-card collected">
              <div className="teacher-stat-top">
                <span>Collected</span>

                <span className="teacher-stat-icon">
                  ✓
                </span>
              </div>

              <strong>
                {money.format(data.collected)}
              </strong>

              <small>
                {collectionProgress}% collected
              </small>
            </div>

            <div className="teacher-stat-card pending">
              <div className="teacher-stat-top">
                <span>Pending</span>

                <span className="teacher-stat-icon">
                  !
                </span>
              </div>

              <strong>
                {money.format(data.pending)}
              </strong>

              <small>
                Needs collection
              </small>
            </div>
          </section>

          {/* Quick actions */}
          <section className="teacher-section">
            <div className="teacher-section-heading">
              <div>
                <div className="eyebrow">Quick actions</div>
                <h2>What would you like to do?</h2>
              </div>
            </div>

            <div className="teacher-actions">
              <a
                href="/teacher/students"
                className="teacher-action-card primary-action"
              >
                <div className="teacher-action-icon">
                  ₹
                </div>

                <div>
                  <strong>Manage students & fees</strong>

                  <span>
                    View students and collect monthly fees
                  </span>
                </div>

                <span className="teacher-action-arrow">
                  →
                </span>
              </a>

              <a
                href="/teacher/students/report"
                className="teacher-action-card"
              >
                <div className="teacher-action-icon">
                  ≡
                </div>

                <div>
                  <strong>Class fee report</strong>

                  <span>
                    View collection and pending fees
                  </span>
                </div>

                <span className="teacher-action-arrow">
                  →
                </span>
              </a>
            </div>
          </section>

          {/* Collection overview */}
          <section className="teacher-section">
            <div className="teacher-section-heading">
              <div>
                <div className="eyebrow">
                  Fee collection
                </div>

                <h2>Monthly progress</h2>
              </div>
            </div>

            <div className="teacher-collection-card">
              <div className="teacher-collection-top">
                <div>
                  <span>Collection progress</span>

                  <strong>
                    {collectionProgress}%
                  </strong>
                </div>

                <div className="teacher-collection-amount">
                  <strong>
                    {money.format(data.collected)}
                  </strong>

                  <span>
                    of {money.format(data.expected)}
                  </span>
                </div>
              </div>

              <div className="teacher-progress-track">
                <div
                  className="teacher-progress-bar"
                  style={{
                    width: `${collectionProgress}%`,
                  }}
                />
              </div>

              <div className="teacher-collection-footer">
                <span>
                  {money.format(data.collected)} collected
                </span>

                <span>
                  {money.format(data.pending)} remaining
                </span>
              </div>
            </div>
          </section>

          {/* Today's collection */}
          <section className="teacher-today-card">
            <div>
              <div className="eyebrow">
                Today
              </div>

              <h2>Today's collection</h2>

              <p>
                Fees recorded today from your students.
              </p>
            </div>

            <strong>
              {money.format(data.todayCollection)}
            </strong>
          </section>
        </main>

        <Footer
          active="dashboard"
          onLogout={signOut}
        />
      </div>
    </div>
  );
}