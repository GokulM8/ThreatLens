interface ToggleProps {
  on: boolean;
  onColor?: string;
}

export default function Toggle({ on, onColor = "#1D9E75" }: ToggleProps) {
  return (
    <div
      className="relative flex h-4 w-7 items-center rounded-full transition-colors"
      style={{ backgroundColor: on ? onColor : "#0e1820" }}
    >
      <div
        className="absolute h-3 w-3 rounded-full bg-bg transition-transform"
        style={{ transform: on ? "translateX(14px)" : "translateX(2px)" }}
      />
    </div>
  );
}
