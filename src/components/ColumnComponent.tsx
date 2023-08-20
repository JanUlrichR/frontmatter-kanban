import React, {useMemo, useState} from "react";
import {Column, Id, Task} from "../types";
import {SortableContext, useSortable} from "@dnd-kit/sortable";
import {CSS} from "@dnd-kit/utilities";
import {DeleteIcon} from "./DeleteIcon";
import {AddIcon} from "./AddIcon";
import {TaskCard} from "./TaskCard";

import "../../styles.css"

export const ColumnComponent: React.FC<{
	column: Column;
	tasks: Task[];

	updateColumn: (id: Id, title: string) => void;
	deleteColumn: (id: Id) => void;

	createTask: (columnId: Id) => void;
	updateTask: (id: Id, content: string) => void;
	deleteTask: (id: Id) => void;
}> = ({column, tasks, updateColumn, deleteColumn, createTask, updateTask, deleteTask}) => {
	const [editMode, setEditMode] = useState(false);
	const taskIds = useMemo(() => tasks.map(task => task.id), [tasks]);

	const {setNodeRef, attributes, listeners, transition, transform, isDragging} = useSortable({
		id: column.id,
		data: {
			type: "Column",
			column
		},
		disabled: editMode
	})

	const relevantTasks = [...tasks.filter(task => task.columnId === column.id)]

	const style = {
		transition,
		transform: CSS.Transform.toString(transform)
	}

	if (isDragging) {
		return <div ref={setNodeRef} style={style} className="bg-columnBackgroundColor opacity-40 border-2 border-pink-500
     		 w-[350px] h-[500px] max-h-[500px] rounded-md flex flex-col"/>
	}

	return <div ref={setNodeRef} style={style} className="bg-columnBackgroundColor w-[350px]  h-[500px] max-h-[500px]
  		rounded-md flex flex-col">
		{/* Column title */}
		<div
			{...attributes}
			{...listeners}
			onClick={() => {
				setEditMode(true);
			}}
			className="bg-mainBackgroundColor text-md h-[60px] cursor-grab rounded-md rounded-b-none p-3 font-bold
				border-columnBackgroundColor border-4 flex items-center justify-between"
		>
			<div className="flex gap-2">
				<div className="flex justify-center items-center bg-columnBackgroundColor px-2 py-1 text-sm rounded-full">
					{relevantTasks.length}
				</div>
				{!editMode && column.title}
				{editMode && (
					<input
						className="bg-black focus:border-rose-500 border rounded outline-none px-2"
						value={column.title}
						onChange={e => updateColumn(column.id, e.target.value)}
						autoFocus
						onBlur={() => {
							setEditMode(false);
						}}
						onKeyDown={e => {
							if (e.key === "Enter") setEditMode(false);
						}}
					/>
				)}
			</div>
			<button
				onClick={() => {
					deleteColumn(column.id);
				}}
				className="stroke-gray-500 hover:stroke-white hover:bg-columnBackgroundColor rounded px-1 py-2"
			>
				<DeleteIcon/>
			</button>
		</div>
		{/* Column task container */}
		<div className="flex flex-grow flex-col gap-4 p-2 overflow-x-hidden overflow-y-auto">
			<SortableContext items={taskIds}>
				{relevantTasks.map(task => (
					<TaskCard
						key={task.id}
						task={task}
						deleteTask={deleteTask}
						updateTask={updateTask}
					/>
				))}
			</SortableContext>
		</div>
		{/* Column footer */}
		<button
			className="flex gap-2 items-center border-columnBackgroundColor border-2 rounded-md p-4 border-x-columnBackgroundColor hover:bg-mainBackgroundColor hover:text-rose-500 active:bg-black"
			onClick={() => {
				createTask(column.id);
			}}
		>
			<AddIcon/>
			Add task
		</button>
	</div>
}
