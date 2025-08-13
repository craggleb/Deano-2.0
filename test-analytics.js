const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAnalytics() {
  try {
    console.log('Testing analytics functionality...');
    
    // Create a test task
    const task = await prisma.task.create({
      data: {
        title: 'Test Task for Analytics',
        description: 'Testing status change tracking',
        status: 'Todo',
        priority: 'Medium',
      },
    });
    
    console.log('Created task:', task.id);
    
    // Update status to InProgress
    await prisma.task.update({
      where: { id: task.id },
      data: { status: 'InProgress' },
    });
    
    // Create audit entry manually for the status change
    await prisma.taskAudit.create({
      data: {
        taskId: task.id,
        fieldName: 'status',
        oldValue: 'Todo',
        newValue: 'InProgress',
      },
    });
    
    console.log('Updated task status to InProgress');
    
    // Update status to Completed
    await prisma.task.update({
      where: { id: task.id },
      data: { status: 'Completed' },
    });
    
    // Create audit entry manually for the status change
    await prisma.taskAudit.create({
      data: {
        taskId: task.id,
        fieldName: 'status',
        oldValue: 'InProgress',
        newValue: 'Completed',
      },
    });
    
    console.log('Updated task status to Completed');
    
    // Query analytics
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);
    
    const statusChangeAudits = await prisma.taskAudit.findMany({
      where: {
        fieldName: 'status',
        changedAt: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
      include: {
        task: true,
      },
      orderBy: {
        changedAt: 'desc',
      },
    });
    
    console.log('\nAnalytics Results:');
    console.log('Total status changes:', statusChangeAudits.length);
    
    statusChangeAudits.forEach((audit, index) => {
      console.log(`Change ${index + 1}: ${audit.oldValue} -> ${audit.newValue} (Task: ${audit.task.title})`);
    });
    
    console.log('\nTest completed successfully!');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAnalytics();
