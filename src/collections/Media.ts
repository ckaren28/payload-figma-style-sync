import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
    // set when the image came from a Figma frame, so a re-import updates it instead of duplicating
    { name: 'figmaNodeId', type: 'text', unique: true },
  ],
  upload: true,
}
