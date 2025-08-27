# Design: Default vs Generated Component Segregation

## Current Architecture Analysis
✅ **Already good separation:**
- `src/lib/datadef/` - Default/template definitions 
- `src/lib/generated/` - User-generated content
- `src/lib/components/` - Core system components

## Proposed Enhanced Architecture

### Directory Structure
```
src/lib/
├── core/                    # System core (readonly)
│   ├── components/         # Base system components
│   ├── layouts/           # System layouts  
│   ├── utils/             # Core utilities
│   └── types/             # Type definitions
├── defaults/              # Default templates (readonly)
│   ├── datadef/          # Default data definitions
│   ├── components/       # Template components
│   ├── forms/            # Default forms
│   └── modules/          # Base modules
├── generated/            # User generated (editable)
│   ├── components/       # Custom components
│   ├── forms/           # User forms
│   ├── datadef/         # Custom data definitions
│   ├── modules/         # User modules
│   └── routes.yaml      # Navigation config
└── workspace/           # User workspace (editable)
    ├── drafts/          # Draft components
    ├── templates/       # User templates
    └── backups/         # Auto backups
```

## Implementation Strategy

### 1. Path-based Protection
```typescript
// src/lib/utils/pathProtection.ts
const READONLY_PATHS = [
  '/src/lib/core',
  '/src/lib/defaults'
];

const EDITABLE_PATHS = [
  '/src/lib/generated', 
  '/src/lib/workspace'
];

export function isPathReadonly(path: string): boolean {
  return READONLY_PATHS.some(readonly => path.startsWith(readonly));
}
```

### 2. Component Classification
```typescript
// Component metadata
interface ComponentMeta {
  id: string;
  type: 'core' | 'default' | 'generated' | 'user';
  readonly: boolean;
  source: 'system' | 'template' | 'user';
  version?: string;
}
```

### 3. Data Source Segregation
```yaml
# defaults/datadef/system_mysql.yaml (readonly)
name: system_mysql
type: mysql
readonly: true
system: true
config:
  server: localhost
  port: 3306
  
# generated/datadef/main_mysql.yaml (editable)
name: main_mysql  
type: mysql
readonly: false
system: false
extends: system_mysql
config:
  database: myapp
```

## Benefits

### ✅ **Protection**
- System components cannot be accidentally deleted
- Default templates preserved for reset/restore
- Clear separation of concerns

### ✅ **Flexibility** 
- Users can extend/inherit from defaults
- Full customization in generated/ workspace
- Easy backup/restore functionality

### ✅ **Maintainability**
- Updates to defaults don't break user customizations
- Version control friendly structure
- Clear audit trail

## Migration Plan

### Phase 1: Restructure
1. Move current components to appropriate directories
2. Add readonly flags to YAML configs
3. Update import paths

### Phase 2: Protection
1. Add path validation in designer
2. Implement readonly UI indicators
3. Add copy/extend functionality

### Phase 3: Enhancement
1. Template inheritance system
2. Version management
3. Backup/restore features

## UI Indicators

### Default Items
- 🔒 Lock icon
- Grayed out delete buttons
- "Copy to Custom" option instead of "Edit"

### Generated Items  
- ✏️ Edit icon
- Full CRUD operations
- "Reset to Default" option available