# PromptModal.jsx

## Overview
PromptModal is a high-fidelity replacement for the native browser `prompt()` function. It is primarily used for administrative tasks that require textual input, such as adding notes for leave approval or rejection.

## File Path
`frontend/src/components/PromptModal.jsx`

## Props
| Prop | Type | Description |
| :--- | :--- | :--- |
| `isOpen` | Boolean | Visibility state. |
| `title` | String | Contextual title (e.g., "Add Admin Notes"). |
| `message` | String | Instructional text for the user. |
| `onConfirm` | Function | Returns the typed string value to the parent component. |
| `onCancel` | Function | Discards input and closes the modal. |
| `placeholder` | String | Hint text inside the textarea. |
| `initialValue`| String | Default text to prepopulate the input. |

## Feature Set
- **Rich Text Area**: Features a large, non-resizable textarea for institutional-grade remarks.
- **Auto-Focus**: Automatically focuses the input area when opened for rapid user interaction.
- **State Management**: Internally tracks input value and clears it upon submission or cancellation.
- **Premium Styling**: Uses the `MessageSquare` green-accented icon to signify a communication/notes task.

## Example Usage
```javascript
<PromptModal 
    isOpen={needsNotes} 
    title="Leave Remark" 
    message="Explain why this request is being modified." 
    onConfirm={(notes) => saveToDatabase(notes)} 
    onCancel={() => setNeedsNotes(false)} 
/>
```
