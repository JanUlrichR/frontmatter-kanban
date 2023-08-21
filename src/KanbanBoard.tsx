import * as React from "react";
import {useApp} from "./hooks/useApp";
import {useMemo, useState} from "react";

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
import {AddIcon} from "./components/AddIcon";
import {Column, Id, Task} from "./types";
import {ColumnComponent} from "./components/ColumnComponent";
import {TaskCard} from "./components/TaskCard";

export const KanbanBoard: React.FC<{}> = () => {
	const {vault} = useApp();

	const [columns, setColumns] = useState<Column[]>([]);
	const columnIds = useMemo(() => columns.map(col => col.id), [columns]);

	const createColumn = () => setColumns([...columns, {
		id: uuidv4(),
		title: `Column ${columns.length + 1}`,
	}]);

	const deleteColumn = (id: Id) => setColumns(columns => columns.filter(col => col.id !== id));

	const updateColumn = (id: Id, title: string) => setColumns(columns => columns.map(col =>
		(col.id === id) ? {...col, title} : col
	));

	const [tasks, setTasks] = useState<Task[]>([]);
	const createTask = (columnId: Id) => setTasks(tasks => [...tasks, {
		id: uuidv4(),
		columnId,
		content: `Task ${tasks.length + 1}`,
	}])

	const deleteTask = (id: Id) => setTasks(tasks => tasks.filter(task => task.id !== id))

	const updateTask = (id: Id, content: string) => setTasks(tasks => tasks.map(task =>
		(task.id === id) ? {...task, content} : task
	));


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
				console.log("DROPPING TASK OVER COLUMN", {activeIndex});
				return arrayMove(tasks, activeIndex, activeIndex);
			});
		}
	}


	return <div className="m-auto flex min-h-screen w-full items-center overflow-x-auto overflow-y-hidden  px-[40px]">
		<DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragOver={onDragOver}>
			<div className="m-auto flex gap-4">
				<div className="flex gap-4">
					<SortableContext items={columnIds}>
						{columns.map(col => (
							<ColumnComponent
								key={col.id}
								column={col}
								tasks={tasks.filter(task => task.columnId === col.id)}
								updateColumn={updateColumn}
								deleteColumn={deleteColumn}
								createTask={createTask}
								updateTask={updateTask}
								deleteTask={deleteTask}/>
						))}
					</SortableContext>
				</div>
				<button onClick={createColumn} className="h-[60px] w-[350px] min-w-[350px] cursor-pointer rounded-lg
					bg-mainBackgroundColor border-2 border-columnBackgroundColor p-4 ring-rose-500 hover:ring-2 flex gap-2">
					<AddIcon/>
					Add Column
				</button>


			</div>

			{createPortal(
				<DragOverlay>
					{activeColumn && (
						<ColumnComponent
							column={activeColumn}
							tasks={tasks.filter(task => task.columnId === activeColumn.id)}
							updateColumn={updateColumn}
							deleteColumn={deleteColumn}
							createTask={createTask}
							updateTask={updateTask}
							deleteTask={deleteTask}
						/>
					)}
					{activeTask && (
						<TaskCard
							task={activeTask}
							deleteTask={deleteTask}
							updateTask={updateTask}
						/>
					)}
				</DragOverlay>,
				document.body
			)}
		</DndContext>
	</div>
}
