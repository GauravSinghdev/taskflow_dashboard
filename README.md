# TaskFlow — Salesforce LWC task dashboard

A practical LWC + Apex project using Salesforce's **standard Task object**. No custom object or field creation needed.

## Features
- Cards for all/open/completed/overdue tasks
- Search by subject; status and priority filters
- Create/edit/delete with native Lightning controls, confirmation, and toast notifications
- Cacheable Apex read + `refreshApex` after writes
- Server-side record ownership enforcement and user-mode SOQL/DML
- Responsive table layout and modal

## Prerequisites
- Salesforce org with **Task** access, activities enabled, and permissions to create/edit/delete your own tasks
- Salesforce CLI (`sf`) and Salesforce Extension Pack for VS Code
- Permission to deploy Apex and Lightning components; Apex class access for users

## Deploy
1. Open this folder in VS Code.
2. Authenticate:
   ```bash
   sf org login web --alias taskflow-org --set-default
   ```
3. Deploy:
   ```bash
   sf project deploy start --source-dir force-app --target-org taskflow-org
   ```
4. In Salesforce: **Setup → Lightning App Builder → New → App Page** (or Home Page).
5. Drag **TaskFlow Dashboard** into the page, save, and **Activate** it. Add the App Page to an app's navigation if relevant.

## Notes
- This project **only shows tasks owned by the signed-in user**, up to the latest 500 tasks.
- Picklist values are discovered from Task field descriptions. Values valid for your Task record type or org-specific restrictions may vary; Salesforce will validate them when saving.
- Apex class access must be granted through a permission set/profile as appropriate. Standard object permissions and field permissions are required; user-mode DML and SOQL enforce these.
- `IsClosed` is supplied by Salesforce, so open/completed/overdue statistics don't assume a specific status label.
- The component intentionally targets App and Home pages rather than Record pages because it is a user-level dashboard.
- Example is designed for hands-on learning; test with a sandbox/developer org before production use.

## Run Apex tests
```bash
sf apex run test --tests TaskFlowControllerTest --result-format human --target-org taskflow-org --wait 10
```
