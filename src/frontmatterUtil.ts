import {FileManager, TFile} from "obsidian";

import {Id} from "./types";

export const getFrontMatterValue = async (fileManager: FileManager, file: TFile, frontmatterKey: string): Promise<string> => {
	let frontmatterValue = ""
	await fileManager.processFrontMatter(file, fm => {
		if (!(frontmatterKey in fm)) {
			console.error("Key", frontmatterKey, "not in frontmatter", fm, "of File", file.path)
		} else {
			frontmatterValue = fm[frontmatterKey]
		}
		return fm
	});
	return frontmatterValue
}

export const updateFrontmatterValue = async (fileManager: FileManager, file: TFile, frontmatterKey: string, frontmatterValue: Id): Promise<void> => {
	return await fileManager.processFrontMatter(file, fm => {
		if (!(frontmatterKey in fm)) {
			console.error("Key", frontmatterKey, "not in frontmatter", fm, "of File", file.path)
		}
		fm[frontmatterKey] = frontmatterValue
		return fm
	});
}
