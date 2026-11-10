public with sharing class TaskFlowController {
    public class Options {
        @AuraEnabled public List<String> statuses { get; set; }
        @AuraEnabled public List<String> priorities { get; set; }
    }

    @AuraEnabled(cacheable=true)
    public static List<Task> getTasks() {
        return [
            SELECT Id, Subject, Status, Priority, ActivityDate, Description, IsClosed
            FROM Task
            WHERE OwnerId = :UserInfo.getUserId()
            WITH USER_MODE
            ORDER BY CreatedDate DESC
            LIMIT 500
        ];
    }

    @AuraEnabled(cacheable=true)
    public static Options getOptions() {
        if (!Schema.sObjectType.Task.isAccessible()) {
            throw new AuraHandledException('You do not have access to tasks.');
        }
        Options options = new Options();
        options.statuses = new List<String>();
        options.priorities = new List<String>();
        for (Schema.PicklistEntry entry : Task.Status.getDescribe().getPicklistValues()) {
            if (entry.isActive()) options.statuses.add(entry.getValue());
        }
        for (Schema.PicklistEntry entry : Task.Priority.getDescribe().getPicklistValues()) {
            if (entry.isActive()) options.priorities.add(entry.getValue());
        }
        return options;
    }

    @AuraEnabled
    public static Id saveTask(Id taskId, String subject, String status, String priority, Date dueDate, String description) {
        if (String.isBlank(subject)) {
            throw new AuraHandledException('Task subject is required.');
        }
        if (subject.trim().length() > 255) {
            throw new AuraHandledException('Subject must contain 255 characters or fewer.');
        }
        Task recordToSave;
        if (taskId == null) {
            recordToSave = new Task();
            recordToSave.OwnerId = UserInfo.getUserId();
        } else {
            List<Task> matches = [
                SELECT Id, OwnerId FROM Task
                WHERE Id = :taskId AND OwnerId = :UserInfo.getUserId()
                WITH USER_MODE LIMIT 1
            ];
            if (matches.isEmpty()) throw new AuraHandledException('Task not found or inaccessible.');
            recordToSave = matches[0];
        }
        recordToSave.Subject = subject.trim();
        recordToSave.Status = status;
        recordToSave.Priority = priority;
        recordToSave.ActivityDate = dueDate;
        recordToSave.Description = description;
        try {
            if (taskId == null) {
                Database.insert(recordToSave, AccessLevel.USER_MODE);
            } else {
                Database.update(recordToSave, AccessLevel.USER_MODE);
            }
            return recordToSave.Id;
        } catch (DmlException e) {
            throw new AuraHandledException(e.getDmlMessage(0));
        }
    }

    @AuraEnabled
    public static void deleteTask(Id taskId) {
        if (taskId == null) throw new AuraHandledException('Choose a task to delete.');
        List<Task> matches = [
            SELECT Id FROM Task
            WHERE Id = :taskId AND OwnerId = :UserInfo.getUserId()
            WITH USER_MODE LIMIT 1
        ];
        if (matches.isEmpty()) throw new AuraHandledException('Task not found or inaccessible.');
        try {
            Database.delete(matches[0], AccessLevel.USER_MODE);
        } catch (DmlException e) {
            throw new AuraHandledException(e.getDmlMessage(0));
        }
    }
}
