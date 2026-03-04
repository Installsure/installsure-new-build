import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import { PrismaClient } from '@prisma/client';
import { Queue } from 'bullmq';
import bcrypt from 'bcrypt';

// Initialize Prisma
const prisma = new PrismaClient();

// Initialize Queues
const reportQueue = new Queue('report-generation', {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  }
});

// Initialize Fastify
const server = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true
      }
    }
  }
});

// Register plugins
await server.register(cors, {
  origin: [process.env.CORS_ORIGIN || 'http://localhost:5173'],
  credentials: true
});

await server.register(helmet);

await server.register(jwt, {
  secret: process.env.JWT_SECRET || 'supersecret'
});

await server.register(multipart, {
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '104857600') // 100MB
  }
});

await server.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute'
});

// Authentication decorator
server.decorate('authenticate', async function(request: any, reply: any) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.send(err);
  }
});

//============================================================================
// AUTH ROUTES
//============================================================================

// POST /auth/login
server.post('/auth/login', async (request, reply) => {
  const { email, password } = request.body as any;
  
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      password: true,
      name: true,
      role: true,
      avatar: true
    }
  });

  if (!user || !await bcrypt.compare(password, user.password)) {
    return reply.code(401).send({ error: 'Invalid credentials' });
  }

  const token = server.jwt.sign({ 
    id: user.id, 
    email: user.email, 
    role: user.role 
  });

  const { password: _, ...userWithoutPassword } = user;
  
  return { token, user: userWithoutPassword };
});

// POST /auth/register
server.post('/auth/register', async (request, reply) => {
  const { email, password, name, role = 'USER' } = request.body as any;
  
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    return reply.code(400).send({ error: 'User already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      avatar: true
    }
  });

  const token = server.jwt.sign({ 
    id: user.id, 
    email: user.email, 
    role: user.role 
  });

  return { token, user };
});

//============================================================================
// PROJECT ROUTES
//============================================================================

// GET /projects
server.get('/projects', {
  onRequest: [server.authenticate]
}, async (request, reply) => {
  const userId = (request.user as any).id;
  
  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { ownerId: userId },
        { members: { some: { userId } } }
      ]
    },
    include: {
      owner: {
        select: { id: true, name: true, email: true }
      },
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, avatar: true }
          }
        }
      },
      _count: {
        select: { 
          planFiles: true, 
          rfis: true, 
          changeOrders: true,
          tasks: true,
          tags: true
        }
      }
    },
    orderBy: { updatedAt: 'desc' }
  });

  return { projects };
});

// POST /projects
server.post('/projects', {
  onRequest: [server.authenticate]
}, async (request, reply) => {
  const userId = (request.user as any).id;
  const data = request.body as any;

  const project = await prisma.project.create({
    data: {
      ...data,
      ownerId: userId
    },
    include: {
      owner: {
        select: { id: true, name: true, email: true }
      }
    }
  });

  return { project };
});

// GET /projects/:id
server.get('/projects/:id', {
  onRequest: [server.authenticate]
}, async (request, reply) => {
  const { id } = request.params as { id: string };
  
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      owner: {
        select: { id: true, name: true, email: true }
      },
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, avatar: true }
          }
        }
      },
      planFiles: {
        orderBy: { createdAt: 'desc' },
        take: 10
      },
      _count: {
        select: { 
          planFiles: true, 
          rfis: true, 
          changeOrders: true,
          tasks: true,
          tags: true
        }
      }
    }
  });

  if (!project) {
    return reply.code(404).send({ error: 'Project not found' });
  }

  return { project };
});

//============================================================================
// RFI ROUTES
//============================================================================

// GET /projects/:projectId/rfis
server.get('/projects/:projectId/rfis', {
  onRequest: [server.authenticate]
}, async (request, reply) => {
  const { projectId } = request.params as { projectId: string };
  const { status, priority } = request.query as any;
  
  const where: any = { projectId };
  if (status) where.status = status;
  if (priority) where.priority = priority;

  const rfis = await prisma.rfi.findMany({
    where,
    include: {
      submittedBy: {
        select: { id: true, name: true, email: true, avatar: true }
      },
      assignedTo: {
        select: { id: true, name: true, email: true, avatar: true }
      },
      attachments: true,
      _count: {
        select: { responses: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return { rfis };
});

// POST /projects/:projectId/rfis
server.post('/projects/:projectId/rfis', {
  onRequest: [server.authenticate]
}, async (request, reply) => {
  const { projectId } = request.params as { projectId: string };
  const userId = (request.user as any).id;
  const data = request.body as any;

  const rfi = await prisma.rfi.create({
    data: {
      ...data,
      projectId,
      submittedById: userId
    },
    include: {
      submittedBy: {
        select: { id: true, name: true, email: true }
      },
      assignedTo: {
        select: { id: true, name: true, email: true }
      }
    }
  });

  return { rfi };
});

//============================================================================
// TASK ROUTES
//============================================================================

// GET /projects/:projectId/tasks
server.get('/projects/:projectId/tasks', {
  onRequest: [server.authenticate]
}, async (request, reply) => {
  const { projectId } = request.params as { projectId: string };
  const { status, assigneeId, overdue } = request.query as any;
  
  const where: any = { projectId };
  if (status) where.status = status;
  if (assigneeId) where.assigneeId = assigneeId;
  if (overdue === 'true') {
    where.dueAt = { lt: new Date() };
    where.status = { not: 'DONE' };
  }

  const tasks = await prisma.task.findMany({
    where,
    include: {
      assignee: {
        select: { id: true, name: true, email: true, avatar: true }
      },
      _count: {
        select: { attachments: true, linkedTags: true }
      }
    },
    orderBy: [
      { priority: 'desc' },
      { dueAt: 'asc' }
    ]
  });

  return { tasks };
});

// POST /projects/:projectId/tasks
server.post('/projects/:projectId/tasks', {
  onRequest: [server.authenticate]
}, async (request, reply) => {
  const { projectId } = request.params as { projectId: string };
  const userId = (request.user as any).id;
  const data = request.body as any;

  const task = await prisma.task.create({
    data: {
      ...data,
      projectId,
      createdById: userId
    },
    include: {
      assignee: {
        select: { id: true, name: true, email: true }
      }
    }
  });

  return { task };
});

//============================================================================
// TAG ROUTES
//============================================================================

// GET /projects/:projectId/tags
server.get('/projects/:projectId/tags', {
  onRequest: [server.authenticate]
}, async (request, reply) => {
  const { projectId } = request.params as { projectId: string };
  const { type, status, planFileId } = request.query as any;
  
  const where: any = { projectId };
  if (type) where.type = type;
  if (status) where.status = status;
  if (planFileId) where.planFileId = planFileId;

  const tags = await prisma.tag.findMany({
    where,
    include: {
      createdBy: {
        select: { id: true, name: true, email: true }
      },
      planFile: {
        select: { id: true, name: true, type: true }
      },
      attachments: true,
      _count: {
        select: { comments: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return { tags };
});

// POST /projects/:projectId/tags
server.post('/projects/:projectId/tags', {
  onRequest: [server.authenticate]
}, async (request, reply) => {
  const { projectId } = request.params as { projectId: string };
  const userId = (request.user as any).id;
  const data = request.body as any;

  const tag = await prisma.tag.create({
    data: {
      ...data,
      projectId,
      createdById: userId
    },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true }
      },
      planFile: true
    }
  });

  return { tag };
});

//============================================================================
// PLAN FILE ROUTES
//============================================================================

// GET /projects/:projectId/plans
server.get('/projects/:projectId/plans', {
  onRequest: [server.authenticate]
}, async (request, reply) => {
  const { projectId } = request.params as { projectId: string };
  
  const plans = await prisma.planFile.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' }
  });

  return { plans };
});

// POST /projects/:projectId/plans/upload
server.post('/projects/:projectId/plans/upload', {
  onRequest: [server.authenticate]
}, async (request, reply) => {
  const { projectId } = request.params as { projectId: string };
  const data = await request.file();
  
  if (!data) {
    return reply.code(400).send({ error: 'No file uploaded' });
  }

  // Save file logic here
  const fs = await import('fs/promises');
  const path = await import('path');
  const crypto = await import('crypto');
  
  const buffer = await data.toBuffer();
  const hash = crypto.createHash('sha256').update(buffer).digest('hex');
  const uploadPath = process.env.UPLOAD_PATH || './uploads';
  const filename = `${hash}${path.extname(data.filename)}`;
  const filepath = path.join(uploadPath, 'plans', filename);
  
  await fs.mkdir(path.dirname(filepath), { recursive: true });
  await fs.writeFile(filepath, buffer);

  const planFile = await prisma.planFile.create({
    data: {
      projectId,
      name: data.filename,
      type: data.mimetype.includes('ifc') ? 'IFC' : 
            data.mimetype.includes('pdf') ? 'PDF' : 'IMAGE',
      path: filepath,
      checksum: hash,
      size: buffer.length,
      mimeType: data.mimetype
    }
  });

  // If IFC, trigger parsing job
  if (planFile.type === 'IFC') {
    await reportQueue.add('parse-ifc', {
      planFileId: planFile.id,
      path: filepath
    });
  }

  return { planFile };
});

//============================================================================
// REPORT ROUTES
//============================================================================

// POST /projects/:projectId/reports/generate
server.post('/projects/:projectId/reports/generate', {
  onRequest: [server.authenticate]
}, async (request, reply) => {
  const { projectId } = request.params as { projectId: string };
  const { type, params = {} } = request.body as any;

  const job = await reportQueue.add('generate-report', {
    projectId,
    type,
    params
  });

  return {
    jobId: job.id,
    message: 'Report generation started',
    status: 'processing'
  };
});

//============================================================================
// CALENDAR ROUTES
//============================================================================

// GET /projects/:projectId/calendar
server.get('/projects/:projectId/calendar', {
  onRequest: [server.authenticate]
}, async (request, reply) => {
  const { projectId } = request.params as { projectId: string };
  const { start, end } = request.query as any;
  
  const where: any = { projectId };
  if (start && end) {
    where.startAt = {
      gte: new Date(start),
      lte: new Date(end)
    };
  }

  const events = await prisma.event.findMany({
    where,
    orderBy: { startAt: 'asc' }
  });

  return { events };
});

//============================================================================
// SERVER STARTUP
//============================================================================

const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '8080');
    const host = process.env.HOST || '0.0.0.0';
    
    await server.listen({ port, host });
    console.log(`🚀 InstallSure Backend running on http://${host}:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  await server.close();
  await prisma.$disconnect();
  process.exit(0);
});

start();