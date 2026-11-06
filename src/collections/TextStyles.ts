import type { CollectionConfig } from 'payload'

export const TextStyles: CollectionConfig = {
  slug: 'text-styles',
  admin: { useAsTitle: 'name' },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'fontFamily',
      type: 'text',
      required: true,
    },
    {
      name: 'fontSize',
      type: 'number',
      required: true,
    },
    {
      name: 'fontWeight',
      type: 'number',
      required: true,
    },
    {
      name: 'lineHeight',
      type: 'number',
      required: true,
    },
    {
      name: 'figmaStyleId',
      type: 'text',
      required: true,
      unique: true,
    },
  ],
}
