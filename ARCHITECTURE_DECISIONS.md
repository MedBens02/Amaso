# Architecture Decisions Record (ADR)

**Project**: Amaso Charity Management System  
**Created**: 2025-08-24  
**Purpose**: Document architectural decisions for future reference  

---

## ADR-001: Kafil Form Simplification (2025-08-24)

### Status
✅ **IMPLEMENTED**

### Context
The original kafil creation system included complex sponsorship management during creation and editing, with real-time budget validation and widget selection. This created a complex UX and tight coupling between kafil creation and widow management.

### Decision
**Simplified kafil creation workflow** while preserving viewing capabilities:

1. **Creation Forms**: Remove sponsored widow selection and management
2. **Editing Forms**: Remove sponsorship editing capabilities  
3. **Viewing Forms**: Preserve full sponsorship display with financial summaries
4. **Future Workflow**: Handle sponsorship management through widow creation flow

### Rationale
- **User Experience**: Kafil creation becomes simpler and faster
- **Separation of Concerns**: Kafil management separate from sponsorship management
- **Flexibility**: Sponsorship management can be redesigned independently
- **Data Preservation**: Existing sponsorships remain visible and intact

### Implementation Details

#### Frontend Changes
```
✅ AddDonorSheet.tsx - Removed sponsorship management
✅ EditKafilSheet.tsx - Removed sponsorship editing
✅ ViewKafilDialog.tsx - Preserved full sponsorship display
```

#### Backend Changes
```
✅ KafilController - Removed sponsorship CRUD endpoints
✅ API routes - Removed sponsorship management routes
✅ Data loading - Still loads sponsorships for viewing
```

### Consequences
- **Positive**: Simpler kafil creation workflow, cleaner code
- **Positive**: Existing data preserved and visible
- **Negative**: Sponsorship management functionality temporarily removed
- **Future**: Need to implement sponsorship management in widow workflow

---

## ADR-002: Controller Separation Strategy (2025-08-24)

### Status  
✅ **DECIDED - Keep Separated**

### Context
Analysis revealed significant redundancy between `DonorController` and `KafilController`:

- **DonorController**: Handles donor CRUD + automatic kafil creation + sponsorship management
- **KafilController**: Handles kafil-specific operations + viewing

Both controllers can modify kafil data through different paths, creating potential inconsistency.

### Decision
**Keep controllers separated** despite identified redundancy.

### Rationale
- **Future Flexibility**: Kafil-specific features planned for future implementation
- **Domain Boundaries**: Clear separation between donor and kafil contexts
- **Independent Evolution**: Kafil business logic can evolve independently
- **Frontend Choice**: Frontend can choose appropriate API based on context

### Implementation Strategy

#### Current Responsibilities
```php
DonorController:
- ✅ Full donor CRUD operations
- ✅ Automatic kafil creation when is_kafil: true  
- ✅ Complex donor-kafil state transitions
- ✅ Legacy sponsorship management

KafilController:
- ✅ Basic kafil CRUD operations
- ✅ Sponsorship data loading for viewing
- ✅ Kafil-specific operations (removeKafilStatus)
- ✅ Future kafil features (planned)
```

#### Monitored Risks
```
⚠️ Data inconsistencies between donor.is_kafil and kafils table
⚠️ Frontend confusion about which API endpoint to use
⚠️ Duplicate kafil creation through different paths
⚠️ Maintenance overhead from similar logic in both controllers
```

### Future Consolidation Criteria
Consider consolidating controllers when:
- No new kafil-specific features are added for 6+ months
- Maintenance complexity consistently outweighs separation benefits  
- Frontend consistently uses only one set of endpoints
- Data inconsistency issues become frequent

---

## ADR-003: Sponsorship Management Strategy (2025-08-24)

### Status
🔄 **PLANNED - Future Implementation**

### Context
Sponsorship management was removed from kafil creation/editing forms but preserved in viewing. Need to define future approach for sponsorship management.

### Planned Approach
**Sponsorship management through widow workflow**:

1. **Widow Creation**: Include kafil assignment during widow creation
2. **Widow Editing**: Allow changing kafil assignments and amounts
3. **Kafil Viewing**: Continue showing all sponsored widows
4. **Budget Validation**: Implement at widow level to prevent over-allocation

### Benefits
- **Natural Workflow**: Sponsorships managed when working with widows
- **Clear Ownership**: Widow-centric sponsorship management
- **Flexibility**: Each widow can have different sponsorship arrangements
- **Validation**: Budget validation at the appropriate level

### Implementation Plan
```
Phase 1: Widow form enhancement
- Add kafil selection to widow creation/editing
- Add sponsorship amount field
- Add budget validation

Phase 2: Integration  
- Update widow workflows
- Test kafil budget validation
- Update ViewKafilDialog if needed

Phase 3: Migration
- Migrate any existing sponsorship management workflows
- Update documentation
- Training for users
```

---

## ADR-004: Data Viewing vs Editing Separation (2025-08-24)

### Status
✅ **IMPLEMENTED**

### Context
Need to balance between simplifying workflows and preserving data visibility.

### Decision
**Separate viewing capabilities from editing workflows**:

- **Rich Viewing**: Full data display with all relationships and calculations
- **Simple Editing**: Only essential fields editable during creation/editing
- **Preserved Data**: All existing data remains intact and visible

### Implementation
```
✅ ViewKafilDialog: Rich display with sponsorships, financial summaries
✅ EditKafilSheet: Simple editing of basic kafil information only  
✅ AddDonorSheet: Simple creation with monthly pledge only
✅ Data Integrity: All existing sponsorships preserved in database
```

### Benefits
- **User Experience**: Users can still see all data but aren't overwhelmed during editing
- **Data Safety**: No risk of accidentally modifying or losing sponsorship data
- **Workflow Clarity**: Clear distinction between viewing and editing operations
- **Future Flexibility**: Can re-add editing capabilities when sponsorship workflow is redesigned

---

## Decision Timeline

```
2025-08-24: Initial architecture analysis and simplification decisions
2025-08-24: Controller redundancy analysis and separation decision  
2025-08-24: Kafil form simplification implementation
2025-08-24: View/Edit separation implementation

Future: Sponsorship management through widow workflow (planned)
Future: Potential controller consolidation (if criteria met)
```

---

## References

- **DEVELOPMENT_PROGRESS.md**: Complete technical implementation details
- **Backend Controllers**: 
  - `backend/app/Http/Controllers/Api/V1/DonorController.php`
  - `backend/app/Http/Controllers/Api/V1/KafilController.php`
- **Frontend Components**:
  - `frontend/components/donors/add-donor-sheet.tsx`
  - `frontend/components/kafils/edit-kafil-sheet.tsx`
  - `frontend/components/kafils/view-kafil-dialog.tsx`

---

*This document will be updated as architectural decisions evolve*