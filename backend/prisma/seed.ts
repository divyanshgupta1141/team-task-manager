import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('password123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@demo.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  // Create member user
  const memberPassword = await bcrypt.hash('password123', 12);
  const member = await prisma.user.upsert({
    where: { email: 'member@demo.com' },
    update: {},
    create: {
      name: 'Jane Member',
      email: 'member@demo.com',
      password: memberPassword,
      role: 'MEMBER',
    },
  });

  // Create project
  const project = await prisma.project.create({
    data: {
      name: 'Website Redesign',
      description: 'Redesigning the company website with a modern look and feel.',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdById: admin.id,
      members: {
        create: [
          { userId: admin.id },
          { userId: member.id },
        ],
      },
    },
  });

  // Create tasks
  await prisma.task.createMany({
    data: [
      {
        title: 'Design homepage mockup',
        description: 'Create Figma mockups for the new homepage',
        status: 'COMPLETED',
        priority: 'HIGH',
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        projectId: project.id,
        assignedToId: member.id,
      },
      {
        title: 'Implement authentication',
        description: 'JWT auth with role-based access control',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        projectId: project.id,
        assignedToId: admin.id,
      },
      {
        title: 'Write API documentation',
        description: 'Document all REST endpoints',
        status: 'TODO',
        priority: 'MEDIUM',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        projectId: project.id,
        assignedToId: member.id,
      },
      {
        title: 'Setup CI/CD pipeline',
        description: 'GitHub Actions for automated deployment',
        status: 'TODO',
        priority: 'LOW',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        projectId: project.id,
        assignedToId: admin.id,
      },
      {
        title: 'Mobile responsive testing',
        description: 'Test app on various screen sizes',
        status: 'TODO',
        priority: 'MEDIUM',
        dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // overdue
        projectId: project.id,
        assignedToId: member.id,
      },
    ],
  });

  console.log('✅ Seed complete!');
  console.log(`   Admin: admin@demo.com / password123`);
  console.log(`   Member: member@demo.com / password123`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
