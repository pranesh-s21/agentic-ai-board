import { NorthMyFilesPanel } from '@/components/shared/NorthMyFilesPanel'

export function FilesPage() {
  return (
    <div className="-mx-5 -mt-5 mb-0 flex h-[calc(100vh-4.5rem)] w-[calc(100%+2.5rem)] flex-col lg:-mx-6 lg:-mt-6 lg:w-[calc(100%+3rem)]">
      <NorthMyFilesPanel variant="org" layout="page" className="h-full min-h-0 rounded-none border-x-0 border-t-0" />
    </div>
  )
}
