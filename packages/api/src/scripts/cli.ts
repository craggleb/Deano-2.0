#!/usr/bin/env tsx

import { TaskService } from '@/services/taskService';
import { connectDatabase, disconnectDatabase } from '@/lib/database';
import { format } from 'date-fns';

const taskService = new TaskService();

async function main() {
  const command = process.argv[2];
  const args = process.argv.slice(3);

  try {
    await connectDatabase();

    switch (command) {
      case 'schedule':
        await handleSchedule(args);
        break;
      case 'list':
        await handleList(args);
        break;
      case 'create':
        await handleCreate(args);
        break;
      case 'complete':
        await handleComplete(args);
        break;
      case 'help':
      case '--help':
      case '-h':
        showHelp();
        break;
      default:
        console.error('Unknown command. Use --help for usage information.');
        process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await disconnectDatabase();
  }
}

async function handleSchedule(args: string[]) {
  const options: any = {};
  
  // Parse arguments
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i];
    const value = args[i + 1];
    
    switch (key) {
      case '--working-hours':
        const [start, end] = value.split('-');
        options.workingHours = { start, end };
        break;
      case '--start-date':
        options.startDate = new Date(value);
        break;
      case '--daily-capacity':
        options.dailyCapacity = parseInt(value);
        break;
      case '--commit':
        options.commit = value === 'true';
        break;
      case '--status':
        options.filter = { ...options.filter, status: value };
        break;
      case '--priority':
        options.filter = { ...options.filter, priority: value };
        break;
    }
  }

  console.log('📅 Planning schedule...\n');
  
  const schedule = await taskService.planSchedule(options);
  
  console.log('📋 Schedule Plan:');
  console.log('='.repeat(80));
  
  if (schedule.tasks.length === 0) {
    console.log('No tasks to schedule.');
    return;
  }

  // Group by day
  const tasksByDay = new Map<string, typeof schedule.tasks>();
  
  schedule.tasks.forEach(task => {
    const day = format(new Date(task.scheduledStart), 'yyyy-MM-dd');
    if (!tasksByDay.has(day)) {
      tasksByDay.set(day, []);
    }
    tasksByDay.get(day)!.push(task);
  });

  for (const [day, tasks] of tasksByDay) {
    console.log(`\n📅 ${format(new Date(day), 'EEEE, MMMM d, yyyy')}`);
    console.log('-'.repeat(50));
    
    tasks.forEach(task => {
      const startTime = format(new Date(task.scheduledStart), 'HH:mm');
      const endTime = format(new Date(task.scheduledEnd), 'HH:mm');
      const duration = Math.round((new Date(task.scheduledEnd).getTime() - new Date(task.scheduledStart).getTime()) / (1000 * 60));
      
      console.log(`${startTime}-${endTime} (${duration}min) | ${task.taskId.slice(0, 8)}...`);
      
      if (task.constraints.blockers.length > 0) {
        console.log(`  🔗 Depends on: ${task.constraints.blockers.map(id => id.slice(0, 8)).join(', ')}`);
      }
      
      if (task.constraints.dueViolation) {
        console.log(`  ⚠️  Due date violation`);
      }
      
      if (task.constraints.notes.length > 0) {
        console.log(`  📝 ${task.constraints.notes.join(', ')}`);
      }
    });
  }

  console.log('\n📊 Summary:');
  console.log(`Total planned minutes: ${schedule.summary.totalPlannedMinutes}`);
  console.log(`Unplaced tasks: ${schedule.summary.unplacedTasks}`);
  console.log(`Due date violations: ${schedule.summary.violations}`);
}

async function handleList(args: string[]) {
  const filter: any = {};
  
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i];
    const value = args[i + 1];
    
    switch (key) {
      case '--status':
        filter.status = value;
        break;
      case '--priority':
        filter.priority = value;
        break;
      case '--parent-id':
        filter.parentId = value;
        break;
      case '--q':
        filter.q = value;
        break;
    }
  }

  const result = await taskService.listTasks(filter);
  
  console.log(`📋 Tasks (${result.total} total):\n`);
  
  result.tasks.forEach(task => {
    const status = task.status.padEnd(12);
    const priority = task.priority.padEnd(8);
    const dueDate = task.dueAt ? format(new Date(task.dueAt), 'MMM dd') : 'No due date'.padEnd(8);
    const duration = `${task.estimatedDurationMinutes}m`.padEnd(4);
    
    console.log(`${task.id.slice(0, 8)} | ${status} | ${priority} | ${dueDate} | ${duration} | ${task.title}`);
  });
}

async function handleCreate(args: string[]) {
  if (args.length < 1) {
    console.error('Usage: create <title> [--description <desc>] [--priority <priority>] [--due <date>]');
    process.exit(1);
  }

  const input: any = {
    title: args[0],
  };

  for (let i = 1; i < args.length; i += 2) {
    const key = args[i];
    const value = args[i + 1];
    
    switch (key) {
      case '--description':
        input.description = value;
        break;
      case '--priority':
        input.priority = value;
        break;
      case '--due':
        input.dueAt = new Date(value);
        break;
      case '--duration':
        input.estimatedDurationMinutes = parseInt(value);
        break;
    }
  }

  const task = await taskService.createTask(input);
  console.log(`✅ Task created: ${task.id}`);
  console.log(`Title: ${task.title}`);
  console.log(`Status: ${task.status}`);
  console.log(`Priority: ${task.priority}`);
}

async function handleComplete(args: string[]) {
  if (args.length < 1) {
    console.error('Usage: complete <task-id> [--force-parent-auto-complete]');
    process.exit(1);
  }

  const taskId = args[0];
  const options: any = {};
  
  if (args.includes('--force-parent-auto-complete')) {
    options.mode = 'forceParentAutoComplete';
  }

  const task = await taskService.completeTask(taskId, options);
  console.log(`✅ Task completed: ${task.title}`);
}

function showHelp() {
  console.log(`
Deano Task Manager CLI

Usage: npm run cli <command> [options]

Commands:
  schedule [options]     Plan a schedule for tasks
  list [options]         List tasks with filtering
  create <title> [options] Create a new task
  complete <task-id> [options] Complete a task
  help                   Show this help message

Schedule Options:
  --working-hours <start-end>  Working hours (e.g., "09:00-17:30")
  --start-date <date>          Start date for scheduling
  --daily-capacity <minutes>   Daily capacity in minutes
  --commit <true|false>        Whether to commit schedule to database
  --status <status>            Filter by task status
  --priority <priority>        Filter by task priority

List Options:
  --status <status>            Filter by task status
  --priority <priority>        Filter by task priority
  --parent-id <id>             Filter by parent task ID
  --q <query>                  Search query

Create Options:
  --description <text>         Task description
  --priority <priority>        Task priority (Low, Medium, High)
  --due <date>                 Due date
  --duration <minutes>         Estimated duration in minutes

Complete Options:
  --force-parent-auto-complete Force complete parent with incomplete children

Examples:
  npm run cli schedule --working-hours "09:00-17:30" --daily-capacity 480
  npm run cli list --status Todo --priority High
  npm run cli create "Review code" --priority High --due "2024-01-15"
  npm run cli complete clm123456 --force-parent-auto-complete
`);
}

if (require.main === module) {
  main();
}
