import { prisma } from "@/lib/prisma";
import type { TaskStatus } from "@/generated/prisma";

export async function getTasks(status?: TaskStatus) {
  return prisma.task.findMany({
    where: status ? { status } : {},
    include: { taskGroup: true },
    orderBy: [{ createdAt: "desc" }],
  });
}

export async function getOpenTasks(limit?: number) {
  return prisma.task.findMany({
    where: { status: "OPEN" },
    include: { taskGroup: true },
    orderBy: { createdAt: "desc" },
    ...(limit ? { take: limit } : {}),
  });
}

export async function getTaskById(id: string) {
  return prisma.task.findUnique({
    where: { id },
    include: { taskGroup: true },
  });
}

export async function getTaskGroups() {
  return prisma.taskGroup.findMany({
    include: {
      tasks: {
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
