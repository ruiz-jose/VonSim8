import type { RefObject } from "react";
import type { ReactZoomPanPinchRef } from "react-zoom-pan-pinch";

import { useTranslate } from "@/lib/i18n";

const buttonClass =
  "m-0.5 flex size-9 items-center justify-center rounded-md text-white transition-colors hover:enabled:bg-stone-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-mantis-300";

export function ZoomControls({
  wrapperRef,
  onFit,
  onManualZoom,
}: {
  wrapperRef: RefObject<ReactZoomPanPinchRef>;
  onFit?: () => void;
  onManualZoom?: () => void;
}) {
  const translate = useTranslate();

  return (
    <div
      role="toolbar"
      aria-label="Zoom"
      aria-orientation="vertical"
      className="absolute right-2 top-2 z-40 flex flex-col rounded-lg border border-stone-600 bg-stone-900 shadow"
    >
      <button
        type="button"
        className={buttonClass}
        onClick={() => {
          onManualZoom?.();
          wrapperRef.current?.zoomIn();
        }}
        title={translate("control.zoom.in")}
        aria-label={translate("control.zoom.in")}
      >
        <span className="size-5" aria-hidden="true">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </span>
      </button>
      <hr className="border-stone-600" />
      <button
        type="button"
        className={buttonClass}
        onClick={() => {
          onManualZoom?.();
          wrapperRef.current?.zoomOut();
        }}
        title={translate("control.zoom.out")}
        aria-label={translate("control.zoom.out")}
      >
        <span className="size-5" aria-hidden="true">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </span>
      </button>
      {onFit && (
        <>
          <hr className="border-stone-600" />
          <button
            type="button"
            className={buttonClass}
            onClick={onFit}
            title={translate("control.zoom.fit")}
            aria-label={translate("control.zoom.fit")}
            data-testid="zoom-fit-button"
          >
            <span className="icon-[lucide--scan] block size-5" aria-hidden="true" />
          </button>
        </>
      )}
    </div>
  );
}
