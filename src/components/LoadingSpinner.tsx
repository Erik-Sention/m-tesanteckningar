interface LoadingSpinnerProps {
  message: string;
  progress?: number; // 0-100
}

export default function LoadingSpinner({ message, progress }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative w-16 h-16 mb-3">
        <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-gray-200"></div>
        <div 
          className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-blue-600 border-t-transparent animate-spin">
        </div>
        {progress !== undefined && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-medium text-gray-700">{progress}%</span>
          </div>
        )}
      </div>
      <p className="text-gray-700 font-medium text-center">{message}</p>
    </div>
  );
} 