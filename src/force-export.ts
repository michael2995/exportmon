import fs from "fs"
import path from "path"
import chokidar from "chokidar"
import chalk from "chalk"
import {Project, SourceFile} from "ts-morph"

const hasVariableExport = (file: SourceFile) => {
  const everyExports = file.getExportSymbols()
  const defaultExport = file.getDefaultExportSymbol()
  return everyExports.length > 0 &&
    !(everyExports.length === 1 && defaultExport)
}

const forceIndexAsExportVault = (sourceFiles: SourceFile[]) => {
  const store: {[index: string]: undefined | string[]} = {}

  sourceFiles
  .filter(hasVariableExport)
  .forEach(file => {
    const curDir = file.getFilePath()
    const parentDir = path.resolve(curDir, "../")
    const baseName = file.getBaseName()
    const extension = file.getExtension()
    const exportSyntax = `export * from "./${baseName.replace(extension, "")}"`

    if (baseName.match(/index.(ts|tsx|js|jsx)/)) return

    store[parentDir] = store[parentDir]?.concat(exportSyntax) || [exportSyntax]
  })

  Object.entries(store)
  .map(([parentDir, exportsSyntaxes]) => {
    const fileContent = exportsSyntaxes?.join("\n") as string
    return new Promise((resolve, reject) => {
      fs.writeFile(`${parentDir}/index.ts`, fileContent, err => {
        if (err) reject(err)
      })
    })
  })
}

export const forceExportFor = (dirpath: string) => {
  // eslint-disable-next-line no-console
  console.log(chalk.blue(`watching ${chalk.yellow(dirpath)} for file changes`))
  chokidar.watch(dirpath).on("change", child => {
    if (fs.lstatSync(child).isDirectory()) return
    if (child.match("index.ts")) return
    const parentDir = path.resolve(child, "../")
    const project = new Project()
    project.addSourceFilesAtPaths(`${parentDir}/**.ts|tsx|js|jsx`)
    const sourceFiles = project.getSourceFiles()
    if (sourceFiles) forceIndexAsExportVault(sourceFiles)
  })
}
