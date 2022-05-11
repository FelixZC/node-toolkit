import type PostHTML from 'posthtml'
const tagList: string[] = []

const queryTag: PostHTML.Plugin<unknown> = (tree) => {
  tree.match(
    {
      tag: 'wp-proj-work-bench'
    },
    (node) => {
      if (node.attrs) {
        for (const [key, value] of Object.entries(node.attrs)) {
          if (key === 'tag' && typeof value === 'string') {
            if (!tagList.includes(value)) {
              tagList.push(value)
            }
          }
        }
      }

      return node
    }
  )
  ;(tree as any).messages.push({
    tagList
  })
}

export default queryTag
