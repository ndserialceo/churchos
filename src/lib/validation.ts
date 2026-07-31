import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  phone: z.string().max(50).optional(),
  role: z.enum(["SUPER_ADMIN", "BRANCH_ADMIN", "PASTOR", "SECRETARY", "TREASURER"]),
  branchId: z.string(),
})

export const memberSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  middleName: z.string().max(100).optional(),
  dateOfBirth: z.string().optional().nullable(),
  gender: z.string().max(20).optional(),
  phone: z.string().max(50).optional(),
  email: z.string().email().optional().or(z.literal("")).transform((v) => (v === "" ? null : v)),
  address: z.string().optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  occupation: z.string().max(100).optional(),
  maritalStatus: z.string().max(50).optional(),
  anniversaryDate: z.string().optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE", "TRANSFERRED", "DECEASED"]).default("ACTIVE"),
  joinedDate: z.string().optional().nullable(),
  notes: z.string().optional(),
  familyId: z.string().optional().nullable(),
})

export const contributionSchema = z.object({
  type: z.enum(["TITHE", "OFFERING", "PLEDGE", "SPECIAL_DONATION"]),
  amount: z.number().positive("Amount must be positive"),
  currency: z.string().default("NGN"),
  date: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
  memberId: z.string(),
})

export const expenseSchema = z.object({
  description: z.string().min(1, "Description is required").max(255),
  amount: z.number().positive("Amount must be positive"),
  category: z.string().min(1, "Category is required").max(100),
  currency: z.string().default("NGN"),
  date: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
})

export const attendanceSchema = z.object({
  date: z.string().min(1, "Date is required"),
  service: z.string().min(1, "Service name is required").max(100),
  memberIds: z.array(z.string()).min(1, "Select at least one member"),
})

export const followUpSchema = z.object({
  type: z.string().min(1, "Type is required").max(100),
  notes: z.string().optional(),
  memberId: z.string(),
  assignedToId: z.string(),
  dueDate: z.string().optional().nullable(),
})

export const volunteerRoleSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().optional(),
})

export const volunteerAssignmentSchema = z.object({
  memberId: z.string(),
  roleId: z.string(),
  startDate: z.string().optional(),
  endDate: z.string().optional().nullable(),
})

export const communicationSchema = z.object({
  type: z.enum(["SMS", "WHATSAPP", "EMAIL"]),
  recipient: z.string().min(1, "Recipient is required"),
  subject: z.string().max(255).optional(),
  message: z.string().min(1, "Message is required"),
  memberIds: z.array(z.string()).optional(),
})

export const announcementSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  content: z.string().min(1, "Content is required"),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
  targetBranchId: z.string().optional().nullable(),
})

export const branchSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  code: z.string().min(1, "Code is required").max(50),
  address: z.string().optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  phone: z.string().max(50).optional(),
  email: z.string().email().optional().or(z.literal("")).transform((v) => (v === "" ? null : v)),
})

type ValidateResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): ValidateResult<T> {
  const result = schema.safeParse(data)
  if (result.success) return { success: true, data: result.data }
  const errorMessage = result.error.issues.map((e) => e.message).join(", ")
  return { success: false, error: errorMessage }
}
