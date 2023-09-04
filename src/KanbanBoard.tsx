import * as React from "react";
import {useApp} from "./hooks/useApp";
import {useEffect, useMemo, useState} from "react";

import {
	DndContext,
	DragEndEvent, DragOverEvent,
	DragOverlay,
	DragStartEvent,
	PointerSensor,
	useSensor,
	useSensors
} from "@dnd-kit/core";
import {v4 as uuidv4} from 'uuid';
import {arrayMove, SortableContext} from "@dnd-kit/sortable";
import {createPortal} from "react-dom";
import {BoardConfig, Column, Id, Task} from "./types";
import {ColumnComponent} from "./components/ColumnComponent";
import {TaskCard} from "./components/TaskCard";
import {TFile, TFolder} from "obsidian";
import {getFrontMatterValue, updateFrontmatterValue} from "./frontmatterUtil";




export const KanbanBoard: React.FC<{boardConfig: BoardConfig}> = ({boardConfig}) => {
	const {vault, fileManager} = useApp();


	const folder = vault.getAbstractFileByPath(boardConfig.cardOrigin);
	if (folder === null){
		console.log("There is no folder at path:", boardConfig.cardOrigin)
	}
	if (!(folder instanceof TFolder)) {
		console.log("There is no valid folder at", folder)
	}

	const [columns, setColumns] = useState<Column[]>(boardConfig.columns.map(columnName => ({
		id: columnName,
		title: columnName,
	})));
	const columnIds = useMemo(() => columns.map(col => col.id), [columns]);

	const [tasks, setTasks] = useState<Task[]>([]);

	useEffect(() => {
		const taskFiles = (folder as TFolder).children.map(file => file as TFile)

		Promise.all(taskFiles.map(async file => {
			const column = await getFrontMatterValue(fileManager, file as TFile, boardConfig.frontmatterAttribute);
			return {
				file: file,
				column: column
			}
		})).then(tasks => {
			setTasks(tasks.map(task => ({
				id: uuidv4(),
				columnId: task.column,
				content: task.file.basename,
				file: task.file
			})))
		});
	}, []);

	const [activeColumn, setActiveColumn] = useState<Column | undefined>(undefined);
	const [activeTask, setActiveTask] = useState<Task | undefined>(undefined);

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 10
			}
		})
	);

	const onDragStart = (event: DragStartEvent) => {
		switch (event.active.data.current?.type) {
			case "Column":
				return setActiveColumn(event.active.data.current.column);
			case "Task":
				return setActiveTask(event.active.data.current.task);
			default:
			// code block
		}
	}

	const onDragEnd = (event: DragEndEvent) => {
		setActiveColumn(undefined);
		setActiveTask(undefined);

		const {active, over} = event;
		if (!over) return;

		const activeId = active.id;
		const overId = over.id;

		if (activeId === overId) return;

		const isActiveAColumn = active.data.current?.type === "Column";
		if (!isActiveAColumn) return;
		setColumns(columns => {
			const activeColumnIndex = columns.findIndex(col => col.id === activeId);
			const overColumnIndex = columns.findIndex(col => col.id === overId);

			return arrayMove(columns, activeColumnIndex, overColumnIndex);
		});
	}

	const onDragOver = (event: DragOverEvent) => {
		const {active, over} = event;
		if (!over) return;

		const activeId = active.id;
		const overId = over.id;

		if (activeId === overId) return;

		const isActiveATask = active.data.current?.type === "Task";
		const isOverATask = over.data.current?.type === "Task";

		if (!isActiveATask) return;

		// dropping a Task over another Task
		if (isActiveATask && isOverATask) {
			setTasks(tasks => {
				const activeIndex = tasks.findIndex(task => task.id === activeId);
				const overIndex = tasks.findIndex(task => task.id === overId);

				if (tasks[activeIndex].columnId != tasks[overIndex].columnId) {
					tasks[activeIndex].columnId = tasks[overIndex].columnId;
					updateFrontmatterValue(fileManager, tasks[activeIndex].file, boardConfig.frontmatterAttribute, tasks[overIndex].columnId).then(console.log)
					return arrayMove(tasks, activeIndex, overIndex - 1);
				}

				return arrayMove(tasks, activeIndex, overIndex);
			});
		}

		const isOverAColumn = over.data.current?.type === "Column";

		// Im dropping a Task over a column
		if (isActiveATask && isOverAColumn) {
			setTasks((tasks) => {
				const activeIndex = tasks.findIndex((t) => t.id === activeId);

				tasks[activeIndex].columnId = overId;
				updateFrontmatterValue(fileManager, tasks[activeIndex].file, boardConfig.frontmatterAttribute, overId).then(console.log)
				return arrayMove(tasks, activeIndex, activeIndex);
			});
		}
	}

	return <div className="m-auto flex min-h-screen w-full items-center overflow-x-auto overflow-y-hidden  px-[40px]">
		<DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragOver={onDragOver}>
			<div className="m-auto flex gap-4">
				<div className="flex gap-4">
					<SortableContext items={columnIds}>
						{(boardConfig.defaultColumnName || tasks.some(task => !columns.some(col => task.columnId === col.id))) &&
							<ColumnComponent
								key={"Not Assigned"}
								column={{
									id: "Not Assigned",
									title: boardConfig.defaultColumnName || "Not Assigned"
								}}
								tasks={tasks.filter(task => !columns.some(col => task.columnId === col.id))}
								boardConfig = {boardConfig}
							/>
						}
						{columns.map(col => (
							<ColumnComponent
								key={col.id}
								column={col}
								tasks={tasks.filter(task => task.columnId === col.id)}
								boardConfig = {boardConfig}
							/>
						))}
					</SortableContext>
				</div>
			</div>

			{createPortal(
				<DragOverlay>
					{activeColumn && (
						<ColumnComponent
							column={activeColumn}
							tasks={tasks.filter(task => task.columnId === activeColumn.id)}
							boardConfig = {boardConfig}
						/>
					)}
					{activeTask && (
						<TaskCard
							task={activeTask}
							boardConfig={boardConfig}
						/>
					)}
				</DragOverlay>,
				document.body
			)}
		</DndContext>
	</div>
}
