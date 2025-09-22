
export const Content: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <div className="page-content px-6 py-4">
      <div className="max-w-full overflow-x-auto">
        {children}
      </div>
    </div>
  )
}
