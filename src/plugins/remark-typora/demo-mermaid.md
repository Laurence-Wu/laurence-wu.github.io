# Mermaid Plugin Demo

This document demonstrates the remark-typora-mermaid plugin functionality.

## Valid Mermaid Diagrams

### Flowchart
```mermaid
graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> B
    C --> E[End]
```

### Sequence Diagram
```mermaid
sequenceDiagram
    participant User
    participant Plugin
    participant Mermaid
    
    User->>Plugin: Process markdown
    Plugin->>Mermaid: Transform code block
    Mermaid-->>Plugin: JSX element
    Plugin-->>User: Transformed content
```

### Pie Chart
```mermaid
pie title Plugin Features
    "Mermaid Support" : 40
    "Image Processing" : 30
    "Extensions" : 30
```

## Error Handling

### Invalid Syntax
```mermaid
this is not valid mermaid syntax
```

### Empty Block
```mermaid

```

## Mixed Content

Here's some regular code that should not be transformed:

```javascript
console.log('This should remain as a code block');
```

```python
print("This should also remain as a code block")
```

But this mermaid should be transformed:

```mermaid
graph LR
    A --> B --> C
```

## End

The plugin successfully transforms mermaid code blocks while preserving other content.