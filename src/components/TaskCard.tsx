import React, {useState} from "react";
import {BoardConfig, Id, Task} from "../types";
import {useSortable} from "@dnd-kit/sortable";
import {CSS} from "@dnd-kit/utilities";
import {DeleteIcon} from "./DeleteIcon";

import "../../styles.css"
import {useApp} from "../hooks/useApp";

export const TaskCard: React.FC<{
	task: Task;
	boardConfig: BoardConfig;
}> = ({task, boardConfig}) => {

	const {workspace, vault} = useApp()

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
		"--tw-ring-color": boardConfig.defaultColor || vault.getConfig("accentColor"),
		"borderColor":  boardConfig.defaultColor || vault.getConfig("accentColor")
	};

	if (isDragging) {
		return <div ref={setNodeRef} style={style} className="opacity-30 bg-mainBackgroundColor p-2.5 h-[30px]
			min-h-[30px] items-center flex text-left rounded-xl border-2 cursor-grab relative"/>
	}

	return <div ref={setNodeRef} style={style} {...attributes} {...listeners} onClick={() => workspace.openLinkText(task.file.basename, task.file.path)}
				className="bg-mainBackgroundColor p-2.5 min-h-[30px] items-center flex text-left rounded-xl
				hover:ring-2 hover:ring-inset cursor-grab relative task"
	>
		<p className="my-auto h-[90%] w-full overflow-y-auto overflow-x-hidden whitespace-pre-wrap">
			{task.content}
		</p>
	</div>
}
