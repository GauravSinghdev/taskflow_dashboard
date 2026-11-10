import { LightningElement, wire } from 'lwc';
import getTasks from '@salesforce/apex/TaskFlowController.getTasks';
import getOptions from '@salesforce/apex/TaskFlowController.getOptions';
import saveTask from '@salesforce/apex/TaskFlowController.saveTask';
import deleteTask from '@salesforce/apex/TaskFlowController.deleteTask';
import { refreshApex } from '@salesforce/apex';
import LightningConfirm from 'lightning/confirm';
import Toast from 'lightning/toast';

const EMPTY_FORM = {
    taskId: null,
    subject: '',
    status: '',
    priority: '',
    dueDate: '',
    description: ''
};

export default class TaskFlowDashboard extends LightningElement {
    tasks = [];
    searchTerm = '';
    statusFilter = 'all';
    priorityFilter = 'all';
    statusOptions = [];
    priorityOptions = [];
    form = { ...EMPTY_FORM };
    isModalOpen = false;
    isSaving = false;
    isLoading = true;
    errorMessage;
    wiredTasksResult;

    @wire(getTasks)
    wiredTasks(result) {
        this.wiredTasksResult = result;
        this.isLoading = false;
        if (result.data) {
            this.tasks = result.data.map((task) => ({
                ...task,
                statusLabel: task.Status || '—',
                priorityLabel: task.Priority || '—',
                formattedDate: task.ActivityDate || 'No due date',
                isOverdue: !task.IsClosed && !!task.ActivityDate && task.ActivityDate < this.today,
                dueDateClass: !task.IsClosed && !!task.ActivityDate && task.ActivityDate < this.today ? 'due-overdue' : '',
                priorityClass: task.Priority === 'High' ? 'priority high' : 'priority',
                statusClass: task.IsClosed ? 'status done' : 'status'
            }));
            this.errorMessage = undefined;
        } else if (result.error) {
            this.errorMessage = this.getError(result.error);
            this.tasks = [];
        }
    }

    @wire(getOptions)
    wiredOptions({ data, error }) {
        if (data) {
            this.statusOptions = data.statuses.map((value) => ({ label: value, value }));
            this.priorityOptions = data.priorities.map((value) => ({ label: value, value }));
        } else if (error) {
            this.errorMessage = this.getError(error);
        }
    }

    get today() {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }

    get totalCount() { return this.tasks.length; }
    get completedCount() { return this.tasks.filter((task) => task.IsClosed).length; }
    get openCount() { return this.totalCount - this.completedCount; }
    get overdueCount() { return this.tasks.filter((task) => task.isOverdue).length; }

    get statusFilterOptions() {
        return [{ label: 'All statuses', value: 'all' }, ...this.statusOptions];
    }
    get priorityFilterOptions() {
        return [{ label: 'All priorities', value: 'all' }, ...this.priorityOptions];
    }
    get filteredTasks() {
        const query = this.searchTerm.trim().toLowerCase();
        return this.tasks.filter((task) =>
            (!query || (task.Subject || '').toLowerCase().includes(query)) &&
            (this.statusFilter === 'all' || task.Status === this.statusFilter) &&
            (this.priorityFilter === 'all' || task.Priority === this.priorityFilter)
        );
    }
    get hasTasks() { return this.filteredTasks.length > 0; }
    get modalTitle() { return this.form.taskId ? 'Edit task' : 'New task'; }
    get modalSaveLabel() { return this.isSaving ? 'Saving…' : 'Save task'; }
    get disableSave() { return this.isSaving || !this.form.subject.trim() || !this.form.status || !this.form.priority; }

    handleSearch(event) { this.searchTerm = event.target.value; }
    handleStatusFilter(event) { this.statusFilter = event.detail.value; }
    handlePriorityFilter(event) { this.priorityFilter = event.detail.value; }
    handleInput(event) {
        const field = event.target.dataset.field;
        this.form = { ...this.form, [field]: event.detail.value };
    }

    openCreate() {
        this.form = {
            ...EMPTY_FORM,
            status: this.statusOptions[0]?.value || '',
            priority: this.priorityOptions.find((option) => option.value === 'Normal')?.value
                || this.priorityOptions[0]?.value || ''
        };
        this.isModalOpen = true;
    }
    openEdit(event) {
        const task = this.tasks.find((item) => item.Id === event.currentTarget.dataset.id);
        if (!task) return;
        this.form = {
            taskId: task.Id,
            subject: task.Subject || '',
            status: task.Status || '',
            priority: task.Priority || '',
            dueDate: task.ActivityDate || '',
            description: task.Description || ''
        };
        this.isModalOpen = true;
    }
    closeModal() {
        if (!this.isSaving) this.isModalOpen = false;
    }

    async handleSave() {
        if (this.disableSave) return;
        this.isSaving = true;
        try {
            await saveTask({
                taskId: this.form.taskId,
                subject: this.form.subject,
                status: this.form.status,
                priority: this.form.priority,
                dueDate: this.form.dueDate || null,
                description: this.form.description
            });
            this.isModalOpen = false;
            this.notify('Success', 'Task saved successfully.', 'success');
            await this.refreshTasks();
        } catch (error) {
            this.notify('Could not save task', this.getError(error), 'error');
        } finally {
            this.isSaving = false;
        }
    }

    async handleDelete(event) {
        const taskId = event.currentTarget.dataset.id;
        const approved = await LightningConfirm.open({
            label: 'Delete task',
            message: 'This will permanently delete the selected task. Continue?',
            variant: 'headerless'
        });
        if (!approved) return;
        try {
            await deleteTask({ taskId });
            this.notify('Deleted', 'Task deleted.', 'success');
            await this.refreshTasks();
        } catch (error) {
            this.notify('Could not delete task', this.getError(error), 'error');
        }
    }

    async refreshTasks() {
        if (!this.wiredTasksResult) return;
        try {
            await refreshApex(this.wiredTasksResult);
        } catch (error) {
            this.notify('Refresh failed', this.getError(error), 'error');
        }
    }
    notify(label, message, variant) { Toast.show({ label, message, variant }, this); }
    getError(error) {
        return error?.body?.message || error?.message || 'An unexpected error occurred.';
    }
}
