---
priority: 'low'
---

hello

# Bundle Structure

Bundle structure seems important so we are making an attempt to tailor it as best as we can to suit the needs of the AI modals who wil consume them.

All files being bundled as per the user selection, will have tags assigned to them. These file tags should be used to create the `bundle_tags` in the bundle document mocked up below. Each bundle when created should be given a title and a description during the time of creation so we will have an interface for this.

Therefore we will add a `bundle_head` to the bundle structure to hold the bundle title, description, and tags. This enhancement might make it easier for AI modals to consume the bundle.

In this example only two files are being bundled but the sum of files could be many more.

```xml
<bundle>

<bundle_head>
  <bundle_tile>
    My Bundle Title
  </bundle_title>
  <description>
    Lorem ipsum dolor sit, amet consectetur adipisicing elit. Nobis dolor esse et. Sunt placeat autem error aperiam veritatis similique animi iure sed officiis doloremque, temporibus eligendi ratione sapiente officia accusantium!
  </description>
  <bundle_tags>
    <tag>root</tag>
    <tag>config</tag>
  </bundle_tags>
</bundle_head>

<document>
<source>.gitignore</source>
<tags>root, config</tags>
<content>...</content>
</document>

<document>
<source>.tailwind.config.js</source>
<tags>root, config</tags>
<content>...</content>
</document>

</bundle>
'''
```
