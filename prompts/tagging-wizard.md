I need to create an appropriate tagging system for this codebase. Here is the complete master bundle containing all source code:

[please reference the attached master bundle file]

Please analyze this codebase and suggest a tag configuration that:

1. Reflects the actual architectural patterns found in the code
2. Captures the different technical domains (UI, state, file system, etc.)
3. Considers file relationships and dependencies
4. Uses appropriate semantic colors from the Tailwind palette
5. Provides precise descriptions based on the actual code patterns

Format the response as a complete tags.ts file ready to use:

```
// .cntx/config/tags.ts
export default {
  "tag-name": {
    "color": "#hex-color",
    "description": "Clear description of what this tag represents"
  }
} as const;
```

Then, using this tag configuration and your analysis of the master bundle, assign appropriate tags to each file. Format as a complete state.json file with the structure:

```
json{
  "lastAccessed": "timestamp",
  "files": {
    "file/path": {
      "name": "filename",
      "directory": "dir",
      "lastModified": "timestamp",
      "isChanged": false,
      "isStaged": false,
      "masterBundleId": "bundle-id",
      "tags": ["tag1", "tag2"]
    }
  },
  "masterBundle": null
}
```

Base tag assignments on each file's implementation, architectural role, and relationships with other files.
