# Task Ordering Algorithm Implementation

This document describes the implementation of a sophisticated task ordering algorithm for the Deano Task Manager application. The algorithm intelligently orders tasks based on urgency, priority, dependencies, and other factors to help users work on the most important tasks first.

## Overview

The task ordering algorithm implements a blended scoring system that considers multiple factors to determine the optimal order for completing tasks. It respects task dependencies, hierarchy relationships, and provides configurable weights for different prioritisation factors.

## Algorithm Features

### Core Rules
1. **Sub-task Dependencies**: Sub-tasks must be completed before their parent tasks
2. **Task Dependencies**: Tasks can only be scheduled after all their dependencies are complete
3. **Dynamic Scoring**: Scores are recomputed each time a task is selected
4. **Cycle Detection**: The algorithm detects and reports dependency cycles
5. **Deterministic Tie-breaking**: Consistent ordering for tasks with equal scores

### Scoring Components

The algorithm uses a weighted blend of four scoring components:

1. **Urgency (U)** - Based on due date proximity
   - Overdue tasks get a boost (configurable)
   - Uses a horizon window (default: 7 days)
   - Normalized to 0-1 range

2. **Priority (P)** - Based on task priority level
   - Low = 0, Medium = 0.5, High = 1
   - Normalized to 0-1 range

3. **Blocking Impact (B)** - How many tasks depend on this one
   - Calculated using longest downstream path
   - Normalized by maximum depth in the graph

4. **Quick Wins (Q)** - Shorter tasks get a small boost
   - Capped at configurable duration (default: 30 minutes)
   - Encourages completing small tasks

### Default Weights
- **U (Urgency)**: 0.45 (45%)
- **P (Priority)**: 0.35 (35%)
- **B (Blocking)**: 0.15 (15%)
- **Q (Quick Wins)**: 0.05 (5%)

## Implementation Details

### API Endpoint
```
POST /api/tasks/order
```

**Request Body:**
```json
{
  "weights": {
    "U": 0.45,
    "P": 0.35,
    "B": 0.15,
    "Q": 0.05
  },
  "horizonHours": 168,
  "overdueBoost": 0.20,
  "quickWinCapMins": 30
}
```

**Response:**
```json
{
  "data": {
    "orderedTaskIds": ["task-id-1", "task-id-2", ...],
    "taskScores": {
      "task-id-1": {
        "score": 0.85,
        "urgency": 0.9,
        "priority": 1.0,
        "blocking": 0.7,
        "quickWin": 0.2
      }
    },
    "cycles": null
  }
}
```

### Algorithm Steps

1. **Normalize Structure**: Make parents depend on all their subtasks
2. **Build Dependency Graph**: Create adjacency lists and in-degree counts
3. **Precompute Blocking Impact**: Calculate longest downstream paths
4. **Seed Ready Set**: Start with tasks having no unmet dependencies
5. **Iterative Selection**: Repeatedly select highest-scoring ready task
6. **Update Dependencies**: "Complete" selected task and unlock dependents
7. **Cycle Detection**: Check for remaining tasks with unmet dependencies

### Key Data Structures

- **Graph**: `Map<string, Set<string>>` - Adjacency list for dependencies
- **In-degree**: `Map<string, number>` - Count of unmet dependencies per task
- **Depth**: `Map<string, number>` - Longest downstream path length
- **Ready Set**: `Set<string>` - Tasks with no unmet dependencies

## Usage Examples

### Basic Usage
```typescript
const taskService = new TaskService();
const result = await taskService.orderTasks();

console.log('Optimal task order:', result.orderedTaskIds);
```

### Custom Configuration
```typescript
const result = await taskService.orderTasks({
  weights: { U: 0.7, P: 0.2, B: 0.08, Q: 0.02 },
  horizonHours: 24,        // 1 day urgency window
  overdueBoost: 0.3,       // 30% boost for overdue tasks
  quickWinCapMins: 15,     // 15-minute quick win cap
});
```

### Web Interface
The algorithm is integrated into the web interface at `/ordered` with:
- Real-time task ordering
- Configurable algorithm weights
- Visual indicators for blocked/ready tasks
- Score debugging information
- Breadcrumb navigation for subtasks

## Demo Data

A demo script is provided at `packages/api/src/scripts/demo.ts` that creates sample tasks with:
- 8 main tasks with varying priorities and due dates
- 6 subtasks with parent relationships
- 4 dependency relationships
- 1 overdue task for testing urgency

To run the demo:
```bash
cd packages/api
npm run ts-node src/scripts/demo.ts
```

## Configuration Guidelines

### Weight Tuning

**Urgency-Focused (Deadline-driven)**
```json
{
  "weights": { "U": 0.6, "P": 0.25, "B": 0.1, "Q": 0.05 }
}
```

**Priority-Focused (Importance-driven)**
```json
{
  "weights": { "U": 0.25, "P": 0.6, "B": 0.1, "Q": 0.05 }
}
```

**Blocking-Focused (Dependency-driven)**
```json
{
  "weights": { "U": 0.3, "P": 0.3, "B": 0.35, "Q": 0.05 }
}
```

**Quick Win-Focused (Productivity-driven)**
```json
{
  "weights": { "U": 0.3, "P": 0.3, "B": 0.2, "Q": 0.2 }
}
```

### Parameter Recommendations

- **Horizon Hours**: 24-168 (1-7 days) depending on project timeline
- **Overdue Boost**: 0.1-0.3 (10-30%) to avoid excessive penalty
- **Quick Win Cap**: 15-60 minutes depending on task complexity

## Error Handling

### Dependency Cycles
If a cycle is detected, the algorithm returns:
```json
{
  "data": {
    "orderedTaskIds": [],
    "taskScores": {},
    "cycles": ["task-a", "task-b", "task-c", "task-a"]
  }
}
```

### Common Issues
1. **Circular Dependencies**: Tasks that depend on each other
2. **Missing Tasks**: Dependencies on non-existent tasks
3. **Invalid Weights**: Weights that don't sum to 1.0

## Performance Considerations

- **Time Complexity**: O(V² + E) where V = tasks, E = dependencies
- **Space Complexity**: O(V + E) for graph representation
- **Scalability**: Suitable for up to 10,000 tasks
- **Caching**: Consider caching results for large task sets

## Testing

The algorithm includes comprehensive testing:
- Unit tests for scoring functions
- Integration tests for dependency handling
- Cycle detection tests
- Performance benchmarks

Run tests with:
```bash
npm test
```

## Future Enhancements

1. **Machine Learning**: Learn optimal weights from user behavior
2. **Context Awareness**: Consider time of day, energy levels
3. **Team Coordination**: Factor in team member availability
4. **Resource Constraints**: Consider resource limitations
5. **Historical Data**: Use completion time predictions

## Conclusion

The task ordering algorithm provides a sophisticated yet configurable approach to task prioritisation. It balances multiple competing factors while respecting the fundamental constraints of task dependencies and hierarchy. The implementation is production-ready with comprehensive error handling, performance optimisations, and a user-friendly web interface.
