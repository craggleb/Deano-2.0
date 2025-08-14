import { TaskService } from '../services/taskService';
import { RecurrenceType } from '../types';

async function testRecurringTasks() {
  const taskService = new TaskService();
  
  try {
    console.log('Testing recurring task functionality...');
    
    // Test 1: Basic recurring task without end date
    console.log('\n=== Test 1: Basic recurring task without end date ===');
    const recurrencePattern1 = {
      type: RecurrenceType.Daily,
      interval: 1,
      startDate: new Date(),
    };

    console.log('Creating recurring task without end date...');
    const task1 = await taskService.createTask({
      title: 'Daily Recurring Task (No End Date)',
      isRecurring: true,
      recurrencePattern: recurrencePattern1,
    });

    console.log('Task created:', {
      id: task1.id,
      title: task1.title,
      isRecurring: task1.isRecurring,
      status: task1.status,
      recurrencePattern: task1.recurrencePattern,
    });

    // Complete the task
    console.log('Completing task...');
    const completedTask1 = await taskService.completeTask(task1.id);
    console.log('Task completed:', {
      id: completedTask1.id,
      status: completedTask1.status,
    });

    // Test 2: Recurring task with end date in the future
    console.log('\n=== Test 2: Recurring task with end date in the future ===');
    const futureEndDate = new Date();
    futureEndDate.setDate(futureEndDate.getDate() + 30); // 30 days from now
    
    const recurrencePattern2 = {
      type: RecurrenceType.Daily,
      interval: 1,
      startDate: new Date(),
      endDate: futureEndDate,
    };

    console.log('Creating recurring task with end date:', futureEndDate.toISOString());
    const task2 = await taskService.createTask({
      title: 'Daily Recurring Task (With End Date)',
      isRecurring: true,
      recurrencePattern: recurrencePattern2,
    });

    console.log('Task created:', {
      id: task2.id,
      title: task2.title,
      isRecurring: task2.isRecurring,
      status: task2.status,
      recurrencePattern: task2.recurrencePattern,
    });

    // Complete the task
    console.log('Completing task...');
    const completedTask2 = await taskService.completeTask(task2.id);
    console.log('Task completed:', {
      id: completedTask2.id,
      status: completedTask2.status,
    });

    // Check if new recurring tasks were created
    console.log('\n=== Checking for new recurring tasks ===');
    const { tasks: allTasks } = await taskService.listTasks({});
    const recurringTasks = allTasks.filter(t => t.isRecurring && t.status === 'Todo');
    
    console.log('All recurring tasks:', recurringTasks.map(t => ({
      id: t.id,
      title: t.title,
      status: t.status,
      originalTaskId: t.originalTaskId,
    })));
    
    // Check for tasks from test 1
    const newTask1 = recurringTasks.find(t => t.title === 'Daily Recurring Task (No End Date)' && t.id !== task1.id);
    if (newTask1) {
      console.log('✅ SUCCESS: New recurring task created for test 1!', {
        id: newTask1.id,
        title: newTask1.title,
        originalTaskId: newTask1.originalTaskId,
      });
    } else {
      console.log('❌ FAILURE: No new recurring task was created for test 1');
    }

    // Check for tasks from test 2
    const newTask2 = recurringTasks.find(t => t.title === 'Daily Recurring Task (With End Date)' && t.id !== task2.id);
    if (newTask2) {
      console.log('✅ SUCCESS: New recurring task created for test 2!', {
        id: newTask2.id,
        title: newTask2.title,
        originalTaskId: newTask2.originalTaskId,
      });
    } else {
      console.log('❌ FAILURE: No new recurring task was created for test 2');
    }
    
  } catch (error) {
    console.error('Error testing recurring tasks:', error);
  }
}

testRecurringTasks();
