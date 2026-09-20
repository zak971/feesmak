"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Footer from "../../components/Footer";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";

type Student = {
  id: string;
  name: string;
  phone: string | null;
  parentName: string | null;
  parentPhone: string | null;
  class: {
    id: string;
    name: string;
    monthlyFee: number;
  } | null;
  feeStatus: "PENDING" | "PARTIAL" | "PAID";
  feeAmount: number;
  feePaid: number;
  feeBalance: number;
  feeHistory: OutstandingFee[];
  outstandingFees: OutstandingFee[];
};

type OutstandingFee = {
  id: string;
  month: string;
  amount: number;
  paid: number;
  balance: number;
  status: "PENDING" | "PARTIAL" | "PAID";
};

type ClassRecord = {
  id: string;
  name: string;
  monthlyFee: number;
};

const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function TeacherStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [assignedClass, setAssignedClass] =
    useState<ClassRecord | null>(null);

  const [form, setForm] = useState({
    name: "",
    parentName: "",
    parentPhone: "",
    phone: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);

  const [feeStudent, setFeeStudent] =
    useState<Student | null>(null);

  const [feeForm, setFeeForm] = useState({
    feeId: "",
    amount: "",
    method: "CASH",
  });

  const [collecting, setCollecting] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [search, setSearch] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");

  function formatFeeMonth(month: string) {
    return new Intl.DateTimeFormat("en-IN", {
      month: "long",
      year: "numeric",
    }).format(new Date(month));
  }

  function openStudentReport(studentId: string) {
    window.location.href = `/teacher/students/${studentId}`;
  }

  useEffect(() => {
    async function load() {
      try {
        const [studentsResponse, classesResponse] =
          await Promise.all([
            fetch("/api/students"),
            fetch("/api/classes"),
          ]);

        if (
          !studentsResponse.ok ||
          !classesResponse.ok
        ) {
          window.location.href = "/login/teacher";
          return;
        }

        const studentData =
          (await studentsResponse.json()) as Student[];

        const classes =
          (await classesResponse.json()) as ClassRecord[];

        setStudents(studentData);
        setAssignedClass(classes[0] || null);
        setLoading(false);
      } catch {
        setError("Unable to load students.");
        setLoading(false);
      }
    }

    load();
  }, []);

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return students;

    return students.filter((student) =>
      [
        student.name,
        student.parentName || "",
        student.parentPhone || "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [students, search]);

  const feeSummary = useMemo(() => {
    const monthOptions = new Map<string, string>();
    students.forEach((student) => student.feeHistory.forEach((fee) => {
      const date = new Date(fee.month);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      monthOptions.set(key, formatFeeMonth(fee.month));
    }));

    const activeMonth = selectedMonth || Array.from(monthOptions.keys()).sort().pop() || "";
    const selectedFees = students.map((student) => student.feeHistory.find((fee) => {
      const date = new Date(fee.month);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}` === activeMonth;
    })).filter((fee): fee is OutstandingFee => Boolean(fee));
    const total = selectedFees.length;

    const paid = selectedFees.filter((fee) => fee.status === "PAID").length;

    const partial = selectedFees.filter((fee) => fee.status === "PARTIAL").length;

    const pending = selectedFees.filter((fee) => fee.status === "PENDING").length;

    const outstanding = selectedFees.reduce((sum, fee) => sum + fee.balance, 0);

    const months = Array.from(monthOptions, ([key, label]) => ({ key, label }))
      .sort((a, b) => b.key.localeCompare(a.key));

    return {
      total,
      paid,
      partial,
      pending,
      outstanding,
      activeMonth,
      months,
    };
  }, [students, selectedMonth]);

  function feeForSelectedMonth(student: Student) {
    return student.feeHistory.find((fee) => {
      const date = new Date(fee.month);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      return key === feeSummary.activeMonth;
    });
  }

  async function createStudent(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone || undefined,
          parentName: form.parentName || undefined,
          parentPhone:
            form.parentPhone || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(
          result.error || "Unable to create student"
        );
        setSaving(false);
        return;
      }

      const newStudent: Student = {
        ...result,
        class: assignedClass,
        feeStatus: "PENDING",
        feeAmount:
          assignedClass?.monthlyFee || 0,
        feePaid: 0,
        feeBalance:
          assignedClass?.monthlyFee || 0,
        feeHistory: [{
          id: "",
          month: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
          amount: assignedClass?.monthlyFee || 0,
          paid: 0,
          balance: assignedClass?.monthlyFee || 0,
          status: "PENDING",
        }],
        outstandingFees: [{
          id: "",
          month: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
          amount: assignedClass?.monthlyFee || 0,
          paid: 0,
          balance: assignedClass?.monthlyFee || 0,
          status: "PENDING",
        }],
      };

      setStudents((current) =>
        [...current, newStudent].sort((a, b) =>
          a.name.localeCompare(b.name)
        )
      );

      setForm({
        name: "",
        parentName: "",
        parentPhone: "",
        phone: "",
      });

      setMessage("Student added successfully.");
      setModalOpen(false);
    } catch {
      setError("Unable to create student.");
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    window.location.href = "/login";
  }

  function openFeeModal(student: Student) {
    setError("");

    const selectedFee = student.outstandingFees[0];

    setFeeStudent(student);

    setFeeForm({
      feeId: selectedFee?.id || "",
      amount: String(selectedFee?.balance || student.feeBalance),
      method: "CASH",
    });
  }

  async function collectFee(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!feeStudent) return;

    const amount = Number(feeForm.amount);
    const selectedFee = feeStudent.outstandingFees.find(
      (fee) => fee.id === feeForm.feeId
    );
    const selectedBalance = selectedFee?.balance ?? feeStudent.feeBalance;

    if (!amount || amount <= 0) {
      setError("Enter a valid amount.");
      return;
    }

    if (amount > selectedBalance) {
      setError("Amount cannot exceed the pending balance.");
      return;
    }

    setCollecting(true);
    setError("");

    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId: feeStudent.id,
          feeId: feeForm.feeId || undefined,
          amount,
          method: feeForm.method,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(
          result.error || "Unable to collect fee"
        );
        setCollecting(false);
        return;
      }

      setStudents((current) =>
        current.map((student) => {
          if (student.id !== feeStudent.id) {
            return student;
          }

          const selectedFee = student.outstandingFees.find(fee => fee.id === feeForm.feeId);
          const updatedFees = student.outstandingFees
            .map(fee => fee.id === feeForm.feeId ? {
              ...fee,
              paid: fee.paid + amount,
              balance: Math.max(0, fee.balance - amount),
              status: fee.balance - amount <= 0 ? "PAID" as const : "PARTIAL" as const,
            } : fee)
            .filter(fee => fee.balance > 0);
          const isCurrentFee = selectedFee?.month && new Date(selectedFee.month).getMonth() === new Date().getMonth() && new Date(selectedFee.month).getFullYear() === new Date().getFullYear();
          const newPaid = isCurrentFee ? student.feePaid + amount : student.feePaid;
          const newBalance = isCurrentFee ? Math.max(0, student.feeBalance - amount) : student.feeBalance;

          return {
            ...student,
            feePaid: newPaid,
            feeBalance: newBalance,
            feeStatus: isCurrentFee ? newBalance === 0 ? "PAID" : "PARTIAL" : student.feeStatus,
            outstandingFees: updatedFees,
          };
        })
      );

      setFeeStudent(null);
      setMessage(
        `${feeStudent.name}'s fee was updated successfully.`
      );
    } catch {
      setError("Unable to connect to the server.");
    } finally {
      setCollecting(false);
    }
  }

  const selectedFee = feeStudent?.outstandingFees.find(
    (fee) => fee.id === feeForm.feeId
  );
  const selectedBalance = selectedFee?.balance ?? feeStudent?.feeBalance ?? 0;

  return (
    <div className="dashboard-shell teacher-students-page">
      <Header
        role="TEACHER"
        onLogout={signOut}
      />

      <div className="owner-layout">
        <Sidebar
          role="TEACHER"
          active="students"
          onLogout={signOut}
          counts={{
            students: students.length,
          }}
        />

        <main className="container owner-page-content">
          {/* Page heading */}
          <div className="students-heading">
            <div>
              <div className="eyebrow">
                {assignedClass?.name || "My class"}
              </div>

              <h1>Students</h1>

              <p className="student-heading-description">
                Manage this month&apos;s fees and
                student records.
              </p>
            </div>

            <div className="students-heading-actions">
              <a className="class-report-button" href="/teacher/students/report">
                Class report
              </a>
              <button
                className="add-student-button"
                onClick={() => {
                  setError("");
                  setModalOpen(true);
                }}
                disabled={!assignedClass}
              >
                <span>+</span>
                Add student
              </button>
            </div>
          </div>

          {/* Messages */}
          {message && (
            <div className="student-success">
              <span>✓</span>
              {message}
            </div>
          )}

          {error && !feeStudent && !modalOpen && (
            <div className="student-error">
              {error}
            </div>
          )}

          {/* Fee summary */}
          {feeSummary.months.length > 0 && (
            <div className="student-month-filter">
              <label htmlFor="student-month-filter">Fee month</label>
              <select
                id="student-month-filter"
                value={feeSummary.activeMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
              >
                {feeSummary.months.map((month) => (
                  <option key={month.key} value={month.key}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <section className="fee-summary">
            <div className="fee-summary-main">
              <div>
                <span className="summary-label">
                  {feeSummary.months.find((month) => month.key === feeSummary.activeMonth)?.label || "This month"}
                </span>

                <strong>
                  {feeSummary.paid}
                  <span> / {feeSummary.total}</span>
                </strong>

                <small>students paid</small>
              </div>

              <div className="summary-progress">
                <div className="summary-progress-track">
                  <div
                    className="summary-progress-fill"
                    style={{
                      width: `${
                        feeSummary.total
                          ? (feeSummary.paid /
                              feeSummary.total) *
                            100
                          : 0
                      }%`,
                    }}
                  />
                </div>

                <span>
                  {feeSummary.total
                    ? Math.round(
                        (feeSummary.paid /
                          feeSummary.total) *
                          100
                      )
                    : 0}
                  %
                </span>
              </div>
            </div>

            <div className="fee-summary-stats">
              <div>
                <span className="status-dot paid" />
                <span>Paid</span>
                <strong>{feeSummary.paid}</strong>
              </div>

              <div>
                <span className="status-dot partial" />
                <span>Partial</span>
                <strong>{feeSummary.partial}</strong>
              </div>

              <div>
                <span className="status-dot pending" />
                <span>Pending</span>
                <strong>{feeSummary.pending}</strong>
              </div>
            </div>
          </section>

          {/* Student list */}
          <section className="student-list-card" aria-busy={loading}>
            <div className="student-list-header">
              <div>
                <div className="eyebrow">
                  {feeSummary.months.find((month) => month.key === feeSummary.activeMonth)?.label || "Current month"}
                </div>

                <h2>Fee collection</h2>
              </div>

              <span className="student-count">
                {students.length}
              </span>
            </div>

            {/* Search */}
            <div className="student-search">
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-4-4" />
              </svg>

              <input
                type="search"
                placeholder="Search students..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />
            </div>

            {loading ? (
              <div className="students-loading-skeleton" aria-label="Loading students">
                {Array.from({ length: 4 }, (_, index) => (
                  <div className="student-skeleton-row" key={index}>
                    <span className="skeleton-avatar" />
                    <span className="skeleton-line student-name-skeleton" />
                    <span className="skeleton-line fee-skeleton" />
                    <span className="skeleton-line fee-skeleton" />
                    <span className="skeleton-pill" />
                  </div>
                ))}
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="students-empty">
                <div className="empty-icon">+</div>

                <h3>
                  {search
                    ? "No students found"
                    : "No students yet"}
                </h3>

                <p>
                  {search
                    ? "Try a different search."
                    : "Add your first student to get started."}
                </p>

                {!search && (
                  <button
                    onClick={() =>
                      setModalOpen(true)
                    }
                  >
                    Add student
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Mobile cards */}
                <div className="student-mobile-list">
                  {filteredStudents.map(
                    (student) => {
                      const fee = feeForSelectedMonth(student);
                      const status = fee?.status || "PENDING";

                      return <article
                        key={student.id}
                        className="student-mobile-card"
                        role="link"
                        tabIndex={0}
                        onClick={() => openStudentReport(student.id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            openStudentReport(student.id);
                          }
                        }}
                      >
                        <div className="student-card-top">
                          <div className="student-avatar">
                            {student.name
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div className="student-card-name">
                            <strong>
                              {student.name}
                            </strong>

                            <span>
                              {student.parentName ||
                                "Parent not provided"}
                            </span>
                          </div>

                          <span
                            className={`fee-status ${status.toLowerCase()}`}
                          >
                            {status ===
                            "PAID"
                              ? "Paid"
                              : status ===
                                "PARTIAL"
                              ? "Partial"
                              : "Pending"}
                          </span>
                        </div>

                        <div className="student-fee-row">
                          <div>
                            <span>Monthly fee</span>
                            <strong>
                              {money.format(
                                fee?.amount || 0
                              )}
                            </strong>
                          </div>

                          <div>
                            <span>Paid</span>
                            <strong>
                              {money.format(
                                fee?.paid || 0
                              )}
                            </strong>
                          </div>

                          <div>
                            <span>Balance</span>
                            <strong
                              className={
                                fee?.balance || 0
                                  ? "balance-due"
                                  : "balance-paid"
                              }
                            >
                              {fee?.balance
                                ? money.format(
                                    student.feeBalance
                                  )
                                : "Paid"}
                            </strong>
                          </div>
                        </div>

                        <button
                          className={`student-fee-button ${
                            status === "PAID"
                              ? "completed"
                              : ""
                          }`}
                          disabled={student.outstandingFees.length === 0}
                          onClick={(event) => {
                            event.stopPropagation();
                            openFeeModal(student);
                          }}
                        >
                          {student.outstandingFees.length === 0
                            ? "✓ Fee paid"
                            : status ===
                              "PARTIAL"
                            ? "Collect remaining"
                            : "Mark fee paid"}
                        </button>
                      </article>;
                    }
                  )}
                </div>

                {/* Desktop table */}
                <div className="student-desktop-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Monthly fee</th>
                        <th>Paid</th>
                        <th>Balance</th>
                        <th>Status</th>
                        <th />
                      </tr>
                    </thead>

                    <tbody>
                      {filteredStudents.map(
                        (student) => {
                          const fee = feeForSelectedMonth(student);
                          const status = fee?.status || "PENDING";

                          return <tr key={student.id} className="student-table-row" onClick={() => openStudentReport(student.id)}>
                            <td>
                              <div className="desktop-student">
                                <div className="student-avatar">
                                  {student.name
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>

                                <div>
                                  <strong>
                                    {student.name}
                                  </strong>

                                  <span>
                                    {student.parentName ||
                                      "Parent not provided"}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td>
                              {money.format(
                                fee?.amount || 0
                              )}
                            </td>

                            <td>
                              {money.format(
                                fee?.paid || 0
                              )}
                            </td>

                            <td>
                              <strong
                                className={
                                  fee?.balance || 0
                                    ? "balance-due"
                                    : "balance-paid"
                                }
                              >
                                {fee?.balance
                                  ? money.format(
                                      student.feeBalance
                                    )
                                  : "Paid"}
                              </strong>
                            </td>

                            <td>
                              <span
                                className={`fee-status ${status.toLowerCase()}`}
                              >
                                {student.feeStatus}
                              </span>
                            </td>

                            <td>
                              <button
                                className="table-fee-button"
                                disabled={student.outstandingFees.length === 0}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openFeeModal(student);
                                }}
                              >
                                {student.outstandingFees.length === 0
                                  ? "Paid"
                                  : "Collect"}
                              </button>
                            </td>
                          </tr>;
                        }
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>

          {/* Create student */}
          {modalOpen && (
            <div
              className="modal-backdrop"
              role="presentation"
              onMouseDown={(event) => {
                if (
                  event.target ===
                  event.currentTarget
                ) {
                  setModalOpen(false);
                }
              }}
            >
              <section
                className="modal student-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="create-student-title"
              >
                <div className="modal-header">
                  <div>
                    <div className="eyebrow">
                      New student
                    </div>

                    <h2 id="create-student-title">
                      Add student
                    </h2>
                  </div>

                  <button
                    type="button"
                    className="icon-button"
                    onClick={() =>
                      setModalOpen(false)
                    }
                  >
                    ×
                  </button>
                </div>

                <p className="muted">
                  Student will automatically be
                  assigned to{" "}
                  <strong>
                    {assignedClass?.name}
                  </strong>
                  .
                </p>

                <form
                  onSubmit={createStudent}
                  className="student-form"
                >
                  <label>
                    Student name
                    <input
                      autoFocus
                      value={form.name}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          name: event.target.value,
                        })
                      }
                      placeholder="Enter student name"
                      required
                    />
                  </label>

                  <label>
                    Parent name
                    <input
                      value={form.parentName}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          parentName:
                            event.target.value,
                        })
                      }
                      placeholder="Parent / guardian name"
                    />
                  </label>

                  <div className="form-two-column">
                    <label>
                      Parent phone
                      <input
                        type="tel"
                        value={form.parentPhone}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            parentPhone:
                              event.target.value,
                          })
                        }
                        placeholder="Phone number"
                      />
                    </label>

                    <label>
                      Student phone
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            phone:
                              event.target.value,
                          })
                        }
                        placeholder="Optional"
                      />
                    </label>
                  </div>

                  {error && (
                    <div className="error">
                      {error}
                    </div>
                  )}

                  <div className="modal-actions">
                    <button
                      type="button"
                      className="secondary"
                      onClick={() =>
                        setModalOpen(false)
                      }
                    >
                      Cancel
                    </button>

                    <button disabled={saving}>
                      {saving
                        ? "Adding..."
                        : "Add student"}
                    </button>
                  </div>
                </form>
              </section>
            </div>
          )}

          {/* Fee collection */}
          {feeStudent && (
            <div
              className="modal-backdrop"
              role="presentation"
              onMouseDown={(event) => {
                if (
                  event.target ===
                  event.currentTarget
                ) {
                  setFeeStudent(null);
                }
              }}
            >
              <section
                className="modal fee-collection-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="collect-fee-title"
              >
                <div className="modal-header">
                  <div>
                    <div className="eyebrow">
                      Outstanding fee
                    </div>

                    <h2 id="collect-fee-title">
                      Mark fee
                    </h2>
                  </div>

                  <button
                    type="button"
                    className="icon-button"
                    onClick={() =>
                      setFeeStudent(null)
                    }
                  >
                    ×
                  </button>
                </div>

                <div className="fee-modal-student">
                  <div className="student-avatar large">
                    {feeStudent.name
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div>
                    <strong>
                      {feeStudent.name}
                    </strong>

                    <span>
                      {feeStudent.class?.name}
                    </span>
                  </div>
                </div>

                <div className="fee-due-box">
                  <span>{selectedFee ? formatFeeMonth(selectedFee.month) : "Outstanding balance"}</span>

                  <strong>
                    {money.format(selectedBalance)}
                  </strong>
                </div>

                <form
                  onSubmit={collectFee}
                  className="student-form"
                >
                  <label>
                    Fee month
                    <select
                      value={feeForm.feeId}
                      onChange={(event) => {
                        const nextFee = feeStudent.outstandingFees.find(
                          (fee) => fee.id === event.target.value
                        );
                        setFeeForm({
                          ...feeForm,
                          feeId: event.target.value,
                          amount: String(nextFee?.balance || ""),
                        });
                      }}
                    >
                      {feeStudent.outstandingFees.map((fee) => (
                        <option key={fee.id} value={fee.id}>
                          {formatFeeMonth(fee.month)} - {money.format(fee.balance)} due
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Amount received
                    <div className="amount-input">
                      <span>₹</span>

                      <input
                        type="number"
                        min="1"
                        max={selectedBalance}
                        step="1"
                        value={feeForm.amount}
                        onChange={(event) =>
                          setFeeForm({
                            ...feeForm,
                            amount:
                              event.target.value,
                          })
                        }
                        autoFocus
                        required
                      />
                    </div>
                  </label>

                  <label>
                    Payment method

                    <select
                      value={feeForm.method}
                      onChange={(event) =>
                        setFeeForm({
                          ...feeForm,
                          method:
                            event.target.value,
                        })
                      }
                    >
                      <option value="CASH">
                        Cash
                      </option>

                      <option value="UPI">
                        UPI
                      </option>

                      <option value="BANK_TRANSFER">
                        Bank transfer
                      </option>
                    </select>
                  </label>

                  {error && (
                    <div className="error">
                      {error}
                    </div>
                  )}

                  <div className="modal-actions">
                    <button
                      type="button"
                      className="secondary"
                      onClick={() =>
                        setFeeStudent(null)
                      }
                    >
                      Cancel
                    </button>

                    <button disabled={collecting}>
                      {collecting
                        ? "Saving..."
                        : "Confirm fee"}
                    </button>
                  </div>
                </form>
              </section>
            </div>
          )}
        </main>

        <Footer
          variant="studentActions"
          onAddStudent={() => {
            setError("");
            setModalOpen(true);
          }}
        />
      </div>
    </div>
  );
}