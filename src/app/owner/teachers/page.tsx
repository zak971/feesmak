"use client";

import { FormEvent, useEffect, useState } from "react";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";

type Teacher = {
  id: string;
  name: string;
  email: string;
  taughtClass: { id: string; name: string } | null;
};

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadTeachers() {
    const response = await fetch("/api/teachers");
    if (!response.ok) {
      window.location.href = "/login/owner";
      return;
    }
    setTeachers(await response.json());
    setLoading(false);
  }

  useEffect(() => {
    loadTeachers();
  }, []);

  async function createTeacher(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    const response = await fetch("/api/teachers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    const result = await response.json();
    if (!response.ok) {
      setError(result.error || "Unable to create teacher");
      setSaving(false);
      return;
    }

    setTeachers(current => [...current, { ...result, taughtClass: null }].sort((a, b) => a.name.localeCompare(b.name)));
    setForm({ name: "", email: "", password: "" });
    setMessage("Teacher created successfully.");
    setSaving(false);
  }

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return <div className="dashboard-shell">
    <Header role="OWNER" onLogout={signOut} />
    <div className="owner-layout">
      <Sidebar role="OWNER" active="teachers" onLogout={signOut} />
      <main className="container owner-page-content">
    <div className="page-heading">
      <div>
        <div className="eyebrow">Workspace / Teachers</div>
        <h1>Teachers</h1>
        <p className="muted">Create teacher accounts and see which class is assigned to each teacher.</p>
      </div>
      <a className="back-link" href="/owner">Back to dashboard</a>
    </div>

    <div className="management-grid">
      <section className="card">
        <div className="eyebrow">New account</div>
        <h2 style={{ margin: "6px 0 18px" }}>Create teacher</h2>
        <form onSubmit={createTeacher} className="grid">
          <label>Name<input value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} required /></label>
          <label>Email<input type="email" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} required /></label>
          <label>Temporary password<input type="password" minLength={6} value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} required /></label>
          {error && <div className="error">{error}</div>}
          {message && <div className="success">{message}</div>}
          <button disabled={saving}>{saving ? "Creating..." : "Create teacher"}</button>
        </form>
      </section>

      <section className="card">
        <div className="eyebrow">Directory</div>
        <h2 style={{ margin: "6px 0 18px" }}>All teachers <span className="count-badge">{teachers.length}</span></h2>
        {loading ? <p className="muted">Loading teachers...</p> : teachers.length === 0 ? <p className="empty-state">No teachers have been created yet.</p> : <div className="teacher-list">{teachers.map(teacher => <div className="teacher-row" key={teacher.id}><div><strong>{teacher.name}</strong><div className="muted">{teacher.email}</div></div><span className="class-badge">{teacher.taughtClass?.name || "Unassigned"}</span></div>)}</div>}
      </section>
    </div>
      </main>
    </div>
  </div>;
}