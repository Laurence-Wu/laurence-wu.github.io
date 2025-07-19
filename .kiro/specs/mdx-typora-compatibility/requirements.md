# Requirements Document

## Introduction

This feature will modify the MDX file compilation process to match Typora's conventions for handling Mermaid diagrams and images. Currently, the system may use different syntax or loading mechanisms than what Typora expects. This change will ensure seamless compatibility between Typora editing and the website's rendering system.

## Requirements

### Requirement 1

**User Story:** As a content creator, I want to write Mermaid diagrams using ```mermaid code blocks in my MDX files, so that my content renders consistently between Typora and the website.

#### Acceptance Criteria

1. WHEN a user writes a Mermaid diagram using ```mermaid code block syntax THEN the system SHALL render it as a proper Mermaid diagram on the website
2. WHEN the MDX file is opened in Typora THEN the Mermaid diagram SHALL display correctly using Typora's native Mermaid support
3. WHEN the system processes an MDX file with ```mermaid blocks THEN it SHALL convert them to the appropriate Mermaid component for rendering

### Requirement 2

**User Story:** As a content creator, I want images in my blog posts to be automatically loaded from a folder with the same name as the blog post, so that I can organize my assets logically and match Typora's asset management.

#### Acceptance Criteria

1. WHEN a blog post references an image by filename THEN the system SHALL automatically look for that image in a folder named after the blog post
2. WHEN an image is placed in a folder matching the blog post name THEN it SHALL be accessible to the blog post without specifying the full path
3. WHEN the system processes image references in MDX files THEN it SHALL resolve relative paths to the corresponding blog post asset folder
4. WHEN a blog post is named "my-blog-post.mdx" THEN images SHALL be loaded from a folder named "my-blog-post"

### Requirement 3

**User Story:** As a developer, I want the MDX compilation process to handle both existing and new content seamlessly, so that no existing content is broken during the transition.

#### Acceptance Criteria

1. WHEN existing MDX files are processed THEN they SHALL continue to work without modification
2. WHEN new MDX files use Typora conventions THEN they SHALL render correctly on the website
3. WHEN the system encounters both old and new syntax THEN it SHALL handle both gracefully
4. IF an image cannot be found in the blog post folder THEN the system SHALL fall back to existing image resolution methods

### Requirement 4

**User Story:** As a content creator, I want clear feedback when images or diagrams fail to load, so that I can quickly identify and fix content issues.

#### Acceptance Criteria

1. WHEN an image reference cannot be resolved THEN the system SHALL provide a clear error message or placeholder
2. WHEN a Mermaid diagram has syntax errors THEN the system SHALL display an appropriate error message
3. WHEN asset loading fails THEN the system SHALL log the issue for debugging purposes
4. WHEN the system processes MDX files THEN it SHALL validate that referenced assets exist