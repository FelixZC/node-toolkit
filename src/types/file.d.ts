import { ParsedPath } from 'path'
import type { Stats } from 'fs-extra'
export type FileType =
  | 'Folder'
  | 'Audio'
  | 'Video'
  | 'Image'
  | 'Document'
  | 'Source Code'
  | 'Archive'
  | 'Executable'
  | 'Font'
  | 'Plain Text'
  | 'Other'
  | 'Unknown'

export interface FileInfo extends ParsedPath {
  filePath: string
}

export interface FileInfoWithStats extends ParsedPath, Stats {
  filePath: string
  type: FileType
  iconSmall: string
  iconMedium: string
  iconLarge: string
  sizeFormat: string
  atimeFormat: string
  mtimeFormat: string
  ctimeFormat: string
  birthtimeFormat: string
}
