/**
 * カードコンポーネント
 */

import type { HTMLAttributes, ReactNode } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
	children: ReactNode;
}

export const Card = ({ children, className = "", ...props }: CardProps) => {
	return (
		<div
			className={`bg-white rounded-lg shadow-md p-6 ${className}`}
			{...props}
		>
			{children}
		</div>
	);
};

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
	children: ReactNode;
}

export const CardHeader = ({
	children,
	className = "",
	...props
}: CardHeaderProps) => {
	return (
		<div className={`mb-4 ${className}`} {...props}>
			{children}
		</div>
	);
};

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
	children: ReactNode;
}

export const CardTitle = ({
	children,
	className = "",
	...props
}: CardTitleProps) => {
	return (
		<h3
			className={`text-xl font-semibold text-gray-900 ${className}`}
			{...props}
		>
			{children}
		</h3>
	);
};

export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
	children: ReactNode;
}

export const CardContent = ({
	children,
	className = "",
	...props
}: CardContentProps) => {
	return (
		<div className={className} {...props}>
			{children}
		</div>
	);
};
