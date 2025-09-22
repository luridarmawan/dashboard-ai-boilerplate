
interface PageProps {
  id: string;
  className?: string;
  children?: React.ReactNode;
}

export const Page: React.FC<PageProps> = ({
  id = 'your-page',
  className = '',
  children
}) => {

  return (
    <div id={id} className={`mx-auto ${className}`}>
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
        {children}
      </div>
    </div>
  )
}
