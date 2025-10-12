# Simple Animation Library

A lightweight animation library built on **Tailwind CSS** and **CSS transitions**. No external dependencies, just clean and simple animations.

## Features

- 🎨 **Tailwind-based** - Uses Tailwind utility classes
- 🚀 **Lightweight** - Pure CSS transitions, no JavaScript animations
- 🎯 **Type-safe** - Full TypeScript support
- 🔧 **Flexible** - Multiple ways to use: components, hooks, or utility classes
- 📦 **Tree-shakeable** - Import only what you need

## Quick Start

### 1. Using the `Animated` Component

The easiest way to add animations:

```tsx
import { Animated } from "@/lib/animation";

function Example() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Animated show={isOpen} preset="fadeScale" duration={300}>
      <div className="p-4 bg-white rounded-lg">
        This content fades and scales in!
      </div>
    </Animated>
  );
}
```

### 2. Using `AnimatedPresence` for Mount/Unmount

Handle component mounting and unmounting with animations:

```tsx
import { AnimatedPresence, Animated } from "@/lib/animation";

function Modal({ isOpen, onClose }) {
  return (
    <AnimatedPresence show={isOpen} exitDuration={300}>
      <Animated show={isOpen} preset="fadeScale">
        <div className="modal">
          <button onClick={onClose}>Close</button>
          <p>Modal content</p>
        </div>
      </Animated>
    </AnimatedPresence>
  );
}
```

### 3. Using Hooks for Custom Animations

For complete control:

```tsx
import { useAnimation } from "@/lib/animation";

function CustomComponent({ isOpen }) {
  const { isVisible } = useAnimation({ show: isOpen });

  return (
    <div
      className={`transition-all duration-300 ${
        isVisible ? "opacity-100 scale-100" : "opacity-0 scale-90"
      }`}
    >
      Custom animated content
    </div>
  );
}
```

### 4. Using Transition Utilities

Pre-defined Tailwind classes for common patterns:

```tsx
import { transitions, states } from "@/lib/animation";

function Button() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      className={`${transitions.all} ${
        isHovered ? states.scaleUp : states.scaleNormal
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      Hover me!
    </button>
  );
}
```

## API Reference

### `<Animated>`

Main component for adding animations to elements.

**Props:**

- `show: boolean` - Controls animation state
- `preset?: AnimationPreset` - Pre-defined animation (see below)
- `duration?: number` - Animation duration in ms (default: 300)
- `delay?: number` - Delay before animation starts in ms (default: 0)
- `className?: string` - Additional CSS classes
- `style?: CSSProperties` - Inline styles
- `as?: string` - HTML element type (default: "div")

**Presets:**

- `"fade"` - Fade in/out
- `"scale"` - Scale from 90% to 100%
- `"slideUp"` - Slide up from bottom
- `"slideDown"` - Slide down from top
- `"slideLeft"` - Slide in from right
- `"slideRight"` - Slide in from left
- `"fadeScale"` - Fade + scale combined (great for modals!)

**Example:**

```tsx
<Animated show={isOpen} preset="slideUp" duration={400} delay={100}>
  <div>Content</div>
</Animated>
```

### `<AnimatedPresence>`

Manages component mount/unmount with exit animations.

**Props:**

- `show: boolean` - Controls visibility
- `exitDuration?: number` - How long to wait before unmounting (default: 300)
- `children: ReactNode` - Content to animate

**Example:**

```tsx
<AnimatedPresence show={isVisible} exitDuration={500}>
  <MyComponent />
</AnimatedPresence>
```

### `useAnimation()`

Hook for managing animation state.

**Parameters:**

```tsx
{
  show: boolean;
  delay?: number;
  onEnter?: () => void;
  onExit?: () => void;
}
```

**Returns:**

```tsx
{
  isVisible: boolean; // Current animation state
  shouldRender: boolean; // Whether to render (for exit animations)
}
```

**Example:**

```tsx
const { isVisible, shouldRender } = useAnimation({
  show: isOpen,
  delay: 100,
  onEnter: () => console.log("Entered!"),
  onExit: () => console.log("Exited!"),
});

if (!shouldRender) return null;

return <div className={isVisible ? "opacity-100" : "opacity-0"}>Content</div>;
```

### `useDelayedUnmount()`

Simple hook for delayed unmounting.

**Parameters:**

- `show: boolean` - Visibility state
- `delayMs?: number` - Delay before unmounting (default: 300)

**Returns:** `boolean` - Whether to render

**Example:**

```tsx
const shouldRender = useDelayedUnmount(isOpen, 400);

return shouldRender ? <div>Content</div> : null;
```

## Utility Classes

### `transitions`

Pre-defined transition classes:

```tsx
import { transitions } from "@/lib/animation";

transitions.fade; // "transition-opacity duration-300 ease-out"
transitions.fadeFast; // "transition-opacity duration-150 ease-out"
transitions.fadeSlow; // "transition-opacity duration-500 ease-out"
transitions.transform; // "transition-transform duration-300 ease-out"
transitions.all; // "transition-all duration-300 ease-out"
transitions.colors; // "transition-colors duration-200 ease-out"
transitions.height; // "transition-[height] duration-300 ease-out"
```

### `states`

Animation state classes:

```tsx
import { states } from "@/lib/animation";

states.visible; // "opacity-100"
states.hidden; // "opacity-0"
states.scaleNormal; // "scale-100"
states.scaleDown; // "scale-90"
states.scaleUp; // "scale-110"
states.translateUp; // "-translate-y-4"
states.rotate180; // "rotate-180"
```

### `animations`

Complete animation configurations:

```tsx
import { animations } from "@/lib/animation";

animations.fadeIn; // fade + visible
animations.fadeOut; // fade + hidden
animations.fadeScaleIn; // fade + scale + visible
animations.fadeScaleOut; // fade + scale + hidden
```

## Examples

### Modal with Backdrop

```tsx
import { AnimatedPresence, Animated } from "@/lib/animation";

function Modal({ isOpen, onClose, children }) {
  return (
    <AnimatedPresence show={isOpen} exitDuration={300}>
      {/* Backdrop */}
      <Animated
        show={isOpen}
        preset="fade"
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        {/* Modal Card */}
        <Animated
          show={isOpen}
          preset="fadeScale"
          className="fixed inset-0 flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white rounded-lg p-6 max-w-md">{children}</div>
        </Animated>
      </Animated>
    </AnimatedPresence>
  );
}
```

### Staggered List Animation

```tsx
import { Animated } from "@/lib/animation";

function List({ items, isVisible }) {
  return (
    <div>
      {items.map((item, index) => (
        <Animated
          key={item.id}
          show={isVisible}
          preset="slideUp"
          delay={index * 50} // Stagger by 50ms
          duration={300}
        >
          <div className="p-4">{item.name}</div>
        </Animated>
      ))}
    </div>
  );
}
```

### Toast Notification

```tsx
import { AnimatedPresence, Animated } from "@/lib/animation";

function Toast({ message, isVisible }) {
  return (
    <AnimatedPresence show={isVisible} exitDuration={200}>
      <Animated
        show={isVisible}
        preset="slideDown"
        className="fixed top-4 right-4"
      >
        <div className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg">
          {message}
        </div>
      </Animated>
    </AnimatedPresence>
  );
}
```

### Dropdown Menu

```tsx
import { Animated } from "@/lib/animation";

function Dropdown({ isOpen }) {
  return (
    <div className="relative">
      <button>Menu</button>
      {isOpen && (
        <Animated
          show={isOpen}
          preset="fadeScale"
          duration={200}
          className="absolute top-full mt-2 bg-white rounded-lg shadow-xl"
        >
          <div className="p-2">
            <button>Item 1</button>
            <button>Item 2</button>
            <button>Item 3</button>
          </div>
        </Animated>
      )}
    </div>
  );
}
```

## Best Practices

1. **Use appropriate durations**:
   - Fast interactions (hover, dropdown): 150-200ms
   - Modal/dialog: 300ms
   - Page transitions: 400-500ms

2. **Match enter/exit durations**: Keep them the same for consistency

3. **Use `AnimatedPresence` for conditional rendering**: It handles the timing for you

4. **Combine multiple animations**: Use `fadeScale` or create custom combinations

5. **Add delays for staggered animations**: Creates polished, professional effects

## Performance Tips

- CSS transitions are hardware-accelerated
- Avoid animating properties that trigger layout (width, height, position)
- Prefer `transform` and `opacity` for best performance
- Use `will-change` sparingly for complex animations

## Migration from Framer Motion

| Framer Motion          | This Library                           |
| ---------------------- | -------------------------------------- |
| `<motion.div>`         | `<Animated as="div">`                  |
| `<AnimatePresence>`    | `<AnimatedPresence>`                   |
| `initial/animate/exit` | `preset` prop                          |
| `variants`             | Custom `className` with `useAnimation` |
| `whileHover`           | CSS `:hover` with Tailwind             |

## License

MIT
