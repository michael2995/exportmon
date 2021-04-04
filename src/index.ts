import {Command, flags} from "@oclif/command"
import {forceExportFor} from "./force-export"
import path from "path"
class Exportmon extends Command {
  static description = "describe the command here"

  static flags = {
    // add --version flag to show CLI version
    version: flags.version({char: "v"}),
    help: flags.help({char: "h"}),
  }

  static args = [
    {
      name: "target",
      required: true,
    },
  ]

  async run() {
    const {args} = this.parse(Exportmon)
    const dirpath = path.isAbsolute(args.target)
      ? args.target
      : `${path.resolve(process.cwd(), args.target)}`
    forceExportFor(dirpath)
  }
}

export = Exportmon
