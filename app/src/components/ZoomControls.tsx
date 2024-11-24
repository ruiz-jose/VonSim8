import type { RefObject } from "react";
import type { ReactZoomPanPinchRef } from "react-zoom-pan-pinch";

import { useTranslate } from "@/lib/i18n";

export function ZoomControls({ wrapperRef }: { wrapperRef: RefObject<ReactZoomPanPinchRef> }) {
  const translate = useTranslate();

  return (
    <div className="absolute right-2 top-2 flex flex-col rounded-lg border border-stone-600 bg-stone-900 shadow">
      <button
        className="m-0.5 flex h-8 w-8 items-center justify-center rounded-t-lg text-white transition-colors hover:enabled:bg-stone-800"
        onClick={() => wrapperRef.current?.zoomIn()}
        title={translate("control.zoom.in")}
      >
        <span className="h-4 w-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </span>
      </button>
      <hr className="border-stone-600" />
      <button
        className="m-0.5 flex h-8 w-8 items-center justify-center rounded-b-lg text-white transition-colors hover:enabled:bg-stone-800"
        onClick={() => wrapperRef.current?.zoomOut()}
        title={translate("control.zoom.out")}
      >
        <span className="h-4 w-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </span>
      </button>
    </div>
  );
}
