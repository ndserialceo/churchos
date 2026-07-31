import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { successResponse, handleApiError } from "@/lib/api-utils";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { branchId } = requireAuth(request);
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const twelveWeeksAgo = new Date(now);
    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);

    if (type === "financial") {
      const contributions = await prisma.contribution.groupBy({
        by: ["type"],
        where: {
          branchId,
          date: { gte: twelveMonthsAgo },
        },
        _sum: { amount: true },
      });

      const monthlyContributions = await prisma.$queryRaw<
        { month: string; type: string; total: number }[]
      >`
        SELECT
          TO_CHAR(date, 'YYYY-MM') AS month,
          type,
          SUM(amount)::float AS total
        FROM "Contribution"
        WHERE "branchId" = ${branchId}
          AND date >= ${twelveMonthsAgo}
        GROUP BY TO_CHAR(date, 'YYYY-MM'), type
        ORDER BY month
      `;

      const monthlyExpenses = await prisma.$queryRaw<
        { month: string; category: string; total: number }[]
      >`
        SELECT
          TO_CHAR(date, 'YYYY-MM') AS month,
          category,
          SUM(amount)::float AS total
        FROM "Expense"
        WHERE "branchId" = ${branchId}
          AND date >= ${twelveMonthsAgo}
        GROUP BY TO_CHAR(date, 'YYYY-MM'), category
        ORDER BY month
      `;

      const totalIncome = contributions.reduce(
        (sum, c) => sum + Number(c._sum.amount ?? 0),
        0
      );

      const totalExpensesResult = await prisma.expense.aggregate({
        where: { branchId, date: { gte: twelveMonthsAgo } },
        _sum: { amount: true },
      });
      const totalExpenses = Number(totalExpensesResult._sum.amount ?? 0);

      return successResponse({
        summary: {
          totalIncome,
          totalExpenses,
          net: totalIncome - totalExpenses,
        },
        monthlyContributions,
        monthlyExpenses,
        contributionTotals: contributions.map((c) => ({
          type: c.type,
          total: Number(c._sum.amount ?? 0),
        })),
      });
    }

    if (type === "growth") {
      const currentMemberCount = await prisma.member.count({
        where: { branchId },
      });

      const activeMembers = await prisma.member.count({
        where: { branchId, status: "ACTIVE" },
      });

      const monthlyMembers = await prisma.$queryRaw<
        { month: string; count: number }[]
      >`
        SELECT
          TO_CHAR("joinedDate", 'YYYY-MM') AS month,
          COUNT(*)::int AS count
        FROM "Member"
        WHERE "branchId" = ${branchId}
          AND "joinedDate" >= ${twelveMonthsAgo}
        GROUP BY TO_CHAR("joinedDate", 'YYYY-MM')
        ORDER BY month
      `;

      const monthlyActive = await prisma.$queryRaw<
        { month: string; count: number }[]
      >`
        SELECT
          TO_CHAR(date_trunc('month', "createdAt"), 'YYYY-MM') AS month,
          COUNT(*)::int AS count
        FROM "Member"
        WHERE "branchId" = ${branchId}
          AND "createdAt" >= ${twelveMonthsAgo}
        GROUP BY date_trunc('month', "createdAt")
        ORDER BY month
      `;

      return successResponse({
        summary: {
          totalMembers: currentMemberCount,
          activeMembers,
          inactiveMembers: currentMemberCount - activeMembers,
        },
        monthlyNewMembers: monthlyMembers,
        monthlyActive,
      });
    }

    if (type === "attendance") {
      const weeklyAttendance = await prisma.$queryRaw<
        { week: string; count: number }[]
      >`
        SELECT
          TO_CHAR(DATE_TRUNC('week', date), 'YYYY-MM-DD') AS week,
          COUNT(DISTINCT "memberId")::int AS count
        FROM "Attendance"
        WHERE "branchId" = ${branchId}
          AND date >= ${twelveWeeksAgo}
        GROUP BY DATE_TRUNC('week', date)
        ORDER BY week
      `;

      return successResponse({
        weeklyAttendance,
      });
    }

    const contributionTotals = await prisma.contribution.groupBy({
      by: ["type"],
      where: {
        branchId,
        date: { gte: twelveMonthsAgo },
      },
      _sum: { amount: true },
    });

    const totalIncome = contributionTotals.reduce(
      (sum, c) => sum + Number(c._sum.amount ?? 0),
      0
    );

    const totalExpensesResult = await prisma.expense.aggregate({
      where: { branchId, date: { gte: twelveMonthsAgo } },
      _sum: { amount: true },
    });
    const totalExpenses = Number(totalExpensesResult._sum.amount ?? 0);

    const currentMemberCount = await prisma.member.count({
      where: { branchId },
    });

    const activeMembers = await prisma.member.count({
      where: { branchId, status: "ACTIVE" },
    });

    const weeklyAttendance = await prisma.$queryRaw<
      { week: string; count: number }[]
    >`
      SELECT
        TO_CHAR(DATE_TRUNC('week', date), 'YYYY-MM-DD') AS week,
        COUNT(DISTINCT "memberId")::int AS count
      FROM "Attendance"
      WHERE "branchId" = ${branchId}
        AND date >= ${twelveWeeksAgo}
      GROUP BY DATE_TRUNC('week', date)
      ORDER BY week
    `;

    return successResponse({
      financial: {
        totalIncome,
        totalExpenses,
        net: totalIncome - totalExpenses,
      },
      growth: {
        totalMembers: currentMemberCount,
        activeMembers,
        inactiveMembers: currentMemberCount - activeMembers,
      },
      attendance: {
        weeklyAttendance,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
