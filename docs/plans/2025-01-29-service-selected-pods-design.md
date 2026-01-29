# Service Selected Pods Feature Design

**Date**: 2025-01-29
**Status**: Design Approved

## Overview

Add a new "Selected Pods" section to the Service details page that displays pods matching the service's selector in a table format with clickable pod names.

## Problem Statement

Currently, when viewing a Service in Headlamp, users see:
- The service's selector (e.g., `app=frontend`)
- Endpoints with IP addresses
- EndpointSlices

However, users cannot easily see **which pods** actually match the selector. They must navigate away to the Pods list and filter manually.

## Proposed Solution

Add a new section below Endpoints that queries and displays pods matching the service's selector.

## Design

### Location

Service details page (`/services/:namespace/:name`), positioned below the existing Endpoints section.

### Component Structure

**New File**: `frontend/src/components/service/SelectedPods.tsx`

```tsx
interface SelectedPodsProps {
  service: Service;
}
```

**Modify**: `frontend/src/components/service/Details.tsx` to include the new section.

### Table Columns

| Column | Description | Type |
|--------|-------------|------|
| Pod Name | Clickable link to Pod details | Link |
| Status | Pod phase (Running, Pending, etc.) | StatusChip |
| Age | Pod creation time | Formatted text |
| Node | Node where pod is scheduled | Text |

### Implementation Details

1. **Extract selector**: `service.spec.selector`
2. **Query pods**: Use `useList<Pod>` hook with label selector
3. **Display**: Reuse `SimpleTable`, `Link`, `SectionBox` components
4. **Pagination**: Show 10 rows initially, "Load more" button for additional pods

### Data Flow

```
Service Details Page
       ↓
Extract service.spec.selector
       ↓
useList<Pod> with labelSelector
       ↓
Render pods in table with pagination
```

## Edge Cases

| Case | Handling |
|------|----------|
| No selector (ExternalName) | Skip rendering the section |
| Empty selector `{}` | Show warning + limit results |
| No matching pods | Display "No pods match this service's selector" |
| Large pod counts | Pagination at 10 items |
| Service deleted | Handle gracefully with error state |

## File Changes

```
frontend/src/components/service/
├── Details.tsx              (modify - add SelectedPods section)
├── SelectedPods.tsx         (new - main component)
├── SelectedPods.stories.tsx (new - Storybook stories)
```

## Testing

Per [contributing guidelines](https://headlamp.dev/docs/latest/contributing), frontend components require Storybook stories.

### Storybook Stories (`SelectedPods.stories.tsx`)
- Loading state (while fetching pods)
- Empty state (no matching pods)
- Populated state (3-5 pods)
- Large state (20+ pods with pagination)
- Warning state (empty selector)

### Unit Tests
- Table renders with correct columns
- Pod names link to correct routes
- Pagination works correctly
- Selector parsing handles edge cases

### Manual Scenarios
1. Service with 3+ matching pods → table displays correctly
2. Empty selector → warning shown
3. No matching pods → empty state shown
4. Click pod name → navigates to Pod details
5. 20+ pods → pagination works

### Pre-Commit Checklist
- `npm run frontend:test` - All tests pass
- `npm run frontend:lint` - Code formatted correctly
- Storybook snapshots updated (if visual changes)

## Success Criteria

- Users can see matching pods on Service details page
- Pod names are clickable and navigate correctly
- Performance acceptable for services with many pods
- Edge cases handled gracefully
