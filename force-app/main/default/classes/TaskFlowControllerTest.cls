@IsTest
private class TaskFlowControllerTest {
    @IsTest
    static void testTaskCrudAndOptions() {
        TaskFlowController.Options opts = TaskFlowController.getOptions();
        System.assert(!opts.statuses.isEmpty());
        System.assert(!opts.priorities.isEmpty());

        Test.startTest();
        Id taskId = TaskFlowController.saveTask(
            null, 'Test task', opts.statuses[0], opts.priorities[0], Date.today().addDays(2), 'Initial details'
        );
        System.assertNotEquals(null, taskId);
        List<Task> tasks = TaskFlowController.getTasks();
        System.assertEquals(1, tasks.size());
        System.assertEquals('Test task', tasks[0].Subject);

        TaskFlowController.saveTask(
            taskId, 'Updated task', opts.statuses[0], opts.priorities[0], Date.today().addDays(3), 'Updated details'
        );
        System.assertEquals('Updated task', TaskFlowController.getTasks()[0].Subject);
        TaskFlowController.deleteTask(taskId);
        System.assertEquals(0, TaskFlowController.getTasks().size());
        Test.stopTest();
    }

    @IsTest
    static void testEmptySubjectRejected() {
        try {
            TaskFlowController.saveTask(null, '   ', 'Not Started', 'Normal', null, null);
            System.assert(false, 'Expected validation error');
        } catch (AuraHandledException e) {
            System.assertNotEquals(null, e);
        }
    }
}
