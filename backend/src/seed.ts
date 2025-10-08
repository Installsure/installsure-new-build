import { db } from './data/db.js';
import { logger } from './infra/logger.js';
import { config } from './infra/config.js';

const seedData = async () => {
  logger.info('Starting database seeding...');

  try {
    // Seed projects
    const projects = [
      {
        name: 'Downtown Office Complex',
        description: 'Modern 12-story office building with retail ground floor',
      },
      {
        name: 'Residential Tower A',
        description: 'High-rise residential building with 200 units',
      },
      {
        name: 'Shopping Mall Renovation',
        description: 'Complete renovation of existing shopping mall',
      },
    ];

    for (const project of projects) {
      await db.query(
        'INSERT INTO projects (name, description) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [project.name, project.description],
      );
    }

    logger.info({ count: projects.length }, 'Projects seeded');

    // Seed events
    const events = [
      {
        event_type: 'project_created',
        entity_type: 'project',
        entity_id: 1,
        data: { name: 'Downtown Office Complex' },
        request_id: 'seed-001',
      },
      {
        event_type: 'project_created',
        entity_type: 'project',
        entity_id: 2,
        data: { name: 'Residential Tower A' },
        request_id: 'seed-002',
      },
    ];

    for (const event of events) {
      await db.query(
        'INSERT INTO events (event_type, entity_type, entity_id, data, request_id) VALUES ($1, $2, $3, $4, $5)',
        [event.event_type, event.entity_type, event.entity_id, event.data, event.request_id],
      );
    }

    logger.info({ count: events.length }, 'Events seeded');

    logger.info('Database seeding completed successfully');
  } catch (error) {
    logger.error({ error: (error as Error).message }, 'Database seeding failed');
    process.exit(1);
  }
};

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedData().then(() => {
    process.exit(0);
  });
}

export { seedData };



