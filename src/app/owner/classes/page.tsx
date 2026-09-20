"use client";

import { FormEvent, useEffect, useState } from "react";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";

type Teacher = { id: string; name: string; email: string; taughtClass: { id: string; name: string } | null };
type ClassRecord = {
  id: string;
  name: string;
  monthlyFee: number;
  teacher: { id: string; name: string; email: string } | null;
  _count: { students: number };
};

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [form, setForm] = useState({ name: "", monthlyFee: "", teacherId: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      const [classesResponse, teachersResponse] = await Promise.all([fetch("/api/classes"), fetch("/api/teachers")]);
      if (!classesResponse.ok || !teachersResponse.ok) {
        window.location.href = "/login/owner";
        return;
      }
      setClasses(await classesResponse.json());
      setTeachers(await teachersResponse.json());
      setLoading(false);
    }
    load();
  }, []);

  async function createClass(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    const response = await fetch("/api/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        monthlyFee: Number(form.monthlyFee),
        teacherId: form.teacherId || null
      })
    });
    const result = await response.json();

    if (!response.ok) {
      setError(result.error || "Unable to create class");
      setSaving(false);
      return;
    }

    const assignedTeacher = teachers.find(teacher => teacher.id === form.teacherId);
    setClasses(current => [...current, { ...result, teacher: assignedTeacher ? { id: assignedTeacher.id, name: assignedTeacher.name, email: assignedTeacher.email } : null, _count: { students: 0 } }].sort((a, b) => a.name.localeCompare(b.name)));
    setForm({ name: "", monthlyFee: "", teacherId: "" });
    setMessage("Class created successfully.");
    setSaving(false);
  }

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return <div className="dashboard-shell">
    <Header role="OWNER" onLogout={signOut} />
    <div className="owner-layout">
      <Sidebar role="OWNER" active="classes" onLogout={signOut} counts={{ teachers: teachers.length }} />

      <main className="container owner-page-content">
        <div className="page-heading"><div><div className="eyebrow">Workspace / Classes</div><h1>Classes</h1><p className="muted">Create classes, set the monthly fee, and assign each class to a teacher.</p></div><a className="back-link" href="/owner">Back to dashboard</a></div>
        <div className="management-grid">
          <section className="card">
            <div className="eyebrow">New class</div><h2 style={{ margin: "6px 0 18px" }}>Create class</h2>
            <form onSubmit={createClass} className="grid">
              <label>Class name<input value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} placeholder="e.g. Class 3" required /></label>
              <label>Monthly fee<input type="number" min="0" step="1" value={form.monthlyFee} onChange={event => setForm({ ...form, monthlyFee: event.target.value })} placeholder="e.g. 300" required /></label>
              <label>Assign teacher<select value={form.teacherId} onChange={event => setForm({ ...form, teacherId: event.target.value })}><option value="">Unassigned</option>{teachers.map(teacher => <option key={teacher.id} value={teacher.id}>{teacher.name}{teacher.taughtClass ? ` (assigned to ${teacher.taughtClass.name})` : ""}</option>)}</select></label>
              {error && <div className="error">{error}</div>}
              {message && <div className="success">{message}</div>}
              <button disabled={saving || loading}>{saving ? "Creating..." : "Create class"}</button>
            </form>
          </section>

          <section className="card">
            <div className="eyebrow">Directory</div><h2 style={{ margin: "6px 0 18px" }}>All classes <span className="count-badge">{classes.length}</span></h2>
            {loading ? <p className="muted">Loading classes...</p> : classes.length === 0 ? <p className="empty-state">No classes have been created yet.</p> : <div className="teacher-list">{classes.map(classRecord => <div className="teacher-row" key={classRecord.id}><div><strong>{classRecord.name}</strong><div className="muted">{classRecord._count.students} students · {money.format(classRecord.monthlyFee)} per month</div></div><span className="class-badge">{classRecord.teacher?.name || "Unassigned"}</span></div>)}</div>}
          </section>
        </div>
      </main>
    </div>
  </div>;
}