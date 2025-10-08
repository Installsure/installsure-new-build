import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create demo users
  const hashedPassword = await bcrypt.hash('demo123', 10);
  
  const owner = await prisma.user.upsert({
    where: { email: 'owner@example.com' },
    update: {},
    create: {
      email: 'owner@example.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Owner',
      role: 'OWNER',
    },
  });

  const projectManager = await prisma.user.upsert({
    where: { email: 'pm@example.com' },
    update: {},
    create: {
      email: 'pm@example.com',
      password: hashedPassword,
      firstName: 'Sarah',
      lastName: 'Manager',
      role: 'PROJECT_MANAGER',
    },
  });

  // Create demo project
  const project = await prisma.project.upsert({
    where: { id: 'demo-project-1' },
    update: {},
    create: {
      id: 'demo-project-1',
      name: 'Downtown Office Complex',
      description: 'A 20-story commercial office building in downtown',
      status: 'ACTIVE',
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-12-15'),
      budget: 5000000,
      ownerId: owner.id,
      members: {
        create: [
          {
            userId: projectManager.id,
            role: 'PROJECT_MANAGER',
          },
        ],
      },
    },
  });

  // Create demo RFI
  await prisma.rFI.upsert({
    where: { id: 'demo-rfi-1' },
    update: {},
    create: {
      id: 'demo-rfi-1',
      title: 'HVAC System Specification Clarification',
      description: 'Need clarification on the HVAC system requirements for floors 15-20',
      status: 'PENDING',
      priority: 'HIGH',
      projectId: project.id,
      authorId: projectManager.id,
      dueDate: new Date('2024-02-15'),
    },
  });

  // Create demo tasks
  await prisma.task.createMany({
    data: [
      {
        title: 'Foundation Inspection',
        description: 'Inspect foundation work before concrete pour',
        status: 'TODO',
        priority: 'HIGH',
        projectId: project.id,
        assigneeId: projectManager.id,
        dueDate: new Date('2024-02-10'),
      },
      {
        title: 'Install Electrical Panels',
        description: 'Install main electrical panels on floors 1-5',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        projectId: project.id,
        assigneeId: projectManager.id,
        dueDate: new Date('2024-02-20'),
      },
      {
        title: 'HVAC Ductwork - Phase 1',
        description: 'Complete HVAC ductwork installation for floors 1-10',
        status: 'COMPLETED',
        priority: 'MEDIUM',
        projectId: project.id,
        assigneeId: projectManager.id,
        completedAt: new Date('2024-01-30'),
      },
    ],
  });

  // Create demo tags
  await prisma.tag.createMany({
    data: [
      { name: 'urgent', color: '#FF0000' },
      { name: 'electrical', color: '#FFA500' },
      { name: 'hvac', color: '#0000FF' },
      { name: 'foundation', color: '#8B4513' },
      { name: 'inspection', color: '#800080' },
    ],
  });

  // Create demo calendar events
  await prisma.calendarEvent.createMany({
    data: [
      {
        title: 'Project Kickoff Meeting',
        description: 'Initial project meeting with all stakeholders',
        startTime: new Date('2024-02-05T09:00:00Z'),
        endTime: new Date('2024-02-05T11:00:00Z'),
        type: 'MEETING',
        projectId: project.id,
        organizerId: owner.id,
      },
      {
        title: 'Foundation Inspection',
        description: 'City inspector visit for foundation approval',
        startTime: new Date('2024-02-10T14:00:00Z'),
        endTime: new Date('2024-02-10T16:00:00Z'),
        type: 'INSPECTION',
        projectId: project.id,
        organizerId: projectManager.id,
      },
    ],
  });

  console.log('Database seeded successfully!');
  console.log('Demo credentials:');
  console.log('Owner: owner@example.com / demo123');
  console.log('Project Manager: pm@example.com / demo123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });