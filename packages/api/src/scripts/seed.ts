import { TaskService } from '@/services/taskService';
import { connectDatabase, disconnectDatabase } from '@/lib/database';
import { addDays, addHours } from 'date-fns';

const taskService = new TaskService();

async function seed() {
  try {
    console.log('🌱 Seeding database...');
    await connectDatabase();

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    // Note: In a real application, you'd want to use Prisma's deleteMany with proper cascade handling

    // Create sample tasks
    console.log('📝 Creating sample tasks...');

    // Project planning tasks
    const projectPlan = await taskService.createTask({
      title: 'Plan Project Architecture',
      description: 'Design the overall system architecture and technology stack',
      priority: 'High',
      dueAt: addDays(new Date(), 2),
      estimatedDurationMinutes: 120,
      allowParentAutoComplete: false,
    });

    const requirementsGathering = await taskService.createTask({
      title: 'Gather Requirements',
      description: 'Collect and document all project requirements from stakeholders',
      priority: 'High',
      dueAt: addDays(new Date(), 1),
      estimatedDurationMinutes: 180,
      allowParentAutoComplete: false,
    });

    const databaseDesign = await taskService.createTask({
      title: 'Design Database Schema',
      description: 'Create the database schema and relationships',
      priority: 'Medium',
      dueAt: addDays(new Date(), 3),
      estimatedDurationMinutes: 90,
      allowParentAutoComplete: false,
    });

    // Development tasks
    const setupEnvironment = await taskService.createTask({
      title: 'Set Up Development Environment',
      description: 'Install and configure all development tools and dependencies',
      priority: 'Medium',
      dueAt: addDays(new Date(), 1),
      estimatedDurationMinutes: 60,
      allowParentAutoComplete: false,
    });

    const backendSetup = await taskService.createTask({
      title: 'Set Up Backend Framework',
      description: 'Initialize Express.js server with basic configuration',
      priority: 'Medium',
      dueAt: addDays(new Date(), 2),
      estimatedDurationMinutes: 45,
      allowParentAutoComplete: false,
    });

    const databaseSetup = await taskService.createTask({
      title: 'Set Up Database',
      description: 'Configure PostgreSQL and run initial migrations',
      priority: 'Medium',
      dueAt: addDays(new Date(), 2),
      estimatedDurationMinutes: 30,
      allowParentAutoComplete: false,
    });

    const apiEndpoints = await taskService.createTask({
      title: 'Implement Core API Endpoints',
      description: 'Create REST API endpoints for task management',
      priority: 'High',
      dueAt: addDays(new Date(), 4),
      estimatedDurationMinutes: 240,
      allowParentAutoComplete: false,
    });

    const authSystem = await taskService.createTask({
      title: 'Implement Authentication',
      description: 'Add JWT-based authentication system',
      priority: 'High',
      dueAt: addDays(new Date(), 5),
      estimatedDurationMinutes: 120,
      allowParentAutoComplete: false,
    });

    // Frontend tasks
    const frontendSetup = await taskService.createTask({
      title: 'Set Up Frontend Framework',
      description: 'Initialize Next.js application with Tailwind CSS',
      priority: 'Medium',
      dueAt: addDays(new Date(), 3),
      estimatedDurationMinutes: 60,
      allowParentAutoComplete: false,
    });

    const taskListComponent = await taskService.createTask({
      title: 'Create Task List Component',
      description: 'Build the main task list view with filtering and sorting',
      priority: 'High',
      dueAt: addDays(new Date(), 4),
      estimatedDurationMinutes: 180,
      allowParentAutoComplete: false,
    });

    const taskDetailComponent = await taskService.createTask({
      title: 'Create Task Detail Component',
      description: 'Build the task detail view with editing capabilities',
      priority: 'High',
      dueAt: addDays(new Date(), 5),
      estimatedDurationMinutes: 150,
      allowParentAutoComplete: false,
    });

    const scheduleView = await taskService.createTask({
      title: 'Create Schedule View',
      description: 'Build the scheduling interface with timeline visualization',
      priority: 'Medium',
      dueAt: addDays(new Date(), 6),
      estimatedDurationMinutes: 200,
      allowParentAutoComplete: false,
    });

    // Testing tasks
    const unitTests = await taskService.createTask({
      title: 'Write Unit Tests',
      description: 'Create comprehensive unit tests for all components',
      priority: 'Medium',
      dueAt: addDays(new Date(), 7),
      estimatedDurationMinutes: 180,
      allowParentAutoComplete: false,
    });

    const integrationTests = await taskService.createTask({
      title: 'Write Integration Tests',
      description: 'Create integration tests for API endpoints',
      priority: 'Medium',
      dueAt: addDays(new Date(), 8),
      estimatedDurationMinutes: 120,
      allowParentAutoComplete: false,
    });

    // Documentation tasks
    const apiDocs = await taskService.createTask({
      title: 'Write API Documentation',
      description: 'Create comprehensive API documentation with examples',
      priority: 'Low',
      dueAt: addDays(new Date(), 9),
      estimatedDurationMinutes: 90,
      allowParentAutoComplete: false,
    });

    const userGuide = await taskService.createTask({
      title: 'Write User Guide',
      description: 'Create user-friendly documentation and tutorials',
      priority: 'Low',
      dueAt: addDays(new Date(), 10),
      estimatedDurationMinutes: 120,
      allowParentAutoComplete: false,
    });

    // Deployment tasks
    const dockerSetup = await taskService.createTask({
      title: 'Set Up Docker Configuration',
      description: 'Create Docker Compose setup for easy deployment',
      priority: 'Medium',
      dueAt: addDays(new Date(), 6),
      estimatedDurationMinutes: 60,
      allowParentAutoComplete: false,
    });

    const deployment = await taskService.createTask({
      title: 'Deploy to Production',
      description: 'Deploy the application to production environment',
      priority: 'High',
      dueAt: addDays(new Date(), 11),
      estimatedDurationMinutes: 90,
      allowParentAutoComplete: false,
    });

    // Create subtasks
    console.log('🔗 Creating subtasks...');

    const backendSubtasks = [
      await taskService.addSubtask(backendSetup.id, {
        title: 'Install Express.js',
        description: 'Install and configure Express.js framework',
        priority: 'Medium',
        estimatedDurationMinutes: 15,
      }),
      await taskService.addSubtask(backendSetup.id, {
        title: 'Configure Middleware',
        description: 'Set up CORS, body parsing, and other middleware',
        priority: 'Medium',
        estimatedDurationMinutes: 20,
      }),
      await taskService.addSubtask(backendSetup.id, {
        title: 'Set Up Error Handling',
        description: 'Implement global error handling middleware',
        priority: 'Medium',
        estimatedDurationMinutes: 10,
      }),
    ];

    const frontendSubtasks = [
      await taskService.addSubtask(frontendSetup.id, {
        title: 'Install Next.js',
        description: 'Create new Next.js project with TypeScript',
        priority: 'Medium',
        estimatedDurationMinutes: 20,
      }),
      await taskService.addSubtask(frontendSetup.id, {
        title: 'Configure Tailwind CSS',
        description: 'Set up Tailwind CSS for styling',
        priority: 'Medium',
        estimatedDurationMinutes: 15,
      }),
      await taskService.addSubtask(frontendSetup.id, {
        title: 'Set Up Project Structure',
        description: 'Organize components, pages, and utilities',
        priority: 'Medium',
        estimatedDurationMinutes: 25,
      }),
    ];

    // Set up dependencies
    console.log('🔗 Setting up dependencies...');

    // Backend dependencies
    await taskService.addDependency(backendSetup.id, setupEnvironment.id);
    await taskService.addDependency(databaseSetup.id, setupEnvironment.id);
    await taskService.addDependency(apiEndpoints.id, backendSetup.id);
    await taskService.addDependency(apiEndpoints.id, databaseSetup.id);
    await taskService.addDependency(authSystem.id, apiEndpoints.id);

    // Frontend dependencies
    await taskService.addDependency(frontendSetup.id, setupEnvironment.id);
    await taskService.addDependency(taskListComponent.id, frontendSetup.id);
    await taskService.addDependency(taskDetailComponent.id, frontendSetup.id);
    await taskService.addDependency(scheduleView.id, frontendSetup.id);

    // Testing dependencies
    await taskService.addDependency(unitTests.id, taskListComponent.id);
    await taskService.addDependency(unitTests.id, taskDetailComponent.id);
    await taskService.addDependency(integrationTests.id, apiEndpoints.id);
    await taskService.addDependency(integrationTests.id, authSystem.id);

    // Documentation dependencies
    await taskService.addDependency(apiDocs.id, apiEndpoints.id);
    await taskService.addDependency(userGuide.id, taskListComponent.id);
    await taskService.addDependency(userGuide.id, taskDetailComponent.id);

    // Deployment dependencies
    await taskService.addDependency(dockerSetup.id, backendSetup.id);
    await taskService.addDependency(dockerSetup.id, frontendSetup.id);
    await taskService.addDependency(deployment.id, dockerSetup.id);
    await taskService.addDependency(deployment.id, unitTests.id);
    await taskService.addDependency(deployment.id, integrationTests.id);

    // Complete some tasks to demonstrate different states
    console.log('✅ Completing some tasks...');
    await taskService.completeTask(setupEnvironment.id);
    await taskService.completeTask(requirementsGathering.id);
    await taskService.completeTask(projectPlan.id);

    console.log('🎉 Database seeded successfully!');
    console.log('\n📊 Sample data created:');
    console.log(`- ${await countTasks()} tasks`);
    console.log(`- Multiple dependencies and subtasks`);
    console.log(`- Tasks in various states (Todo, InProgress, Completed)`);
    console.log('\n🚀 You can now test the scheduling functionality:');
    console.log('npm run cli schedule --working-hours "09:00-17:30" --daily-capacity 480');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await disconnectDatabase();
  }
}

async function countTasks(): Promise<number> {
  const result = await taskService.listTasks({ limit: 1 });
  return result.total;
}

if (require.main === module) {
  seed();
}
