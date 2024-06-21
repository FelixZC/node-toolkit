declare namespace NodeJS {
  interface Require {
    context(
      module: string,
      exportStar: boolean,
      regExp: RegExp
    ): {
      keys(): string[]
      (id: string): any
    }
  }
}
