import React, {useMemo} from "react";
import {BoardConfig, Column, Task} from "../types";
import {SortableContext, useSortable} from "@dnd-kit/sortable";
import {CSS} from "@dnd-kit/utilities";
import {TaskCard} from "./TaskCard";

import "../../styles.css"
import {useApp} from "../hooks/useApp";
import {getVaultProperty} from "../frontmatterUtil";

export const ColumnComponent: React.FC<{
	column: Column;
	tasks: Task[];
	boardConfig: BoardConfig;
}> = ({column, tasks, boardConfig}) => {
	const taskIds = useMemo(() => tasks.map(task => task.id), [tasks]);

	const {vault} = useApp()
	const vaultAccentColor = getVaultProperty(vault, "accentColor")

	const {setNodeRef, attributes, listeners, transition, transform, isDragging} = useSortable({
		id: column.id,
		data: {
			type: "Column",
			column
		}
	})

	const style = {
		transition,
		transform: CSS.Transform.toString(transform),
		width: boardConfig.columnWidth || "350px",
		height: boardConfig.columnHeight || "500px",
		"--tw-ring-color": boardConfig.defaultColor || vaultAccentColor,
		"borderColor": boardConfig.defaultColor || vaultAccentColor
	}

	if (isDragging) {
		return <div ref={setNodeRef} style={style}
					className="bg-columnBackgroundColor opacity-40 border-2 border-pink-500 rounded-md flex flex-col"/>
	}

	return <div ref={setNodeRef} style={style} className="bg-columnBackgroundColor w-[350px] h-[500px]
  		rounded-md flex flex-col">
		{/* Column title */}
		<div
			{...attributes}
			{...listeners}
			className="bg-mainBackgroundColor text-md h-[60px] cursor-grab rounded-md rounded-b-none p-3 font-bold
				border-columnBackgroundColor border-4 flex items-center justify-between"
		>
			<div className="flex gap-2">
				<div
					className="flex justify-center items-center bg-columnBackgroundColor px-2 py-1 text-sm rounded-full">
					{tasks.length}
				</div>
				{column.title}

			</div>
		</div>
		{/* Column task container */}
		<div className="flex flex-grow flex-col gap-4 p-2 overflow-x-hidden overflow-y-auto">
			<SortableContext items={taskIds}>
				{tasks.map(task => (
					<TaskCard
						key={task.id}
						task={task}
						boardConfig={boardConfig}
					/>
				))}
			</SortableContext>
		</div>
	</div>
}
