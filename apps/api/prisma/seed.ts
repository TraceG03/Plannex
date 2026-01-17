import { PrismaClient, Priority, TaskStatus, WorkspaceRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  const [alice, bob] = await Promise.all([
    prisma.user.upsert({
      where: { email: "alice@example.com" },
      update: {},
      create: { email: "alice@example.com", name: "Alice", passwordHash }
    }),
    prisma.user.upsert({
      where: { email: "bob@example.com" },
      update: {},
      create: { email: "bob@example.com", name: "Bob", passwordHash }
    })
  ]);

  const workspace = await prisma.workspace.create({
    data: {
      name: "Demo Workspace",
      memberships: {
        create: [
          { userId: alice.id, role: WorkspaceRole.owner },
          { userId: bob.id, role: WorkspaceRole.member }
        ]
      },
      channels: {
        create: [
          { name: "General", description: "Team updates + notes", notesMd: "# General\n\nWelcome!" },
          { name: "Planning", description: "Planning notes", notesMd: "## Weekly themes\n- Ship MVP\n" }
        ]
      },
      projects: {
        create: [{ name: "Planner MVP", description: "Core features", color: "indigo" }]
      },
      tags: {
        create: [
          { name: "Product", color: "indigo" },
          { name: "Bug", color: "red" },
          { name: "Growth", color: "emerald" }
        ]
      }
    },
    include: { channels: true, projects: true, tags: true }
  });

  const project = workspace.projects[0]!;
  const channelGeneral = workspace.channels.find((c) => c.name === "General")!;
  const tagProduct = workspace.tags.find((t) => t.name === "Product")!;

  const task1 = await prisma.task.create({
    data: {
      workspaceId: workspace.id,
      projectId: project.id,
      channelId: channelGeneral.id,
      title: "Design Today view (time blocking)",
      descriptionMd: "Create a fast daily view with time blocks.",
      status: TaskStatus.in_progress,
      priority: Priority.high,
      dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      color: "indigo",
      createdById: alice.id,
      assigneeId: alice.id,
      tags: { create: [{ tagId: tagProduct.id }] }
    }
  });

  const task2 = await prisma.task.create({
    data: {
      workspaceId: workspace.id,
      projectId: project.id,
      channelId: channelGeneral.id,
      title: "Add comments with @mentions",
      descriptionMd: "Mentions should notify users in-app.",
      status: TaskStatus.todo,
      priority: Priority.urgent,
      dueAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      color: "red",
      createdById: alice.id,
      assigneeId: bob.id
    }
  });

  await prisma.comment.create({
    data: {
      taskId: task2.id,
      authorId: alice.id,
      bodyMd: "Hey @bob@example.com can you take this today?"
    }
  });

  await prisma.event.create({
    data: {
      workspaceId: workspace.id,
      title: "Sprint Planning",
      descriptionMd: "Review goals + commit to week",
      startAt: new Date(Date.now() + 3 * 60 * 60 * 1000),
      endAt: new Date(Date.now() + 4 * 60 * 60 * 1000),
      allDay: false,
      color: "emerald",
      createdById: alice.id
    }
  });

  // Time blocks for Alice today
  const todayUtcMidnight = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00.000Z");
  await prisma.timeBlock.createMany({
    data: [
      {
        workspaceId: workspace.id,
        userId: alice.id,
        date: todayUtcMidnight,
        startMin: 9 * 60,
        endMin: 10 * 60,
        title: "Plan the day",
        relatedTaskId: null
      },
      {
        workspaceId: workspace.id,
        userId: alice.id,
        date: todayUtcMidnight,
        startMin: 10 * 60,
        endMin: 12 * 60,
        title: "Deep work: Today view UI",
        relatedTaskId: task1.id
      }
    ]
  });

  await prisma.template.create({
    data: {
      workspaceId: workspace.id,
      name: "Weekly Review Checklist",
      description: "Standard weekly review tasks",
      data: {
        tasks: [
          { title: "Review completed tasks", priority: "medium" },
          { title: "Identify top 3 wins", priority: "high" },
          { title: "Pick next week focus", priority: "high" }
        ]
      },
      createdById: alice.id
    }
  });

  console.log("Seeded:", { workspaceId: workspace.id, aliceEmail: alice.email, bobEmail: bob.email });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

