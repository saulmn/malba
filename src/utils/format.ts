export const formatCurrency = (amount: number) => {
	return new Intl.NumberFormat("es-MX", {
		style: "currency",
		currency: "MXN",
	}).format(amount);
};

export const formatQuantity = (
	quantity: number | string,
	unit?: "piece" | "liter" | "kilo" | "package" | string | null,
) => {
	const num = Number(quantity || 0);
	// Siempre redondear a máximo 2 decimales
	const rounded = Number(
		(Math.round((num + Number.EPSILON) * 100) / 100).toFixed(2),
	);

	if (!unit) return `${rounded}`;
	if (unit === "piece") return `${rounded} pz`;
	if (unit === "kilo") return `${rounded} kg`;
	if (unit === "package") return `${rounded} paq`;
	if (unit === "liter") return `${rounded} L`;
	return `${rounded} ${unit}`;
};
