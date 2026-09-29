## Purpose

Defines how the Graph Explore first page gives the Sigma scene maximum remaining viewport with preview-1 overlay chrome, and how hovered-node bidirectional edges keep opposite-side labels and clear arrows.

## ADDED Requirements

### Requirement: Sigma scene occupies the first-page stage
The Graph Explore first page SHALL allocate the remaining workspace below the app/workspace chrome to the Sigma scene so the graph canvas is the dominant surface. Command chrome and the temporal scrubber MUST overlay that scene instead of stacking as persistent in-flow blocks that permanently reduce canvas height. Idle layout MUST match the locked preview-1 composition: one compact top command row, one compact bottom temporal row, and the right-hand inspector occupying a side column when it is open. Opening an explicit plugin dock MAY temporarily consume scene height; with the dock closed, the scene MUST reclaim that space.

#### Scenario: Default graph tab shows a canvas-dominant stage
- **WHEN** an operator opens the Graph Explore first page with the inspector open and no plugin dock visible
- **THEN** the Sigma scene fills the remaining workspace below any app/workspace tabs, and neither the command toolbar nor the temporal scrubber sits as a persistent multi-row block above or below the canvas

#### Scenario: Closing a plugin dock restores scene height
- **WHEN** a plugin dock that was consuming scene height is closed
- **THEN** the Sigma scene expands to reclaim that height without leaving an empty chrome strip

### Requirement: Command chrome collapses to one row
The Graph Explore command chrome (status chips, search, view-mode control, Camera/Layout/Analysis/Utility tools, node-color legend, and related numeric controls such as ego depth) SHALL present a single compact row in the collapsed state. The collapsed row MUST remain visible at the top of the scene overlay and MUST NOT restore the previous multi-row stacked command deck as the default layout.

#### Scenario: Idle chrome is one compact row
- **WHEN** the Graph Explore first page is idle with no pointer over the command chrome and no keyboard focus inside it
- **THEN** the command chrome occupies a single compact row at the top of the scene and the status, search, modes, tools, and legend do not each take their own stacked row

### Requirement: Command chrome expands on hover or keyboard focus
The command chrome SHALL expand into a dropdown overlay when the operator hovers the compact row or moves keyboard focus into the chrome. The expanded dropdown MUST expose the same command capabilities as the previous command deck: search, Full Graph / Grouped View / Focus, camera and analysis tools, node-color legend, and any numeric controls that belong to the current view. Pointer interaction with the expanded dropdown MUST keep it open. Moving pointer and focus out of the chrome MUST collapse it unless a numeric draft is awaiting confirm.

#### Scenario: Hover reveals the full command dropdown
- **WHEN** the operator hovers the collapsed command row
- **THEN** a dropdown overlay opens that includes search, view-mode control, tool clusters, and the node-color legend without shrinking the Sigma canvas allocation

#### Scenario: Keyboard focus keeps the dropdown open
- **WHEN** the operator tabs into the command chrome
- **THEN** the dropdown stays expanded until focus leaves the chrome or the operator confirms a numeric draft or dismisses the chrome

#### Scenario: Leaving the chrome without a pending draft collapses it
- **WHEN** the dropdown is expanded, no numeric draft is awaiting confirm, and both pointer and keyboard focus leave the chrome
- **THEN** the command chrome returns to the compact top row

### Requirement: Confirming numeric drafts collapses command chrome
When the expanded command chrome contains numeric or range values the operator is editing (including ego-depth hops and any other chrome-owned numeric fields), the system SHALL keep the dropdown open until the operator confirms the draft. Confirming MUST apply the drafted values and collapse the chrome back to the compact top row. The system MUST NOT collapse the dropdown mid-drag or mid-keystroke before confirm. Escape SHALL discard an unconfirmed numeric draft and collapse the chrome without applying that draft.

#### Scenario: Confirm applies values and recedes to the top row
- **WHEN** the operator changes a numeric chrome control and activates Confirm
- **THEN** the drafted value is applied and the command chrome collapses to the compact top row

#### Scenario: Dragging a numeric control does not collapse the dropdown
- **WHEN** the operator is dragging a range or editing a numeric field in the expanded command chrome
- **THEN** the dropdown remains expanded until Confirm or Escape

#### Scenario: Escape discards an unconfirmed numeric draft
- **WHEN** the operator has an unconfirmed numeric draft in the command chrome and presses Escape
- **THEN** the draft is discarded, prior applied values remain, and the chrome collapses to the compact top row

### Requirement: Temporal chrome collapses and expands like the command row
The temporal playback strip (play/pause, current playhead label, and the vis-timeline scrubber) SHALL present a single compact row in the collapsed state, overlaid at the bottom of the Sigma scene. Hover or keyboard focus SHALL expand the full scrubber overlay. After the operator confirms a playhead or bound change, or after pointer and focus leave with no pending draft, the temporal chrome MUST recede to the compact bottom row. Play/pause MUST remain reachable from the collapsed row. Expanding the scrubber MUST NOT permanently reduce the Sigma canvas allocation.

#### Scenario: Idle temporal chrome is one compact row
- **WHEN** the Graph Explore first page is idle with no pointer or focus on the temporal chrome
- **THEN** the temporal chrome shows a single compact row with play/pause and the current playhead label, and the full vis-timeline does not occupy a persistent 90px in-flow band

#### Scenario: Hover expands the temporal scrubber
- **WHEN** the operator hovers the collapsed temporal row
- **THEN** the full temporal scrubber overlay appears over the bottom of the scene so the operator can move the playhead

#### Scenario: Confirming a playhead change recedes the temporal chrome
- **WHEN** the operator changes the playhead in the expanded scrubber and confirms
- **THEN** the new time is applied and the temporal chrome collapses to the compact bottom row

#### Scenario: Play remains available while collapsed
- **WHEN** the temporal chrome is collapsed
- **THEN** the operator can still start or pause evolution from the compact row without expanding the full scrubber

### Requirement: Collapsed chrome does not remove graph commands
Collapsing command and temporal chrome MUST be a density change only. Search, view-mode switching, camera and analysis tools, the node-color legend, plugin-dock toggles, and temporal play MUST remain available from the compact rows or their expanded dropdowns. Sigma pan, zoom, and node selection MUST continue to work on the unobscured scene. Overlay chrome MUST capture pointer events only within its own bounds.

#### Scenario: Canvas interaction continues outside overlay chrome
- **WHEN** the command and temporal chrome are collapsed
- **THEN** pointer events on the unobscured Sigma scene still pan, zoom, and select nodes, and do not toggle the chrome dropdowns except when they hit the compact rows

#### Scenario: Color legend remains reachable
- **WHEN** the operator expands the command chrome
- **THEN** the node-color legend items for the current display graph are visible in the dropdown

#### Scenario: Touch expands by tap instead of hover
- **WHEN** the operator on a coarse pointer uses the compact command or temporal row
- **THEN** a tap pins the corresponding dropdown open, and a tap outside, Confirm, or Escape collapses it

### Requirement: Hovered-node bidirectional edges keep labels on opposite sides
When the operator hovers a node, the system SHALL light that node's incident edges. For a bidirectional pair among those lit edges (A→B and B→A on the same connection), each relationship description MUST be drawn on opposite sides of the connecting line, offset perpendicular to the stroke. Direction arrowheads MUST remain clearly visible (not clipped, not faded into the line, and not hidden by zoom-tier contextual arrow policy while the node is hovered). The two labels MUST NOT overlap or occlude each other. A unidirectional lit edge MUST show a single label and a single clear arrow. Edges that are not incident to the hovered node MAY stay dimmed without these forced labels.

#### Scenario: Bidirectional pair splits labels across the line
- **WHEN** the operator hovers a node that has both A→B and B→A relationships to a neighbor
- **THEN** one relationship text sits on one side of the connecting line and the reverse text sits on the other side, and both texts remain readable without overlapping

#### Scenario: Hovered bidirectional arrows stay distinct
- **WHEN** the operator hovers a node with a bidirectional pair
- **THEN** each direction shows a clear arrowhead, and the arrows are not covered by either label

#### Scenario: Unidirectional hovered edge stays single-sided
- **WHEN** the operator hovers a node whose incident edge to a neighbor has only one direction
- **THEN** that edge shows one relationship label and one arrow, and no reverse label is invented

#### Scenario: Non-incident edges stay dim
- **WHEN** the operator hovers a node
- **THEN** edges that do not touch the hovered node remain unlit and do not receive the opposite-side label treatment
