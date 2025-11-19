/**
 * ローディングコンポーネント
 */

export interface LoadingProps {
  size?: "sm" | "md" | "lg";
  text?: string;
}

export const Loading = ({ size = "md", text }: LoadingProps) => {
  const sizeStyles = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4",
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div
        className={`${sizeStyles[size]} border-blue-600 border-t-transparent rounded-full animate-spin`}
      />
      {text && <p className="mt-2 text-sm text-gray-600">{text}</p>}
    </div>
  );
};
