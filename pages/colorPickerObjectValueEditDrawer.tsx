import { bindVariablesToObject } from "@uniformdev/canvas";
import {
	ParameterDrawerHeader,
	VerticalRhythm,
} from "@uniformdev/design-system";
import {
	Button,
	ParamTypeDynamicDataProvider,
	useMeshLocation,
	useUniformMeshSdk,
} from "@uniformdev/mesh-sdk-react";
import type { NextPage } from "next";
import { useState, useEffect, CSSProperties } from "react";
import { SketchPicker, ColorResult } from "react-color";

/**
 * This param type has a complex object value, with four properties that can be independently connected to Uniform's dynamic tokens.
 * The param editing is done in a dialog, an appropriate pattern for larger editing experiences.
 */
type ParamTypeObjectValue = {
	color?: {
		r: number;
		g: number;
		b: number;
		a: number;
	};
};

const ParamTypeSupportingObjectValueWithDynamicTokens: NextPage = () => {
	const sdk = useUniformMeshSdk();
	const {
		value,
		setValue,
		isReadOnly,
		dialogContext,
		metadata: { connectedData },
	} = useMeshLocation<"paramType", ParamTypeObjectValue>("paramType");

	const [currentColor, setCurrentColor] = useState(
		value?.color || { r: 255, g: 255, b: 255, a: 1 }
	);
	const [colorName, setColorName] = useState("White");

	useEffect(() => {
		if (value?.color) {
			setCurrentColor(value.color);
			fetchColorName(rgbToHex(value.color.r, value.color.g, value.color.b));
		}
	}, [value?.color]);

	const openEditorDialog = () => {
		sdk.openCurrentLocationDialog({
			options: { disableCloseDialogOnSetValue: true },
		});
	};

	const handleChange = (color: ColorResult) => {
		const { r, g, b, a = 1 } = color.rgb;
		setCurrentColor({ r, g, b, a });
		fetchColorName(rgbToHex(r, g, b));
	};

	const handleFinish = () => {
		setValue((current) => ({ ...current, newValue: { color: currentColor } }));
		if (dialogContext) {
			dialogContext.returnDialogValue({ ...value, color: currentColor });
		}
	};

	const handleCancel = () => {
		if (dialogContext) {
			dialogContext.returnDialogValue(value); // Return the original value to effectively cancel changes
		}
	};

	const fetchColorName = async (hex: string) => {
		try {
			const response = await fetch(
				`https://api.color.pizza/v1/${hex.slice(1)}`
			);
			const data = await response.json();
			if (data.colors && data.colors.length > 0) {
				setColorName(data.colors[0].name);
			} else {
				setColorName("Unknown");
			}
		} catch (error) {
			console.error("Error fetching color name:", error);
			setColorName("Unknown");
		}
	};

	const { result: valueWithDynamicTokensBound } = bindVariablesToObject({
		value,
		variables: connectedData,
	});

	const rgbToHex = (r: number, g: number, b: number) => {
		const toHex = (c: number) => c.toString(16).padStart(2, "0");
		return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
	};

	const hexColor = rgbToHex(currentColor.r, currentColor.g, currentColor.b);

	const styles: { [key: string]: CSSProperties } = {
		colorBar: {
			display: "flex",
			alignItems: "center",
			width: "100%",
			height: "40px",
			borderRadius: "4px",
			backgroundColor: "#f0f0f0",
			padding: "0 10px",
			boxShadow: "0 0 3px rgba(0,0,0,0.1)",
			cursor: "pointer",
		},
		colorSquare: {
			width: "30px",
			height: "30px",
			borderRadius: "4px",
			background: `rgba(${currentColor.r}, ${currentColor.g}, ${currentColor.b}, ${currentColor.a})`,
			marginRight: "10px",
		},
		text: {
			flex: 1,
			fontSize: "16px",
			color: "#333",
		},
		modalContent: {
			padding: "20px",
			borderRadius: "8px",			
			textAlign: "center" as CSSProperties["textAlign"],
			display: "flex",
			flexDirection: "column",
			alignItems: "center",
			justifyContent: "center",
		},
		buttonContainer: {
			marginTop: "20px",
			display: "flex",
			justifyContent: "center",
			gap: "10px",
		},
	};

	if (dialogContext) {
		return (
			<ParamTypeDynamicDataProvider>
				<VerticalRhythm>
					<ParameterDrawerHeader title=""/>
					<div style={styles.modalContent}>
						<SketchPicker color={currentColor} onChange={handleChange} width="400px" />
						<div style={styles.buttonContainer}>
							<Button buttonType="secondary" onClick={handleFinish}>
								Accept
							</Button>
							<Button buttonType="primary" onClick={handleCancel}>
								Cancel
							</Button>
						</div>
					</div>
				</VerticalRhythm>
			</ParamTypeDynamicDataProvider>
		);
	}

	return (
		<ParamTypeDynamicDataProvider>
			<VerticalRhythm gap="sm">
				<div style={styles.colorBar} onClick={openEditorDialog}>
					<div style={styles.colorSquare} />
					<div style={styles.text}>
						{colorName} ({hexColor})
					</div>
				</div>
			</VerticalRhythm>
		</ParamTypeDynamicDataProvider>
	);
};

export default ParamTypeSupportingObjectValueWithDynamicTokens;
