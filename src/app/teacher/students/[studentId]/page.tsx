"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
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
  phone: string | null;
  parentName: string | null;
  parentPhone: string | null;
  class: {
    id: string;
    name: string;
    monthlyFee: number;
  } | null;
  feeHistory: Fee[];
};

const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function StudentReportPage() {
  const params = useParams<{ studentId: string }>();

  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch("/api/students");

        if (!response.ok) {
          window.location.href = "/login/teacher";
          return;
        }

        const students = (await response.json()) as Student[];

        const selectedStudent = students.find(
          (item) => item.id === params.studentId
        );

        if (!selectedStudent) {
          setError("Student not found.");
          return;
        }

        setStudent(selectedStudent);
      } catch {
        setError("Unable to load student report.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [params.studentId]);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  const report = useMemo(() => {
    const fees = student?.feeHistory || [];

    const expected = fees.reduce((sum, fee) => sum + fee.amount, 0);
    const paid = fees.reduce((sum, fee) => sum + fee.paid, 0);
    const balance = fees.reduce((sum, fee) => sum + fee.balance, 0);

    const paidMonths = fees.filter((fee) => fee.status === "PAID").length;
    const pendingMonths = fees.filter(
      (fee) => fee.status === "PENDING" || fee.status === "PARTIAL"
    ).length;

    return {
      expected,
      paid,
      balance,
      paidMonths,
      pendingMonths,
    };
  }, [student]);

  function formatMonth(month: string) {
    return new Intl.DateTimeFormat("en-IN", {
      month: "long",
      year: "numeric",
    }).format(new Date(month));
  }

  function getStatusLabel(status: Fee["status"]) {
    if (status === "PAID") return "Paid";
    if (status === "PARTIAL") return "Partial";
    return "Pending";
  }

  return (
    <div className="dashboard-shell teacher-student-report">
      <Header role="TEACHER" onLogout={signOut} />

      <div className="owner-layout">
        <Sidebar
          role="TEACHER"
          active="students"
          onLogout={signOut}
        />

        <main className="container owner-page-content student-report-page">
          {loading ? (
            <div className="report-loading">
              <div className="loading-line large" />
              <div className="loading-line" />
              <div className="loading-card" />
            </div>
          ) : error ? (
            <div className="student-error">{error}</div>
          ) : student ? (
            <>
              {/* Back */}
              <a href="/teacher/students" className="report-back-link">
                <span>←</span>
                <span>Students</span>
              </a>

              {/* Student header */}
              <section className="student-profile-card">
                <div className="student-profile-main">
                  <div className="student-avatar">
                    {student.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="student-profile-info">
                    <div className="eyebrow">Student</div>

                    <h1>{student.name}</h1>

                    <div className="student-meta">
                      <span>
                        {student.class?.name || "No class assigned"}
                      </span>

                      <span className="meta-dot">•</span>

                      <span>
                        Monthly fee{" "}
                        {money.format(student.class?.monthlyFee || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="student-contact">
                  <div className="contact-item">
                    <span className="contact-label">Parent</span>
                    <strong>
                      {student.parentName || "Not provided"}
                    </strong>
                  </div>

                  <div className="contact-item">
                    <span className="contact-label">Phone</span>
                    <strong>
                      {student.parentPhone || "Not provided"}
                    </strong>
                  </div>
                </div>
              </section>

              {/* Fee overview */}
              <section className="report-section">
                <div className="section-heading">
                  <div>
                    <div className="eyebrow">Fee overview</div>
                    <h2>Payment summary</h2>
                  </div>
                </div>

                <div className="report-summary-grid">
                  <div className="report-stat-card">
                    <span>Expected</span>
                    <strong>{money.format(report.expected)}</strong>
                    <small>
                      {student.feeHistory.length} months
                    </small>
                  </div>

                  <div className="report-stat-card paid">
                    <span>Paid</span>
                    <strong>{money.format(report.paid)}</strong>
                    <small>
                      {report.paidMonths} paid months
                    </small>
                  </div>

                  <div className="report-stat-card outstanding">
                    <span>Outstanding</span>
                    <strong>{money.format(report.balance)}</strong>
                    <small>
                      {report.pendingMonths} months pending
                    </small>
                  </div>
                </div>
              </section>

              {/* Payment history */}
              <section className="report-section">
                <div className="section-heading">
                  <div>
                    <div className="eyebrow">Payment history</div>
                    <h2>Monthly fees</h2>
                  </div>

                  <span className="history-count">
                    {student.feeHistory.length} months
                  </span>
                </div>

                {student.feeHistory.length === 0 ? (
                  <div className="empty-report">
                    <div className="empty-report-icon">₹</div>
                    <strong>No fee records</strong>
                    <p>
                      Fee records will appear here once fees are generated.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Mobile */}
                    <div className="fee-history-mobile">
                      {student.feeHistory.map((fee) => (
                        <div className="fee-history-card" key={fee.id}>
                          <div className="fee-history-top">
                            <div>
                              <strong>{formatMonth(fee.month)}</strong>
                              <span className="fee-month-label">
                                Monthly fee
                              </span>
                            </div>

                            <span
                              className={`fee-status ${fee.status.toLowerCase()}`}
                            >
                              {getStatusLabel(fee.status)}
                            </span>
                          </div>

                          <div className="fee-history-details">
                            <div>
                              <span>Fee</span>
                              <strong>{money.format(fee.amount)}</strong>
                            </div>

                            <div>
                              <span>Paid</span>
                              <strong>{money.format(fee.paid)}</strong>
                            </div>

                            <div>
                              <span>Balance</span>
                              <strong
                                className={
                                  fee.balance
                                    ? "balance-due"
                                    : "balance-paid"
                                }
                              >
                                {fee.balance
                                  ? money.format(fee.balance)
                                  : "Paid"}
                              </strong>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop */}
                    <div className="fee-history-desktop card">
                      <div className="table-scroll">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>Month</th>
                              <th>Fee</th>
                              <th>Paid</th>
                              <th>Balance</th>
                              <th>Status</th>
                            </tr>
                          </thead>

                          <tbody>
                            {student.feeHistory.map((fee) => (
                              <tr key={fee.id}>
                                <td>
                                  <strong>
                                    {formatMonth(fee.month)}
                                  </strong>
                                </td>

                                <td>{money.format(fee.amount)}</td>

                                <td>{money.format(fee.paid)}</td>

                                <td
                                  className={
                                    fee.balance
                                      ? "balance-due"
                                      : "balance-paid"
                                  }
                                >
                                  {fee.balance
                                    ? money.format(fee.balance)
                                    : "Paid"}
                                </td>

                                <td>
                                  <span
                                    className={`fee-status ${fee.status.toLowerCase()}`}
                                  >
                                    {getStatusLabel(fee.status)}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </section>
            </>
          ) : null}
        </main>

      </div>
    </div>
  );
}