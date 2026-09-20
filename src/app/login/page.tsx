"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function LoginPage() {
  useEffect(() => {
    fetch("/api/me").then(async (response) => {
      if (!response.ok) return;
      const { user } = await response.json();
      window.location.replace(user.role === "OWNER" ? "/owner" : "/teacher");
    }).catch(() => undefined);
  }, []);

  return (
    <main className="maktab-login-page">
      <div className="maktab-login-container">

        {/* Brand */}
        <div className="maktab-brand">
          <div className="maktab-logo">
            M
          </div>

          <div>
            <div className="maktab-name">Maktab-E-Bilal</div>
            <div className="maktab-subtitle">
              Maktab Management
            </div>
          </div>
        </div>

        {/* Main card */}
        <section className="maktab-login-card">
          <div className="maktab-card-heading">
            <div className="maktab-eyebrow">
              Welcome
            </div>

            <h1>
              Welcome to
              <br />
              <span>Maktab-E-Bilal</span>
            </h1>

            <p>
              Choose your account type to continue.
            </p>
          </div>

          <div className="maktab-login-options">

            {/* Owner */}
            <Link
              href="/login/owner"
              className="maktab-login-option"
            >
              <div className="login-option-icon owner-icon">
                <span>O</span>
              </div>

              <div className="login-option-content">
                <strong>Admin</strong>

                <span>
                  Manage your Maktab, teachers,
                  students and fees.
                </span>
              </div>

              <div className="login-option-arrow">
                →
              </div>
            </Link>

            {/* Teacher */}
            <Link
              href="/login/teacher"
              className="maktab-login-option"
            >
              <div className="login-option-icon teacher-icon">
                <span>T</span>
              </div>

              <div className="login-option-content">
                <strong>Teacher</strong>

                <span>
                  Manage your students,
                  attendance and class activities.
                </span>
              </div>

              <div className="login-option-arrow">
                →
              </div>
            </Link>

          </div>

          <div className="maktab-card-footer">
            <span>Simple</span>
            <span>•</span>
            <span>Secure</span>
            <span>•</span>
            <span>Organised</span>
          </div>
        </section>

        {/* Footer */}
        <p className="maktab-page-footer">
          Maktab-E-Bilal
        </p>

      </div>
    </main>
  );
}