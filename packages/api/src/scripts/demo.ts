import { TaskService } from '../services/taskService';
import { CreateTaskInput } from '../types';

async function createDemoTasks() {
  const taskService = new TaskService();

  console.log('Creating demo tasks...\n');

  // Create sample tasks
  const demoTasks: CreateTaskInput[] = [
    {
      title: 'Project Planning',
      description: 'Plan the overall project structure and timeline',
      priority: 'High' as const,
      dueAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      estimatedDurationMinutes: 120,
    },
    {
      title: 'Database Design',
      description: 'Design the database schema and relationships',
      priority: 'High' as const,
      dueAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      estimatedDurationMinutes: 180,
    },
    {
      title: 'API Development',
      description: 'Develop the REST API endpoints',
      priority: 'Medium' as const,
      dueAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      estimatedDurationMinutes: 240,
    },
    {
      title: 'Frontend Development',
      description: 'Build the user interface',
      priority: 'Medium' as const,
      dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      estimatedDurationMinutes: 300,
    },
    {
      title: 'Testing',
      description: 'Write and run comprehensive tests',
      priority: 'High' as const,
      dueAt: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // 8 days from now
      estimatedDurationMinutes: 120,
    },
    {
      title: 'Deployment',
      description: 'Deploy the application to production',
      priority: 'Medium' as const,
      dueAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
      estimatedDurationMinutes: 60,
    },
    {
      title: 'Quick Bug Fix',
      description: 'Fix a critical bug in the login system',
      priority: 'High' as const,
      dueAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day overdue
      estimatedDurationMinutes: 30,
    },
    {
      title: 'Documentation',
      description: 'Write user and technical documentation',
      priority: 'Low' as const,
      dueAt: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000), // 12 days from now
      estimatedDurationMinutes: 90,
    },
  ];

  const createdTasks: any[] = [];

  // Create tasks
  for (const taskData of demoTasks) {
    try {
      const task = await taskService.createTask(taskData);
      createdTasks.push(task);
      console.log(`✓ Created: ${task.title}`);
    } catch (error) {
      console.error(`✗ Failed to create: ${taskData.title}`, error);
    }
  }

  // Create subtasks
  const projectPlanning = createdTasks.find(t => t.title === 'Project Planning');
  const apiDevelopment = createdTasks.find(t => t.title === 'API Development');
  const frontendDevelopment = createdTasks.find(t => t.title === 'Frontend Development');

  if (projectPlanning) {
    await taskService.addSubtask(projectPlanning.id, {
      title: 'Requirements Gathering',
      description: 'Gather and document project requirements',
      priority: 'High' as const,
      estimatedDurationMinutes: 60,
    });
    console.log('✓ Created subtask: Requirements Gathering');

    await taskService.addSubtask(projectPlanning.id, {
      title: 'Timeline Creation',
      description: 'Create detailed project timeline',
      priority: 'Medium' as const,
      estimatedDurationMinutes: 45,
    });
    console.log('✓ Created subtask: Timeline Creation');
  }

  if (apiDevelopment) {
    await taskService.addSubtask(apiDevelopment.id, {
      title: 'Authentication Endpoints',
      description: 'Implement user authentication API',
      priority: 'High' as const,
      estimatedDurationMinutes: 90,
    });
    console.log('✓ Created subtask: Authentication Endpoints');

    await taskService.addSubtask(apiDevelopment.id, {
      title: 'Data Endpoints',
      description: 'Implement CRUD operations for data',
      priority: 'Medium' as const,
      estimatedDurationMinutes: 120,
    });
    console.log('✓ Created subtask: Data Endpoints');
  }

  if (frontendDevelopment) {
    await taskService.addSubtask(frontendDevelopment.id, {
      title: 'Login Page',
      description: 'Create user login interface',
      priority: 'High' as const,
      estimatedDurationMinutes: 60,
    });
    console.log('✓ Created subtask: Login Page');

    await taskService.addSubtask(frontendDevelopment.id, {
      title: 'Dashboard',
      description: 'Create main dashboard interface',
      priority: 'Medium' as const,
      estimatedDurationMinutes: 120,
    });
    console.log('✓ Created subtask: Dashboard');
  }

  // Add dependencies
  const databaseDesign = createdTasks.find(t => t.title === 'Database Design');
  const testing = createdTasks.find(t => t.title === 'Testing');
  const deployment = createdTasks.find(t => t.title === 'Deployment');

  if (apiDevelopment && databaseDesign) {
    await taskService.addDependency(apiDevelopment.id, databaseDesign.id);
    console.log('✓ Added dependency: API Development depends on Database Design');
  }

  if (frontendDevelopment && apiDevelopment) {
    await taskService.addDependency(frontendDevelopment.id, apiDevelopment.id);
    console.log('✓ Added dependency: Frontend Development depends on API Development');
  }

  if (testing && frontendDevelopment) {
    await taskService.addDependency(testing.id, frontendDevelopment.id);
    console.log('✓ Added dependency: Testing depends on Frontend Development');
  }

  if (deployment && testing) {
    await taskService.addDependency(deployment.id, testing.id);
    console.log('✓ Added dependency: Deployment depends on Testing');
  }

  console.log('\nDemo tasks created successfully!');
  console.log(`Total tasks created: ${createdTasks.length + 6}`); // +6 for subtasks

  return createdTasks;
}

async function testOrderingAlgorithm() {
  const taskService = new TaskService();

  console.log('\n=== Testing Task Ordering Algorithm ===\n');

  try {
    // Test with default configuration
    console.log('Testing with default configuration...');
    const result = await taskService.orderTasks();
    
    console.log('Ordered Task IDs:');
    result.orderedTaskIds.forEach((taskId, index) => {
      console.log(`${index + 1}. ${taskId}`);
    });

    console.log('\nTask Scores:');
    result.taskScores.forEach((score, taskId) => {
      console.log(`${taskId}:`);
      console.log(`  Score: ${score.score.toFixed(3)}`);
      console.log(`  Urgency: ${score.urgency.toFixed(3)}`);
      console.log(`  Priority: ${score.priority.toFixed(3)}`);
      console.log(`  Blocking: ${score.blocking.toFixed(3)}`);
      console.log(`  Quick Win: ${score.quickWin.toFixed(3)}`);
    });

    // Test with custom configuration
    console.log('\nTesting with custom configuration (high urgency weight)...');
    const customResult = await taskService.orderTasks({
      weights: { U: 0.7, P: 0.2, B: 0.08, Q: 0.02 },
      horizonHours: 24,
      overdueBoost: 0.3,
      quickWinCapMins: 15,
    });

    console.log('Custom Ordered Task IDs:');
    customResult.orderedTaskIds.forEach((taskId, index) => {
      console.log(`${index + 1}. ${taskId}`);
    });

  } catch (error) {
    console.error('Error testing ordering algorithm:', error);
  }
}

async function main() {
  try {
    await createDemoTasks();
    await testOrderingAlgorithm();
  } catch (error) {
    console.error('Demo failed:', error);
  }
}

// Run the demo if this file is executed directly
if (require.main === module) {
  main();
}

export { createDemoTasks, testOrderingAlgorithm };
