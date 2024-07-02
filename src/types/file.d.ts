import { ParsedPath } from "path";
import type { Stats } from "fs-extra";
export type FileType =
  | "Folder"
  | "Audio"
  | "Video"
  | "Image"
  | "Document"
  | "Archive"
  | "Executable"
  | "Font"
  | "Plain Text"
  | "Other"
  | "Application";
export interface FileInfo extends ParsedPath {
  filePath: string;
}
export interface FileInfoWithStats extends ParsedPath, Stats {
  filePath: string;
  type: FileType;
  fileIcon: string;
  sizeFormat: string;
  atimeFormat: string;
  mtimeFormat: string;
  ctimeFormat: string;
  birthtimeFormat: string;
}
export interface FileInfoCustom extends FileInfoWithStats {
  key: string;
  isSelected: boolean;
}
