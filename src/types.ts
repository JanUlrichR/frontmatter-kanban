import {z, ZodError} from "zod"
import {SafeParseError, SafeParseReturnType} from "zod/lib/types";

export type Id = string | number;

export type Column = {
	id: Id;
	title: string;
};

export type Task = {
	id: Id;
	columnId: Id;
	content: string;
};

const BoardConfig = z.object({
	frontmatterAttribute: z.string(),
	columns: z.array(z.string()),
	cardOrigin: z.string()
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
