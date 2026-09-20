import { PrismaClient, UserRole, StudentStatus, PaymentMethod } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 12);

  const maktab = await prisma.maktab.upsert({
    where: { id: "demo-maktab" },
    update: {},
    create: {
      id: "demo-maktab",
      name: "Demo Maktab",
      phone: "+91 90000 00000",
      address: "India"
    }
  });

  const owner = await prisma.user.upsert({
    where: { email: "owner@maktab.local" },
    update: {},
    create: {
      maktabId: maktab.id,
      name: "Maktab Owner",
      email: "owner@maktab.local",
      passwordHash,
      role: UserRole.OWNER
    }
  });

  const teacher1 = await prisma.user.upsert({
    where: { email: "teacher1@maktab.local" },
    update: {},
    create: {
      maktabId: maktab.id,
      name: "Teacher 1",
      email: "teacher1@maktab.local",
      passwordHash,
      role: UserRole.TEACHER
    }
  });

  const teacher2 = await prisma.user.upsert({
    where: { email: "teacher2@maktab.local" },
    update: {},
    create: {
      maktabId: maktab.id,
      name: "Teacher 2",
      email: "teacher2@maktab.local",
      passwordHash,
      role: UserRole.TEACHER
    }
  });

  const class1 = await prisma.class.upsert({
    where: { id: "demo-class-1" },
    update: { teacherId: teacher1.id, monthlyFee: 200 },
    create: {
      id: "demo-class-1",
      maktabId: maktab.id,
      name: "Class 1",
      monthlyFee: 200,
      teacherId: teacher1.id
    }
  });

  const class2 = await prisma.class.upsert({
    where: { id: "demo-class-2" },
    update: { teacherId: teacher2.id, monthlyFee: 300 },
    create: {
      id: "demo-class-2",
      maktabId: maktab.id,
      name: "Class 2",
      monthlyFee: 300,
      teacherId: teacher2.id
    }
  });

  await prisma.classFeeHistory.deleteMany({ where: { classId: { in: [class1.id, class2.id] } } });
  await prisma.classFeeHistory.createMany({
    data: [
      { classId: class1.id, amount: 200, effectiveFrom: new Date("2026-01-01") },
      { classId: class2.id, amount: 300, effectiveFrom: new Date("2026-01-01") }
    ]
  });

  const student1 = await prisma.student.upsert({
    where: { id: "demo-student-1" },
    update: {},
    create: {
      id: "demo-student-1",
      maktabId: maktab.id,
      classId: class1.id,
      name: "Ahmed Khan",
      parentName: "Mohammed Khan",
      parentPhone: "+91 90000 00001",
      status: StudentStatus.ACTIVE,
      createdById: teacher1.id
    }
  });

  await prisma.student.upsert({
    where: { id: "demo-student-2" },
    update: {},
    create: {
      id: "demo-student-2",
      maktabId: maktab.id,
      classId: class2.id,
      name: "Yusuf Ali",
      parentName: "Sameer Ali",
      parentPhone: "+91 90000 00002",
      status: StudentStatus.ACTIVE,
      createdById: teacher2.id
    }
  });

  const month = new Date();
  month.setDate(1);
  month.setHours(0, 0, 0, 0);

  await prisma.fee.upsert({
    where: { studentId_month: { studentId: student1.id, month } },
    update: {},
    create: {
      studentId: student1.id,
      classId: class1.id,
      month,
      amount: 200
    }
  });

  console.log("Seed complete.");
  console.log("Owner: owner@maktab.local / password123");
  console.log("Teacher 1: teacher1@maktab.local / password123");
  console.log("Teacher 2: teacher2@maktab.local / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
