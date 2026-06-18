export default function ScanOverlay() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      <div className="tgvpix-scanlines absolute inset-0" />
      <div className="tgvpix-noise absolute -inset-8" />
      <div className="tgvpix-scan-sweep absolute inset-x-0 top-0 h-1/2" />
    </div>
  );
}
