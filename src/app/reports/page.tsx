"use client";

import { useEffect, useState } from "react";

type Tab = "financial" | "growth" | "attendance";

interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  net: number;
}

interface MonthlyItem {
  month: string;
  type?: string;
  category?: string;
  total: number;
}

interface GrowthSummary {
  totalMembers: number;
  activeMembers: number;
  inactiveMembers: number;
}

interface MonthlyMember {
  month: string;
  count: number;
}

interface AttendanceWeek {
  week: string;
  count: number;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(amount);
}

function formatMonth(month: string): string {
  const [year, m] = month.split("-");
  const date = new Date(Number(year), Number(m) - 1);
  return date.toLocaleDateString("en-NG", { month: "short", year: "numeric" });
}

function formatWeek(week: string): string {
  const date = new Date(week);
  return date.toLocaleDateString("en-NG", { month: "short", day: "numeric" });
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("financial");
  const [financial, setFinancial] = useState<{
    summary: FinancialSummary;
    monthlyContributions: MonthlyItem[];
    contributionTotals: { type: string; total: number }[];
  } | null>(null);
  const [growth, setGrowth] = useState<{
    summary: GrowthSummary;
    monthlyNewMembers: MonthlyMember[];
  } | null>(null);
  const [attendance, setAttendance] = useState<{
    weeklyAttendance: AttendanceWeek[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReport() {
      setLoading(true);
      try {
        const res = await fetch(`/api/reports?type=${activeTab}`);
        const json = await res.json();
        const data = json.data ?? json;

        if (activeTab === "financial") setFinancial(data);
        else if (activeTab === "growth") setGrowth(data);
        else setAttendance(data);
      } catch (err) {
        console.error("Failed to fetch report", err);
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, [activeTab]);

  const maxContribution = financial
    ? Math.max(
        ...financial.monthlyContributions.map((m) => m.total),
        1
      )
    : 1;

  const maxAttendance = attendance
    ? Math.max(...attendance.weeklyAttendance.map((w) => w.count), 1)
    : 1;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Reports</h1>

        <div className="mb-6 flex gap-2 border-b border-gray-200">
          {(["financial", "growth", "attendance"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-500">Loading...</div>
        ) : (
          <>
            {activeTab === "financial" && financial && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="rounded-lg border border-gray-200 bg-white p-5">
                    <p className="text-sm text-gray-500">Total Income</p>
                    <p className="mt-1 text-2xl font-semibold text-green-600">
                      {formatCurrency(financial.summary.totalIncome)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-white p-5">
                    <p className="text-sm text-gray-500">Total Expenses</p>
                    <p className="mt-1 text-2xl font-semibold text-red-600">
                      {formatCurrency(financial.summary.totalExpenses)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-white p-5">
                    <p className="text-sm text-gray-500">Net</p>
                    <p
                      className={`mt-1 text-2xl font-semibold ${
                        financial.summary.net >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {formatCurrency(financial.summary.net)}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-5">
                  <h3 className="mb-4 text-sm font-semibold text-gray-700">
                    Contribution Totals by Type
                  </h3>
                  <div className="space-y-3">
                    {financial.contributionTotals.map((item) => (
                      <div key={item.type} className="flex items-center gap-3">
                        <span className="w-24 text-xs text-gray-500">
                          {item.type}
                        </span>
                        <div className="flex-1">
                          <div
                            className="h-5 rounded bg-blue-500"
                            style={{
                              width: `${(item.total / maxContribution) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="w-28 text-right text-xs font-medium text-gray-700">
                          {formatCurrency(item.total)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-5">
                  <h3 className="mb-4 text-sm font-semibold text-gray-700">
                    Monthly Contributions
                  </h3>
                  <div className="flex items-end gap-1" style={{ height: 160 }}>
                    {financial.monthlyContributions.map((item) => (
                      <div
                        key={item.month}
                        className="group relative flex flex-col items-center"
                        style={{ flex: 1 }}
                      >
                        <div
                          className="w-full rounded-t bg-blue-400 transition-colors group-hover:bg-blue-500"
                          style={{
                            height: `${(item.total / maxContribution) * 120}px`,
                          }}
                        />
                        <span className="mt-1 text-[10px] text-gray-400">
                          {formatMonth(item.month).split(" ")[0]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "growth" && growth && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="rounded-lg border border-gray-200 bg-white p-5">
                    <p className="text-sm text-gray-500">Total Members</p>
                    <p className="mt-1 text-2xl font-semibold text-gray-900">
                      {growth.summary.totalMembers}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-white p-5">
                    <p className="text-sm text-gray-500">Active</p>
                    <p className="mt-1 text-2xl font-semibold text-green-600">
                      {growth.summary.activeMembers}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-white p-5">
                    <p className="text-sm text-gray-500">Inactive</p>
                    <p className="mt-1 text-2xl font-semibold text-red-500">
                      {growth.summary.inactiveMembers}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-5">
                  <h3 className="mb-4 text-sm font-semibold text-gray-700">
                    New Members per Month
                  </h3>
                  <div className="space-y-2">
                    {growth.monthlyNewMembers.map((item) => (
                      <div key={item.month} className="flex items-center gap-3">
                        <span className="w-20 text-xs text-gray-500">
                          {formatMonth(item.month)}
                        </span>
                        <div className="flex-1">
                          <div
                            className="h-4 rounded bg-indigo-500"
                            style={{
                              width: `${
                                (item.count /
                                  Math.max(
                                    ...growth.monthlyNewMembers.map(
                                      (m) => m.count
                                    ),
                                    1
                                  )) *
                                100
                              }%`,
                            }}
                          />
                        </div>
                        <span className="w-8 text-right text-xs font-medium text-gray-700">
                          {item.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "attendance" && attendance && (
              <div className="rounded-lg border border-gray-200 bg-white p-5">
                <h3 className="mb-4 text-sm font-semibold text-gray-700">
                  Weekly Attendance
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="pb-2 font-medium text-gray-500">
                          Week
                        </th>
                        <th className="pb-2 font-medium text-gray-500">
                          Attendees
                        </th>
                        <th className="pb-2 font-medium text-gray-500">
                          Trend
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendance.weeklyAttendance.map((item) => (
                        <tr
                          key={item.week}
                          className="border-b border-gray-50 last:border-0"
                        >
                          <td className="py-2.5 text-gray-700">
                            {formatWeek(item.week)}
                          </td>
                          <td className="py-2.5 font-medium text-gray-900">
                            {item.count}
                          </td>
                          <td className="py-2.5">
                            <div
                              className="h-3 rounded bg-emerald-400"
                              style={{
                                width: `${(item.count / maxAttendance) * 100}%`,
                                maxWidth: "200px",
                              }}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
