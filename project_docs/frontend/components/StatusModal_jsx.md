# StatusModal.jsx

## Overview
StatusModal is a premium, animated modal component used to provide visual feedback for system actions. It supports multiple states (Success, Error, Info) and features a high-end "Glassmorphism" design aesthetic.

## File Path
`frontend/src/components/StatusModal.jsx`

## Props
| Prop | Type | Description |
| :--- | :--- | :--- |
| `isOpen` | Boolean | Controls the visibility of the modal. |
| `type` | String | Defines the visual style: `'success'`, `'error'`, or `'info'`. |
| `title` | String | The heading text displayed in the modal. |
| `message` | String | Brief description or details of the status. |
| `onConfirm` | Function | Callback function triggered when the user clicks the "Got it" button or the backdrop. |

## Visual Features
- **Backdrop Blur**: Uses `backdrop-filter: blur(8px)` to focus user attention.
- **Micro-animations**: Features a spring-over-shoot entrance animation using `cubic-bezier`.
- **Dynamic Icons**: Integrates colored `Lucide-React` icons corresponding to the status type.
- **Glassmorphism**: Subtle shadows and borders for a premium software feel.

## Example Usage
```javascript
<StatusModal 
    isOpen={true} 
    type="success" 
    title="Action Complete" 
    message="Your changes have been saved successfully." 
    onConfirm={() => setOpen(false)} 
/>
```
