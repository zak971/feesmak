"use client";

import { useEffect, useMemo, useState } from "react";
import Header from "../../../components/Header";
import Sidebar from "../../../components/Sidebar";

type Fee = {
  id: string;
  month: string;
  amount: number;
  paid: number;
  balance: number;
  status: "PENDING" | "PARTIAL" | "PAID";
};

type Student = {
  id: string;
  name: string;
  parentName: string | null;
  class: {
    id: string;
    name: string;
    monthlyFee: number;
  } | null;
  feeStatus: "PENDING" | "PARTIAL" | "PAID";
  feeAmount: number;
  feePaid: number;
  feeBalance: number;
  feeHistory: Fee[];
};

const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function ClassReportPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch("/api/students");

        if (!response.ok) {
          window.location.href = "/login/teacher";
          return;
        }

        const data = (await response.json()) as Student[];
        setStudents(data);
      } catch {
        setError("Unable to load class report.");
      } finally {
        setLoading(false);
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

  function openStudentReport(studentId: string) {
    window.location.href = `/teacher/students/${studentId}`;
  }

  const monthOptions = useMemo(() => {
    const months = new Map<string, string>();

    students.forEach((student) => {
      student.feeHistory.forEach((fee) => {
        const date = new Date(fee.month);

        const key = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;

        const label = new Intl.DateTimeFormat("en-IN", {
          month: "long",
          year: "numeric",
        }).format(date);

        months.set(key, label);
      });
    });

    return Array.from(months, ([key, label]) => ({
      key,
      label,
    })).sort((a, b) => b.key.localeCompare(a.key));
  }, [students]);

  const activeMonth = selectedMonth || monthOptions[0]?.key || "";

  const activeMonthLabel =
    monthOptions.find((month) => month.key === activeMonth)?.label ||
    "Monthly fee";

  const monthRows = useMemo(() => {
    return students.map((student) => {
      const fee = student.feeHistory.find((item) => {
        const date = new Date(item.month);

        const key = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;

        return key === activeMonth;
      });

      return {
        student,
        fee,
      };
    });
  }, [students, activeMonth]);

  const totals = useMemo(() => {
    const monthlyFees = monthRows.reduce(
      (sum, row) => sum + (row.fee?.amount || 0),
      0
    );

    const paid = monthRows.reduce(
      (sum, row) => sum + (row.fee?.paid || 0),
      0
    );

    const balance = monthRows.reduce(
      (sum, row) => sum + (row.fee?.balance || 0),
      0
    );

    const paidStudents = monthRows.filter(
      (row) => row.fee?.status === "PAID"
    ).length;

    const pendingStudents = monthRows.filter(
      (row) =>
        row.fee?.status === "PENDING" ||
        row.fee?.status === "PARTIAL"
    ).length;

    const collectionPercentage =
      monthlyFees > 0
        ? Math.round((paid / monthlyFees) * 100)
        : 0;

    return {
      monthlyFees,
      paid,
      balance,
      paidStudents,
      pendingStudents,
      collectionPercentage,
    };
  }, [monthRows]);

  return (
    <div className="dashboard-shell teacher-students-page">
      <Header role="TEACHER" onLogout={signOut} />

      <div className="owner-layout">
        <Sidebar
          role="TEACHER"
          active="students"
          onLogout={signOut}
          counts={{ students: students.length }}
        />

        <main className="container owner-page-content class-report-page">
          {/* Back */}
          <a href="/teacher/students" className="report-back-link">
            <span>←</span>
            <span>Students</span>
          </a>

          {/* Heading */}
          <div className="class-report-heading">
            <div>
              <div className="eyebrow">Class fee report</div>

              <h1>Fee collection</h1>

              <p className="muted">
                Track monthly fees for your assigned students.
              </p>
            </div>
          </div>

          {error && (
            <div className="student-error">
              {error}
            </div>
          )}

          {/* Month selector */}
          {!loading && monthOptions.length > 0 && (
            <div className="class-month-selector">
              <label className="month-selector-label" htmlFor="report-month">
                Month
              </label>
              <select
                id="report-month"
                className="class-month-select"
                value={activeMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
              >
                {monthOptions.map((month) => (
                  <option key={month.key} value={month.key}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Summary */}
          <section className="class-fee-summary">
            <div className="class-summary-card">
              <span>Expected</span>

              <strong>
                {money.format(totals.monthlyFees)}
              </strong>

              <small>
                {students.length} students
              </small>
            </div>

            <div className="class-summary-card collected">
              <span>Collected</span>

              <strong>
                {money.format(totals.paid)}
              </strong>

              <small>
                {totals.paidStudents} paid
              </small>
            </div>

            <div className="class-summary-card outstanding">
              <span>Outstanding</span>

              <strong>
                {money.format(totals.balance)}
              </strong>

              <small>
                {totals.pendingStudents} pending
              </small>
            </div>
          </section>

          {/* Collection progress */}
          <section className="collection-progress-card">
            <div className="collection-progress-header">
              <div>
                <span>Collection progress</span>

                <strong>
                  {totals.collectionPercentage}%
                </strong>
              </div>

              <span>
                {activeMonthLabel}
              </span>
            </div>

            <div className="collection-progress-track">
              <div
                className="collection-progress-fill"
                style={{
                  width: `${Math.min(
                    totals.collectionPercentage,
                    100
                  )}%`,
                }}
              />
            </div>

            <div className="collection-progress-footer">
              <span>
                {money.format(totals.paid)} collected
              </span>

              <span>
                {money.format(totals.balance)} remaining
              </span>
            </div>
          </section>

          {/* Students */}
          <section className="class-students-section">
            <div className="class-students-heading">
              <div>
                <div className="eyebrow">
                  {activeMonthLabel}
                </div>

                <h2>Student fees</h2>
              </div>

              <span className="count-badge">
                {students.length} students
              </span>
            </div>

            {loading ? (
              <div className="class-report-loading">
                {Array.from({ length: 5 }, (_, index) => (
                  <div
                    className="class-report-skeleton"
                    key={index}
                  >
                    <span />
                    <div>
                      <span />
                      <span />
                    </div>
                    <span />
                  </div>
                ))}
              </div>
            ) : students.length === 0 ? (
              <div className="class-report-empty">
                <div className="empty-report-icon">
                  +
                </div>

                <strong>No students yet</strong>

                <p>
                  Students assigned to your class will
                  appear here.
                </p>
              </div>
            ) : (
              <>
                {/* Mobile */}
                <div className="class-student-mobile-list">
                  {monthRows.map(({ student, fee }) => {
                    const status =
                      fee?.status || "PENDING";

                    return (
                      <div
                        className="class-student-card"
                        key={student.id}
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
                        <div className="class-student-card-top">
                          <div className="class-student-identity">
                            <div className="class-student-avatar">
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

                          <span
                            className={`fee-status ${status.toLowerCase()}`}
                          >
                            {status === "PAID"
                              ? "Paid"
                              : status === "PARTIAL"
                              ? "Partial"
                              : "Pending"}
                          </span>
                        </div>

                        <div className="class-student-fee-details">
                          <div>
                            <span>Fee</span>

                            <strong>
                              {money.format(
                                fee?.amount || 0
                              )}
                            </strong>
                          </div>

                          <div>
                            <span>Paid</span>

                            <strong className="paid-value">
                              {money.format(
                                fee?.paid || 0
                              )}
                            </strong>
                          </div>

                          <div>
                            <span>Balance</span>

                            <strong
                              className={
                                fee?.balance
                                  ? "balance-due"
                                  : "balance-paid"
                              }
                            >
                              {fee?.balance
                                ? money.format(
                                    fee.balance
                                  )
                                : "Paid"}
                            </strong>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop */}
                <div className="class-student-desktop-table card">
                  <div className="table-scroll">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>{activeMonthLabel}</th>
                          <th>Paid</th>
                          <th>Balance</th>
                          <th>Status</th>
                        </tr>
                      </thead>

                      <tbody>
                        {monthRows.map(
                          ({ student, fee }) => {
                            const status =
                              fee?.status || "PENDING";

                            return (
                              <tr
                                key={student.id}
                                className="class-student-row"
                                onClick={() => openStudentReport(student.id)}
                                onKeyDown={(event) => {
                                  if (event.key === "Enter" || event.key === " ") {
                                    event.preventDefault();
                                    openStudentReport(student.id);
                                  }
                                }}
                                tabIndex={0}
                              >
                                <td>
                                  <strong>
                                    {student.name}
                                  </strong>

                                  <div className="muted">
                                    {student.parentName ||
                                      "Parent not provided"}
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

                                <td
                                  className={
                                    fee?.balance
                                      ? "balance-due"
                                      : "balance-paid"
                                  }
                                >
                                  {fee?.balance
                                    ? money.format(
                                        fee.balance
                                      )
                                    : "Paid"}
                                </td>

                                <td>
                                  <span
                                    className={`fee-status ${status.toLowerCase()}`}
                                  >
                                    {status === "PAID"
                                      ? "Paid"
                                      : status === "PARTIAL"
                                      ? "Partial"
                                      : "Pending"}
                                  </span>
                                </td>
                              </tr>
                            );
                          }
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </section>
        </main>

      </div>
    </div>
  );
}