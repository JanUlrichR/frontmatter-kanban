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
import {FileManager, moment, TFile, TFolder, Vault} from "obsidian";
import {getFrontMatterValue, updateFrontmatterValue} from "./frontmatterUtil";
import {PropertyLabels, PropertyLabelsExplanation} from "./components/PropertyLabels";

function mapAsync<T, U>(array: T[], callbackfn: (value: T, index: number, array: T[]) => Promise<U>): Promise<U[]> {
	return Promise.all(array.map(callbackfn));
}

async function someAsync<T>(array: T[], callbackfn: (value: T) => Promise<boolean>): Promise<boolean> {
	const filterMap = await mapAsync(array, callbackfn);
	return filterMap.some(it => it)
}

async function filterAsync<T>(array: T[], callbackfn: (value: T, index: number, array: T[]) => Promise<boolean>): Promise<T[]> {
	const filterMap = await mapAsync(array, callbackfn);
	return array.filter((value, index) => filterMap[index]);
}

const getRelevantTasks = async (boardConfig: BoardConfig, vault: Vault, fileManager: FileManager) => {
	const taskRoot = vault.getAbstractFileByPath(boardConfig.cardOrigin);
	if (taskRoot === null) {
		console.log("There is no root for cards at path:", boardConfig.cardOrigin)
	}
	if (!(taskRoot instanceof TFolder)) {
		console.log("There is no valid folder at", taskRoot)
	}

	const wasUpdatedPreviously = (file: TFile, boardConfig: BoardConfig) => {
		if (!boardConfig.filter?.lastUpdated) {
			return true;
		}
		const fileUpdatedDate = moment.unix(file.stat.mtime / 1000)
		// @ts-ignore
		const cutoffDate = moment() // today
			.add(boardConfig.filter.lastUpdated.amount, boardConfig.filter.lastUpdated.unit) // plus configured cutoff

		return fileUpdatedDate >= cutoffDate
	}

	const hasFilterProperty = async (file: TFile, boardConfig: BoardConfig, fileManager: FileManager) => {
		if (!boardConfig.filter?.propertyFilters) {
			return false;
		}
		return someAsync(
			boardConfig.filter.propertyFilters,
			async propertyFilter => await getFrontMatterValue(fileManager, file, propertyFilter.property) === propertyFilter.value
		)
	}
	const value = await filterAsync((taskRoot as TFolder).children.map(file => file as TFile),
		async file => {
			// At the start we will exlude the file
			let relevant = false
			if (boardConfig.filter?.lastUpdated){
				// Except if it was updated previously
				const updated = wasUpdatedPreviously(file, boardConfig)
				relevant = relevant || updated
			}

			if (boardConfig.filter?.propertyFilters) {
				// Except if it has no filter Properties
				const hasProp = await hasFilterProperty(file, boardConfig, fileManager)
				relevant = relevant || !hasProp
			}

			return relevant
		}
	)
	return value

}


export const KanbanBoard: React.FC<{ boardConfig: BoardConfig }> = ({boardConfig}) => {
	const {vault, fileManager} = useApp();


	const [columns, setColumns] = useState<Column[]>(boardConfig.columns.map(columnName => ({
		id: columnName,
		title: columnName,
	})));
	const columnIds = useMemo(() => columns.map(col => col.id), [columns]);

	const [tasks, setTasks] = useState<Task[]>([]);

	useEffect(() => {
		getRelevantTasks(boardConfig, vault, fileManager).then(taskFiles => {
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
		})
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

	return <div className="m-auto w-full grid justify-items-center gap-0.5">
		{!!boardConfig.additionalProperties && <PropertyLabelsExplanation boardConfig={boardConfig}/>}

		<div className="m-auto flex w-full items-center overflow-x-auto overflow-y-hidden  px-[40px]">

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
									boardConfig={boardConfig}
								/>
							}
							{columns.map(col => (
								<ColumnComponent
									key={col.id}
									column={col}
									tasks={tasks.filter(task => task.columnId === col.id)}
									boardConfig={boardConfig}
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
								boardConfig={boardConfig}
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
	</div>
}
