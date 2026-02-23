# ConfirmModal.jsx

## Overview
ConfirmModal is a specialized safety component used to prevent accidental permanent actions (like deleting staff or schedule slots). It follows the same premium design language as the rest of the modal system but focuses on high-contrast warning elements.

## File Path
`frontend/src/components/ConfirmModal.jsx`

## Props
| Prop | Type | Description |
| :--- | :--- | :--- |
| `isOpen` | Boolean | Controls modal visibility. |
| `title` | String | Danger warning title (e.g., "Confirm Delete"). |
| `message` | String | Descriptive warning about the consequences of the action. |
| `onConfirm` | Function | Executed when the red confirming button is clicked. |
| `onCancel` | Function | Executed when the user cancels or clicks the backdrop. |

## Visual Features
- **Warning Indicator**: Features a large, circular amber background with a `HelpCircle` icon.
- **Action Hierarchy**: Clear visual distinction between the "Cancel" (gray) and "Confirm" (deep red) buttons.
- **Interactivity**: The confirmation button features a prominent shadow to signify a primary critical action.
- **Consistency**: Shares the standard `modal-backdrop` and `modal-content` CSS classes for unified animations.

## Example Usage
```javascript
<ConfirmModal 
    isOpen={showDelete} 
    title="Delete Record?" 
    message="This action is permanent and cannot be undone." 
    onConfirm={handleActualDelete} 
    onCancel={() => setShowDelete(false)} 
/>
```
