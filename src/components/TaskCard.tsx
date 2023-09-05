import React from "react";
import {BoardConfig, Task} from "../types";
import {useSortable} from "@dnd-kit/sortable";
import {CSS} from "@dnd-kit/utilities";

import "../../styles.css"
import {useApp} from "../hooks/useApp";
import {PropertyLabels} from "./PropertyLabels";
import {getVaultProperty} from "../frontmatterUtil";

export const TaskCard: React.FC<{
	task: Task;
	boardConfig: BoardConfig;
}> = ({task, boardConfig}) => {

	const {workspace, vault} = useApp()
	const vaultAccentColor = getVaultProperty(vault, "accentColor")

	const {setNodeRef, attributes, listeners, transition, transform, isDragging} = useSortable({
		id: task.id,
		data: {
			type: "Task",
			task
		}
	})

	// @ts-ignore
	const style = {
		transition,
		transform: CSS.Transform.toString(transform),
		"--tw-ring-color": boardConfig.defaultColor || vaultAccentColor,
		"borderColor": boardConfig.defaultColor || vaultAccentColor
	};

	if (isDragging) {
		return <div ref={setNodeRef} style={style} className="opacity-30 bg-mainBackgroundColor p-2.5 h-[30px]
			min-h-[30px] items-center flex text-left rounded-xl border-2 cursor-grab relative"/>
	}

	return <div ref={setNodeRef} style={style} {...attributes} {...listeners}
				onClick={() => workspace.openLinkText(task.file.basename, task.file.path)}
				className="bg-mainBackgroundColor p-2.5 min-h-[30px] items-center flex text-left rounded-xl
				hover:ring-2 hover:ring-inset cursor-grab relative task"
	>
		<p className="my-auto h-[90%] w-full overflow-y-hidden overflow-x-hidden whitespace-pre-wrap">
			{task.content}
		</p>
		{!!boardConfig.additionalProperties && <PropertyLabels task={task} boardConfig={boardConfig}/>}
	</div>
}
