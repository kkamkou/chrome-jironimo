# Jironimo

Browser extension for monitoring, filtering, and tracking work on Atlassian JIRA issues across one or more servers.

## Language

**Account**:
A configured connection to an Atlassian JIRA server authenticated through the user's active browser session.
_Avoid_: Server, instance, profile

**Workspace**:
A named JQL filter tab, scoped to either a single Account or all Accounts, that displays matching Issues and optionally triggers change notifications.
_Avoid_: Tab, filter, view, activity

**Issue**:
An Atlassian JIRA ticket returned by a Workspace query.
_Avoid_: Entry, ticket, task, item

**Tile**:
The visual card on a Workspace board that represents a single Issue, its priority styling, transitions, and toolbar actions.
_Avoid_: Card, box, issue view

**Worklog Timer**:
A time-tracking session for a specific Issue that records elapsed work duration and submits a worklog to JIRA when stopped after at least one minute.
_Avoid_: Timer entry, stopwatch, activity timer
