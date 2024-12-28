---
priority: 'medium'
---

What is the `handle` property in the File and Directory States?

Why is it empty?

`"directoryHandle": {},` is empty in Directory State

`"handle": {},` is empty in File State

Presumably, the `handle` property is a reference to the file or directory in the file system. It would be useful to use this property so we could provide links to the file or directory in the UI. A user could open the file in their IDE or file explorer, or navigate to the directory in their file explorer.
