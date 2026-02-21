export default {
  name: "post",
  title: "Post",
  type: "document",
  fields: [
    {
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required().min(5).max(120)
    },
    {
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (Rule) => Rule.required()
    },
    {
      name: "excerpt",
      title: "Excerpt",
      description: "Short summary shown on /blog index.",
      type: "text",
      rows: 3,
      validation: (Rule) => Rule.max(240)
    },
    {
      name: "coverImage",
      title: "Cover Image",
      type: "image",
      options: { hotspot: true },
      fields: [
        {
          name: "alt",
          title: "Alt text",
          type: "string",
          validation: (Rule) => Rule.required().max(160)
        }
      ]
    },
    {
      name: "publishDate",
      title: "Publish Date",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
      validation: (Rule) => Rule.required()
    },
    {
      name: "seoTitle",
      title: "SEO Title",
      type: "string",
      description: "Optional override for browser title and OG title.",
      validation: (Rule) => Rule.max(70)
    },
    {
      name: "seoDescription",
      title: "SEO Description",
      type: "text",
      rows: 3,
      description: "Optional override for meta description and OG description.",
      validation: (Rule) => Rule.max(160)
    },
    {
      name: "body",
      title: "Body",
      type: "array",
      of: [
        {
          type: "block",
          styles: [
            { title: "Normal", value: "normal" },
            { title: "Heading 2", value: "h2" },
            { title: "Heading 3", value: "h3" },
            { title: "Quote", value: "blockquote" }
          ],
          lists: [
            { title: "Bulleted", value: "bullet" },
            { title: "Numbered", value: "number" }
          ],
          marks: {
            decorators: [
              { title: "Strong", value: "strong" },
              { title: "Emphasis", value: "em" },
              { title: "Code", value: "code" }
            ],
            annotations: [
              {
                name: "link",
                title: "Link",
                type: "object",
                fields: [
                  {
                    name: "href",
                    title: "URL",
                    type: "url",
                    validation: (Rule) =>
                      Rule.uri({
                        scheme: ["http", "https", "mailto", "tel"]
                      }).required()
                  }
                ]
              }
            ]
          }
        },
        {
          type: "image",
          options: { hotspot: true },
          fields: [
            {
              name: "alt",
              title: "Alt text",
              type: "string",
              validation: (Rule) => Rule.required().max(160)
            }
          ]
        }
      ],
      validation: (Rule) => Rule.required().min(1)
    }
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "publishDate",
      media: "coverImage"
    },
    prepare({ title, subtitle, media }) {
      return {
        title: title || "Untitled post",
        subtitle: subtitle ? new Date(subtitle).toLocaleDateString() : "No publish date",
        media
      };
    }
  }
};
