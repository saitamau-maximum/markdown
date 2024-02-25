import { parseMarkdownToHTML } from ".";

describe("markdown-processor/server", () => {
  it("should work with tocProcessor", async () => {
    const md = `
# Title
## SubTitle
### SubSubTitle
`;
    const { toc } = await parseMarkdownToHTML(md);
    expect(toc).toEqual([
      {
        depth: 1,
        value: "Title",
        data: {
          id: "title",
          hProperties: {
            id: "title",
          },
        },
        children: [
          {
            depth: 2,
            value: "SubTitle",
            data: {
              id: "subtitle",
              hProperties: {
                id: "subtitle",
              },
            },
            children: [
              {
                depth: 3,
                value: "SubSubTitle",
                data: {
                  id: "subsubtitle",
                  hProperties: {
                    id: "subsubtitle",
                  },
                },
                children: [],
              },
            ],
          },
        ],
      },
    ]);
  });
});
