import {z, ZodError} from "zod"
import {SafeParseError, SafeParseReturnType} from "zod/lib/types";
import {TFile} from "obsidian";

export type Id = string | number;

export type Column = {
	id: Id;
	title: string;
};

export type Task = {
	id: Id;
	columnId: Id;
	content: string;
	file: TFile;
};

const HexColor = z.string().regex(/^#(([0-9a-fA-F]{2}){3}|([0-9a-fA-F]){3})$/)

export type HexColor = z.infer<typeof HexColor>

// Tasks are filtered out if they were not modified since the lastUpdated expression and if they contain one of the propertyFilter properties with that value
// If just one given the other will not influence the result
// lastUpdated uses momentum js notation
// e.g. All Cards updated in the last week is amount = -7 , unit = "days"
// propertyFilters
// e.g Remove all closed statuses is property = "status" , value = "closed"
// TODO write this in the docu
const FilterType = z.object({
	lastUpdated: z.object({
		amount: z.number(),
		unit: z.string()
	}).optional(),
	propertyFilters : z.array(z.object({
		property: z.string(),
		value: z.string()
	})).optional()
})

const BoardConfig = z.object({
	frontmatterAttribute: z.string(),
	columns: z.array(z.string()),
	cardOrigin: z.string(),
	columnWidth: z.string().optional(),
	columnHeight: z.string().optional(),
	defaultColumnName: z.string().optional(),
	defaultColor: HexColor.optional(),
	additionalProperties: z.array(z.object({
		property: z.string(),
		color: z.string().regex(/^#(([0-9a-fA-F]{2}){3}|([0-9a-fA-F]){3})$/).optional()
	})).optional(),
	filter: FilterType.optional()
})

export type BoardConfig = z.infer<typeof BoardConfig>

export const parseBoardConfig = (config: string) => {
	try {
		const parsedConfig = JSON.parse(config);
		return BoardConfig.safeParse(parsedConfig)
	} catch (e) {
		console.error(e); // error in the above string (in this case, yes)!
		return BoardConfig.safeParse("See logs for more information")
	}

}
