import React, {useEffect, useState} from "react";
import {BoardConfig, Task} from "../types";
import {useApp} from "../hooks/useApp";
import {getFrontMatterValue, getVaultProperty} from "../frontmatterUtil";
import {TFile} from "obsidian";
import "../../styles.css"
import {getContrastYIQ} from "../colorUtils";

type PropertyLabel = {
	value: string,
	propertyConfig: {
		property: string,
		color?: string | undefined
	}
}

export const PropertyLabels: React.FC<{
	task: Task;
	boardConfig: BoardConfig;
}> = ({task, boardConfig}) => {

	const {vault, fileManager} = useApp()
	const vaultAccentColor = getVaultProperty(vault, "accentColor")

	const [properties, setProperties] = useState<PropertyLabel[]>([]);

	useEffect(() => {
		Promise.all(boardConfig.additionalProperties.map(async prop => ({
			value: await getFrontMatterValue(fileManager, task.file as TFile, prop.property),
			propertyConfig: prop
		}))).then(values => {
			setProperties(values)
		});
	}, []);


	return <LabelsComponent items={properties.map(property => ({
		text: property.value,
		color: property.propertyConfig.color || vaultAccentColor
	}))}/>
}

export const PropertyLabelsExplanation: React.FC<{
	boardConfig: BoardConfig;
}> = ({boardConfig}) => {

	const {vault} = useApp()
	const vaultAccentColor = getVaultProperty(vault, "accentColor")


	return <div className={"w-full flex justify-center items-center"}>
		<LabelsComponent items={boardConfig.additionalProperties.map(property => ({
			text: property.property,
			color: property.color || vaultAccentColor
		}))}/>
	</div>
}

type LabelsItem = {
	text: string,
	color: string
}

const LabelsComponent: React.FC<{
	items: LabelsItem[]
}> = ({items}) => {
	return <div>
		{items.filter(item => item.text).map(item =>
			<span style={{
				backgroundColor: item.color,
				color: getContrastYIQ(item.color)
			}}
				  className="text-sm font-medium mr-2 px-2.5 py-0.5 rounded">{item.text}</span>
		)}
	</div>
}
