import type { Core, JSCodeshift, Transform } from 'jscodeshift'
export type Context = {
  root: ReturnType<Core>
  j: JSCodeshift
  filename: string
}
export type ASTTransformation<Params = void> = {
  (context: Context, params: Params): void
}
export default function astTransformationToJSCodeshiftModule<Params = any>(
  transformAST: ASTTransformation<Params>
): Transform {
  const transform: Transform = (file, api, options: Params) => {
    const j = api.jscodeshift
    const root = j(file.source)
    transformAST(
      {
        filename: file.path,
        j,
        root,
      },
      options
    )
    return root.toSource({
      lineTerminator: '\n',
    })
  }

  return transform
}
