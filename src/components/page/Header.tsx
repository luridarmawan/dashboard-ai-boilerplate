
interface HeaderProps {
  title: string;
  children?: React.ReactNode;
}

export const PageHeader: React.FC<HeaderProps> = ({
  title = 'Page Title',
  children
}) => {

  return (
    <>
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        {/* Mobile Layout - Stacked with horizontal scroll for buttons */}
        <div className="block md:hidden">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-3 truncate">{title}</h2>
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-3 min-w-max pb-1">
              {children}
            </div>
          </div>
        </div>

        {/* Desktop Layout - Side by side */}
        <div className="hidden md:flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{title}</h2>
          <div className="flex items-center gap-3">
            {children}
          </div>
        </div>
      </div>
    </>

  )
}
