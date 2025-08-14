import { TaskService } from '../services/taskService';
import { RecurrenceType } from '../types';

async function testRecurringTasks() {
  const taskService = new TaskService();
  
  try {
    console.log('Testing recurring task functionality...');
    
    // Create a recurring task
    const recurrencePattern = {
      type: RecurrenceType.Daily,
      interval: 1,
      startDate: new Date(),
    };

    console.log('Creating recurring task...');
    const task = await taskService.createTask({
      title: 'Daily Recurring Task',
      isRecurring: true,
      recurrencePattern,
    });

    console.log('Task created:', {
      id: task.id,
      title: task.title,
      isRecurring: task.isRecurring,
      status: task.status,
      recurrencePattern: task.recurrencePattern,
    });

    // Complete the task
    console.log('Completing task...');
    const completedTask = await taskService.completeTask(task.id);
    console.log('Task completed:', {
      id: completedTask.id,
      status: completedTask.status,
    });

    // Check if a new recurring task was created
    console.log('Checking for new recurring tasks...');
    const { tasks: allTasks } = await taskService.listTasks({});
    const recurringTasks = allTasks.filter(t => t.isRecurring && t.status === 'Todo');
    
    console.log('All recurring tasks:', recurringTasks.map(t => ({
      id: t.id,
      title: t.title,
      status: t.status,
      originalTaskId: t.originalTaskId,
    })));
    
    // The new task should have the same title but different ID
    const newTask = recurringTasks.find(t => t.title === 'Daily Recurring Task' && t.id !== task.id);
    
    if (newTask) {
      console.log('✅ SUCCESS: New recurring task created!', {
        id: newTask.id,
        title: newTask.title,
        originalTaskId: newTask.originalTaskId,
      });
    } else {
      console.log('❌ FAILURE: No new recurring task was created');
    }
    
  } catch (error) {
    console.error('Error testing recurring tasks:', error);
  }
}

testRecurringTasks();
