# Codebase Tagging Guide

## Step 1: Generate Master Bundle for Analysis

First, create a master bundle of your codebase to give the AI full context:

1. Use your application to create a master bundle
2. The master bundle will contain the full content of all tracked files
3. This is crucial as it allows the AI to analyze:
   - Actual code content and patterns
   - File relationships and dependencies
   - Architectural decisions
   - Implementation details
   - Common patterns and conventions

## Step 2: Analyze and Update Tags Definition

### Master Bundle Analysis Prompt

```markdown
I need to create an appropriate tagging system for this codebase. Here is the complete master bundle containing all source code:

[paste complete master bundle content]

Please analyze this codebase and suggest a tag configuration that:

1. Reflects the actual architectural patterns found in the code
2. Captures the different technical domains (UI, state, file system, etc.)
3. Considers file relationships and dependencies
4. Uses appropriate semantic colors from the Tailwind palette
5. Provides precise descriptions based on the actual code patterns

Format the response as a complete tags.ts file ready to use, with explanations for why each tag was chosen based on the code analysis.
```

### Current State Analysis

After getting the suggested tags, show the current state:

```markdown
Based on the codebase analysis and these suggested tags, here is my current state:

[paste current state.json]

Please validate or adjust the tag configuration based on this additional context.
```

## Step 3: Apply Tags to Files

After implementing the validated tags.ts, use this comprehensive prompt:

### Tag Assignment Prompt

```markdown
Using the deep understanding of the codebase from this master bundle:

[paste master bundle content]

And this tag configuration:

[paste new tags.ts content]

Please analyze each file in the current state:

[paste current state.json]

Suggest appropriate tags for each file based on:

1. The file's actual implementation and behavior from the master bundle
2. Its relationships with other files (imports, shared patterns)
3. Its architectural role as seen in the code
4. Any special responsibilities revealed in the implementation

Format the response as a complete state.json file with updated tags, maintaining all other existing properties.
```

## Implementation Steps

1. Create master bundle first - this is crucial!
2. Use master bundle content to get AI analysis of appropriate tags
3. Save the AI-suggested tags.ts content to `.cntx/config/tags.ts`
4. Use master bundle again with new tags to get proper file tagging
5. Save the AI-suggested state.json content to `.cntx/state/file.json`
6. Refresh your application to see the new tags applied

## Tips for Good Results

- Always include the complete master bundle - don't just list files
- The master bundle provides crucial context about:
  - Implementation patterns
  - Code organization
  - Architectural decisions
  - File relationships
  - Technical domains
- Review tag suggestions in context of actual code implementation
- Consider how tags reflect patterns found in the code
- Validate tag assignments against actual file contents

## Common Tag Combinations

Examples based on actual code patterns:

- Context Providers: Look for React context usage and state management patterns
- UI Components: Check component complexity and feature integration
- Utility Files: Examine function sharing and import patterns
- Core Files: Identify bootstrap and initialization code
- Type Definitions: Look for type sharing and interface patterns

## Validation

After applying new tags, verify against the master bundle:

- Tags reflect actual implementation patterns
- Similar implementations have consistent tags
- Tag combinations match code responsibilities
- Special cases are properly identified
- Architecture is accurately represented
