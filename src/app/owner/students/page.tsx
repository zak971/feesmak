"use client";

import { FormEvent, useEffect, useState } from "react";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";

type ClassRecord = { id: string; name: string; monthlyFee: number };
type Student = {
  id: string;
  name: string;
  phone: string | null;
  parentName: string | null;
  parentPhone: string | null;
  class: { id: string; name: string; monthlyFee: number } | null;
};

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [form, setForm] = useState({ name: "", parentName: "", parentPhone: "", phone: "", classId: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      const [studentsResponse, classesResponse] = await Promise.all([fetch("/api/students"), fetch("/api/classes")]);
      if (!studentsResponse.ok || !classesResponse.ok) {
        window.location.href = "/login/owner";
        return;
      }
      setStudents(await studentsResponse.json());
      setClasses(await classesResponse.json());
      setLoading(false);
    }
    load();
  }, []);

  async function createStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    const response = await fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        phone: form.phone || undefined,
        parentName: form.parentName || undefined,
        parentPhone: form.parentPhone || undefined,
        classId: form.classId
      })
    });
    const result = await response.json();

    if (!response.ok) {
      setError(result.error || "Unable to create student");
      setSaving(false);
      return;
    }

    const assignedClass = classes.find(classRecord => classRecord.id === form.classId) || null;
    setStudents(current => [...current, { ...result, class: assignedClass }].sort((a, b) => a.name.localeCompare(b.name)));
    setForm({ name: "", parentName: "", parentPhone: "", phone: "", classId: "" });
    setMessage("Student created successfully.");
    setSaving(false);
  }

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return <div className="dashboard-shell">
    <Header role="OWNER" onLogout={signOut} />
    <div className="owner-layout">
      <Sidebar role="OWNER" active="students" onLogout={signOut} counts={{ students: students.length, classes: classes.length }} />

      <main className="container owner-page-content">
        <div className="page-heading"><div><div className="eyebrow">Workspace / Students</div><h1>Students</h1><p className="muted">Create student records and assign each student to a class.</p></div><a className="back-link" href="/owner">Back to dashboard</a></div>
        <div className="management-grid">
          <section className="card">
            <div className="eyebrow">New student</div><h2 style={{ margin: "6px 0 18px" }}>Create student</h2>
            <form onSubmit={createStudent} className="grid">
              <label>Student name<input value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} required /></label>
              <label>Assign class<select value={form.classId} onChange={event => setForm({ ...form, classId: event.target.value })} required><option value="">Select a class</option>{classes.map(classRecord => <option key={classRecord.id} value={classRecord.id}>{classRecord.name}</option>)}</select></label>
              <label>Parent name<input value={form.parentName} onChange={event => setForm({ ...form, parentName: event.target.value })} /></label>
              <label>Parent phone<input type="tel" value={form.parentPhone} onChange={event => setForm({ ...form, parentPhone: event.target.value })} /></label>
              <label>Student phone<input type="tel" value={form.phone} onChange={event => setForm({ ...form, phone: event.target.value })} /></label>
              {classes.length === 0 && <div className="error">Create a class before adding students.</div>}
              {error && <div className="error">{error}</div>}
              {message && <div className="success">{message}</div>}
              <button disabled={saving || loading || classes.length === 0}>{saving ? "Creating..." : "Create student"}</button>
            </form>
          </section>

          <section className="card">
            <div className="eyebrow">Directory</div><h2 style={{ margin: "6px 0 18px" }}>All students <span className="count-badge">{students.length}</span></h2>
            {loading ? <p className="muted">Loading students...</p> : students.length === 0 ? <p className="empty-state">No students have been created yet.</p> : <div className="teacher-list">{students.map(student => <div className="teacher-row" key={student.id}><div><strong>{student.name}</strong><div className="muted">{student.parentName ? `Parent: ${student.parentName}` : "No parent details"}{student.parentPhone ? ` · ${student.parentPhone}` : ""}</div></div><span className="class-badge">{student.class?.name || "Unassigned"}</span></div>)}</div>}
          </section>
        </div>
      </main>
    </div>
  </div>;
}