import type { ReactNode } from 'react';

export function WorkspaceBanner({ children }: { children: ReactNode }) {
  return <header aria-label="Workspace banner" className="sticky top-0 z-20 flex h-[65px] items-center justify-between gap-3 border-b border-[#dfe7e4] bg-white/95 px-4 text-[#172321] backdrop-blur-md md:px-[30px]">
    {children}
    <div className="ml-auto flex shrink-0 items-center gap-3">
      <button type="button" aria-label="Help" title="Help" className="grid size-8 place-items-center rounded-full border border-[#dfe7e4] bg-white text-sm text-[#667572] hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-teal-700" onClick={() => window.alert('This prototype uses fictional healthcare data. Select a module from the sidebar to explore its workflow.')}>?</button>
      <div className="flex items-center gap-[9px] border-l border-[#dfe7e4] pl-[14px]">
        <span className="grid size-[34px] place-items-center rounded-full bg-[#e5f4f0] text-[11px] font-bold text-[#075f54]">MO</span>
        <div className="hidden sm:block"><b className="block text-xs">Maya Ortiz</b><small className="mt-px block text-[10px] text-[#667572]">Network Administrator</small></div>
      </div>
    </div>
  </header>;
}
