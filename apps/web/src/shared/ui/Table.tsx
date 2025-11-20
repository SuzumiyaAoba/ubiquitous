/**
 * テーブルコンポーネント
 */

import type { HTMLAttributes, ReactNode } from "react";

export interface TableProps extends HTMLAttributes<HTMLTableElement> {
	children: ReactNode;
}

export const Table = ({ children, className = "", ...props }: TableProps) => {
	return (
		<div className="overflow-x-auto">
			<table
				className={`min-w-full divide-y divide-gray-200 ${className}`}
				{...props}
			>
				{children}
			</table>
		</div>
	);
};

export interface TableHeaderProps
	extends HTMLAttributes<HTMLTableSectionElement> {
	children: ReactNode;
}

export const TableHeader = ({
	children,
	className = "",
	...props
}: TableHeaderProps) => {
	return (
		<thead className={`bg-gray-50 ${className}`} {...props}>
			{children}
		</thead>
	);
};

export interface TableBodyProps
	extends HTMLAttributes<HTMLTableSectionElement> {
	children: ReactNode;
}

export const TableBody = ({
	children,
	className = "",
	...props
}: TableBodyProps) => {
	return (
		<tbody
			className={`bg-white divide-y divide-gray-200 ${className}`}
			{...props}
		>
			{children}
		</tbody>
	);
};

export interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
	children: ReactNode;
}

export const TableRow = ({
	children,
	className = "",
	...props
}: TableRowProps) => {
	return (
		<tr className={className} {...props}>
			{children}
		</tr>
	);
};

export interface TableHeadProps extends HTMLAttributes<HTMLTableCellElement> {
	children: ReactNode;
}

export const TableHead = ({
	children,
	className = "",
	...props
}: TableHeadProps) => {
	return (
		<th
			className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${className}`}
			{...props}
		>
			{children}
		</th>
	);
};

export interface TableCellProps extends HTMLAttributes<HTMLTableCellElement> {
	children: ReactNode;
}

export const TableCell = ({
	children,
	className = "",
	...props
}: TableCellProps) => {
	return (
		<td
			className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${className}`}
			{...props}
		>
			{children}
		</td>
	);
};
