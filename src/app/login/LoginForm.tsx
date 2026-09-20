"use client";

import { useState } from "react";

type LoginRole = "OWNER" | "TEACHER";

export default function LoginForm({
  role,
  title,
  description,
  demoEmail,
}: {
  role: LoginRole;
  title: string;
  description: string;
  demoEmail: string;
}) {
  const [email, setEmail] = useState(demoEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          role,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Invalid email or password.");
        setLoading(false);
        return;
      }

      window.location.replace(
        result.role === "OWNER" ? "/owner" : "/teacher"
      );
    } catch {
      setError("Unable to connect. Please try again.");
      setLoading(false);
    }
  }

  const roleLabel = role === "OWNER" ? "Owner" : "Teacher";

  return (
    <main className="maktab-auth-page">
      <div className="maktab-auth-container">

        {/* Brand */}
        <div className="maktab-auth-brand">
          <div className="maktab-auth-logo">
            M
          </div>

          <div>
            <div className="maktab-auth-name">
              Maktab-E-Bilal
            </div>

            <div className="maktab-auth-subtitle">
              Maktab Management
            </div>
          </div>
        </div>

        {/* Login card */}
        <section className="maktab-auth-card">

          {/* Back */}
          <a
            href="/login"
            className="maktab-auth-back"
          >
            <span>←</span>
            <span>Back</span>
          </a>

          {/* Heading */}
          <div className="maktab-auth-heading">



            <h1>{title}</h1>

            <p>{description}</p>
          </div>

          {/* Form */}
          <form
            onSubmit={signIn}
            className="maktab-auth-form"
          >
            <label className="maktab-input-group">
              <span>Email address</span>

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="Enter your email"
                autoComplete="email"
                required
              />
            </label>

            <label className="maktab-input-group">
              <span>Password</span>

              <div className="maktab-password-wrapper">
                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="maktab-password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (value) => !value
                    )
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </label>

            {error && (
              <div className="maktab-login-error">
                <span>!</span>
                <p>{error}</p>
              </div>
            )}

            <button
              type="submit"
              className="maktab-login-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="login-spinner" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <span>→</span>
                </>
              )}
            </button>
          </form>


        </section>

        <p className="maktab-auth-footer">
          Maktab-E-Bilal
        </p>
      </div>
    </main>
  );
}